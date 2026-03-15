'use client'

import { useState, useRef, useCallback } from 'react'
import { VisionResult, AppSettings, StreamStatus } from '@/lib/types'

export interface VisionState {
    isRunning: boolean
    results: VisionResult[]
    lastResult: VisionResult | null
    error: string | null
    fps: number
    stream: MediaStream | null
    status: StreamStatus
    isTradingViewDetected: boolean
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
    })

    const visionRef = useRef<unknown>(null)
    const resultCountRef = useRef(0)
    const fpsTimerRef = useRef<NodeJS.Timeout | null>(null)
    const lastFpsCountRef = useRef(0)

    const startVision = useCallback(async (settings: AppSettings) => {
        if (!settings.overshootApiKey) {
            setState(prev => ({ ...prev, error: 'Overshoot API key is required.' }))
            return
        }

        setState(prev => ({ ...prev, status: 'requesting', error: null }))

        // Pre-flight: verify getDisplayMedia is available
        if (!navigator.mediaDevices?.getDisplayMedia) {
            console.error('getDisplayMedia not available. navigator.mediaDevices:', navigator.mediaDevices)
            setState(prev => ({
                ...prev,
                error: 'Screen sharing is not supported. Use Chrome/Edge on desktop with HTTPS or localhost.',
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
                    const result: VisionResult = {
                        id: crypto.randomUUID(),
                        content: raw.result,
                        timestamp: new Date(),
                    }
                    setState(prev => ({
                        ...prev,
                        results: [result, ...prev.results].slice(0, 100),
                        lastResult: result,
                        error: null,
                    }))
                },
                onError: (err: Error) => {
                    setState(prev => ({ ...prev, error: err.message, isRunning: false, status: 'error' }))
                },
            })

            visionRef.current = vision
            await vision.start()

            // Get the MediaStream from the SDK for preview display
            let mediaStream: MediaStream | null = null
            let isTradingView = false
            try {
                mediaStream = (vision as unknown as { getMediaStream: () => MediaStream | null }).getMediaStream()
                if (mediaStream) {
                    const label = mediaStream.getVideoTracks()[0]?.label?.toLowerCase() ?? ''
                    isTradingView = label.includes('tradingview') || label.includes('tab') || label.includes('chrome') || label.includes('window')
                }
            } catch (e) {
                console.warn('getMediaStream not available on this SDK version:', e)
            }

            setState(prev => ({
                ...prev,
                isRunning: true,
                error: null,
                status: 'active',
                stream: mediaStream,
                isTradingViewDetected: isTradingView,
            }))

            // FPS tracking
            resultCountRef.current = 0
            lastFpsCountRef.current = 0
            fpsTimerRef.current = setInterval(() => {
                const delta = resultCountRef.current - lastFpsCountRef.current
                lastFpsCountRef.current = resultCountRef.current
                setState(prev => ({ ...prev, fps: delta }))
            }, 1000)
        } catch (err) {
            console.error('Vision start failed:', err)
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
            try {
                await (visionRef.current as { stop: () => Promise<void> }).stop()
            } catch { }
            visionRef.current = null
        }
        if (fpsTimerRef.current) clearInterval(fpsTimerRef.current)
        setState(prev => ({ ...prev, isRunning: false, fps: 0, stream: null, status: 'stopped', isTradingViewDetected: false }))
    }, [])

    const clearResults = useCallback(() => {
        setState(prev => ({ ...prev, results: [], lastResult: null }))
    }, [])

    return { state, startVision, stopVision, clearResults }
}