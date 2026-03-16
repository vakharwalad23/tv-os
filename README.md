# TradeVision

Real-time AI chart analyst. Screen-share any chart, pick your timeframe, and [Overshoot's](https://overshoot.ai) vision inference watches it continuously — detecting patterns, breakouts, and signals at the right cadence for that timeframe. Everything it sees is streamed as live context into a Claude-powered chat so you can ask questions about what's happening on your chart **right now**.

---

## How It Works

1. **Click Start → Pick a timeframe** — A picker asks which candle size you're analyzing (1m → 1D). This does two things: sets the Overshoot analysis cadence to a sensible interval for that timeframe, and injects `"You are analyzing X candles"` context directly into the AI prompt before your session starts.
2. **Share your screen** — The browser's native screen capture picker opens immediately after you select the timeframe. Share any tab, window, or your entire display.
3. **Vision Analysis** — Overshoot's real-time vision models (Qwen 3.5 series) analyze frames at the configured cadence, detecting candlestick patterns, support/resistance levels, breakouts, volume anomalies, and more.
4. **AI Chat** — All detections are streamed as live context into a Claude-powered chat. Ask *"What's the current trend?"* or *"Any breakout forming?"* and get answers grounded in what's actually on your screen right now.

---

## Timeframe → Analysis Cadence

The Overshoot SDK enforces a hard maximum of **60 seconds** for its capture interval. For slower timeframes (15m → 1D) TradeVision uses a **result gate**: the SDK captures and runs inference every 60 s, but only the result that arrives once the real target interval has elapsed is forwarded to the UI. Intermediate inferences are silently dropped.

| Timeframe | Candle Duration | SDK Capture Rate | Result shown every | Results / Candle |
|-----------|----------------|------------------|--------------------|-----------------|
| **1m**    | 60 s           | 20 s             | **20 s**           | ~3              |
| **5m**    | 5 min          | 60 s             | **60 s**           | ~5              |
| **15m**   | 15 min         | 60 s ¹           | **120 s (2 min)**  | ~7              |
| **1H**    | 1 hour         | 60 s ¹           | **300 s (5 min)**  | ~12             |
| **4H**    | 4 hours        | 60 s ¹           | **600 s (10 min)** | ~24             |
| **1D**    | 1 day          | 60 s ¹           | **900 s (15 min)** | ~96             |

¹ SDK capped at 60 s max; result gate suppresses output until the full target interval elapses.

> **API cost note:** For 15m–1D sessions the SDK still runs inference every 60 s internally. Only 1-in-N results reach the UI, but all N inferences are billed. If cost is a concern, use the **Default Frame Interval** slider in Settings to raise the SDK interval toward 60 s (it is already at the ceiling for 5m–1D).

The active timeframe is shown as a badge in the live feed HUD so it's always visible while a session is running.

---

## Features

### Core
- **Timeframe-aware analysis** — Each session is scoped to a candle size. The AI prompt is automatically prefixed with the timeframe context and the Overshoot cadence is tuned to match.
- **Live screen capture** — Capture any browser tab, window, or desktop via the Web Screen Capture API. Works with any charting platform.
- **Real-time signal feed** — Every analysis fires as a live signal card in the left panel, newest at the top. Signals are color-coded and tagged by type.
- **Session stats** — Bullish/bearish signal counts, prediction accuracy breakdown, and session uptime tracked in real-time at the bottom bar.

### Prompt Templates
Seven built-in AI vision prompts accessible via the quick-switch bar — switch without opening settings:

| Template | Focus |
|----------|-------|
| 📊 General Analysis | Trend, S/R, candle patterns, MA crosses, RSI/MACD divergence |
| 🕯️ Candle Predictor | Next-candle direction with confidence % and reason |
| ⚡ Scalping Mode | 1–5 min momentum setups, wick rejections, volume surges |
| 📈 Swing Trade Mode | Chart patterns, higher-TF trend, MA alignment |
| 📦 Volume Analysis | Volume spikes, absorption, distribution, divergence |
| 🔍 Pattern Hunter | Named candlestick + chart patterns with confidence |
| 🔤 Read Chart Text | OCR — transcribes every visible price, indicator value, and label (auto-selects Qwen 3.5 2B) |

### Candle Predictor
Dedicated panel that parses structured `PREDICTION: GREEN/RED | confidence: X% | reason: ...` output from the AI. Shows the latest directional call, confidence bar, and a running streak counter.

### Paper Trader
Auto-opens paper trades based on candle predictions. Tracks open/closed positions, win/loss outcomes, and P&L across the session. Resets on page refresh.

### Signal Log
Persistent signal history stored in `localStorage`. Browse, filter, and export all captured signals as CSV. Survives page refresh.

### Signal Timeline
A compact heatmap strip at the bottom of the screen showing the color-coded signal history for the current session (up to 120 entries).

### AI Chat
Claude-powered chat with full vision context. The last 10 live signals are injected into the system prompt so Claude can answer questions about what's currently on your chart. Requires an Anthropic API key.

### Audio Alerts
Configurable audio pings and browser notifications for predictions and keyword-matched signals (e.g. `BREAKOUT`, `REVERSAL`).

---

## Tech Stack

| Layer | Tech |
|-------|------|
| Framework | Next.js 15 (App Router, React 19) |
| Vision inference | [Overshoot SDK](https://overshoot.ai) — real-time screen frame analysis |
| Chat | Anthropic Claude API (via `/api/chat`) |
| Styling | Tailwind CSS v4 |
| Icons | Lucide React |
| Storage | Browser `localStorage` |

---

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) (or Node.js 18+)
- An [Overshoot API key](https://platform.overshoot.ai/api-keys) — powers vision analysis
- An [Anthropic API key](https://console.anthropic.com/settings/keys) — powers chat (optional)

### Install & Run

```bash
bun install
bun dev
```

Open [http://localhost:3000](http://localhost:3000) in Chrome (recommended — best screen capture support).

### Configuration

Click the **gear icon** (top-right) → Settings:

| Setting | Description |
|---------|-------------|
| Overshoot API Key | Required. Powers real-time vision inference. |
| Anthropic API Key | Optional. Powers the Claude chat panel. |
| Vision Model | Choose speed vs. quality tradeoff (see table below). |
| Processing Mode | `frame` (analyze snapshots) or `clip` (analyze short video clips). |
| Analysis Frequency | Fallback cadence used if no timeframe preset matches. |
| Audio Alerts | Toggle pings for predictions and keyword signals. |
| Alert Keywords | Comma-separated trigger words (e.g. `BREAKOUT,REVERSAL`). |

### Vision Models

| Model | Speed | Best For |
|-------|-------|----------|
| Qwen/Qwen3.5-4B | Fastest | Quick scans, lowest latency, high volume |
| Qwen/Qwen3.5-9B | Fast | Recommended default |
| Qwen/Qwen3.5-27B | Medium | Best pattern recognition quality |
| Qwen/Qwen3.5-35B-MoE | Fast | High quality at near-9B speeds |

---

## Project Structure

```
app/
  layout.tsx              — Root layout + page metadata
  page.tsx                — Main app: topbar, timeframe picker, layout orchestration
  globals.css             — Theme tokens, animations, custom utilities
  api/chat/route.ts       — Anthropic Claude proxy endpoint

components/
  VisionFeed.tsx          — Live screen preview, HUD (timeframe badge, FPS), signal feed
  ChatPanel.tsx           — Claude chat with vision context injection
  SettingsPanel.tsx       — API keys, model, prompt, alert configuration
  CandlePredictor.tsx     — Structured prediction parser + streak tracker
  PaperTrader.tsx         — Auto paper trading from predictions
  SignalLog.tsx           — Persistent signal history + CSV export
  SignalTimeline.tsx      — Session signal heatmap strip
  SessionStats.tsx        — Live session stat bar (counts, uptime)
  PromptQuickSwitch.tsx   — One-click prompt template switcher

hooks/
  useVisionAnalysis.ts    — Overshoot SDK, timeframe presets, prompt injection, screen capture
  useChat.ts              — Anthropic API with rolling vision context
  useScreenCapture.ts     — Low-level screen capture primitives

lib/
  types.ts                — TypeScript interfaces (AppSettings, VisionResult, etc.)
  storage.ts              — localStorage persistence + prompt template registry
```

---

## Usage Tips

- **Pick the right timeframe** — The cadence is tuned per timeframe. Using 1m on a 1D chart wastes API calls; using 1D on a 1m chart misses fast moves.
- **Candle Predictor works best on 1m–15m** — The model needs fast feedback loops to be useful for next-candle prediction.
- **Customize the prompt** — The built-in templates are starting points. Open Settings and edit the prompt directly to add your specific indicators or focus areas.
- **Use the Signal Log for review** — Export CSV after a session to review which signal types had the best follow-through.
- **Chat is context-aware** — The Claude chat already has the last 10 live signals in its context. You don't need to paste what you're seeing; just ask.

---

## License

MIT
