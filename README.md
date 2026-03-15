# TradeVision

Real-time AI-powered TradingView chart analyst. Screen-share your chart, and [Overshoot's](https://overshoot.ai) ultra-fast vision inference watches it continuously for patterns, breakouts, and signals. Everything it detects gets fed as live context into a Claude-powered chat, so you can ask questions about what's happening on your chart **right now** and get instant, context-aware responses.

## How It Works

1. **Screen Share** — Share your TradingView tab or window via the browser's screen capture API.
2. **Vision Analysis** — Overshoot's real-time vision models (Qwen 3.5 series) continuously analyze the live feed, detecting candlestick patterns, support/resistance levels, breakouts, volume spikes, and more.
3. **AI Chat** — All vision detections are streamed as live context into a Claude-powered chat. Ask "What's the current trend?" or "Any breakout forming?" and get answers grounded in what's actually on your screen.

## Tech Stack

- **Next.js 16** (App Router, React 19)
- **Overshoot SDK** — Real-time vision inference on screen capture
- **Anthropic Claude** — Chat with full vision context
- **Tailwind CSS v4** — Styling
- **Lucide React** — Icons

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) (or Node.js 18+)
- An [Overshoot API key](https://platform.overshoot.ai/api-keys) (for vision analysis)
- An [Anthropic API key](https://console.anthropic.com/settings/keys) (for chat)

### Install & Run

```bash
bun install
bun dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser (Chrome recommended for screen capture support).

### Configuration

Click the **gear icon** in the top bar to open Settings and enter your API keys:

| Key | Purpose | Get it at |
|-----|---------|-----------|
| Overshoot API Key | Powers real-time vision inference on your chart | [platform.overshoot.ai](https://platform.overshoot.ai/api-keys) |
| Anthropic API Key | Powers the Claude chat assistant | [console.anthropic.com](https://console.anthropic.com/settings/keys) |

You can also customize the **vision model** and **analysis prompt** in settings.

### Vision Models

| Model | Speed | Best For |
|-------|-------|----------|
| Qwen 3.5 4B | Fastest | Quick scans, low latency |
| Qwen 3.5 9B | Fast | Recommended starting point |
| Qwen 3.5 27B | Medium | Best overall quality |
| Qwen 3.5 35B MoE | Fast | High throughput (3B active params) |

## Project Structure

```
app/
  layout.tsx          — Root layout with scanline effect
  page.tsx            — Main app page with topbar, controls, and layout
  globals.css         — Theme tokens, animations, custom utilities
components/
  VisionFeed.tsx      — Live screen preview + signal feed
  ChatPanel.tsx       — Claude-powered chat with vision context
  SettingsPanel.tsx   — API keys, model selection, prompt config
hooks/
  useVisionAnalysis.ts — Overshoot SDK integration + screen capture
  useChat.ts          — Anthropic API integration with vision context
lib/
  types.ts            — TypeScript interfaces
  storage.ts          — LocalStorage settings persistence
```

## Usage Tips

- **Share the right tab** — For best results, share just the TradingView browser tab (not the entire screen).
- **Tune the prompt** — Customize the vision prompt in settings to focus on specific patterns or timeframes you care about.
- **Watch the signal feed** — The left panel shows live detections in real-time; the chat panel lets you ask follow-up questions.
- **Quick prompts** — Use the pre-built prompt buttons in the chat panel for common questions.

## License

MIT
