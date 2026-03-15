'use client'

import { useState } from 'react'
import { SignalLogEntry } from '@/lib/types'
import { loadSignalLog, clearSignalLog, exportSignalLogCSV } from '@/lib/storage'
import { Download, Trash2, X } from 'lucide-react'

interface Props {
    onClose: () => void
}

type Filter = 'all' | 'green' | 'red' | 'signals'

const FILTER_LABELS: Record<Filter, string> = {
    all:     'All',
    green:   '▲ Green',
    red:     '▼ Red',
    signals: 'Signals',
}

export default function SignalLog({ onClose }: Props) {
    const [entries, setEntries] = useState<SignalLogEntry[]>(() => loadSignalLog())
    const [filter, setFilter]   = useState<Filter>('all')

    const handleClear = () => {
        clearSignalLog()
        setEntries([])
    }

    const filtered = entries.filter(e => {
        if (filter === 'green')   return e.prediction === 'GREEN'
        if (filter === 'red')     return e.prediction === 'RED'
        if (filter === 'signals') return !e.prediction && e.signalType
        return true
    })

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
            <div className="w-full max-w-2xl bg-surface border border-border rounded-xl overflow-hidden shadow-[0_24px_60px_rgba(0,0,0,0.7)] flex flex-col max-h-[80vh] animate-slide-up">

                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
                    <div>
                        <h2 className="font-display font-semibold text-text">Signal Log</h2>
                        <p className="text-[11px] text-muted font-mono mt-0.5">{entries.length} total entries stored</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => exportSignalLogCSV(entries)}
                            disabled={entries.length === 0}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono text-accent border border-accent/30 rounded-lg hover:bg-accentDim transition-colors disabled:opacity-30"
                        >
                            <Download size={11} />
                            Export CSV
                        </button>
                        <button
                            onClick={handleClear}
                            disabled={entries.length === 0}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono text-danger border border-danger/30 rounded-lg hover:bg-danger/5 transition-colors disabled:opacity-30"
                        >
                            <Trash2 size={11} />
                            Clear
                        </button>
                        <button
                            onClick={onClose}
                            className="p-1.5 hover:bg-border/60 rounded-lg transition-colors"
                        >
                            <X size={14} className="text-muted" />
                        </button>
                    </div>
                </div>

                {/* Filter tabs */}
                <div className="flex items-center gap-1 px-5 py-2 border-b border-border shrink-0 bg-bg/30">
                    {(Object.entries(FILTER_LABELS) as [Filter, string][]).map(([f, label]) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-3 py-1 text-[11px] font-mono rounded-md transition-colors ${
                                filter === f
                                    ? 'bg-accent text-bg font-semibold'
                                    : 'text-muted hover:text-textDim hover:bg-border/60'
                            }`}
                        >
                            {label}
                        </button>
                    ))}
                    <span className="ml-auto text-[10px] font-mono text-muted">{filtered.length} shown</span>
                </div>

                {/* Entries */}
                <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
                    {filtered.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 gap-2">
                            <p className="text-textDim text-sm">No entries</p>
                            <p className="text-muted text-xs font-mono">Start a session to log signals</p>
                        </div>
                    ) : (
                        filtered.map(e => (
                            <div
                                key={e.id}
                                className={`flex items-start gap-3 px-3 py-2.5 rounded-lg border ${
                                    e.prediction === 'GREEN'
                                        ? 'border-green-500/20 bg-green-500/5'
                                        : e.prediction === 'RED'
                                        ? 'border-red-500/20 bg-red-500/5'
                                        : 'border-border/40 bg-bg/30'
                                }`}
                            >
                                <span className="shrink-0 text-[10px] font-mono text-muted mt-0.5 w-14">
                                    {e.timestamp.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                </span>
                                <div className="flex-1 min-w-0">
                                    {e.prediction && (
                                        <span className={`text-xs font-mono font-bold mr-2 ${e.prediction === 'GREEN' ? 'text-green-400' : 'text-red-400'}`}>
                                            {e.prediction === 'GREEN' ? '▲' : '▼'} {e.prediction}
                                            {e.predictionConfidence ? ` ${e.predictionConfidence}%` : ''}
                                        </span>
                                    )}
                                    {e.signalType && !e.prediction && (
                                        <span className="text-xs font-mono text-accent mr-2">[{e.signalType}]</span>
                                    )}
                                    <span className="text-xs text-textDim leading-relaxed">{e.content}</span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    )
}
