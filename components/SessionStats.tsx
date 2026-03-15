'use client'

import { SessionStats } from '@/lib/types'
import { Clock, TrendingUp, TrendingDown, Activity } from 'lucide-react'

interface Props {
    stats: SessionStats
    isRunning: boolean
}

function formatDuration(start: Date | null): string {
    if (!start) return '00:00'
    const secs = Math.floor((Date.now() - start.getTime()) / 1000)
    const m = Math.floor(secs / 60).toString().padStart(2, '0')
    const s = (secs % 60).toString().padStart(2, '0')
    return `${m}:${s}`
}

export default function SessionStatsBar({ stats, isRunning }: Props) {
    const bullPct = stats.totalSignals > 0
        ? Math.round((stats.bullishCount / stats.totalSignals) * 100)
        : 0

    return (
        <div className="flex items-center gap-4 px-4 py-2 border-t border-border bg-surface/60 shrink-0 overflow-x-auto no-scrollbar">
            {/* Session time */}
            <div className="flex items-center gap-1.5 shrink-0">
                <Clock size={11} className="text-muted" />
                <span className="text-xs font-mono text-textDim">
                    {isRunning ? formatDuration(stats.startTime) : '--:--'}
                </span>
            </div>

            <div className="w-px h-3 bg-border shrink-0" />

            {/* Total signals */}
            <div className="flex items-center gap-1.5 shrink-0">
                <Activity size={11} className="text-accent" />
                <span className="text-xs font-mono text-textDim">{stats.totalSignals} signals</span>
            </div>

            <div className="w-px h-3 bg-border shrink-0" />

            {/* Bullish/Bearish */}
            <div className="flex items-center gap-2 shrink-0">
                <div className="flex items-center gap-1">
                    <TrendingUp size={11} className="text-green-400" />
                    <span className="text-xs font-mono text-green-400">{stats.bullishCount}</span>
                </div>
                <div className="flex items-center gap-1">
                    <TrendingDown size={11} className="text-red-400" />
                    <span className="text-xs font-mono text-red-400">{stats.bearishCount}</span>
                </div>
            </div>

            {/* Bias bar */}
            {stats.totalSignals > 0 && (
                <>
                    <div className="w-px h-3 bg-border shrink-0" />
                    <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs font-mono text-muted">bias:</span>
                        <div className="w-20 h-1.5 rounded-full bg-border overflow-hidden flex">
                            <div className="bg-green-500 h-full" style={{ width: `${bullPct}%` }} />
                            <div className="bg-red-500 h-full" style={{ width: `${100 - bullPct}%` }} />
                        </div>
                        <span className={`text-xs font-mono ${bullPct > 55 ? 'text-green-400' : bullPct < 45 ? 'text-red-400' : 'text-textDim'}`}>
                            {bullPct > 55 ? 'BULL' : bullPct < 45 ? 'BEAR' : 'NEUTRAL'}
                        </span>
                    </div>
                </>
            )}
        </div>
    )
}