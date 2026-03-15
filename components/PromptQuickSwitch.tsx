'use client'

import { PromptTemplate } from '@/lib/types'
import { PROMPT_TEMPLATES } from '@/lib/storage'
import { AppSettings } from '@/lib/types'

interface Props {
    settings: AppSettings
    onSwitch: (template: PromptTemplate) => void
    disabled: boolean
}

export default function PromptQuickSwitch({ settings, onSwitch, disabled }: Props) {
    const active = settings.promptTemplate as PromptTemplate

    return (
        <div className="flex items-center gap-1.5 px-4 py-2 border-b border-border bg-surface/60 overflow-x-auto no-scrollbar shrink-0">
            <span className="text-[10px] font-mono text-muted uppercase tracking-widest shrink-0 mr-1">Mode:</span>
            {(Object.entries(PROMPT_TEMPLATES) as [PromptTemplate, { label: string }][]).map(([key, val]) => (
                <button
                    key={key}
                    onClick={() => onSwitch(key)}
                    disabled={disabled}
                    title={disabled ? 'Stop session to switch mode' : `Switch to ${val.label}`}
                    className={`shrink-0 px-2.5 py-1 text-xs font-mono rounded-md transition-all border disabled:cursor-not-allowed ${
                        active === key
                            ? 'border-accent/50 bg-accentDim text-accent'
                            : 'border-border text-textDim hover:border-muted hover:text-text disabled:opacity-40'
                    }`}
                >
                    {val.label}
                </button>
            ))}
        </div>
    )
}