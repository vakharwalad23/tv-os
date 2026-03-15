"use client";

import { useEffect, useRef } from "react";
import { StreamStatus } from "@/lib/types";
import { Monitor, AlertTriangle, Wifi, WifiOff } from "lucide-react";
import { VisionResult } from "@/lib/types";

interface Props {
  stream: MediaStream | null;
  status: StreamStatus;
  isVisionRunning: boolean;
  lastResult: VisionResult | null;
  results: VisionResult[];
  fps: number;
  isTradingViewDetected: boolean;
  onStartCapture: () => void;
}

export default function VisionFeed({
  stream,
  status,
  isVisionRunning,
  lastResult,
  results,
  fps,
  isTradingViewDetected,
  onStartCapture,
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(() => {});
    }
  }, [stream]);

  return (
    <div className="flex flex-col h-full gap-3">
      {/* Preview Area */}
      <div
        className="relative rounded-xl border border-border overflow-hidden bg-surface shrink-0"
        style={{ aspectRatio: "16/9" }}
      >
        {stream ? (
          <>
            <video
              ref={videoRef}
              muted
              className="w-full h-full object-contain bg-bg"
            />
            {/* Overlay HUD */}
            <div
              className="absolute top-0 left-0 right-0 flex items-center justify-between px-3 py-2
              bg-linear-to-b from-black/60 to-transparent pointer-events-none"
            >
              <div className="flex items-center gap-2">
                <div
                  className={`w-2 h-2 rounded-full live-dot ${isVisionRunning ? "bg-accent" : "bg-warn"}`}
                />
                <span className="text-xs font-mono text-text">
                  {isVisionRunning ? "ANALYZING" : "PAUSED"}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs font-mono text-textDim">
                {isVisionRunning && (
                  <span className="text-accent">{fps} res/s</span>
                )}
                <span
                  className={
                    isTradingViewDetected ? "text-accent" : "text-warn"
                  }
                >
                  {isTradingViewDetected
                    ? "● TradingView"
                    : "○ Unverified source"}
                </span>
              </div>
            </div>
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 grid-bg">
            <div className="p-4 rounded-2xl border border-border bg-surface/80">
              <Monitor size={32} className="text-muted" />
            </div>
            {status === "error" && (
              <div className="flex items-center gap-2 text-danger text-xs font-mono">
                <AlertTriangle size={12} />
                Screen share was denied or cancelled
              </div>
            )}
            <div className="text-center">
              <p className="text-textDim text-sm mb-1">No screen selected</p>
              <p className="text-muted text-xs font-mono">
                Share your TradingView tab to begin
              </p>
            </div>
            <button
              onClick={onStartCapture}
              className="px-5 py-2.5 bg-accent text-bg text-sm font-mono font-medium rounded-lg hover:bg-accent/90 transition-colors glow-accent"
            >
              Select Screen / Tab
            </button>
          </div>
        )}
      </div>

      {/* Live Signal Feed */}
      <div className="flex-1 min-h-0 rounded-xl border border-border bg-surface overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-border shrink-0">
          <div className="flex items-center gap-2">
            {isVisionRunning ? (
              <Wifi size={12} className="text-accent" />
            ) : (
              <WifiOff size={12} className="text-muted" />
            )}
            <span className="text-xs font-mono uppercase tracking-widest text-textDim">
              Live Signals
            </span>
          </div>
          <span className="text-xs font-mono text-muted">
            {results.length} captured
          </span>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {results.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-8">
              <p className="text-textDim text-xs font-mono">
                Signals will appear here in real-time
              </p>
              <p className="text-muted text-xs mt-1">
                as Overshoot analyzes your chart
              </p>
            </div>
          ) : (
            results.map((r, i) => (
              <div
                key={r.id}
                className={`rounded-lg px-3 py-2.5 border transition-all ${
                  i === 0
                    ? "border-accent/30 bg-accentDim msg-in"
                    : "border-border/50 bg-bg/50"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`text-xs font-mono ${i === 0 ? "text-accent" : "text-muted"}`}
                  >
                    {i === 0 ? "▶ NOW" : formatTime(r.timestamp)}
                  </span>
                </div>
                <p className="text-xs text-text leading-relaxed">{r.content}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}
