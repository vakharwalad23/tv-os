'use client'

import { SignalTimelineEntry } from '@/lib/types'
import { useRef, useEffect } from 'react'

interface Props {
    timeline: SignalTimelineEntry[]
    isRunning: boolean
}

const DOT_COLOR: Record<SignalTimelineEntry['type'], string> = {
    prediction_green: 'bg-green-400',
    prediction_red:   'bg-red-400',
    bullish:          'bg-green-600',
    bearish:          'bg-red-600',
    neutral:          'bg-muted',
}

const DOT_SIZE: Record<SignalTimelineEntry['type'], string> = {
    prediction_green: 'w-2.5 h-2.5',
    prediction_red:   'w-2.5 h-2.5',
    bullish:          'w-1.5 h-1.5',
    bearish:          'w-1.5 h-1.5',
    neutral:          'w-1 h-1',
}

const LABEL_COLOR: Record<SignalTimelineEntry['type'], string> = {
    prediction_green: 'text-green-400',
    prediction_red:   'text-red-400',
    bullish:          'text-green-500',
    bearish:          'text-red-500',
    neutral:          'text-muted',
}

export default function SignalTimeline({ timeline, isRunning }: Props) {
    const scrollRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollLeft = scrollRef.current.scrollWidth
        }
    }, [timeline.length])

    return (
        <div className="flex items-center gap-3 px-4 h-9 border-t border-border bg-surface/50 shrink-0 overflow-hidden">
            {/* Label */}
            <span className="text-[10px] font-mono text-muted uppercase tracking-widest shrink-0">
                Timeline
            </span>
            <div className="w-px h-3.5 bg-border shrink-0" />

            {/* Track */}
            {timeline.length === 0 ? (
                <span className="text-[10px] font-mono text-muted/40 italic">
                    signals will appear as dots
                </span>
            ) : (
                <div ref={scrollRef} className="flex-1 overflow-x-auto no-scrollbar">
                    <div className="flex items-center gap-1.5 min-w-max relative py-1">
                        {/* Baseline */}
                        <div className="absolute inset-y-0 left-0 right-0 flex items-center pointer-events-none">
                            <div className="w-full h-px bg-border/40" />
                        </div>

                        {timeline.map((entry, i) => (
                            <div key={entry.id} className="relative group shrink-0">
                                <div className={`rounded-full cursor-default transition-transform group-hover:scale-150 ${DOT_COLOR[entry.type]} ${DOT_SIZE[entry.type]}`} />

                                {/* Tooltip */}
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-30 pointer-events-none">
                                    <div className="bg-bg border border-border rounded-lg px-2.5 py-2 text-xs font-mono whitespace-nowrap shadow-xl">
                                        <p className={`font-semibold mb-0.5 ${LABEL_COLOR[entry.type]}`}>
                                            {entry.label.slice(0, 40)}
                                        </p>
                                        <p className="text-muted text-[10px]">
                                            {entry.timestamp.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                        </p>
                                    </div>
                                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-border" />
                                </div>

                                {/* Time marker every 10 */}
                                {i % 10 === 0 && i > 0 && (
                                    <div className="absolute top-full mt-1 left-1/2 -translate-x-1/2 text-[8px] font-mono text-muted/40 whitespace-nowrap">
                                        {entry.timestamp.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                )}
                            </div>
                        ))}

                        {/* Live cursor */}
                        {isRunning && (
                            <div className="w-px h-3.5 bg-accent/50 animate-pulse shrink-0 rounded-full" />
                        )}
                    </div>
                </div>
            )}

            {/* Legend */}
            <div className="flex items-center gap-2.5 shrink-0 ml-auto">
                <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-green-400" />
                    <span className="text-[10px] font-mono text-muted">▲ pred</span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-red-400" />
                    <span className="text-[10px] font-mono text-muted">▼ pred</span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-600" />
                    <div className="w-1.5 h-1.5 rounded-full bg-red-600" />
                    <span className="text-[10px] font-mono text-muted">sig</span>
                </div>
            </div>
        </div>
    )
}
