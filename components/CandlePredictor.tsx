'use client'

import { VisionState } from '@/hooks/useVisionAnalysis'

interface Props {
    visionState: VisionState
}

export default function CandlePredictor({ visionState }: Props) {
    const { latestPrediction, candleStreak, sessionStats } = visionState

    const totalPreds = sessionStats.greenPredictions + sessionStats.redPredictions
    const greenPct = totalPreds > 0 ? Math.round((sessionStats.greenPredictions / totalPreds) * 100) : 0
    const redPct = totalPreds > 0 ? 100 - greenPct : 0

    const isGreen = latestPrediction?.direction === 'GREEN'
    const isRed = latestPrediction?.direction === 'RED'

    return (
        <div className="rounded-xl border border-border bg-surface overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-border">
                <span className="text-xs font-mono uppercase tracking-widest text-textDim">🕯 Next Candle</span>
                {totalPreds > 0 && (
                    <span className="text-xs font-mono text-muted">{totalPreds} predictions</span>
                )}
            </div>

            <div className="p-3 space-y-3">
                {/* Big prediction card */}
                {latestPrediction ? (
                    <div className={`rounded-lg p-4 border text-center transition-all ${
                        isGreen
                            ? 'border-green-500/40 bg-green-500/10'
                            : 'border-red-500/40 bg-red-500/10'
                    }`}>
                        {/* Candle icon */}
                        <div className="flex justify-center mb-2">
                            <div className={`relative w-6 flex flex-col items-center`}>
                                {/* wick top */}
                                <div className={`w-0.5 h-3 ${isGreen ? 'bg-green-400' : 'bg-red-400'}`} />
                                {/* body */}
                                <div className={`w-4 h-7 rounded-sm ${isGreen ? 'bg-green-400' : 'bg-red-500'}`} />
                                {/* wick bottom */}
                                <div className={`w-0.5 h-3 ${isGreen ? 'bg-green-400' : 'bg-red-400'}`} />
                            </div>
                        </div>

                        <div className={`text-2xl font-mono font-bold mb-1 ${isGreen ? 'text-green-400' : 'text-red-400'}`}>
                            {latestPrediction.direction}
                        </div>
                        <div className={`text-sm font-mono font-semibold mb-2 ${isGreen ? 'text-green-400/80' : 'text-red-400/80'}`}>
                            {latestPrediction.confidence}% confidence
                        </div>
                        {latestPrediction.reason && (
                            <p className="text-xs text-textDim leading-relaxed">{latestPrediction.reason}</p>
                        )}

                        {/* Confidence bar */}
                        <div className="mt-3 h-1 rounded-full bg-border overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all duration-700 ${isGreen ? 'bg-green-400' : 'bg-red-400'}`}
                                style={{ width: `${latestPrediction.confidence}%` }}
                            />
                        </div>
                    </div>
                ) : (
                    <div className="rounded-lg p-4 border border-border text-center">
                        <div className="text-3xl mb-2 opacity-30">🕯</div>
                        <p className="text-xs text-muted font-mono">
                            {visionState.isRunning
                                ? 'Waiting for prediction...'
                                : 'Use "Candle Predictor" prompt template'}
                        </p>
                    </div>
                )}

                {/* Candle Streak */}
                {candleStreak && candleStreak.count >= 2 && (
                    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${
                        candleStreak.color === 'GREEN'
                            ? 'border-green-500/30 bg-green-500/5'
                            : 'border-red-500/30 bg-red-500/5'
                    }`}>
                        <span className="text-xs text-textDim font-mono">Streak:</span>
                        <div className="flex gap-1">
                            {Array.from({ length: Math.min(candleStreak.count, 8) }).map((_, i) => (
                                <div
                                    key={i}
                                    className={`w-3 h-4 rounded-sm ${candleStreak.color === 'GREEN' ? 'bg-green-400' : 'bg-red-500'}`}
                                />
                            ))}
                            {candleStreak.count > 8 && (
                                <span className="text-xs text-muted font-mono ml-1">+{candleStreak.count - 8}</span>
                            )}
                        </div>
                        <span className={`text-xs font-mono font-semibold ml-auto ${candleStreak.color === 'GREEN' ? 'text-green-400' : 'text-red-400'}`}>
                            {candleStreak.count}×
                        </span>
                    </div>
                )}

                {/* Session prediction ratio */}
                {totalPreds > 0 && (
                    <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs font-mono">
                            <span className="text-green-400">▲ {sessionStats.greenPredictions} GREEN</span>
                            <span className="text-red-400">▼ {sessionStats.redPredictions} RED</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-border overflow-hidden flex">
                            <div className="bg-green-500 h-full transition-all duration-500" style={{ width: `${greenPct}%` }} />
                            <div className="bg-red-500 h-full transition-all duration-500" style={{ width: `${redPct}%` }} />
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}