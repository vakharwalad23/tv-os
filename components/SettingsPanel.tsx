"use client";

import { useState } from "react";
import { AppSettings, PromptTemplate } from "@/lib/types";
import { X, Eye, EyeOff, ChevronDown, ChevronUp, Volume2, VolumeX } from "lucide-react";
import { PROMPT_TEMPLATES } from "@/lib/storage";

interface Props {
    settings: AppSettings;
    onSave: (settings: AppSettings) => void;
    onClose: () => void;
}

type ModelGroup = { group: string; models: { value: string; label: string; note: string }[] }

const MODEL_GROUPS: ModelGroup[] = [
    {
        group: 'Large (27B+)',
        models: [
            { value: 'Qwen/Qwen3.5-27B',              label: 'Qwen 3.5 27B',       note: 'Best overall'      },
            { value: 'Qwen/Qwen3.5-35B-A3B',           label: 'Qwen 3.5 35B (MoE)', note: 'High throughput'   },
            { value: 'Qwen/Qwen3-VL-32B-Instruct-FP8', label: 'Qwen3-VL 32B FP8',  note: ''                  },
            { value: 'Qwen/Qwen3-VL-30B-A3B-Instruct', label: 'Qwen3-VL 30B (MoE)', note: ''                 },
            { value: 'OpenGVLab/InternVL3_5-30B-A3B',  label: 'InternVL3.5 30B',    note: ''                  },
        ],
    },
    {
        group: 'Medium (8–9B)',
        models: [
            { value: 'Qwen/Qwen3.5-9B',          label: 'Qwen 3.5 9B',     note: 'Recommended'    },
            { value: 'Qwen/Qwen3-VL-8B-Instruct', label: 'Qwen3-VL 8B',    note: ''               },
            { value: 'allenai/Molmo2-8B',          label: 'Molmo2 8B',      note: ''               },
            { value: 'Kwai-Keye/Keye-VL-1_5-8B',  label: 'Keye-VL 8B',     note: ''               },
            { value: 'openbmb/MiniCPM-V-4_5',     label: 'MiniCPM-V 4.5',  note: ''               },
        ],
    },
    {
        group: 'Small (2–4B)',
        models: [
            { value: 'Qwen/Qwen3.5-4B',           label: 'Qwen 3.5 4B',    note: 'Fastest video'  },
            { value: 'Qwen/Qwen3.5-2B',            label: 'Qwen 3.5 2B',    note: 'Best for OCR'   },
            { value: 'Qwen/Qwen3-VL-4B-Instruct',  label: 'Qwen3-VL 4B',   note: ''               },
        ],
    },
];

type Tab = 'keys' | 'vision' | 'alerts'

export default function SettingsPanel({ settings, onSave, onClose }: Props) {
    const [form, setForm]           = useState<AppSettings>(settings);
    const [showOSKey, setShowOSKey] = useState(false);
    const [showAnthKey, setShowAnthKey] = useState(false);
    const [promptExpanded, setPromptExpanded] = useState(false);
    const [activeTab, setActiveTab] = useState<Tab>('keys');

    const update = (key: keyof AppSettings, value: string | number | boolean) =>
        setForm(prev => ({ ...prev, [key]: value }));

    const OCR_MODEL = 'Qwen/Qwen3.5-2B'

    const applyTemplate = (key: PromptTemplate) => {
        update('visionPrompt', PROMPT_TEMPLATES[key].prompt)
        update('promptTemplate', key)
        // Auto-select the OCR-optimised model for chart text reading,
        // and restore the default recommended model when switching away.
        if (key === 'chart_text') {
            update('model', OCR_MODEL)
        } else if (form.model === OCR_MODEL) {
            update('model', 'Qwen/Qwen3.5-9B')
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
            <div className="w-full max-w-xl bg-surface border border-border rounded-xl overflow-hidden shadow-[0_24px_60px_rgba(0,0,0,0.7)] animate-slide-up">

                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                    <div>
                        <h2 className="font-display font-semibold text-text">Configuration</h2>
                        <p className="text-[11px] text-muted font-mono mt-0.5">API keys · vision model · alerts</p>
                    </div>
                    <button onClick={onClose} className="p-1.5 hover:bg-border/60 rounded-lg transition-colors">
                        <X size={15} className="text-muted" />
                    </button>
                </div>

                {/* Tab bar */}
                <div className="flex border-b border-border px-5 bg-bg/30">
                    {(['keys', 'vision', 'alerts'] as Tab[]).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-2.5 text-[11px] font-mono uppercase tracking-wider border-b-2 transition-colors -mb-px ${
                                activeTab === tab
                                    ? 'border-accent text-accent'
                                    : 'border-transparent text-muted hover:text-textDim'
                            }`}
                        >
                            {tab === 'keys' ? 'API Keys' : tab === 'vision' ? 'Vision' : 'Alerts'}
                        </button>
                    ))}
                </div>

                {/* Body */}
                <div className="p-5 space-y-5 max-h-[60vh] overflow-y-auto">

                    {/* ── API Keys ─────────────────────────────────── */}
                    {activeTab === 'keys' && (
                        <div className="space-y-4">
                            <div>
                                <label className="text-[11px] font-mono text-muted uppercase tracking-wider block mb-2">
                                    Overshoot API Key
                                </label>
                                <div className="relative">
                                    <input
                                        type={showOSKey ? "text" : "password"}
                                        value={form.overshootApiKey}
                                        onChange={e => update("overshootApiKey", e.target.value)}
                                        placeholder="os_..."
                                        className="w-full bg-bg border border-border rounded-lg px-3 py-2.5 text-sm font-mono text-text placeholder-muted focus:outline-none focus:border-accent/40 pr-10 transition-colors"
                                    />
                                    <button
                                        onClick={() => setShowOSKey(v => !v)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-textDim"
                                    >
                                        {showOSKey ? <EyeOff size={13} /> : <Eye size={13} />}
                                    </button>
                                </div>
                                <p className="text-[11px] text-muted mt-1.5">
                                    Get your key at{" "}
                                    <a
                                        href="https://platform.overshoot.ai/api-keys"
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-accent hover:underline"
                                    >
                                        platform.overshoot.ai
                                    </a>
                                </p>
                            </div>

                            <div>
                                <label className="text-[11px] font-mono text-muted uppercase tracking-wider block mb-2">
                                    Anthropic API Key <span className="normal-case">(optional — for chat)</span>
                                </label>
                                <div className="relative">
                                    <input
                                        type={showAnthKey ? "text" : "password"}
                                        value={form.anthropicApiKey}
                                        onChange={e => update("anthropicApiKey", e.target.value)}
                                        placeholder="sk-ant-..."
                                        className="w-full bg-bg border border-border rounded-lg px-3 py-2.5 text-sm font-mono text-text placeholder-muted focus:outline-none focus:border-accent/40 pr-10 transition-colors"
                                    />
                                    <button
                                        onClick={() => setShowAnthKey(v => !v)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-textDim"
                                    >
                                        {showAnthKey ? <EyeOff size={13} /> : <Eye size={13} />}
                                    </button>
                                </div>
                                <p className="text-[11px] text-muted mt-1.5">Powers the AI chat panel via Claude</p>
                            </div>
                        </div>
                    )}

                    {/* ── Vision ───────────────────────────────────── */}
                    {activeTab === 'vision' && (
                        <div className="space-y-5">
                            {/* Prompt templates */}
                            <div>
                                <h3 className="text-[11px] font-mono uppercase tracking-widest text-muted mb-3">
                                    Prompt Templates
                                </h3>
                                <div className="grid grid-cols-2 gap-1.5">
                                    {(Object.entries(PROMPT_TEMPLATES) as [PromptTemplate, { label: string }][]).map(([key, val]) => (
                                        <button
                                            key={key}
                                            onClick={() => applyTemplate(key)}
                                            className={`text-left px-3 py-2.5 rounded-lg border text-xs font-mono transition-all ${
                                                form.promptTemplate === key
                                                    ? 'border-accent/50 bg-accentDim text-accent'
                                                    : 'border-border text-muted hover:border-muted hover:text-textDim'
                                            }`}
                                        >
                                            {val.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Vision model */}
                            <div>
                                <h3 className="text-[11px] font-mono uppercase tracking-widest text-muted mb-3">
                                    Vision Model
                                </h3>
                                <div className="space-y-3">
                                    {MODEL_GROUPS.map(group => (
                                        <div key={group.group}>
                                            <p className="text-[10px] font-mono text-muted/60 uppercase tracking-widest mb-1.5 px-0.5">
                                                {group.group}
                                            </p>
                                            <div className="space-y-1">
                                                {group.models.map(m => (
                                                    <label
                                                        key={m.value}
                                                        className={`flex items-center gap-3 px-3 py-2 rounded-lg border cursor-pointer transition-all ${
                                                            form.model === m.value
                                                                ? 'border-accent/40 bg-accentDim'
                                                                : 'border-border hover:border-muted'
                                                        }`}
                                                    >
                                                        <div className={`w-3 h-3 rounded-full border-2 shrink-0 ${
                                                            form.model === m.value ? 'border-accent bg-accent' : 'border-muted'
                                                        }`} />
                                                        <input
                                                            type="radio"
                                                            className="hidden"
                                                            name="model"
                                                            value={m.value}
                                                            checked={form.model === m.value}
                                                            onChange={() => update('model', m.value)}
                                                        />
                                                        <span className="text-sm font-mono text-text flex-1">{m.label}</span>
                                                        {m.note && <span className="text-[10px] font-mono text-muted">{m.note}</span>}
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Vision prompt */}
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-[11px] font-mono uppercase tracking-widest text-muted">Vision Prompt</h3>
                                    <button
                                        onClick={() => setPromptExpanded(v => !v)}
                                        className="flex items-center gap-1 text-[11px] text-muted hover:text-textDim transition-colors"
                                    >
                                        {promptExpanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                                        {promptExpanded ? "Collapse" : "Expand"}
                                    </button>
                                </div>
                                <textarea
                                    value={form.visionPrompt}
                                    onChange={e => update("visionPrompt", e.target.value)}
                                    rows={promptExpanded ? 14 : 5}
                                    className="w-full bg-bg border border-border rounded-lg px-3 py-2.5 text-xs font-mono text-text placeholder-muted focus:outline-none focus:border-accent/40 resize-none transition-all leading-relaxed"
                                />
                            </div>

                            {/* Analysis speed */}
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-[11px] font-mono uppercase tracking-widest text-muted">
                                        Default Frame Interval
                                    </h3>
                                    <span className="text-[11px] font-mono text-accent">{form.analysisFrequency}s</span>
                                </div>
                                <input
                                    type="range"
                                    min={1}
                                    max={60}
                                    step={1}
                                    value={form.analysisFrequency}
                                    onChange={e => update("analysisFrequency", Number(e.target.value))}
                                    className="w-full accent-accent"
                                />
                                <div className="flex justify-between text-[10px] font-mono text-muted mt-1">
                                    <span>1s fast</span>
                                    <span>60s slow</span>
                                </div>
                            </div>

                            {/* Max output tokens */}
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-[11px] font-mono uppercase tracking-widest text-muted">
                                        Max Output Tokens
                                    </h3>
                                    <span className="text-[11px] font-mono text-accent">{form.maxOutputTokens}</span>
                                </div>
                                <input
                                    type="range"
                                    min={50}
                                    max={500}
                                    step={25}
                                    value={form.maxOutputTokens}
                                    onChange={e => update('maxOutputTokens', Number(e.target.value))}
                                    className="w-full accent-accent"
                                />
                                <div className="flex justify-between text-[10px] font-mono text-muted mt-1">
                                    <span>50 — lowest latency</span>
                                    <span>500 — detailed</span>
                                </div>
                                <p className="text-[10px] text-muted mt-1.5">
                                    Lower = faster responses. 100–200 works well for scalping; 300–500 for swing/pattern analysis.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* ── Alerts ───────────────────────────────────── */}
                    {activeTab === 'alerts' && (
                        <div className="space-y-4">
                            {/* Audio toggle */}
                            <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-bg/30">
                                <div className="flex items-center gap-3">
                                    {form.audioAlertsEnabled
                                        ? <Volume2 size={16} className="text-accent" />
                                        : <VolumeX size={16} className="text-muted" />
                                    }
                                    <div>
                                        <p className="text-sm font-mono text-text">Audio Alerts</p>
                                        <p className="text-[11px] text-muted mt-0.5">Beep on signal detection & predictions</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => update('audioAlertsEnabled', !form.audioAlertsEnabled)}
                                    className={`relative w-9 h-5 rounded-full transition-colors ${
                                        form.audioAlertsEnabled ? 'bg-accent' : 'bg-border'
                                    }`}
                                >
                                    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-bg transition-all ${
                                        form.audioAlertsEnabled ? 'left-[18px]' : 'left-0.5'
                                    }`} />
                                </button>
                            </div>

                            {/* Alert keywords */}
                            <div>
                                <label className="text-[11px] font-mono text-muted uppercase tracking-wider block mb-2">
                                    Alert Keywords <span className="normal-case">(comma separated)</span>
                                </label>
                                <input
                                    type="text"
                                    value={form.alertKeywords}
                                    onChange={e => update('alertKeywords', e.target.value)}
                                    placeholder="BREAKOUT,REVERSAL,ALERT"
                                    className="w-full bg-bg border border-border rounded-lg px-3 py-2.5 text-sm font-mono text-text placeholder-muted focus:outline-none focus:border-accent/40 transition-colors"
                                />
                                <p className="text-[11px] text-muted mt-1.5">
                                    Case-insensitive. Triggers a beep when found in any vision output.
                                </p>
                            </div>

                            <div className="p-3 rounded-lg border border-border/60 bg-bg/30 space-y-1">
                                <p className="text-[11px] text-muted font-mono">🔔 Candle predictions — high tone</p>
                                <p className="text-[11px] text-muted font-mono">📡 Keyword matches — lower tone</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-2.5 px-5 py-4 border-t border-border">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-xs font-mono text-muted border border-border rounded-lg hover:border-muted hover:text-textDim transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => { onSave(form); onClose(); }}
                        className="px-4 py-2 text-xs font-mono font-semibold bg-accent text-bg rounded-lg hover:bg-accent/90 transition-colors"
                    >
                        Save Configuration
                    </button>
                </div>
            </div>
        </div>
    );
}
