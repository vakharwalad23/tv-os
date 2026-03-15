'use client'

import { SessionStats } from '@/lib/types'
import { Clock, TrendingUp, TrendingDown, Activity } from 'lucide-react'

interface Props {
    stats: SessionStats
    isRunning: boolean
}

function formatDuration(start: Date | null): string {
    if (!start) return '--:--'
    const secs = Math.floor((Date.now() - start.getTime()) / 1000)
    const m = Math.floor(secs / 60).toString().padStart(2, '0')
    const s = (secs % 60).toString().padStart(2, '0')
    return `${m}:${s}`
}

export default function SessionStatsBar({ stats, isRunning }: Props) {
    const bullPct = stats.totalSignals > 0
        ? Math.round((stats.bullishCount / stats.totalSignals) * 100)
        : 0

    const bias = bullPct > 55 ? 'BULL' : bullPct < 45 ? 'BEAR' : 'NEUTRAL'
    const biasColor = bullPct > 55 ? 'text-green-400' : bullPct < 45 ? 'text-red-400' : 'text-muted'

    return (
        <div className="flex items-center gap-4 px-4 h-8 border-t border-border bg-surface/60 shrink-0 overflow-x-auto no-scrollbar">
            {/* Session time */}
            <div className="flex items-center gap-1.5 shrink-0">
                <Clock size={10} className="text-muted" />
                <span className="text-[10px] font-mono text-muted">
                    {isRunning ? formatDuration(stats.startTime) : '--:--'}
                </span>
            </div>

            <div className="w-px h-3 bg-border shrink-0" />

            {/* Total signals */}
            <div className="flex items-center gap-1.5 shrink-0">
                <Activity size={10} className="text-accent" />
                <span className="text-[10px] font-mono text-textDim">{stats.totalSignals} signals</span>
            </div>

            <div className="w-px h-3 bg-border shrink-0" />

            {/* Bull / Bear counts */}
            <div className="flex items-center gap-2 shrink-0">
                <div className="flex items-center gap-1">
                    <TrendingUp size={10} className="text-green-500" />
                    <span className="text-[10px] font-mono text-green-500">{stats.bullishCount}</span>
                </div>
                <div className="flex items-center gap-1">
                    <TrendingDown size={10} className="text-red-500" />
                    <span className="text-[10px] font-mono text-red-500">{stats.bearishCount}</span>
                </div>
            </div>

            {/* Bias bar */}
            {stats.totalSignals > 0 && (
                <>
                    <div className="w-px h-3 bg-border shrink-0" />
                    <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] font-mono text-muted">bias</span>
                        <div className="w-16 h-1 rounded-full bg-border overflow-hidden flex">
                            <div className="bg-green-500 h-full transition-all" style={{ width: `${bullPct}%` }} />
                            <div className="bg-red-500 h-full transition-all" style={{ width: `${100 - bullPct}%` }} />
                        </div>
                        <span className={`text-[10px] font-mono font-semibold ${biasColor}`}>{bias}</span>
                    </div>
                </>
            )}

            {/* Prediction counts */}
            {(stats.greenPredictions + stats.redPredictions) > 0 && (
                <>
                    <div className="w-px h-3 bg-border shrink-0" />
                    <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-[10px] font-mono text-muted">preds</span>
                        <span className="text-[10px] font-mono text-green-400">▲{stats.greenPredictions}</span>
                        <span className="text-[10px] font-mono text-red-400">▼{stats.redPredictions}</span>
                    </div>
                </>
            )}
        </div>
    )
}
