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

    const closed = trades.filter(t => t.outcome !== 'PENDING')
    const wins = closed.filter(t => t.outcome === 'WIN').length
    const losses = closed.filter(t => t.outcome === 'LOSS').length
    const winRate = closed.length > 0 ? Math.round((wins / closed.length) * 100) : null
    const pending = trades.filter(t => t.outcome === 'PENDING')

    return (
        <div className="rounded-xl border border-border bg-surface overflow-hidden">
            {/* Header */}
            <div
                className="flex items-center justify-between px-4 py-2.5 cursor-pointer hover:bg-border/30 transition-colors"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-2">
                    <Target size={13} className="text-accent" />
                    <span className="text-xs font-mono uppercase tracking-widest text-textDim">Paper Trader</span>
                </div>
                <div className="flex items-center gap-3">
                    {winRate !== null && (
                        <span className={`text-xs font-mono font-semibold ${winRate >= 50 ? 'text-green-400' : 'text-red-400'}`}>
                            {winRate}% WR
                        </span>
                    )}
                    {isExpanded ? <ChevronUp size={13} className="text-muted" /> : <ChevronDown size={13} className="text-muted" />}
                </div>
            </div>

            {isExpanded && (
                <div className="border-t border-border">
                    {/* Stats row */}
                    {closed.length > 0 && (
                        <div className="flex items-center gap-4 px-4 py-2 border-b border-border bg-bg/20">
                            <div className="flex items-center gap-1.5">
                                <span className="text-xs font-mono text-muted">Total:</span>
                                <span className="text-xs font-mono text-text">{closed.length}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="text-xs font-mono text-green-400">W: {wins}</span>
                                <span className="text-xs font-mono text-red-400">L: {losses}</span>
                            </div>
                            {winRate !== null && (
                                <div className="flex-1 h-1.5 rounded-full bg-border overflow-hidden flex">
                                    <div className="bg-green-500 h-full transition-all" style={{ width: `${winRate}%` }} />
                                    <div className="bg-red-500 h-full transition-all" style={{ width: `${100 - winRate}%` }} />
                                </div>
                            )}
                            <button onClick={handleClear} className="p-1 hover:text-danger text-muted transition-colors">
                                <Trash2 size={11} />
                            </button>
                        </div>
                    )}

                    {/* Open trade buttons */}
                    <div className="flex items-center gap-2 px-3 py-3">
                        <button
                            onClick={() => openTrade('LONG')}
                            disabled={!isRunning}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-mono font-semibold text-green-400 border border-green-500/30 bg-green-500/5 hover:bg-green-500/15 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                            <TrendingUp size={13} /> LONG
                        </button>
                        <button
                            onClick={() => openTrade('SHORT')}
                            disabled={!isRunning}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-mono font-semibold text-red-400 border border-red-500/30 bg-red-500/5 hover:bg-red-500/15 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                            <TrendingDown size={13} /> SHORT
                        </button>
                    </div>

                    {latestPrediction?.reason && (
                        <div className="px-3 pb-2">
                            <p className="text-[10px] font-mono text-muted">
                                Based on: {latestPrediction.reason.slice(0, 60)}
                            </p>
                        </div>
                    )}

                    {/* Pending trades */}
                    {pending.length > 0 && (
                        <div className="border-t border-border px-3 py-2 space-y-1.5">
                            <p className="text-[10px] font-mono text-muted uppercase tracking-widest mb-2">Open Trades</p>
                            {pending.map(trade => (
                                <div key={trade.id} className={`flex items-center gap-2 p-2 rounded-lg border ${
                                    trade.direction === 'LONG'
                                        ? 'border-green-500/20 bg-green-500/5'
                                        : 'border-red-500/20 bg-red-500/5'
                                }`}>
                                    <span className={`text-xs font-mono font-bold ${trade.direction === 'LONG' ? 'text-green-400' : 'text-red-400'}`}>
                                        {trade.direction}
                                    </span>
                                    <span className="text-xs font-mono text-muted flex-1">
                                        {trade.openedAt.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                    <span className="text-xs font-mono text-textDim">{trade.predictionConfidence}%</span>
                                    <button
                                        onClick={() => closeTrade(trade.id, 'WIN')}
                                        className="px-2 py-0.5 text-[10px] font-mono text-green-400 border border-green-500/30 rounded hover:bg-green-500/10 transition-colors"
                                    >
                                        WIN
                                    </button>
                                    <button
                                        onClick={() => closeTrade(trade.id, 'LOSS')}
                                        className="px-2 py-0.5 text-[10px] font-mono text-red-400 border border-red-500/30 rounded hover:bg-red-500/10 transition-colors"
                                    >
                                        LOSS
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Recent closed */}
                    {closed.length > 0 && (
                        <div className="border-t border-border px-3 py-2 space-y-1">
                            <p className="text-[10px] font-mono text-muted uppercase tracking-widest mb-1.5">History</p>
                            <div className="space-y-1 max-h-32 overflow-y-auto">
                                {closed.slice(0, 10).map(trade => (
                                    <div key={trade.id} className="flex items-center gap-2 text-xs font-mono">
                                        <span className={trade.direction === 'LONG' ? 'text-green-400' : 'text-red-400'}>
                                            {trade.direction === 'LONG' ? '▲' : '▼'}
                                        </span>
                                        <span className="text-muted">
                                            {trade.openedAt.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                        <span className={`ml-auto font-semibold ${trade.outcome === 'WIN' ? 'text-green-400' : 'text-red-400'}`}>
                                            {trade.outcome}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {trades.length === 0 && (
                        <div className="px-4 pb-4 text-center">
                            <p className="text-xs text-muted font-mono">No trades yet.</p>
                            <p className="text-xs text-muted/60 font-mono mt-0.5">Start a session and go LONG/SHORT to track accuracy.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}