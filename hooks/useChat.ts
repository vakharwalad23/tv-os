'use client'

import { useState, useRef, useCallback } from 'react'
import { ChatMessage, VisionResult } from '@/lib/types'

export function useChat() {
    const [messages, setMessages] = useState<ChatMessage[]>([
        {
            id: 'welcome',
            role: 'system',
            content: 'TradeVision is ready. Start screen sharing to begin live chart analysis.',
            timestamp: new Date(),
        }
    ])
    const [isLoading, setIsLoading] = useState(false)

    const latestVisionResultsRef = useRef<VisionResult[]>([])

    const updateVisionContext = useCallback((results: VisionResult[]) => {
        latestVisionResultsRef.current = results
    }, [])

    const sendMessage = useCallback(async (
        userMessage: string,
        apiKey: string,
        visionPromptContext: string
    ) => {
        if (!userMessage.trim() || !apiKey) return

        const userMsg: ChatMessage = {
            id: crypto.randomUUID(),
            role: 'user',
            content: userMessage,
            timestamp: new Date(),
        }

        setMessages(prev => [...prev, userMsg])
        setIsLoading(true)

        // Build context from recent vision results
        const recentResults = latestVisionResultsRef.current.slice(0, 10)
        const visionContext = recentResults.length > 0
            ? `\n\nRecent live chart observations from Overshoot AI vision (most recent first):\n${recentResults.map((r, i) =>
                `[${i === 0 ? 'NOW' : `${i * 3}s ago`}] ${r.content}`
            ).join('\n')
            }`
            : '\n\n(No live chart data captured yet — screen share not active or no signals detected)'

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    apiKey,
                    system: `You are TradeVision AI, an expert trading assistant with deep knowledge of technical analysis, chart patterns, and market dynamics. You have access to real-time visual analysis of a live chart being screen-shared by the user.

The vision AI (Overshoot) is continuously analyzing the live chart and feeding you observations. Use this context to answer the user's questions precisely and concisely.

Vision analysis configuration: ${visionPromptContext}${visionContext}

Rules:
- Be precise and actionable, not vague
- Use proper trading terminology  
- If asked about specific patterns, reference the actual vision data when available
- Never give direct financial advice — frame as technical observations
- Keep responses concise and focused`,
                    messages: [
                        ...messages
                            .filter(m => m.role !== 'system')
                            .slice(-20)
                            .map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
                        { role: 'user', content: userMessage }
                    ],
                }),
            })

            if (!response.ok) {
                const err = await response.json().catch(() => ({}))
                throw new Error(err?.error || `API error ${response.status}`)
            }

            const data = await response.json()
            const assistantContent = data.text || 'No response received.'

            const assistantMsg: ChatMessage = {
                id: crypto.randomUUID(),
                role: 'assistant',
                content: assistantContent,
                timestamp: new Date(),
            }

            setMessages(prev => [...prev, assistantMsg])
        } catch (err) {
            const errorMsg: ChatMessage = {
                id: crypto.randomUUID(),
                role: 'system',
                content: `Error: ${err instanceof Error ? err.message : 'Failed to get response'}`,
                timestamp: new Date(),
            }
            setMessages(prev => [...prev, errorMsg])
        } finally {
            setIsLoading(false)
        }
    }, [messages])

    const clearChat = useCallback(() => {
        setMessages([{
            id: 'welcome',
            role: 'system',
            content: 'Chat cleared. Ready for new analysis session.',
            timestamp: new Date(),
        }])
    }, [])

    return { messages, isLoading, sendMessage, clearChat, updateVisionContext }
}