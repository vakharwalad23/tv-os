"use client";

import { useEffect, useRef, useCallback } from "react";
import { StreamStatus, VisionResult } from "@/lib/types";
import { Monitor, AlertTriangle, Wifi, WifiOff, Camera } from "lucide-react";
import { TIMEFRAME_PRESETS } from "@/hooks/useVisionAnalysis";

interface Props {
    stream: MediaStream | null;
    status: StreamStatus;
    isVisionRunning: boolean;
    lastResult: VisionResult | null;
    results: VisionResult[];
    fps: number;
    activeTimeframe: string | null;
    onStartCapture: () => void;
}

export default function VisionFeed({
    stream, status, isVisionRunning, lastResult, results, fps, activeTimeframe, onStartCapture,
}: Props) {
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (videoRef.current && stream) {
            videoRef.current.srcObject = stream;
            videoRef.current.play().catch(() => {});
        }
    }, [stream]);

    const handleSnapshot = useCallback(() => {
        const video = videoRef.current;
        if (!video) return;
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth || 1280;
        canvas.height = video.videoHeight || 720;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.drawImage(video, 0, 0);
        ctx.fillStyle = "rgba(0,0,0,0.55)";
        ctx.fillRect(0, canvas.height - 52, canvas.width, 52);
        ctx.fillStyle = "#00ff88";
        ctx.font = "bold 14px IBM Plex Mono, monospace";
        ctx.fillText(`TradeVision Snapshot — ${new Date().toLocaleString()}`, 12, canvas.height - 30);
        if (lastResult) {
            ctx.fillStyle = "#d0d0e8";
            ctx.font = "11px IBM Plex Mono, monospace";
            ctx.fillText(lastResult.content.slice(0, 120), 12, canvas.height - 10);
        }
        canvas.toBlob(blob => {
            if (!blob) return;
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `tradevision_${Date.now()}.png`;
            a.click();
            URL.revokeObjectURL(url);
        }, "image/png");
    }, [lastResult]);

    const tfLabel = activeTimeframe
        ? (TIMEFRAME_PRESETS.find(t => t.value === activeTimeframe)?.label ?? activeTimeframe)
        : null;

    return (
        // flex-1 min-h-0 ensures this fills the parent flex column without overflow
        <div className="flex-1 min-h-0 flex flex-col gap-3">

            {/* ── Preview ──────────────────────────────────────────── */}
            <div
                className="relative rounded-xl border border-border bg-surface overflow-hidden shrink-0"
                style={{ aspectRatio: "16/9" }}
            >
                {stream ? (
                    <>
                        <video ref={videoRef} muted className="w-full h-full object-contain bg-bg" />

                        {/* HUD — top */}
                        <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-3 py-2 bg-linear-to-b from-black/70 to-transparent pointer-events-none">
                            <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${isVisionRunning ? "bg-accent live-dot" : "bg-warn"}`} />
                                <span className="text-[11px] font-mono text-white/80 font-medium">
                                    {isVisionRunning ? "ANALYZING" : "PAUSED"}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                {isVisionRunning && (
                                    <span className="text-[11px] font-mono text-accent">{fps} res/s</span>
                                )}
                                {tfLabel && (
                                    <span className="text-[10px] font-mono font-bold text-accent border border-accent/40 bg-accent/10 px-2 py-0.5 rounded-full">
                                        {tfLabel}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Snapshot button — bottom right */}
                        <button
                            onClick={handleSnapshot}
                            title="Save snapshot"
                            className="absolute bottom-2 right-2 p-1.5 bg-black/60 hover:bg-black/80 border border-white/10 rounded-lg transition-colors"
                        >
                            <Camera size={12} className="text-white/70" />
                        </button>
                    </>
                ) : (
                    /* Empty state */
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-bg grid-bg">
                        <div className="p-4 rounded-xl border border-border bg-surface">
                            <Monitor size={28} className="text-muted" />
                        </div>
                        {status === "error" && (
                            <div className="flex items-center gap-1.5 text-danger text-xs font-mono">
                                <AlertTriangle size={11} />
                                Screen share was denied or cancelled
                            </div>
                        )}
                        <div className="text-center">
                            <p className="text-textDim text-sm font-medium mb-1">No screen selected</p>
                            <p className="text-muted text-[11px] font-mono max-w-[220px]">
                                Click Start, pick a timeframe, then share your chart tab
                            </p>
                        </div>
                        <button
                            onClick={onStartCapture}
                            className="px-4 py-2 bg-accent text-bg text-xs font-mono font-semibold rounded-lg hover:bg-accent/90 transition-colors"
                        >
                            Select Screen / Tab
                        </button>
                    </div>
                )}
            </div>

            {/* ── Live Signal Feed ─────────────────────────────────── */}
            <div className="flex-1 min-h-0 rounded-xl border border-border bg-surface overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-border shrink-0">
                    <div className="flex items-center gap-2">
                        {isVisionRunning
                            ? <Wifi size={11} className="text-accent" />
                            : <WifiOff size={11} className="text-muted" />
                        }
                        <span className="text-[10px] font-mono uppercase tracking-widest text-muted">
                            Live Signals
                        </span>
                    </div>
                    {results.length > 0 && (
                        <span className="text-[10px] font-mono text-muted">{results.length} captured</span>
                    )}
                </div>

                {/* Feed */}
                <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5">
                    {results.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full gap-1.5 py-8 text-center">
                            <p className="text-muted text-xs font-mono">No signals yet</p>
                            <p className="text-muted/50 text-[11px] font-mono">
                                {isVisionRunning ? "Waiting for analysis…" : "Start a session to see signals"}
                            </p>
                        </div>
                    ) : (
                        results.map((r, i) => (
                            <div
                                key={r.id}
                                className={`rounded-lg px-3 py-2 border transition-all ${
                                    i === 0
                                        ? "border-accent/25 bg-accentDim msg-in"
                                        : "border-border/40 bg-bg/40"
                                }`}
                            >
                                <div className="flex items-center justify-between mb-1 gap-2">
                                    <span className={`text-[10px] font-mono shrink-0 ${i === 0 ? "text-accent" : "text-muted"}`}>
                                        {i === 0 ? "▶ NOW" : formatTime(r.timestamp)}
                                    </span>
                                    {r.prediction && (
                                        <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                                            r.prediction === "GREEN"
                                                ? "bg-green-500/15 text-green-400"
                                                : "bg-red-500/15 text-red-400"
                                        }`}>
                                            {r.prediction === "GREEN" ? "▲" : "▼"} {r.prediction} {r.predictionConfidence}%
                                        </span>
                                    )}
                                    {r.signalType && !r.prediction && (
                                        <span className="text-[10px] font-mono text-accent/60 shrink-0">[{r.signalType}]</span>
                                    )}
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
    return date.toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" });
}
