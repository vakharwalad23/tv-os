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
    // parsed fields from structured prompt output
    prediction?: 'GREEN' | 'RED' | null
    predictionConfidence?: number
    predictionReason?: string
    signalType?: string
}

export interface SignalLogEntry {
    id: string
    timestamp: Date
    content: string
    prediction?: 'GREEN' | 'RED' | null
    predictionConfidence?: number
    signalType?: string
}

export interface SessionStats {
    totalSignals: number
    bullishCount: number
    bearishCount: number
    greenPredictions: number
    redPredictions: number
    startTime: Date | null
}

export interface AppSettings {
    overshootApiKey: string
    anthropicApiKey: string
    visionPrompt: string
    model: string
    processingMode: 'frame' | 'clip'
    analysisFrequency: number
    audioAlertsEnabled: boolean
    alertKeywords: string // comma separated
    promptTemplate: string // which preset is active
}

export type StreamStatus = 'idle' | 'requesting' | 'active' | 'error' | 'stopped'

export type PromptTemplate = 'default' | 'scalping' | 'swing' | 'candle_predictor' | 'volume' | 'pattern_hunter'
export interface PaperTrade {
    id: string
    openedAt: Date
    closedAt?: Date
    direction: 'LONG' | 'SHORT'
    predictionConfidence: number
    reason: string
    outcome?: 'WIN' | 'LOSS' | 'PENDING'
}

export interface SignalTimelineEntry {
    id: string
    timestamp: Date
    type: 'bullish' | 'bearish' | 'neutral' | 'prediction_green' | 'prediction_red'
    label: string
}

