"use client";

import { useEffect, useRef, useCallback } from "react";
import { StreamStatus } from "@/lib/types";
import { Monitor, AlertTriangle, Wifi, WifiOff, Camera } from "lucide-react";
import { VisionResult } from "@/lib/types";
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
            videoRef.current.play().catch(() => { });
        }
    }, [stream]);

    // Screenshot snapshot — saves current frame + top signal as PNG
    const handleSnapshot = useCallback(() => {
        const video = videoRef.current;
        if (!video) return;
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 1280;
        canvas.height = video.videoHeight || 720;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(video, 0, 0);

        // Overlay watermark
        ctx.fillStyle = 'rgba(0,0,0,0.55)';
        ctx.fillRect(0, canvas.height - 52, canvas.width, 52);
        ctx.fillStyle = '#00ff88';
        ctx.font = 'bold 14px IBM Plex Mono, monospace';
        ctx.fillText(`TradeVision Snapshot — ${new Date().toLocaleString()}`, 12, canvas.height - 30);
        if (lastResult) {
            ctx.fillStyle = '#d0d0e8';
            ctx.font = '11px IBM Plex Mono, monospace';
            ctx.fillText(lastResult.content.slice(0, 120), 12, canvas.height - 10);
        }

        canvas.toBlob(blob => {
            if (!blob) return;
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `tradevision_${Date.now()}.png`;
            a.click();
            URL.revokeObjectURL(url);
        }, 'image/png');
    }, [lastResult]);

    return (
        <div className="flex flex-col h-full gap-3">
            {/* Preview Area */}
            <div className="relative rounded-xl border border-border overflow-hidden bg-surface shrink-0" style={{ aspectRatio: "16/9" }}>
                {stream ? (
                    <>
                        <video ref={videoRef} muted className="w-full h-full object-contain bg-bg" />
                        {/* Top HUD */}
                        <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-3 py-2 bg-linear-to-b from-black/60 to-transparent pointer-events-none">
                            <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full live-dot ${isVisionRunning ? "bg-accent" : "bg-warn"}`} />
                                <span className="text-xs font-mono text-text">{isVisionRunning ? "ANALYZING" : "PAUSED"}</span>
                            </div>
                            <div className="flex items-center gap-3 text-xs font-mono text-textDim">
                                {isVisionRunning && <span className="text-accent">{fps} res/s</span>}
                                {activeTimeframe && (
                                    <span className="px-1.5 py-0.5 rounded border border-accent/40 bg-accentDim text-accent text-[10px] font-mono font-bold">
                                        {TIMEFRAME_PRESETS.find(t => t.value === activeTimeframe)?.label ?? activeTimeframe}
                                    </span>
                                )}
                            </div>
                        </div>
                        {/* Snapshot button */}
                        <button
                            onClick={handleSnapshot}
                            title="Save snapshot"
                            className="absolute bottom-2 right-2 p-1.5 bg-black/50 hover:bg-black/80 border border-white/10 rounded-lg transition-colors"
                        >
                            <Camera size={13} className="text-white/70" />
                        </button>
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
                            <p className="text-muted text-xs font-mono">Share a screen or tab to begin</p>
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
                        {isVisionRunning ? <Wifi size={12} className="text-accent" /> : <WifiOff size={12} className="text-muted" />}
                        <span className="text-xs font-mono uppercase tracking-widest text-textDim">Live Signals</span>
                    </div>
                    <span className="text-xs font-mono text-muted">{results.length} captured</span>
                </div>

                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                    {results.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center py-8">
                            <p className="text-textDim text-xs font-mono">Signals will appear here in real-time</p>
                            <p className="text-muted text-xs mt-1">as Overshoot analyzes your chart</p>
                        </div>
                    ) : (
                        results.map((r, i) => (
                            <div key={r.id} className={`rounded-lg px-3 py-2.5 border transition-all ${
                                i === 0 ? "border-accent/30 bg-accentDim msg-in" : "border-border/50 bg-bg/50"
                            }`}>
                                <div className="flex items-center justify-between mb-1 gap-2">
                                    <span className={`text-xs font-mono shrink-0 ${i === 0 ? "text-accent" : "text-muted"}`}>
                                        {i === 0 ? "▶ NOW" : formatTime(r.timestamp)}
                                    </span>
                                    {r.prediction && (
                                        <span className={`text-xs font-mono font-bold px-1.5 py-0.5 rounded ${
                                            r.prediction === 'GREEN'
                                                ? 'bg-green-500/15 text-green-400'
                                                : 'bg-red-500/15 text-red-400'
                                        }`}>
                                            {r.prediction === 'GREEN' ? '▲' : '▼'} {r.prediction} {r.predictionConfidence}%
                                        </span>
                                    )}
                                    {r.signalType && !r.prediction && (
                                        <span className="text-xs font-mono text-accent/70 shrink-0">[{r.signalType}]</span>
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