"use client";

import { useState, useRef, useEffect } from "react";
import { ChatMessage } from "@/lib/types";
import { Send, Trash2, Bot, User, AlertCircle } from "lucide-react";

interface Props {
    messages: ChatMessage[];
    isLoading: boolean;
    onSend: (msg: string) => void;
    onClear: () => void;
    hasApiKey: boolean;
}

const QUICK_PROMPTS = [
    "Current trend?",
    "Breakout patterns?",
    "Key S/R levels?",
    "RSI reading?",
    "Last signal?",
    "Good entry?",
    "Overall bias?",
    "Warning signs?",
];

export default function ChatPanel({ messages, isLoading, onSend, onClear, hasApiKey }: Props) {
    const [input, setInput] = useState("");
    const bottomRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isLoading]);

    const handleSend = () => {
        const trimmed = input.trim();
        if (!trimmed || isLoading) return;
        onSend(trimmed);
        setInput("");
        inputRef.current?.focus();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="flex flex-col h-full rounded-xl border border-border bg-surface overflow-hidden">

            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-border shrink-0">
                <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-accent live-dot" />
                    <span className="text-[10px] font-mono uppercase tracking-widest text-muted">AI Chat</span>
                </div>
                <button
                    onClick={onClear}
                    className="p-1 text-muted hover:text-textDim hover:bg-border/60 rounded transition-colors"
                    title="Clear chat"
                >
                    <Trash2 size={12} />
                </button>
            </div>

            {/* Messages */}
            <div className="flex-1 min-h-0 overflow-y-auto px-3 py-3 space-y-3">
                {!hasApiKey && (
                    <div className="flex items-start gap-2 p-3 rounded-lg border border-warn/30 bg-warn/5">
                        <AlertCircle size={13} className="text-warn shrink-0 mt-0.5" />
                        <p className="text-xs text-textDim">
                            Add your Anthropic API key in settings to enable chat.
                        </p>
                    </div>
                )}

                {messages.map(msg => (
                    <div key={msg.id} className="msg-in">
                        {msg.role === "system" ? (
                            <div className="flex items-center gap-2 text-[11px] text-muted font-mono py-0.5">
                                <div className="w-px h-3 bg-border shrink-0" />
                                <span className="leading-relaxed">{msg.content}</span>
                            </div>
                        ) : msg.role === "user" ? (
                            <div className="flex items-start gap-2 justify-end">
                                <div className="max-w-[86%] bg-accentDim border border-accent/20 rounded-xl rounded-tr-sm px-3 py-2">
                                    <p className="text-xs text-text leading-relaxed">{msg.content}</p>
                                    <p className="text-[10px] text-muted mt-1">{formatTime(msg.timestamp)}</p>
                                </div>
                                <div className="w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center shrink-0 mt-0.5">
                                    <User size={10} className="text-accent" />
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-start gap-2">
                                <div className="w-5 h-5 rounded-full bg-border flex items-center justify-center shrink-0 mt-0.5">
                                    <Bot size={10} className="text-textDim" />
                                </div>
                                <div className="max-w-[86%] bg-bg border border-border rounded-xl rounded-tl-sm px-3 py-2">
                                    <p className="text-xs text-text leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                                    <p className="text-[10px] text-muted mt-1">{formatTime(msg.timestamp)}</p>
                                </div>
                            </div>
                        )}
                    </div>
                ))}

                {isLoading && (
                    <div className="flex items-start gap-2 msg-in">
                        <div className="w-5 h-5 rounded-full bg-border flex items-center justify-center shrink-0">
                            <Bot size={10} className="text-textDim" />
                        </div>
                        <div className="bg-bg border border-border rounded-xl rounded-tl-sm px-3 py-3">
                            <div className="flex gap-1.5 items-center">
                                {[0, 150, 300].map(d => (
                                    <div
                                        key={d}
                                        className="w-1.5 h-1.5 rounded-full bg-accent/60 animate-bounce"
                                        style={{ animationDelay: `${d}ms` }}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                <div ref={bottomRef} />
            </div>

            {/* Quick prompts */}
            <div className="px-3 py-1.5 border-t border-border/60 flex gap-1 overflow-x-auto no-scrollbar shrink-0">
                {QUICK_PROMPTS.map(p => (
                    <button
                        key={p}
                        onClick={() => onSend(p)}
                        disabled={isLoading || !hasApiKey}
                        className="shrink-0 px-2 py-0.5 text-[10px] font-mono text-muted border border-border/60 rounded hover:border-accent/30 hover:text-textDim hover:bg-accentDim transition-all disabled:opacity-40"
                    >
                        {p}
                    </button>
                ))}
            </div>

            {/* Input */}
            <div className="px-3 pb-3 pt-1.5 shrink-0">
                <div className="flex gap-2 items-end bg-bg border border-border rounded-xl px-3 py-2 focus-within:border-accent/30 transition-colors">
                    <textarea
                        ref={inputRef}
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={hasApiKey ? "Ask about the chart… (Enter to send)" : "Add API key to chat"}
                        disabled={!hasApiKey || isLoading}
                        rows={1}
                        className="flex-1 bg-transparent text-sm text-text placeholder-muted resize-none focus:outline-none font-mono leading-relaxed max-h-24 overflow-y-auto disabled:opacity-50"
                    />
                    <button
                        onClick={handleSend}
                        disabled={!input.trim() || isLoading || !hasApiKey}
                        className="p-1.5 rounded-lg bg-accent text-bg hover:bg-accent/90 transition-all disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
                    >
                        <Send size={12} />
                    </button>
                </div>
            </div>
        </div>
    );
}

function formatTime(date: Date): string {
    return date.toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit" });
}
