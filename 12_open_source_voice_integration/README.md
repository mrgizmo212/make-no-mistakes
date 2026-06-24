# 12 — Open-Source Voice Integration & Channel Connectors

## What Was Researched

Voice input (STT), voice output (TTS), and voice conversation systems in open-source AI agents. Additionally, this topic covers secure device-pairing protocols and platform messaging connectors (SMS, Telegram, Discord, Slack, WhatsApp) that route notifications, voice memos, and actions.

For detailed analysis on messaging gateways, see:
*   [channel_connectors_and_pairing.md](12_open_source_voice_integration/channel_connectors_and_pairing.md)

## Which Sources Were Used

| Source | Type | URL | Relevance |
|--------|------|-----|-----------|
| Hermes Agent (`hermes-agent/tools/tts_tool.py`, `tools/transcription_tools.py`, `tools/voice_mode.py`) | Local codebase | https://github.com/NousResearch/hermes-agent | CRITICAL |
| OpenClaw Voice Wake + Talk Mode | Local codebase | https://github.com/openclaw/openclaw | HIGH |
| OpenClaw Extensions (`openclaw/extensions/device-pair/`, `whatsapp/`, `sms/`, `slack/`, `telegram/`, `discord/`) | Local codebase | https://github.com/openclaw/openclaw | CRITICAL |
| Model landscape (GPT Audio, Grok Voice TTS) | Research output | — | HIGH |

## Key Findings

### Hermes Voice System

- **`tts_tool.py`** (111KB) — Text-to-speech with multiple backends
- **`transcription_tools.py`** (73KB) — Audio transcription / speech-to-text
- **`voice_mode.py`** (48KB) — Continuous voice conversation mode
- **`tools/neutts_synth.py`** + `tools/neutts_samples/` — Neural TTS synthesis
- **Voice memo transcription** — Receives voice memos via messaging platforms, transcribes automatically
- **Cross-platform** — Voice works via CLI, messaging gateway (Telegram voice messages), and companion apps
- **ElevenLabs integration** — Premium TTS via API key

### OpenClaw Voice System

- **Voice Wake** — Wake words on macOS/iOS (always-listening trigger)
- **Talk Mode** — Continuous voice conversation on Android
- **ElevenLabs + system TTS fallback** — Premium voice with free fallback
- **Node-based** — Voice processing runs on companion app nodes (macOS, iOS, Android)

### Voice Model Landscape (June 2026)

From model research (`13_model_agnostic_harness_architecture/model_landscape_june_2026.md`):

| Model | Type | Modality |
|-------|------|----------|
| Grok Voice TTS 1.0 | Text → Audio | TTS only |
| GPT Audio | Text + Audio → Text + Audio | Bidirectional |
| GPT Audio Mini | Text + Audio → Text + Audio | Bidirectional (cost-optimized) |

### Voice Architecture Pattern

```
┌───────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│ Microphone │────▸│ STT      │────▸│ Agent    │────▸│ TTS      │────▸ Speaker
│            │     │ (Whisper)│     │ (LLM)    │     │ (Eleven) │
└───────────┘     └──────────┘     └──────────┘     └──────────┘
```

**Emerging pattern** (GPT Audio): Single model handles audio→text→audio natively, eliminating the STT/TTS pipeline.

## What Is Confirmed

1. **STT + TTS pipeline** is the current standard (Hermes, OpenClaw)
2. **ElevenLabs** is the dominant TTS provider in open-source agents
3. **Voice wake words** enable hands-free interaction (OpenClaw on macOS/iOS)
4. **Native audio models** (GPT Audio, Grok Voice) are emerging and may replace the pipeline approach
5. **Voice memo transcription** via messaging is a killer feature for mobile use

## What Is Uncertain

- Whether native audio models will replace STT + TTS pipelines
- Latency characteristics of pipeline vs. native audio models
- Best approach for voice wake word detection (on-device vs. cloud)

## How This Applies to Building a Modern Model-Agnostic Agent Harness

1. **Support STT + TTS pipeline** as the baseline voice capability
2. **Plan for native audio models** (GPT Audio) as an alternative path
3. **Implement voice memo transcription** for messaging platform integration
4. **Consider ElevenLabs** as the default premium TTS provider
5. **Design voice as a modality, not a feature** — voice input/output should be orthogonal to the agent loop
