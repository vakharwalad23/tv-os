import { AppSettings, SignalLogEntry, PromptTemplate } from './types'

const SETTINGS_KEY = 'tradevision_settings'
const SIGNAL_LOG_KEY = 'tradevision_signal_log'

export const PROMPT_TEMPLATES: Record<PromptTemplate, { label: string; prompt: string }> = {
    default: {
        label: '📊 General Analysis',
        prompt: `You are analyzing a live TradingView chart. Focus on:
- Current price action and trend direction (bullish/bearish/sideways)
- Key support and resistance levels visible on the chart
- Candlestick patterns (engulfing, doji, hammer, shooting star, etc.)
- Volume anomalies or spikes
- Moving average crossovers or price touching MAs
- RSI/MACD divergences if visible
- Breakouts, breakdowns, or consolidation zones

Report ONLY significant changes or notable patterns. Be concise and precise.
Format: [SIGNAL TYPE] Description. Price level if visible.`,
    },
    candle_predictor: {
        label: '🕯️ Candle Predictor',
        prompt: `You are analyzing a live TradingView candlestick chart. Your ONLY job is to predict the next candle direction.

Look at:
1. The last 3-5 completed candles (size, wicks, body direction)
2. Current forming candle
3. Nearby support/resistance
4. Volume if visible
5. RSI position if visible (overbought/oversold)

Respond STRICTLY in this format and nothing else:
PREDICTION: GREEN | confidence: 70% | reason: <one short reason>

OR

PREDICTION: RED | confidence: 65% | reason: <one short reason>

Do not add any other text.`,
    },
    scalping: {
        label: '⚡ Scalping Mode',
        prompt: `You are analyzing a TradingView chart for SCALPING opportunities (very short term, 1-5 min moves).

Focus ONLY on:
- Immediate momentum direction (last 2-3 candles)
- Price near key intraday level (round numbers, recent highs/lows)
- Volume surge or dry-up
- Wick rejections at levels
- Tight consolidation ready to break

Output format: [SCALP LONG] or [SCALP SHORT] or [WAIT] — then one sentence reason. Price level if visible.
Be extremely concise. Only fire when there's a clear setup.`,
    },
    swing: {
        label: '📈 Swing Trade Mode',
        prompt: `You are analyzing a TradingView chart for SWING TRADE setups (holds lasting hours to days).

Focus on:
- Higher timeframe trend direction
- Key weekly/daily support and resistance zones
- Chart patterns: flags, wedges, triangles, H&S, cups
- MA alignment (20, 50, 200 if visible)
- RSI divergence or extreme readings
- Volume confirmation on moves

Output: [SWING LONG SETUP] or [SWING SHORT SETUP] or [NO SETUP] — describe the pattern and key levels.`,
    },
    volume: {
        label: '📦 Volume Analysis',
        prompt: `You are analyzing a TradingView chart with FOCUS ON VOLUME.

Report when you see:
- Volume spike (>2x normal bar size)
- High volume candle that didn't move much price (absorption/distribution)
- Low volume pullback in a trend (healthy)
- Volume dry-up before potential move
- Volume divergence (price up, volume down or vice versa)

Format: [VOL SPIKE] / [ABSORPTION] / [DISTRIBUTION] / [DRY UP] / [DIVERGENCE] — then price level and context.
Ignore candles with normal volume.`,
    },
    pattern_hunter: {
        label: '🔍 Pattern Hunter',
        prompt: `You are a chart pattern specialist analyzing a TradingView chart.

Identify and report ONLY these patterns when clearly visible:
- Candlestick: Doji, Hammer, Shooting Star, Engulfing (Bull/Bear), Morning/Evening Star, Harami, Marubozu
- Chart: Double Top/Bottom, Head & Shoulders, Triangle (sym/asc/desc), Flag, Wedge, Cup & Handle, Pennant

For each pattern found:
FORMAT: [PATTERN NAME] at ~$PRICE — bullish/bearish implication — confidence: high/medium/low

Only report patterns that are COMPLETE or nearly complete. Do not speculate.`,
    },
}

export const DEFAULT_SETTINGS: AppSettings = {
    overshootApiKey: '',
    anthropicApiKey: '',
    visionPrompt: PROMPT_TEMPLATES.default.prompt,
    model: 'Qwen/Qwen3.5-9B',
    processingMode: 'frame',
    analysisFrequency: 5,
    audioAlertsEnabled: true,
    alertKeywords: 'BREAKOUT,BREAKDOWN,REVERSAL,ALERT,ENGULFING,DIVERGENCE',
    promptTemplate: 'default',
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

// Signal log persistence
export function loadSignalLog(): SignalLogEntry[] {
    if (typeof window === 'undefined') return []
    try {
        const raw = localStorage.getItem(SIGNAL_LOG_KEY)
        if (!raw) return []
        const parsed = JSON.parse(raw)
        return parsed.map((e: SignalLogEntry) => ({ ...e, timestamp: new Date(e.timestamp) }))
    } catch {
        return []
    }
}

export function appendSignalLog(entry: SignalLogEntry): void {
    if (typeof window === 'undefined') return
    try {
        const existing = loadSignalLog()
        const updated = [entry, ...existing].slice(0, 500) // keep max 500
        localStorage.setItem(SIGNAL_LOG_KEY, JSON.stringify(updated))
    } catch { }
}

export function clearSignalLog(): void {
    if (typeof window === 'undefined') return
    localStorage.removeItem(SIGNAL_LOG_KEY)
}

export function exportSignalLogCSV(entries: SignalLogEntry[]): void {
    const header = 'Timestamp,Signal Type,Prediction,Confidence,Content\n'
    const rows = entries.map(e =>
        `"${e.timestamp.toISOString()}","${e.signalType || ''}","${e.prediction || ''}","${e.predictionConfidence || ''}","${e.content.replace(/"/g, '""')}"`
    ).join('\n')
    const blob = new Blob([header + rows], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `tradevision_signals_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
}