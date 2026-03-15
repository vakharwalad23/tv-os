'use client'

import { VisionState } from '@/hooks/useVisionAnalysis'

interface Props {
    visionState: VisionState
}

export default function CandlePredictor({ visionState }: Props) {
    const { latestPrediction, candleStreak, sessionStats } = visionState

    const totalPreds = sessionStats.greenPredictions + sessionStats.redPredictions
    const greenPct = totalPreds > 0 ? Math.round((sessionStats.greenPredictions / totalPreds) * 100) : 0

    const isGreen = latestPrediction?.direction === 'GREEN'
    const isRed = latestPrediction?.direction === 'RED'

    return (
        <div className="rounded-xl border border-border bg-surface overflow-hidden">

            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-border">
                <span className="text-[10px] font-mono uppercase tracking-widest text-muted">Next Candle</span>
                {totalPreds > 0 && (
                    <span className="text-[10px] font-mono text-muted">{totalPreds} predictions</span>
                )}
            </div>

            <div className="p-3 space-y-2.5">

                {/* Main prediction card */}
                {latestPrediction ? (
                    <div className={`rounded-lg p-3.5 border text-center ${
                        isGreen ? 'border-green-500/30 bg-green-500/8' : 'border-red-500/30 bg-red-500/8'
                    }`}>
                        {/* Candle icon */}
                        <div className="flex justify-center mb-2.5">
                            <div className="flex flex-col items-center">
                                <div className={`w-px h-3 ${isGreen ? 'bg-green-400' : 'bg-red-400'}`} />
                                <div className={`w-4 h-7 rounded-sm ${isGreen ? 'bg-green-400' : 'bg-red-500'}`} />
                                <div className={`w-px h-3 ${isGreen ? 'bg-green-400' : 'bg-red-400'}`} />
                            </div>
                        </div>
                        <p className={`text-xl font-mono font-bold mb-0.5 ${isGreen ? 'text-green-400' : 'text-red-400'}`}>
                            {latestPrediction.direction}
                        </p>
                        <p className={`text-xs font-mono mb-2 ${isGreen ? 'text-green-400/70' : 'text-red-400/70'}`}>
                            {latestPrediction.confidence}% confidence
                        </p>
                        {latestPrediction.reason && (
                            <p className="text-[11px] text-textDim leading-relaxed">{latestPrediction.reason}</p>
                        )}
                        {/* Confidence bar */}
                        <div className="mt-3 h-0.5 rounded-full bg-border overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all duration-700 ${isGreen ? 'bg-green-400' : 'bg-red-400'}`}
                                style={{ width: `${latestPrediction.confidence}%` }}
                            />
                        </div>
                    </div>
                ) : (
                    <div className="rounded-lg p-4 border border-border/60 text-center bg-bg/40">
                        <div className="text-2xl mb-1.5 opacity-20">🕯</div>
                        <p className="text-[11px] text-muted font-mono">
                            {visionState.isRunning ? 'Waiting for prediction…' : 'Use "Candle Predictor" mode'}
                        </p>
                    </div>
                )}

                {/* Streak */}
                {candleStreak && candleStreak.count >= 2 && (
                    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${
                        candleStreak.color === 'GREEN'
                            ? 'border-green-500/25 bg-green-500/5'
                            : 'border-red-500/25 bg-red-500/5'
                    }`}>
                        <span className="text-[10px] text-muted font-mono shrink-0">Streak</span>
                        <div className="flex gap-0.5">
                            {Array.from({ length: Math.min(candleStreak.count, 10) }).map((_, i) => (
                                <div
                                    key={i}
                                    className={`w-2.5 h-4 rounded-sm ${candleStreak.color === 'GREEN' ? 'bg-green-400' : 'bg-red-500'}`}
                                />
                            ))}
                            {candleStreak.count > 10 && (
                                <span className="text-[10px] text-muted font-mono ml-1 self-center">
                                    +{candleStreak.count - 10}
                                </span>
                            )}
                        </div>
                        <span className={`text-xs font-mono font-bold ml-auto ${candleStreak.color === 'GREEN' ? 'text-green-400' : 'text-red-400'}`}>
                            {candleStreak.count}×
                        </span>
                    </div>
                )}

                {/* Prediction ratio */}
                {totalPreds > 0 && (
                    <div className="space-y-1">
                        <div className="flex items-center justify-between text-[11px] font-mono">
                            <span className="text-green-400">▲ {sessionStats.greenPredictions}</span>
                            <span className="text-muted">{greenPct}% green</span>
                            <span className="text-red-400">▼ {sessionStats.redPredictions}</span>
                        </div>
                        <div className="h-1 rounded-full bg-border overflow-hidden flex">
                            <div className="bg-green-500 h-full transition-all duration-500" style={{ width: `${greenPct}%` }} />
                            <div className="bg-red-500 h-full transition-all duration-500" style={{ width: `${100 - greenPct}%` }} />
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
