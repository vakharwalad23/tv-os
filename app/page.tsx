"use client";

import { useState, useCallback, useEffect } from "react";
import { Settings, Play, Square, RefreshCw, TrendingUp, ChevronRight, BookOpen } from "lucide-react";
import { AppSettings, PromptTemplate } from "@/lib/types";
import { DEFAULT_SETTINGS, loadSettings, saveSettings, PROMPT_TEMPLATES } from "@/lib/storage";
import { useVisionAnalysis, TIMEFRAME_PRESETS } from "@/hooks/useVisionAnalysis";
import { useChat } from "@/hooks/useChat";
import VisionFeed from "@/components/VisionFeed";
import ChatPanel from "@/components/ChatPanel";
import SettingsPanel from "@/components/SettingsPanel";
import CandlePredictor from "@/components/CandlePredictor";
import SessionStatsBar from "@/components/SessionStats";
import SignalLog from "@/components/SignalLog";
import SignalTimeline from "@/components/SignalTimeline";
import PromptQuickSwitch from "@/components/PromptQuickSwitch";
import PaperTrader from "@/components/PaperTrader";

export default function Home() {
    const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
    const [showSettings, setShowSettings] = useState(false);
    const [showSignalLog, setShowSignalLog] = useState(false);
    const [showTimeframePicker, setShowTimeframePicker] = useState(false);
    const [isStarting, setIsStarting] = useState(false);
    const [hydrated, setHydrated] = useState(false);

    useEffect(() => {
        setSettings(loadSettings());
        setHydrated(true);
    }, []);

    const { state: visionState, startVision, stopVision, clearResults } = useVisionAnalysis();
    const { messages, isLoading: chatLoading, sendMessage, clearChat, updateVisionContext } = useChat();

    useEffect(() => {
        updateVisionContext(visionState.results);
    }, [visionState.results, updateVisionContext]);

    const handleSaveSettings = useCallback((newSettings: AppSettings) => {
        setSettings(newSettings);
        saveSettings(newSettings);
    }, []);

    const handlePromptSwitch = useCallback((template: PromptTemplate) => {
        const newSettings: AppSettings = {
            ...settings,
            promptTemplate: template,
            visionPrompt: PROMPT_TEMPLATES[template].prompt,
        };
        setSettings(newSettings);
        saveSettings(newSettings);
    }, [settings]);

    const handleStartWithTimeframe = useCallback(async (timeframe: string) => {
        setShowTimeframePicker(false);
        setIsStarting(true);
        try {
            await startVision(settings, timeframe);
        } finally {
            setIsStarting(false);
        }
    }, [startVision, settings]);

    const handleStop = useCallback(async () => {
        await stopVision();
    }, [stopVision]);

    const handleSendChat = useCallback((msg: string) => {
        sendMessage(msg, settings.anthropicApiKey, settings.visionPrompt);
    }, [sendMessage, settings]);

    const isActive = visionState.status === "active" && visionState.isRunning;
    const canStart = !isActive && visionState.status !== "requesting";
    const needsSetup = !settings.overshootApiKey;

    if (!hydrated) return null;

    return (
        <div className="flex flex-col h-screen bg-bg overflow-hidden">

            {/* ── Topbar ─────────────────────────────────────────────── */}
            <header className="flex items-center justify-between px-5 h-12 border-b border-border bg-surface shrink-0 z-20">
                {/* Logo */}
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-accentDim border border-accent/30 flex items-center justify-center">
                            <TrendingUp size={13} className="text-accent" />
                        </div>
                        <span className="font-display font-semibold text-text text-sm tracking-tight">
                            Trade<span className="text-accent">Vision</span>
                        </span>
                    </div>
                    <div className="hidden sm:flex items-center gap-2.5">
                        <div className="w-px h-3.5 bg-border" />
                        <span className="text-[11px] text-muted font-mono">Real-time AI chart analysis</span>
                    </div>
                </div>

                {/* Controls */}
                <div className="flex items-center gap-2">
                    {/* Status pill */}
                    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono border ${
                        isActive
                            ? "border-accent/40 bg-accentDim text-accent"
                            : visionState.status === "requesting" || isStarting
                            ? "border-warn/40 bg-warn/10 text-warn"
                            : "border-border text-muted"
                    }`}>
                        <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                            isActive ? "bg-accent live-dot"
                            : visionState.status === "requesting" || isStarting ? "bg-warn animate-pulse"
                            : "bg-muted"
                        }`} />
                        {isActive ? "LIVE" : isStarting ? "CONNECTING" : "IDLE"}
                    </div>

                    <div className="hidden sm:block w-px h-5 bg-border" />

                    {/* Signal log */}
                    <button
                        onClick={() => setShowSignalLog(true)}
                        className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-mono text-muted hover:text-textDim border border-border hover:border-muted rounded-md transition-colors"
                    >
                        <BookOpen size={11} />
                        Log
                    </button>

                    {/* Start / Stop */}
                    {isActive ? (
                        <button
                            onClick={handleStop}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono text-danger border border-danger/30 bg-danger/5 hover:bg-danger/10 rounded-md transition-colors"
                        >
                            <Square size={10} fill="currentColor" />
                            Stop
                        </button>
                    ) : (
                        <button
                            onClick={() => setShowTimeframePicker(true)}
                            disabled={!canStart || isStarting || needsSetup}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-medium text-bg bg-accent hover:bg-accent/90 rounded-md transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            <Play size={10} fill="currentColor" />
                            {isStarting ? "Starting…" : "Start"}
                        </button>
                    )}

                    {visionState.status === "active" && !visionState.isRunning && (
                        <button
                            onClick={clearResults}
                            className="p-1.5 text-muted hover:text-textDim hover:bg-border/60 rounded-md transition-colors"
                            title="Clear results"
                        >
                            <RefreshCw size={13} />
                        </button>
                    )}

                    <button
                        onClick={() => setShowSettings(true)}
                        className={`p-1.5 rounded-md transition-colors ${
                            needsSetup
                                ? "text-warn bg-warn/10 border border-warn/30"
                                : "text-muted hover:text-textDim hover:bg-border/60"
                        }`}
                        title="Settings"
                    >
                        <Settings size={14} />
                    </button>
                </div>
            </header>

            {/* ── Setup banner ───────────────────────────────────────── */}
            {needsSetup && (
                <div
                    className="flex items-center gap-2.5 px-5 py-2 bg-warn/5 border-b border-warn/20 cursor-pointer hover:bg-warn/8 transition-colors shrink-0"
                    onClick={() => setShowSettings(true)}
                >
                    <div className="w-1.5 h-1.5 rounded-full bg-warn shrink-0" />
                    <span className="text-[11px] font-mono text-warn font-medium">Setup required</span>
                    <span className="text-[11px] text-muted">— Add your Overshoot API key to begin</span>
                    <ChevronRight size={11} className="text-warn ml-auto" />
                </div>
            )}

            {/* ── Mode bar ───────────────────────────────────────────── */}
            <PromptQuickSwitch
                settings={settings}
                onSwitch={handlePromptSwitch}
                disabled={isActive}
            />

            {/* ── Main layout ────────────────────────────────────────── */}
            {/* Left column has overflow-hidden so VisionFeed can fill height and scroll internally */}
            <main className="flex-1 min-h-0 flex gap-3 p-3 overflow-hidden">

                {/* Left — VisionFeed fills all available height */}
                <div className="flex-1 min-w-0 min-h-0 flex flex-col overflow-hidden">
                    <VisionFeed
                        stream={visionState.stream}
                        status={visionState.status}
                        isVisionRunning={visionState.isRunning}
                        lastResult={visionState.lastResult}
                        results={visionState.results}
                        fps={visionState.fps}
                        activeTimeframe={visionState.activeTimeframe}
                        onStartCapture={() => setShowTimeframePicker(true)}
                    />
                </div>

                {/* Right — scrollable card stack */}
                <div className="w-[308px] xl:w-[344px] shrink-0 flex flex-col gap-3 overflow-y-auto no-scrollbar">
                    <CandlePredictor visionState={visionState} />
                    <PaperTrader
                        latestPrediction={visionState.latestPrediction}
                        isRunning={isActive}
                    />
                    <div className="flex-1 min-h-0" style={{ minHeight: "280px" }}>
                        <ChatPanel
                            messages={messages}
                            isLoading={chatLoading}
                            onSend={handleSendChat}
                            onClear={clearChat}
                            hasApiKey={!!settings.anthropicApiKey}
                        />
                    </div>
                </div>
            </main>

            {/* ── Bottom bars ────────────────────────────────────────── */}
            <SignalTimeline timeline={visionState.timeline} isRunning={isActive} />
            <SessionStatsBar stats={visionState.sessionStats} isRunning={isActive} />

            {/* ── Modals ─────────────────────────────────────────────── */}
            {showSettings && (
                <SettingsPanel
                    settings={settings}
                    onSave={handleSaveSettings}
                    onClose={() => setShowSettings(false)}
                />
            )}
            {showSignalLog && (
                <SignalLog onClose={() => setShowSignalLog(false)} />
            )}

            {/* ── Timeframe picker ───────────────────────────────────── */}
            {showTimeframePicker && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm">
                    <div className="bg-surface border border-border rounded-xl w-[380px] overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.7)]">
                        {/* Header */}
                        <div className="px-5 py-4 border-b border-border">
                            <h2 className="font-display font-semibold text-text text-sm">Select Timeframe</h2>
                            <p className="text-[11px] text-muted font-mono mt-0.5">
                                Sets analysis cadence · injects candle context into the AI prompt
                            </p>
                        </div>
                        {/* 3-col grid — gap-px creates hairline separators without double borders */}
                        <div className="grid grid-cols-3 gap-px bg-border">
                            {TIMEFRAME_PRESETS.map(tf => (
                                <button
                                    key={tf.value}
                                    onClick={() => handleStartWithTimeframe(tf.value)}
                                    className="flex flex-col items-center gap-1 py-5 bg-surface hover:bg-bg transition-colors group"
                                >
                                    <span className="text-base font-mono font-bold text-text group-hover:text-accent transition-colors">
                                        {tf.label}
                                    </span>
                                    <span className="text-[10px] font-mono text-muted group-hover:text-accent/50 transition-colors">
                                        every {tf.freqSeconds}s
                                    </span>
                                </button>
                            ))}
                        </div>
                        {/* Footer */}
                        <div className="px-5 py-3 border-t border-border">
                            <button
                                onClick={() => setShowTimeframePicker(false)}
                                className="w-full py-2 text-xs font-mono text-muted hover:text-textDim rounded-md hover:bg-border/60 transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
