'use client'

import { useState, useRef, useCallback } from 'react'
import { VisionResult, AppSettings, StreamStatus, SessionStats } from '@/lib/types'
import { appendSignalLog } from '@/lib/storage'

export interface VisionState {
    isRunning: boolean
    results: VisionResult[]
    lastResult: VisionResult | null
    error: string | null
    fps: number
    stream: MediaStream | null
    status: StreamStatus
    isTradingViewDetected: boolean
    sessionStats: SessionStats
    // latest parsed candle prediction
    latestPrediction: { direction: 'GREEN' | 'RED' | null; confidence: number; reason: string } | null
    // candle streak
    candleStreak: { color: 'GREEN' | 'RED'; count: number } | null
}

const INITIAL_STATS: SessionStats = {
    totalSignals: 0,
    bullishCount: 0,
    bearishCount: 0,
    greenPredictions: 0,
    redPredictions: 0,
    startTime: null,
}

// Parse Overshoot result text for structured data
function parseResult(raw: string): Partial<VisionResult> {
    const out: Partial<VisionResult> = {}

    // Parse candle prediction: "PREDICTION: GREEN | confidence: 72% | reason: bullish engulfing"
    const predMatch = raw.match(/PREDICTION:\s*(GREEN|RED)\s*\|?\s*confidence:\s*(\d+)%?\s*\|?\s*reason:\s*(.+)/i)
    if (predMatch) {
        out.prediction = predMatch[1].toUpperCase() as 'GREEN' | 'RED'
        out.predictionConfidence = parseInt(predMatch[2])
        out.predictionReason = predMatch[3].trim()
    }

    // Parse signal type from [SIGNAL TYPE] prefix
    const signalMatch = raw.match(/^\[([^\]]+)\]/)
    if (signalMatch) {
        out.signalType = signalMatch[1].trim()
    }

    return out
}

// Play a beep using Web Audio API — no deps
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

export function useVisionAnalysis() {
    const [state, setState] = useState<VisionState>({
        isRunning: false,
        results: [],
        lastResult: null,
        error: null,
        fps: 0,
        stream: null,
        status: 'idle',
        isTradingViewDetected: false,
        sessionStats: INITIAL_STATS,
        latestPrediction: null,
        candleStreak: null,
    })

    const visionRef = useRef<unknown>(null)
    const resultCountRef = useRef(0)
    const fpsTimerRef = useRef<NodeJS.Timeout | null>(null)
    const lastFpsCountRef = useRef(0)
    const settingsRef = useRef<AppSettings | null>(null)
    // track streak locally
    const streakRef = useRef<{ color: 'GREEN' | 'RED'; count: number } | null>(null)

    const startVision = useCallback(async (settings: AppSettings) => {
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

        try {
            const { RealtimeVision } = await import('overshoot')

            const frameConfig = settings.processingMode === 'frame'
                ? { frameProcessing: { interval_seconds: settings.analysisFrequency } }
                : { clipProcessing: { clip_length_seconds: settings.analysisFrequency, delay_seconds: settings.analysisFrequency, target_fps: 6 } }

            const vision = new RealtimeVision({
                apiKey: settings.overshootApiKey,
                model: settings.model,
                prompt: settings.visionPrompt,
                source: { type: 'screen' },
                mode: settings.processingMode,
                ...frameConfig,
                onResult: (raw: { ok: boolean; result: string; error: string | null }) => {
                    if (!raw.ok) {
                        setState(prev => ({ ...prev, error: raw.error ?? 'Inference failed' }))
                        return
                    }

                    resultCountRef.current += 1
                    const parsed = parseResult(raw.result)

                    const result: VisionResult = {
                        id: crypto.randomUUID(),
                        content: raw.result,
                        timestamp: new Date(),
                        ...parsed,
                    }

                    // Update candle streak
                    let newStreak = streakRef.current
                    if (parsed.prediction) {
                        if (newStreak && newStreak.color === parsed.prediction) {
                            newStreak = { color: parsed.prediction, count: newStreak.count + 1 }
                        } else {
                            newStreak = { color: parsed.prediction, count: 1 }
                        }
                        streakRef.current = newStreak
                    }

                    // Audio alert
                    const s = settingsRef.current
                    if (s?.audioAlertsEnabled) {
                        if (parsed.prediction) {
                            playAlert('prediction')
                        } else {
                            const keywords = s.alertKeywords.split(',').map(k => k.trim().toLowerCase()).filter(Boolean)
                            const lower = raw.result.toLowerCase()
                            if (keywords.some(k => lower.includes(k))) {
                                playAlert('signal')
                            }
                        }
                    }

                    // Persist to signal log
                    appendSignalLog({
                        id: result.id,
                        timestamp: result.timestamp,
                        content: result.content,
                        prediction: result.prediction,
                        predictionConfidence: result.predictionConfidence,
                        signalType: result.signalType,
                    })

                    setState(prev => {
                        const lower = raw.result.toLowerCase()
                        const isBullish = lower.includes('bullish') || lower.includes('green') || lower.includes('long') || lower.includes('breakout')
                        const isBearish = lower.includes('bearish') || lower.includes('red') || lower.includes('short') || lower.includes('breakdown')

                        return {
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
                            sessionStats: {
                                ...prev.sessionStats,
                                totalSignals: prev.sessionStats.totalSignals + 1,
                                bullishCount: prev.sessionStats.bullishCount + (isBullish ? 1 : 0),
                                bearishCount: prev.sessionStats.bearishCount + (isBearish ? 1 : 0),
                                greenPredictions: prev.sessionStats.greenPredictions + (parsed.prediction === 'GREEN' ? 1 : 0),
                                redPredictions: prev.sessionStats.redPredictions + (parsed.prediction === 'RED' ? 1 : 0),
                            }
                        }
                    })
                },
                onError: (err: Error) => {
                    setState(prev => ({ ...prev, error: err.message, isRunning: false, status: 'error' }))
                },
            })

            visionRef.current = vision
            await vision.start()

            let mediaStream: MediaStream | null = null
            let isTradingView = false
            try {
                mediaStream = (vision as unknown as { getMediaStream: () => MediaStream | null }).getMediaStream()
                if (mediaStream) {
                    const label = mediaStream.getVideoTracks()[0]?.label?.toLowerCase() ?? ''
                    isTradingView = label.includes('tradingview') || label.includes('tab') || label.includes('chrome') || label.includes('window')
                }
            } catch (e) {
                console.warn('getMediaStream not available:', e)
            }

            setState(prev => ({
                ...prev,
                isRunning: true,
                error: null,
                status: 'active',
                stream: mediaStream,
                isTradingViewDetected: isTradingView,
                sessionStats: { ...INITIAL_STATS, startTime: new Date() },
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
    }, [])

    const stopVision = useCallback(async () => {
        if (visionRef.current) {
            try { await (visionRef.current as { stop: () => Promise<void> }).stop() } catch { }
            visionRef.current = null
        }
        if (fpsTimerRef.current) clearInterval(fpsTimerRef.current)
        streakRef.current = null
        setState(prev => ({
            ...prev,
            isRunning: false,
            fps: 0,
            stream: null,
            status: 'stopped',
            isTradingViewDetected: false,
            latestPrediction: null,
            candleStreak: null,
        }))
    }, [])

    const clearResults = useCallback(() => {
        setState(prev => ({ ...prev, results: [], lastResult: null, sessionStats: INITIAL_STATS, latestPrediction: null, candleStreak: null }))
        streakRef.current = null
    }, [])

    return { state, startVision, stopVision, clearResults }
}