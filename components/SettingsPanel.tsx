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

const MODELS = [
    { value: "Qwen/Qwen3.5-4B", label: "Qwen 3.5 4B (Fastest)" },
    { value: "Qwen/Qwen3.5-9B", label: "Qwen 3.5 9B (Recommended)" },
    { value: "Qwen/Qwen3.5-27B", label: "Qwen 3.5 27B (Best Quality)" },
    { value: "Qwen/Qwen3.5-35B-A3B", label: "Qwen 3.5 35B MoE (High Throughput)" },
];

export default function SettingsPanel({ settings, onSave, onClose }: Props) {
    const [form, setForm] = useState<AppSettings>(settings);
    const [showOSKey, setShowOSKey] = useState(false);
    const [showAnthKey, setShowAnthKey] = useState(false);
    const [promptExpanded, setPromptExpanded] = useState(false);
    const [activeTab, setActiveTab] = useState<'keys' | 'vision' | 'alerts'>('keys');

    const update = (key: keyof AppSettings, value: string | number | boolean) => {
        setForm((prev) => ({ ...prev, [key]: value }));
    };

    const applyTemplate = (key: PromptTemplate) => {
        update('visionPrompt', PROMPT_TEMPLATES[key].prompt);
        update('promptTemplate', key);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-2xl bg-surface border border-border rounded-xl overflow-hidden shadow-2xl animate-slide-up">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                    <div>
                        <h2 className="font-display font-semibold text-text text-lg">Configuration</h2>
                        <p className="text-textDim text-xs font-mono mt-0.5">API keys, vision & alert settings</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-border rounded-lg transition-colors">
                        <X size={16} className="text-textDim" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-border px-6">
                    {(['keys', 'vision', 'alerts'] as const).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-2.5 text-xs font-mono uppercase tracking-wider border-b-2 transition-colors -mb-px ${
                                activeTab === tab
                                    ? 'border-accent text-accent'
                                    : 'border-transparent text-textDim hover:text-text'
                            }`}
                        >
                            {tab === 'keys' ? '🔑 API Keys' : tab === 'vision' ? '👁 Vision' : '🔔 Alerts'}
                        </button>
                    ))}
                </div>

                <div className="p-6 space-y-5 max-h-[65vh] overflow-y-auto">

                    {/* === API KEYS TAB === */}
                    {activeTab === 'keys' && (
                        <section className="space-y-3">
                            <div>
                                <label className="text-xs text-textDim mb-1.5 block">Overshoot API Key</label>
                                <div className="relative">
                                    <input
                                        type={showOSKey ? "text" : "password"}
                                        value={form.overshootApiKey}
                                        onChange={(e) => update("overshootApiKey", e.target.value)}
                                        placeholder="os_..."
                                        className="w-full bg-bg border border-border rounded-lg px-3 py-2.5 text-sm font-mono text-text placeholder-muted focus:outline-none focus:border-accent/50 pr-10 transition-colors"
                                    />
                                    <button onClick={() => setShowOSKey(!showOSKey)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-textDim">
                                        {showOSKey ? <EyeOff size={14} /> : <Eye size={14} />}
                                    </button>
                                </div>
                                <p className="text-xs text-textDim mt-1">
                                    Get your key at{" "}
                                    <a href="https://platform.overshoot.ai/api-keys" target="_blank" rel="noreferrer" className="text-accent hover:underline">
                                        platform.overshoot.ai
                                    </a>
                                </p>
                            </div>

                            <div>
                                <label className="text-xs text-textDim mb-1.5 block">Anthropic API Key (for chat)</label>
                                <div className="relative">
                                    <input
                                        type={showAnthKey ? "text" : "password"}
                                        value={form.anthropicApiKey}
                                        onChange={(e) => update("anthropicApiKey", e.target.value)}
                                        placeholder="sk-ant-..."
                                        className="w-full bg-bg border border-border rounded-lg px-3 py-2.5 text-sm font-mono text-text placeholder-muted focus:outline-none focus:border-accent/50 pr-10 transition-colors"
                                    />
                                    <button onClick={() => setShowAnthKey(!showAnthKey)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-textDim">
                                        {showAnthKey ? <EyeOff size={14} /> : <Eye size={14} />}
                                    </button>
                                </div>
                                <p className="text-xs text-textDim mt-1">Powers the side chat via Claude</p>
                            </div>
                        </section>
                    )}

                    {/* === VISION TAB === */}
                    {activeTab === 'vision' && (
                        <>
                            {/* Prompt Templates */}
                            <section>
                                <h3 className="text-xs font-mono uppercase tracking-widest text-textDim mb-3">Prompt Templates</h3>
                                <div className="grid grid-cols-2 gap-2">
                                    {(Object.entries(PROMPT_TEMPLATES) as [PromptTemplate, { label: string }][]).map(([key, val]) => (
                                        <button
                                            key={key}
                                            onClick={() => applyTemplate(key)}
                                            className={`text-left p-3 rounded-lg border text-xs font-mono transition-all ${
                                                form.promptTemplate === key
                                                    ? 'border-accent/50 bg-accentDim text-accent'
                                                    : 'border-border hover:border-muted text-textDim'
                                            }`}
                                        >
                                            {val.label}
                                        </button>
                                    ))}
                                </div>
                                <p className="text-xs text-muted mt-2">Click a template to load it into the prompt below. You can still edit it manually.</p>
                            </section>

                            {/* Vision Model */}
                            <section>
                                <h3 className="text-xs font-mono uppercase tracking-widest text-textDim mb-3">Vision Model</h3>
                                <div className="grid grid-cols-1 gap-2">
                                    {MODELS.map((m) => (
                                        <label key={m.value} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                                            form.model === m.value ? "border-accent/50 bg-accentDim" : "border-border hover:border-muted"
                                        }`}>
                                            <div className={`w-3 h-3 rounded-full border-2 shrink-0 ${form.model === m.value ? "border-accent bg-accent" : "border-muted"}`} />
                                            <input type="radio" className="hidden" name="model" value={m.value} checked={form.model === m.value} onChange={() => update("model", m.value)} />
                                            <span className="text-sm text-text font-mono">{m.label}</span>
                                        </label>
                                    ))}
                                </div>
                            </section>

                            {/* Vision Prompt */}
                            <section>
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-xs font-mono uppercase tracking-widest text-textDim">Vision Prompt</h3>
                                    <button onClick={() => setPromptExpanded(!promptExpanded)} className="flex items-center gap-1 text-xs text-textDim hover:text-text transition-colors">
                                        {promptExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                                        {promptExpanded ? "Collapse" : "Expand"}
                                    </button>
                                </div>
                                <textarea
                                    value={form.visionPrompt}
                                    onChange={(e) => update("visionPrompt", e.target.value)}
                                    rows={promptExpanded ? 16 : 6}
                                    className="w-full bg-bg border border-border rounded-lg px-3 py-2.5 text-sm font-mono text-text placeholder-muted focus:outline-none focus:border-accent/50 resize-none transition-all"
                                />
                            </section>

                            {/* Analysis Speed */}
                            <section>
                                <h3 className="text-xs font-mono uppercase tracking-widest text-textDim mb-3">Analysis Speed</h3>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="text-xs text-textDim">Frame interval</label>
                                    <span className="text-xs font-mono text-accent">{form.analysisFrequency}s</span>
                                </div>
                                <input
                                    type="range" min={1} max={60} step={1}
                                    value={form.analysisFrequency}
                                    onChange={(e) => update("analysisFrequency", Number(e.target.value))}
                                    className="w-full accent-accent"
                                />
                                <div className="flex justify-between text-xs text-muted mt-1">
                                    <span>1s (fast)</span><span>60s (slow)</span>
                                </div>
                            </section>
                        </>
                    )}

                    {/* === ALERTS TAB === */}
                    {activeTab === 'alerts' && (
                        <section className="space-y-4">
                            {/* Audio toggle */}
                            <div className="flex items-center justify-between p-4 rounded-lg border border-border">
                                <div className="flex items-center gap-3">
                                    {form.audioAlertsEnabled
                                        ? <Volume2 size={18} className="text-accent" />
                                        : <VolumeX size={18} className="text-muted" />
                                    }
                                    <div>
                                        <p className="text-sm text-text font-mono">Audio Alerts</p>
                                        <p className="text-xs text-textDim mt-0.5">Beep on signal detection & candle predictions</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => update('audioAlertsEnabled', !form.audioAlertsEnabled)}
                                    className={`relative w-10 h-5 rounded-full transition-colors ${form.audioAlertsEnabled ? 'bg-accent' : 'bg-border'}`}
                                >
                                    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-bg transition-all ${form.audioAlertsEnabled ? 'left-5' : 'left-0.5'}`} />
                                </button>
                            </div>

                            {/* Alert keywords */}
                            <div>
                                <label className="text-xs text-textDim mb-1.5 block">Alert Keywords (comma separated)</label>
                                <input
                                    type="text"
                                    value={form.alertKeywords}
                                    onChange={e => update('alertKeywords', e.target.value)}
                                    placeholder="BREAKOUT,REVERSAL,ALERT"
                                    className="w-full bg-bg border border-border rounded-lg px-3 py-2.5 text-sm font-mono text-text placeholder-muted focus:outline-none focus:border-accent/50 transition-colors"
                                />
                                <p className="text-xs text-textDim mt-1.5">
                                    When Overshoot&apos;s output contains any of these words, a beep is triggered. Case-insensitive.
                                </p>
                            </div>

                            <div className="p-3 rounded-lg border border-border/50 bg-bg/30">
                                <p className="text-xs text-textDim font-mono">
                                    🔔 Candle predictions always beep (high tone)<br />
                                    📡 Keyword matches beep with a lower tone
                                </p>
                            </div>
                        </section>
                    )}
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 px-6 py-4 border-t border-border">
                    <button onClick={onClose} className="px-4 py-2 text-sm text-textDim hover:text-text border border-border rounded-lg hover:border-muted transition-colors">
                        Cancel
                    </button>
                    <button
                        onClick={() => { onSave(form); onClose(); }}
                        className="px-4 py-2 text-sm font-mono font-medium bg-accent text-bg rounded-lg hover:bg-accent/90 transition-colors glow-accent"
                    >
                        Save Configuration
                    </button>
                </div>
            </div>
        </div>
    );
}