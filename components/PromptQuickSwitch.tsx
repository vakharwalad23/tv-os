'use client'

import { PromptTemplate, AppSettings } from '@/lib/types'
import { PROMPT_TEMPLATES } from '@/lib/storage'

interface Props {
    settings: AppSettings
    onSwitch: (template: PromptTemplate) => void
    disabled: boolean
}

export default function PromptQuickSwitch({ settings, onSwitch, disabled }: Props) {
    const active = settings.promptTemplate as PromptTemplate

    return (
        <div className="flex items-center gap-0 px-4 h-9 border-b border-border bg-surface/60 overflow-x-auto no-scrollbar shrink-0">
            <span className="text-[10px] font-mono text-muted uppercase tracking-widest shrink-0 mr-3">
                Mode
            </span>
            <div className="w-px h-4 bg-border shrink-0 mr-3" />
            <div className="flex items-center gap-1">
                {(Object.entries(PROMPT_TEMPLATES) as [PromptTemplate, { label: string }][]).map(([key, val]) => (
                    <button
                        key={key}
                        onClick={() => onSwitch(key)}
                        disabled={disabled}
                        title={disabled ? 'Stop session to switch mode' : `Switch to ${val.label}`}
                        className={`shrink-0 px-2.5 py-1 text-[11px] font-mono rounded transition-all border disabled:cursor-not-allowed ${
                            active === key
                                ? 'border-accent/40 bg-accentDim text-accent'
                                : 'border-transparent text-muted hover:text-textDim hover:border-border disabled:opacity-40'
                        }`}
                    >
                        {val.label}
                    </button>
                ))}
            </div>
        </div>
    )
}
