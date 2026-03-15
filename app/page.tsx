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

    // Quick switch prompt template without opening settings
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
        <div className="flex flex-col h-screen bg-bg grid-bg overflow-hidden">
            {/* Topbar */}
            <header className="flex items-center justify-between px-5 py-3 border-b border-border bg-surface/80 backdrop-blur-sm shrink-0 z-10">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-accentDim border border-accent/30 flex items-center justify-center">
                            <TrendingUp size={14} className="text-accent" />
                        </div>
                        <span className="font-display font-semibold text-text text-sm tracking-tight">
                            Trade<span className="text-accent">Vision</span>
                        </span>
                    </div>
                    <span className="text-xs text-muted font-mono hidden sm:block">/ Real-time chart intelligence</span>
                </div>

                <div className="flex items-center gap-2">
                    {/* Status pill */}
                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono border ${
                        isActive
                            ? "border-accent/40 bg-accentDim text-accent"
                            : visionState.status === "requesting" || isStarting
                            ? "border-warn/40 bg-warn/10 text-warn"
                            : "border-border text-muted"
                    }`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${
                            isActive ? "bg-accent live-dot" : visionState.status === "requesting" ? "bg-warn animate-pulse" : "bg-muted"
                        }`} />
                        {isActive ? "LIVE" : isStarting ? "CONNECTING" : "OFFLINE"}
                    </div>

                    {/* Signal Log */}
                    <button
                        onClick={() => setShowSignalLog(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono text-textDim border border-border hover:border-muted hover:text-text rounded-lg transition-colors"
                        title="Signal Log"
                    >
                        <BookOpen size={12} />
                        <span className="hidden sm:inline">Log</span>
                    </button>

                    {/* Start / Stop */}
                    {isActive ? (
                        <button
                            onClick={handleStop}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono text-danger border border-danger/30 bg-danger/5 hover:bg-danger/10 rounded-lg transition-colors"
                        >
                            <Square size={11} fill="currentColor" />
                            Stop
                        </button>
                    ) : (
                        <button
                            onClick={() => setShowTimeframePicker(true)}
                            disabled={!canStart || isStarting || needsSetup}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono text-bg bg-accent hover:bg-accent/90 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed glow-accent"
                        >
                            <Play size={11} fill="currentColor" />
                            {isStarting ? "Starting..." : "Start"}
                        </button>
                    )}

                    {visionState.status === "active" && !visionState.isRunning && (
                        <button onClick={clearResults} className="p-1.5 hover:bg-border rounded-lg transition-colors" title="Clear results">
                            <RefreshCw size={13} className="text-muted" />
                        </button>
                    )}

                    <button
                        onClick={() => setShowSettings(true)}
                        className={`p-1.5 rounded-lg transition-colors ${
                            needsSetup ? "bg-warn/20 border border-warn/40 text-warn" : "hover:bg-border text-muted hover:text-textDim"
                        }`}
                        title="Settings"
                    >
                        <Settings size={14} />
                    </button>
                </div>
            </header>

            {/* Setup Banner */}
            {needsSetup && (
                <div
                    className="flex items-center gap-3 px-5 py-2.5 bg-warn/10 border-b border-warn/20 cursor-pointer hover:bg-warn/15 transition-colors"
                    onClick={() => setShowSettings(true)}
                >
                    <span className="text-xs font-mono text-warn">⚠ Setup required:</span>
                    <span className="text-xs text-textDim">Add your Overshoot API key to enable vision analysis</span>
                    <ChevronRight size={12} className="text-muted ml-auto" />
                </div>
            )}

            {/* Prompt Quick Switch bar */}
            <PromptQuickSwitch
                settings={settings}
                onSwitch={handlePromptSwitch}
                disabled={isActive}
            />

            {/* Main Layout */}
            <main className="flex-1 min-h-0 flex p-4 gap-4 overflow-hidden">
                {/* Left column */}
                <div className="flex-1 min-w-0 flex flex-col gap-3 overflow-y-auto no-scrollbar">
                    {/* Vision Feed */}
                    <div className="flex-1 min-h-0">
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
                </div>

                {/* Right panel */}
                <div className="w-80 xl:w-96 shrink-0 flex flex-col gap-3 overflow-y-auto no-scrollbar">
                    {/* Candle Predictor */}
                    <CandlePredictor visionState={visionState} />

                    {/* Paper Trader */}
                    <PaperTrader
                        latestPrediction={visionState.latestPrediction}
                        isRunning={isActive}
                    />

                    {/* Chat */}
                    <div className="flex-1 min-h-0" style={{ minHeight: '300px' }}>
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

            {/* Signal Timeline */}
            <SignalTimeline timeline={visionState.timeline} isRunning={isActive} />

            {/* Session Stats Bar */}
            <SessionStatsBar stats={visionState.sessionStats} isRunning={isActive} />

            {/* Modals */}
            {showSettings && (
                <SettingsPanel settings={settings} onSave={handleSaveSettings} onClose={() => setShowSettings(false)} />
            )}
            {showSignalLog && (
                <SignalLog onClose={() => setShowSignalLog(false)} />
            )}

            {/* Timeframe Picker */}
            {showTimeframePicker && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
                    <div className="bg-surface border border-border rounded-2xl p-6 w-[340px] shadow-2xl">
                        <div className="mb-5">
                            <h2 className="font-display font-semibold text-text text-sm tracking-tight mb-1">
                                Select Timeframe
                            </h2>
                            <p className="text-xs text-muted font-mono">
                                Which candle timeframe are you analyzing? This sets the analysis cadence and injects timeframe context into the AI prompt.
                            </p>
                        </div>
                        <div className="grid grid-cols-3 gap-2 mb-5">
                            {TIMEFRAME_PRESETS.map(tf => (
                                <button
                                    key={tf.value}
                                    onClick={() => handleStartWithTimeframe(tf.value)}
                                    className="flex flex-col items-center gap-1 px-3 py-3 rounded-xl border border-border bg-bg hover:border-accent/50 hover:bg-accentDim hover:text-accent transition-colors group"
                                >
                                    <span className="text-sm font-mono font-bold text-text group-hover:text-accent">{tf.label}</span>
                                    <span className="text-[10px] font-mono text-muted group-hover:text-accent/60">{tf.freqSeconds}s cadence</span>
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={() => setShowTimeframePicker(false)}
                            className="w-full py-2 text-xs font-mono text-muted hover:text-text border border-border rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}