'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { VisionResult, AppSettings, StreamStatus, SessionStats, SignalTimelineEntry } from '@/lib/types'
import { appendSignalLog } from '@/lib/storage'

export interface TimeframePreset {
    label: string
    value: string
    freqSeconds: number
    description: string
}

export const TIMEFRAME_PRESETS: TimeframePreset[] = [
    { label: '1m',  value: '1',   freqSeconds: 20,  description: '1-minute candles' },
    { label: '5m',  value: '5',   freqSeconds: 60,  description: '5-minute candles' },
    { label: '15m', value: '15',  freqSeconds: 120, description: '15-minute candles' },
    { label: '1H',  value: '60',  freqSeconds: 300, description: '1-hour candles' },
    { label: '4H',  value: '240', freqSeconds: 600, description: '4-hour candles' },
    { label: '1D',  value: 'D',   freqSeconds: 900, description: 'daily candles' },
]

export interface VisionState {
    isRunning: boolean
    results: VisionResult[]
    lastResult: VisionResult | null
    error: string | null
    fps: number
    stream: MediaStream | null
    status: StreamStatus
    activeTimeframe: string | null
    sessionStats: SessionStats
    latestPrediction: { direction: 'GREEN' | 'RED' | null; confidence: number; reason: string } | null
    candleStreak: { color: 'GREEN' | 'RED'; count: number } | null
    timeline: SignalTimelineEntry[]  // for timeline heatmap
}

const INITIAL_STATS: SessionStats = {
    totalSignals: 0,
    bullishCount: 0,
    bearishCount: 0,
    greenPredictions: 0,
    redPredictions: 0,
    startTime: null,
}

function parseResult(raw: string): Partial<VisionResult> {
    const out: Partial<VisionResult> = {}
    const predMatch = raw.match(/PREDICTION:\s*(GREEN|RED)\s*\|?\s*confidence:\s*(\d+)%?\s*\|?\s*reason:\s*(.+)/i)
    if (predMatch) {
        out.prediction = predMatch[1].toUpperCase() as 'GREEN' | 'RED'
        out.predictionConfidence = parseInt(predMatch[2])
        out.predictionReason = predMatch[3].trim()
    }
    const signalMatch = raw.match(/^\[([^\]]+)\]/)
    if (signalMatch) {
        out.signalType = signalMatch[1].trim()
    }
    return out
}

function playAlert(type: 'signal' | 'prediction') {
    try {
        const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.frequency.value = type === 'prediction' ? 880 : 660
        osc.type = 'sine'
        gain.gain.setValueAtTime(0.3, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4)
        osc.start(ctx.currentTime)
        osc.stop(ctx.currentTime + 0.4)
    } catch { }
}

// Browser notification helper
function sendBrowserNotification(title: string, body: string) {
    if (typeof window === 'undefined') return
    if (!('Notification' in window)) return
    if (Notification.permission === 'granted') {
        new Notification(title, { body, icon: '/favicon.ico', silent: false })
    }
}

export function useVisionAnalysis() {
    const [state, setState] = useState<VisionState>({
        isRunning: false,
        results: [],
        lastResult: null,
        error: null,
        fps: 0,
        stream: null,
        status: 'idle',
        activeTimeframe: null,
        sessionStats: INITIAL_STATS,
        latestPrediction: null,
        candleStreak: null,
        timeline: [],
    })

    // Pre-warm the overshoot module so the dynamic import is already cached
    // when the user clicks start, keeping getDisplayMedia inside the gesture chain.
    useEffect(() => {
        import('overshoot').catch(() => {})
    }, [])

    const visionRef = useRef<unknown>(null)
    const resultCountRef = useRef(0)
    const fpsTimerRef = useRef<NodeJS.Timeout | null>(null)
    const lastFpsCountRef = useRef(0)
    const settingsRef = useRef<AppSettings | null>(null)
    const streakRef = useRef<{ color: 'GREEN' | 'RED'; count: number } | null>(null)
    // Gate for slow timeframes: tracks when we last forwarded a result.
    // The SDK is capped at 60s, so for 15m/1H/4H/1D we suppress callbacks
    // until the real desired interval has elapsed.
    const lastProcessedAtRef = useRef<number>(0)
    const analysisFreqRef = useRef<number>(60)

    // Request notification permission
    const requestNotificationPermission = useCallback(async () => {
        if (typeof window === 'undefined') return
        if (!('Notification' in window)) return
        if (Notification.permission === 'default') {
            await Notification.requestPermission()
        }
    }, [])

    const startVision = useCallback(async (settings: AppSettings, timeframe: string) => {
        settingsRef.current = settings

        if (!settings.overshootApiKey) {
            setState(prev => ({ ...prev, error: 'Overshoot API key is required.' }))
            return
        }

        setState(prev => ({ ...prev, status: 'requesting', error: null }))

        if (!navigator.mediaDevices?.getDisplayMedia) {
            setState(prev => ({
                ...prev,
                error: 'Screen sharing not supported. Use Chrome/Edge on desktop.',
                status: 'error',
            }))
            return
        }

        // Request notification permission when starting
        await requestNotificationPermission()

        try {
            const { RealtimeVision } = await import('overshoot')

            // Derive analysis frequency from timeframe, fall back to settings value
            const preset = TIMEFRAME_PRESETS.find(t => t.value === timeframe)
            const analysisFreq = preset?.freqSeconds ?? settings.analysisFrequency

            // Prepend timeframe context to the prompt so the AI knows which candle size to analyze
            const timeframePrefix = preset
                ? `You are analyzing ${preset.description} (${preset.label} timeframe) on a live chart.\n\n`
                : ''
            const prompt = timeframePrefix + settings.visionPrompt

            // The SDK enforces a hard max of 60s. For slower timeframes we run the
            // SDK at 60s but gate onResult so results only pass through once the
            // real desired interval has elapsed (e.g. every ~2 ticks for 15m,
            // every ~5 ticks for 1H, etc.).
            const sdkFreq = Math.min(analysisFreq, 60)
            analysisFreqRef.current = analysisFreq
            lastProcessedAtRef.current = 0  // fire immediately on first result

            const frameConfig = settings.processingMode === 'frame'
                ? { frameProcessing: { interval_seconds: sdkFreq } }
                : { clipProcessing: { clip_length_seconds: sdkFreq, delay_seconds: sdkFreq, target_fps: 6 } }

            const vision = new RealtimeVision({
                apiKey: settings.overshootApiKey,
                model: settings.model,
                prompt,
                source: { type: 'screen' },
                mode: settings.processingMode,
                ...frameConfig,
                onResult: (raw: { ok: boolean; result: string; error: string | null }) => {
                    if (!raw.ok) {
                        setState(prev => ({ ...prev, error: raw.error ?? 'Inference failed' }))
                        return
                    }

                    // Gate: suppress this result if the real timeframe interval hasn't elapsed yet
                    const nowMs = Date.now()
                    const elapsed = (nowMs - lastProcessedAtRef.current) / 1000
                    if (lastProcessedAtRef.current !== 0 && elapsed < analysisFreqRef.current) return
                    lastProcessedAtRef.current = nowMs

                    resultCountRef.current += 1
                    const parsed = parseResult(raw.result)
                    const now = new Date(nowMs)

                    const result: VisionResult = {
                        id: crypto.randomUUID(),
                        content: raw.result,
                        timestamp: now,
                        ...parsed,
                    }

                    // Streak update
                    let newStreak = streakRef.current
                    if (parsed.prediction) {
                        if (newStreak && newStreak.color === parsed.prediction) {
                            newStreak = { color: parsed.prediction, count: newStreak.count + 1 }
                        } else {
                            newStreak = { color: parsed.prediction, count: 1 }
                        }
                        streakRef.current = newStreak
                    }

                    // Build timeline entry
                    const lower = raw.result.toLowerCase()
                    const isBullish = lower.includes('bullish') || lower.includes('long') || lower.includes('breakout')
                    const isBearish = lower.includes('bearish') || lower.includes('short') || lower.includes('breakdown')
                    let tlType: SignalTimelineEntry['type'] = 'neutral'
                    if (parsed.prediction === 'GREEN') tlType = 'prediction_green'
                    else if (parsed.prediction === 'RED') tlType = 'prediction_red'
                    else if (isBullish) tlType = 'bullish'
                    else if (isBearish) tlType = 'bearish'

                    const tlEntry: SignalTimelineEntry = {
                        id: result.id,
                        timestamp: now,
                        type: tlType,
                        label: parsed.signalType ?? (parsed.prediction ? `${parsed.prediction} ${parsed.predictionConfidence}%` : raw.result.slice(0, 30)),
                    }

                    // Audio alert
                    const s = settingsRef.current
                    if (s?.audioAlertsEnabled) {
                        if (parsed.prediction) {
                            playAlert('prediction')
                        } else {
                            const keywords = s.alertKeywords.split(',').map(k => k.trim().toLowerCase()).filter(Boolean)
                            if (keywords.some(k => lower.includes(k))) {
                                playAlert('signal')
                            }
                        }
                    }

                    // Browser notifications
                    if (s?.audioAlertsEnabled) {
                        if (parsed.prediction) {
                            sendBrowserNotification(
                                `TradeVision: ${parsed.prediction} candle predicted`,
                                `${parsed.predictionConfidence}% confidence — ${parsed.predictionReason ?? ''}`
                            )
                        } else if (s.alertKeywords.split(',').map(k => k.trim().toLowerCase()).some(k => lower.includes(k))) {
                            sendBrowserNotification('TradeVision: Signal detected', raw.result.slice(0, 80))
                        }
                    }

                    // Persist
                    appendSignalLog({
                        id: result.id,
                        timestamp: result.timestamp,
                        content: result.content,
                        prediction: result.prediction,
                        predictionConfidence: result.predictionConfidence,
                        signalType: result.signalType,
                    })

                    setState(prev => ({
                        ...prev,
                        results: [result, ...prev.results].slice(0, 200),
                        lastResult: result,
                        error: null,
                        latestPrediction: parsed.prediction ? {
                            direction: parsed.prediction,
                            confidence: parsed.predictionConfidence ?? 50,
                            reason: parsed.predictionReason ?? '',
                        } : prev.latestPrediction,
                        candleStreak: newStreak,
                        timeline: [...prev.timeline, tlEntry].slice(-120), // keep last 120
                        sessionStats: {
                            ...prev.sessionStats,
                            totalSignals: prev.sessionStats.totalSignals + 1,
                            bullishCount: prev.sessionStats.bullishCount + (isBullish ? 1 : 0),
                            bearishCount: prev.sessionStats.bearishCount + (isBearish ? 1 : 0),
                            greenPredictions: prev.sessionStats.greenPredictions + (parsed.prediction === 'GREEN' ? 1 : 0),
                            redPredictions: prev.sessionStats.redPredictions + (parsed.prediction === 'RED' ? 1 : 0),
                        },
                    }))
                },
                onError: (err: Error) => {
                    setState(prev => ({ ...prev, error: err.message, isRunning: false, status: 'error' }))
                },
            })

            visionRef.current = vision
            await vision.start()

            let mediaStream: MediaStream | null = null
            try {
                mediaStream = (vision as unknown as { getMediaStream: () => MediaStream | null }).getMediaStream()
            } catch (e) {
                console.warn('getMediaStream not available:', e)
            }

            setState(prev => ({
                ...prev,
                isRunning: true,
                error: null,
                status: 'active',
                stream: mediaStream,
                activeTimeframe: timeframe,
                sessionStats: { ...INITIAL_STATS, startTime: new Date() },
                timeline: [],
            }))

            resultCountRef.current = 0
            lastFpsCountRef.current = 0
            fpsTimerRef.current = setInterval(() => {
                const delta = resultCountRef.current - lastFpsCountRef.current
                lastFpsCountRef.current = resultCountRef.current
                setState(prev => ({ ...prev, fps: delta }))
            }, 1000)

        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Vision analysis failed to start'
            const isAborted = msg.includes('Permission denied') || msg.includes('NotAllowedError')
            setState(prev => ({
                ...prev,
                error: isAborted ? 'Screen share was cancelled or denied.' : msg,
                isRunning: false,
                status: 'error',
            }))
        }
    }, [requestNotificationPermission])

    const stopVision = useCallback(async () => {
        if (visionRef.current) {
            try { await (visionRef.current as { stop: () => Promise<void> }).stop() } catch { }
            visionRef.current = null
        }
        if (fpsTimerRef.current) clearInterval(fpsTimerRef.current)
        streakRef.current = null
        lastProcessedAtRef.current = 0
        setState(prev => ({
            ...prev,
            isRunning: false,
            fps: 0,
            stream: null,
            status: 'stopped',
            activeTimeframe: null,
            latestPrediction: null,
            candleStreak: null,
        }))
    }, [])

    const clearResults = useCallback(() => {
        setState(prev => ({
            ...prev,
            results: [],
            lastResult: null,
            sessionStats: INITIAL_STATS,
            latestPrediction: null,
            candleStreak: null,
            timeline: [],
        }))
        streakRef.current = null
    }, [])

    return { state, startVision, stopVision, clearResults }
}