'use client'

import { SignalTimelineEntry } from '@/lib/types'
import { useRef, useEffect } from 'react'

interface Props {
    timeline: SignalTimelineEntry[]
    isRunning: boolean
}

const DOT_COLORS: Record<SignalTimelineEntry['type'], string> = {
    prediction_green: 'bg-green-400',
    prediction_red: 'bg-red-400',
    bullish: 'bg-green-600',
    bearish: 'bg-red-600',
    neutral: 'bg-muted',
}

const DOT_SIZES: Record<SignalTimelineEntry['type'], string> = {
    prediction_green: 'w-3 h-3',
    prediction_red: 'w-3 h-3',
    bullish: 'w-2 h-2',
    bearish: 'w-2 h-2',
    neutral: 'w-1.5 h-1.5',
}

export default function SignalTimeline({ timeline, isRunning }: Props) {
    const scrollRef = useRef<HTMLDivElement>(null)

    // Auto-scroll right as new signals come in
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollLeft = scrollRef.current.scrollWidth
        }
    }, [timeline.length])

    return (
        <div className="border-t border-border bg-surface/40 shrink-0">
            <div className="flex items-center gap-3 px-4 py-1.5">
                <span className="text-xs font-mono text-muted shrink-0 uppercase tracking-widest">Timeline</span>

                {timeline.length === 0 ? (
                    <span className="text-xs font-mono text-muted/50 italic">signals will appear here as dots</span>
                ) : (
                    <div
                        ref={scrollRef}
                        className="flex-1 overflow-x-auto no-scrollbar"
                    >
                        <div className="flex items-center gap-1.5 py-1 min-w-max relative">
                            {/* Baseline */}
                            <div className="absolute inset-y-0 left-0 right-0 flex items-center pointer-events-none">
                                <div className="w-full h-px bg-border/50" />
                            </div>

                            {timeline.map((entry, i) => (
                                <div key={entry.id} className="relative group shrink-0">
                                    {/* Dot */}
                                    <div className={`rounded-full cursor-default transition-transform group-hover:scale-150 ${DOT_COLORS[entry.type]} ${DOT_SIZES[entry.type]}`} />

                                    {/* Tooltip */}
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-20 pointer-events-none">
                                        <div className="bg-bg border border-border rounded-md px-2 py-1.5 text-xs font-mono text-text whitespace-nowrap shadow-xl">
                                            <div className={`font-semibold mb-0.5 ${
                                                entry.type === 'prediction_green' ? 'text-green-400' :
                                                entry.type === 'prediction_red' ? 'text-red-400' :
                                                entry.type === 'bullish' ? 'text-green-600' :
                                                entry.type === 'bearish' ? 'text-red-600' : 'text-muted'
                                            }`}>
                                                {entry.label.slice(0, 40)}
                                            </div>
                                            <div className="text-muted text-[10px]">
                                                {entry.timestamp.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                            </div>
                                        </div>
                                        {/* Arrow */}
                                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-border" />
                                    </div>

                                    {/* Time marker every 10 signals */}
                                    {i % 10 === 0 && i > 0 && (
                                        <div className="absolute top-full mt-0.5 left-1/2 -translate-x-1/2 text-[9px] font-mono text-muted/50 whitespace-nowrap">
                                            {entry.timestamp.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    )}
                                </div>
                            ))}

                            {/* Live cursor */}
                            {isRunning && (
                                <div className="w-0.5 h-4 bg-accent/60 animate-pulse shrink-0 rounded-full" />
                            )}
                        </div>
                    </div>
                )}

                {/* Legend */}
                <div className="flex items-center gap-2 shrink-0">
                    <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-green-400" />
                        <span className="text-[10px] font-mono text-muted">▲</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-red-400" />
                        <span className="text-[10px] font-mono text-muted">▼</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-600" />
                        <div className="w-1.5 h-1.5 rounded-full bg-red-600" />
                        <span className="text-[10px] font-mono text-muted">sig</span>
                    </div>
                </div>
            </div>
        </div>
    )
}