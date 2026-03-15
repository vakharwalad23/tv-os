'use client'

import { useState, useCallback } from 'react'
import { PaperTrade } from '@/lib/types'
import { loadPaperTrades, savePaperTrades, clearPaperTrades } from '@/lib/storage'
import { TrendingUp, TrendingDown, Target, Trash2, ChevronDown, ChevronUp } from 'lucide-react'

interface Props {
    latestPrediction: { direction: 'GREEN' | 'RED' | null; confidence: number; reason: string } | null
    isRunning: boolean
}

export default function PaperTrader({ latestPrediction, isRunning }: Props) {
    const [trades, setTrades] = useState<PaperTrade[]>(() => loadPaperTrades())
    const [isExpanded, setIsExpanded] = useState(false)

    const openTrade = useCallback((direction: 'LONG' | 'SHORT') => {
        const trade: PaperTrade = {
            id: crypto.randomUUID(),
            openedAt: new Date(),
            direction,
            predictionConfidence: latestPrediction?.confidence ?? 0,
            reason: latestPrediction?.reason ?? 'Manual entry',
            outcome: 'PENDING',
        }
        const updated = [trade, ...trades]
        setTrades(updated)
        savePaperTrades(updated)
    }, [trades, latestPrediction])

    const closeTrade = useCallback((id: string, outcome: 'WIN' | 'LOSS') => {
        const updated = trades.map(t =>
            t.id === id ? { ...t, outcome, closedAt: new Date() } : t
        )
        setTrades(updated)
        savePaperTrades(updated)
    }, [trades])

    const handleClear = useCallback(() => {
        clearPaperTrades()
        setTrades([])
    }, [])

    const closed  = trades.filter(t => t.outcome !== 'PENDING')
    const wins    = closed.filter(t => t.outcome === 'WIN').length
    const losses  = closed.filter(t => t.outcome === 'LOSS').length
    const winRate = closed.length > 0 ? Math.round((wins / closed.length) * 100) : null
    const pending = trades.filter(t => t.outcome === 'PENDING')

    return (
        <div className="rounded-xl border border-border bg-surface overflow-hidden">
            {/* Header — always visible, click to expand */}
            <div
                className="flex items-center justify-between px-4 py-2.5 cursor-pointer hover:bg-border/40 transition-colors"
                onClick={() => setIsExpanded(v => !v)}
            >
                <div className="flex items-center gap-2">
                    <Target size={12} className="text-accent" />
                    <span className="text-[10px] font-mono uppercase tracking-widest text-muted">
                        Paper Trader
                    </span>
                </div>
                <div className="flex items-center gap-2.5">
                    {winRate !== null && (
                        <span className={`text-[11px] font-mono font-semibold ${winRate >= 50 ? 'text-green-400' : 'text-red-400'}`}>
                            {winRate}% WR
                        </span>
                    )}
                    {pending.length > 0 && (
                        <span className="text-[10px] font-mono text-warn border border-warn/30 px-1.5 py-0.5 rounded-full">
                            {pending.length} open
                        </span>
                    )}
                    {isExpanded
                        ? <ChevronUp size={12} className="text-muted" />
                        : <ChevronDown size={12} className="text-muted" />
                    }
                </div>
            </div>

            {isExpanded && (
                <div className="border-t border-border">

                    {/* Stats bar */}
                    {closed.length > 0 && (
                        <div className="flex items-center gap-3 px-4 py-2 border-b border-border bg-bg/30">
                            <span className="text-[10px] font-mono text-green-400">W {wins}</span>
                            <span className="text-[10px] font-mono text-red-400">L {losses}</span>
                            {winRate !== null && (
                                <div className="flex-1 h-1 rounded-full bg-border overflow-hidden flex">
                                    <div className="bg-green-500 h-full" style={{ width: `${winRate}%` }} />
                                    <div className="bg-red-500 h-full" style={{ width: `${100 - winRate}%` }} />
                                </div>
                            )}
                            <button
                                onClick={e => { e.stopPropagation(); handleClear(); }}
                                className="p-1 text-muted hover:text-danger transition-colors"
                                title="Clear trades"
                            >
                                <Trash2 size={11} />
                            </button>
                        </div>
                    )}

                    {/* Trade buttons */}
                    <div className="grid grid-cols-2 gap-2 p-3">
                        <button
                            onClick={() => openTrade('LONG')}
                            disabled={!isRunning}
                            className="flex items-center justify-center gap-1.5 py-2.5 text-xs font-mono font-semibold text-green-400 border border-green-500/30 bg-green-500/5 hover:bg-green-500/12 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                            <TrendingUp size={12} />
                            LONG
                        </button>
                        <button
                            onClick={() => openTrade('SHORT')}
                            disabled={!isRunning}
                            className="flex items-center justify-center gap-1.5 py-2.5 text-xs font-mono font-semibold text-red-400 border border-red-500/30 bg-red-500/5 hover:bg-red-500/12 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                            <TrendingDown size={12} />
                            SHORT
                        </button>
                    </div>

                    {latestPrediction?.reason && (
                        <p className="px-3 pb-2 text-[10px] font-mono text-muted truncate">
                            Signal: {latestPrediction.reason.slice(0, 65)}
                        </p>
                    )}

                    {/* Pending trades */}
                    {pending.length > 0 && (
                        <div className="border-t border-border p-2.5 space-y-1.5">
                            <p className="text-[10px] font-mono text-muted uppercase tracking-widest px-1 mb-2">
                                Open
                            </p>
                            {pending.map(trade => (
                                <div
                                    key={trade.id}
                                    className={`flex items-center gap-2 px-2.5 py-2 rounded-lg border text-xs font-mono ${
                                        trade.direction === 'LONG'
                                            ? 'border-green-500/20 bg-green-500/5'
                                            : 'border-red-500/20 bg-red-500/5'
                                    }`}
                                >
                                    <span className={trade.direction === 'LONG' ? 'text-green-400 font-bold' : 'text-red-400 font-bold'}>
                                        {trade.direction}
                                    </span>
                                    <span className="text-muted text-[10px] flex-1">
                                        {trade.openedAt.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                    <span className="text-textDim text-[10px]">{trade.predictionConfidence}%</span>
                                    <button
                                        onClick={() => closeTrade(trade.id, 'WIN')}
                                        className="px-1.5 py-0.5 text-[10px] text-green-400 border border-green-500/30 rounded hover:bg-green-500/10 transition-colors"
                                    >
                                        WIN
                                    </button>
                                    <button
                                        onClick={() => closeTrade(trade.id, 'LOSS')}
                                        className="px-1.5 py-0.5 text-[10px] text-red-400 border border-red-500/30 rounded hover:bg-red-500/10 transition-colors"
                                    >
                                        LOSS
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* History */}
                    {closed.length > 0 && (
                        <div className="border-t border-border p-2.5">
                            <p className="text-[10px] font-mono text-muted uppercase tracking-widest px-1 mb-2">History</p>
                            <div className="space-y-1 max-h-28 overflow-y-auto">
                                {closed.slice(0, 10).map(trade => (
                                    <div key={trade.id} className="flex items-center gap-2 px-1 text-[11px] font-mono">
                                        <span className={trade.direction === 'LONG' ? 'text-green-400' : 'text-red-400'}>
                                            {trade.direction === 'LONG' ? '▲' : '▼'}
                                        </span>
                                        <span className="text-muted flex-1">
                                            {trade.openedAt.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                        <span className={`font-semibold ${trade.outcome === 'WIN' ? 'text-green-400' : 'text-red-400'}`}>
                                            {trade.outcome}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {trades.length === 0 && (
                        <div className="px-4 pb-4 pt-1 text-center">
                            <p className="text-[11px] text-muted font-mono">No trades yet</p>
                            <p className="text-[10px] text-muted/50 font-mono mt-0.5">
                                Start a session, then go LONG or SHORT
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
