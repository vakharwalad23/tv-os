"use client";

import { useState, useCallback, useEffect } from "react";
import {
  Settings,
  Play,
  Square,
  RefreshCw,
  TrendingUp,
  ChevronRight,
} from "lucide-react";
import { AppSettings } from "@/lib/types";
import { DEFAULT_SETTINGS } from "@/lib/storage";
import { loadSettings, saveSettings } from "@/lib/storage";
import { useVisionAnalysis } from "@/hooks/useVisionAnalysis";
import { useChat } from "@/hooks/useChat";
import VisionFeed from "@/components/VisionFeed";
import ChatPanel from "@/components/ChatPanel";
import SettingsPanel from "@/components/SettingsPanel";

export default function Home() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [showSettings, setShowSettings] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // Load settings from localStorage after hydration
  useEffect(() => {
    setSettings(loadSettings());
    setHydrated(true);
  }, []);

  const {
    state: visionState,
    startVision,
    stopVision,
    clearResults,
  } = useVisionAnalysis();
  const {
    messages,
    isLoading: chatLoading,
    sendMessage,
    clearChat,
    updateVisionContext,
  } = useChat();

  // Keep chat updated with latest vision context
  useEffect(() => {
    updateVisionContext(visionState.results);
  }, [visionState.results, updateVisionContext]);

  const handleSaveSettings = useCallback((newSettings: AppSettings) => {
    setSettings(newSettings);
    saveSettings(newSettings);
  }, []);

  const handleStart = useCallback(async () => {
    setIsStarting(true);
    try {
      await startVision(settings);
    } finally {
      setIsStarting(false);
    }
  }, [startVision, settings]);

  const handleStop = useCallback(async () => {
    await stopVision();
  }, [stopVision]);

  const handleSendChat = useCallback(
    (msg: string) => {
      sendMessage(msg, settings.anthropicApiKey, settings.visionPrompt);
    },
    [sendMessage, settings],
  );

  const isActive = visionState.status === "active" && visionState.isRunning;
  const canStart = !isActive && visionState.status !== "requesting";

  // First time setup prompt
  const needsSetup = !settings.overshootApiKey;

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
          <span className="text-xs text-muted font-mono hidden sm:block">
            / Real-time chart intelligence
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Status pill */}
          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono border ${
              isActive
                ? "border-accent/40 bg-accentDim text-accent"
                : visionState.status === "requesting" || isStarting
                  ? "border-warn/40 bg-warn/10 text-warn"
                  : "border-border text-muted"
            }`}
          >
            <div
              className={`w-1.5 h-1.5 rounded-full ${
                isActive
                  ? "bg-accent live-dot"
                  : visionState.status === "requesting"
                    ? "bg-warn animate-pulse"
                    : "bg-muted"
              }`}
            />
            {isActive ? "LIVE" : isStarting ? "CONNECTING" : "OFFLINE"}
          </div>

          {/* Controls */}
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
              onClick={handleStart}
              disabled={!canStart || isStarting || needsSetup}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono text-bg bg-accent hover:bg-accent/90 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed glow-accent"
            >
              <Play size={11} fill="currentColor" />
              {isStarting ? "Starting..." : "Start"}
            </button>
          )}

          {visionState.status === "active" && !visionState.isRunning && (
            <button
              onClick={clearResults}
              className="p-1.5 hover:bg-border rounded-lg transition-colors"
              title="Clear results"
            >
              <RefreshCw size={13} className="text-muted" />
            </button>
          )}

          <button
            onClick={() => setShowSettings(true)}
            className={`p-1.5 rounded-lg transition-colors ${
              needsSetup
                ? "bg-warn/20 border border-warn/40 text-warn"
                : "hover:bg-border text-muted hover:text-textDim"
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
          <span className="text-xs text-textDim">
            Add your Overshoot API key to enable vision analysis
          </span>
          <ChevronRight size={12} className="text-muted ml-auto" />
        </div>
      )}

      {/* Main Layout */}
      <main className="flex-1 min-h-0 flex p-4 gap-4">
        {/* Left: Vision Feed */}
        <div className="flex-1 min-w-0">
          <VisionFeed
            stream={visionState.stream}
            status={visionState.status}
            isVisionRunning={visionState.isRunning}
            lastResult={visionState.lastResult}
            results={visionState.results}
            fps={visionState.fps}
            isTradingViewDetected={visionState.isTradingViewDetected}
            onStartCapture={handleStart}
          />
        </div>

        {/* Right: Chat */}
        <div className="w-80 xl:w-96 shrink-0">
          <ChatPanel
            messages={messages}
            isLoading={chatLoading}
            onSend={handleSendChat}
            onClear={clearChat}
            hasApiKey={!!settings.anthropicApiKey}
          />
        </div>
      </main>

      {/* Settings Modal */}
      {showSettings && (
        <SettingsPanel
          settings={settings}
          onSave={handleSaveSettings}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}
