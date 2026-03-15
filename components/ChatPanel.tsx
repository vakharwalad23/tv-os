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
  "What's the current trend?",
  "Any breakout patterns?",
  "Key support/resistance?",
  "What's the RSI telling us?",
  "Should I be cautious here?",
];

export default function ChatPanel({
  messages,
  isLoading,
  onSend,
  onClear,
  hasApiKey,
}: Props) {
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
    <div className="flex flex-col h-full border border-border rounded-xl overflow-hidden bg-surface">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-accent live-dot" />
          <span className="text-xs font-mono uppercase tracking-widest text-textDim">
            AI Chat
          </span>
        </div>
        <button
          onClick={onClear}
          className="p-1.5 hover:bg-border rounded-md transition-colors"
          title="Clear chat"
        >
          <Trash2 size={13} className="text-muted hover:text-textDim" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3">
        {!hasApiKey && (
          <div className="flex items-start gap-2 p-3 rounded-lg border border-warn/30 bg-warn/5">
            <AlertCircle size={14} className="text-warn shrink-0 mt-0.5" />
            <p className="text-xs text-textDim">
              Add your Anthropic API key in settings to enable chat.
            </p>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className="msg-in">
            {msg.role === "system" ? (
              <div className="flex items-start gap-2 text-xs text-muted font-mono py-1">
                <span className="text-border">—</span>
                <span>{msg.content}</span>
              </div>
            ) : msg.role === "user" ? (
              <div className="flex items-start gap-2.5 justify-end">
                <div className="max-w-[85%] bg-accentDim border border-accent/20 rounded-xl rounded-tr-sm px-3 py-2">
                  <p className="text-xs text-text leading-relaxed">
                    {msg.content}
                  </p>
                  <p className="text-xs text-muted mt-1">
                    {formatTime(msg.timestamp)}
                  </p>
                </div>
                <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center shrink-0 mt-0.5">
                  <User size={11} className="text-accent" />
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-2.5">
                <div className="w-6 h-6 rounded-full bg-border flex items-center justify-center shrink-0 mt-0.5">
                  <Bot size={11} className="text-textDim" />
                </div>
                <div className="max-w-[85%] bg-bg border border-border rounded-xl rounded-tl-sm px-3 py-2">
                  <p className="text-xs text-text leading-relaxed whitespace-pre-wrap">
                    {msg.content}
                  </p>
                  <p className="text-xs text-muted mt-1">
                    {formatTime(msg.timestamp)}
                  </p>
                </div>
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex items-start gap-2.5 msg-in">
            <div className="w-6 h-6 rounded-full bg-border flex items-center justify-center shrink-0">
              <Bot size={11} className="text-textDim" />
            </div>
            <div className="bg-bg border border-border rounded-xl rounded-tl-sm px-4 py-3">
              <div className="flex gap-1.5 items-center">
                <div
                  className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce"
                  style={{ animationDelay: "0ms" }}
                />
                <div
                  className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce"
                  style={{ animationDelay: "150ms" }}
                />
                <div
                  className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce"
                  style={{ animationDelay: "300ms" }}
                />
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Quick Prompts */}
      <div className="px-3 py-2 border-t border-border/50 flex gap-1.5 overflow-x-auto shrink-0 no-scrollbar">
        {QUICK_PROMPTS.map((p) => (
          <button
            key={p}
            onClick={() => onSend(p)}
            disabled={isLoading || !hasApiKey}
            className="shrink-0 px-2.5 py-1 text-xs font-mono text-textDim border border-border rounded-md
              hover:border-accent/30 hover:text-text hover:bg-accentDim transition-all disabled:opacity-40"
          >
            {p}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="px-3 pb-3 pt-2 shrink-0">
        <div className="flex gap-2 items-end bg-bg border border-border rounded-xl p-2 focus-within:border-accent/40 transition-colors">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              hasApiKey
                ? "Ask about the chart... (Enter to send)"
                : "Add API key to chat"
            }
            disabled={!hasApiKey || isLoading}
            rows={1}
            className="flex-1 bg-transparent text-sm text-text placeholder-muted resize-none focus:outline-none font-mono leading-relaxed max-h-24 overflow-y-auto disabled:opacity-50"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading || !hasApiKey}
            className="p-2 rounded-lg bg-accent text-bg hover:bg-accent/90 transition-all disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
          >
            <Send size={13} />
          </button>
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
  });
}
