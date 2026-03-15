import { AppSettings } from './types'

const SETTINGS_KEY = 'tradevision_settings'

export const DEFAULT_SETTINGS: AppSettings = {
    overshootApiKey: '',
    anthropicApiKey: '',
    visionPrompt: `You are analyzing a live TradingView chart. Focus on:
- Current price action and trend direction (bullish/bearish/sideways)
- Key support and resistance levels visible on the chart
- Candlestick patterns (engulfing, doji, hammer, shooting star, etc.)
- Volume anomalies or spikes
- Moving average crossovers or price touching MAs
- RSI/MACD divergences if visible
- Breakouts, breakdowns, or consolidation zones
- Any sudden price movements or volatility spikes

Report ONLY significant changes or notable patterns. Be concise and precise.
Format: [SIGNAL TYPE] Description. Price level if visible.`,
    model: 'Qwen/Qwen3.5-9B',
    processingMode: 'frame',
    analysisFrequency: 5,
}

export function loadSettings(): AppSettings {
    if (typeof window === 'undefined') return DEFAULT_SETTINGS
    try {
        const raw = localStorage.getItem(SETTINGS_KEY)
        if (!raw) return DEFAULT_SETTINGS
        return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) }
    } catch {
        return DEFAULT_SETTINGS
    }
}

export function saveSettings(settings: AppSettings): void {
    if (typeof window === 'undefined') return
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
}