'use client'

import { useState, useRef, useCallback } from 'react'
import { StreamStatus } from '@/lib/types'

export interface ScreenCaptureState {
    status: StreamStatus
    stream: MediaStream | null
    error: string | null
}

export function useScreenCapture() {
    const [state, setState] = useState<ScreenCaptureState>({
        status: 'idle',
        stream: null,
        error: null,
    })

    const streamRef = useRef<MediaStream | null>(null)
    const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null)
    const canvasRef = useRef<HTMLCanvasElement | null>(null)
    const videoRef = useRef<HTMLVideoElement | null>(null)

    const startCapture = useCallback(async () => {
        setState(prev => ({ ...prev, status: 'requesting', error: null }))
        try {
            const stream = await navigator.mediaDevices.getDisplayMedia({
                video: {
                    frameRate: { ideal: 30, max: 60 },
                    width: { ideal: 1920 },
                    height: { ideal: 1080 },
                },
                audio: false,
                // @ts-ignore — preferCurrentTab is a Chrome hint to surface the current tab first
                preferCurrentTab: false,
            })

            streamRef.current = stream
            setState({
                status: 'active',
                stream,
                error: null,
            })

            // Listen for user stopping share via browser chrome
            stream.getVideoTracks()[0].addEventListener('ended', () => {
                stopCapture()
            })

            return stream
        } catch (err: unknown) {
            const error = err instanceof Error ? err.message : 'Screen capture failed'
            const isAborted = error.includes('Permission denied') || error.includes('NotAllowedError')
            setState({
                status: 'error',
                stream: null,
                error: isAborted ? 'Screen share was cancelled or denied.' : error,
            })
            return null
        }
    }, [])

    const stopCapture = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(t => t.stop())
            streamRef.current = null
        }
        if (detectionIntervalRef.current) {
            clearInterval(detectionIntervalRef.current)
        }
        setState({ status: 'stopped', stream: null, error: null })
    }, [])

    // Grab a single frame from the stream as a base64 image
    const captureFrame = useCallback((): string | null => {
        const stream = streamRef.current
        if (!stream) return null

        const videoTrack = stream.getVideoTracks()[0]
        if (!videoTrack) return null

        // Create or reuse an ImageCapture
        if (!canvasRef.current) {
            canvasRef.current = document.createElement('canvas')
        }
        if (!videoRef.current) {
            videoRef.current = document.createElement('video')
            videoRef.current.srcObject = stream
            videoRef.current.muted = true
            videoRef.current.play().catch(() => { })
        }

        const video = videoRef.current
        const canvas = canvasRef.current
        canvas.width = video.videoWidth || 1280
        canvas.height = video.videoHeight || 720

        const ctx = canvas.getContext('2d')
        if (!ctx) return null
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

        return canvas.toDataURL('image/jpeg', 0.85).split(',')[1] // base64 only
    }, [])

    return { state, startCapture, stopCapture, captureFrame, streamRef }
}