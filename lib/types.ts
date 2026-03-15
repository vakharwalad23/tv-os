export interface ChatMessage {
    id: string
    role: 'user' | 'assistant' | 'system'
    content: string
    timestamp: Date
    isStreaming?: boolean
}

export interface VisionResult {
    id: string
    content: string
    timestamp: Date
    confidence?: number
}

export interface AppSettings {
    overshootApiKey: string
    anthropicApiKey: string
    visionPrompt: string
    model: string
    processingMode: 'frame' | 'clip'
    analysisFrequency: number // seconds between forced snapshots
}

export type StreamStatus = 'idle' | 'requesting' | 'active' | 'error' | 'stopped'