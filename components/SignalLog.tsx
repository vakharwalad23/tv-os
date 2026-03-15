'use client'

import { useState } from 'react'
import { SignalLogEntry } from '@/lib/types'
import { loadSignalLog, clearSignalLog, exportSignalLogCSV } from '@/lib/storage'
import { Download, Trash2, X } from 'lucide-react'

interface Props {
    onClose: () => void
}

export default function SignalLog({ onClose }: Props) {
    const [entries, setEntries] = useState<SignalLogEntry[]>(() => loadSignalLog())
    const [filter, setFilter] = useState<'all' | 'green' | 'red' | 'signals'>('all')

    const handleClear = () => {
        clearSignalLog()
        setEntries([])
    }

    const filtered = entries.filter(e => {
        if (filter === 'green') return e.prediction === 'GREEN'
        if (filter === 'red') return e.prediction === 'RED'
        if (filter === 'signals') return !e.prediction && e.signalType
        return true
    })

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="w-full max-w-2xl bg-surface border border-border rounded-xl overflow-hidden shadow-2xl flex flex-col max-h-[80vh]">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
                    <div>
                        <h2 className="font-display font-semibold text-text">Signal Log</h2>
                        <p className="text-xs text-muted font-mono mt-0.5">{entries.length} total entries stored</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => exportSignalLogCSV(entries)}
                            disabled={entries.length === 0}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono text-accent border border-accent/30 rounded-lg hover:bg-accentDim transition-colors disabled:opacity-40"
                        >
                            <Download size={12} /> Export CSV
                        </button>
                        <button
                            onClick={handleClear}
                            disabled={entries.length === 0}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono text-danger border border-danger/30 rounded-lg hover:bg-danger/5 transition-colors disabled:opacity-40"
                        >
                            <Trash2 size={12} /> Clear
                        </button>
                        <button onClick={onClose} className="p-1.5 hover:bg-border rounded-lg transition-colors">
                            <X size={15} className="text-textDim" />
                        </button>
                    </div>
                </div>

                {/* Filter tabs */}
                <div className="flex gap-1 px-4 py-2.5 border-b border-border shrink-0">
                    {(['all', 'green', 'red', 'signals'] as const).map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-3 py-1 text-xs font-mono rounded-md transition-colors ${
                                filter === f
                                    ? 'bg-accent text-bg'
                                    : 'text-textDim hover:text-text hover:bg-border'
                            }`}
                        >
                            {f === 'all' ? 'All' : f === 'green' ? '🟢 Green' : f === 'red' ? '🔴 Red' : '📡 Signals'}
                        </button>
                    ))}
                    <span className="ml-auto text-xs font-mono text-muted self-center">{filtered.length} shown</span>
                </div>

                {/* Entries */}
                <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
                    {filtered.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <p className="text-textDim text-sm">No entries</p>
                            <p className="text-muted text-xs mt-1 font-mono">Start a session to log signals</p>
                        </div>
                    ) : (
                        filtered.map(e => (
                            <div key={e.id} className={`flex items-start gap-3 px-3 py-2.5 rounded-lg border ${
                                e.prediction === 'GREEN'
                                    ? 'border-green-500/20 bg-green-500/5'
                                    : e.prediction === 'RED'
                                    ? 'border-red-500/20 bg-red-500/5'
                                    : 'border-border/50 bg-bg/30'
                            }`}>
                                <div className="shrink-0 text-xs font-mono text-muted mt-0.5 w-16">
                                    {e.timestamp.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-0.5">
                                        {e.prediction && (
                                            <span className={`text-xs font-mono font-bold ${e.prediction === 'GREEN' ? 'text-green-400' : 'text-red-400'}`}>
                                                {e.prediction === 'GREEN' ? '▲' : '▼'} {e.prediction}
                                                {e.predictionConfidence ? ` ${e.predictionConfidence}%` : ''}
                                            </span>
                                        )}
                                        {e.signalType && !e.prediction && (
                                            <span className="text-xs font-mono text-accent">[{e.signalType}]</span>
                                        )}
                                    </div>
                                    <p className="text-xs text-textDim leading-relaxed truncate">{e.content}</p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    )
}