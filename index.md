<p align="center">
  <img src="assets/logo.png" alt="Make No Mistakes" width="280"/>
</p>

# Make No Mistakes

**Notes toward a model-agnostic agent harness.**

*Started June 2026 · still being edited*

---

## What this is

Working notes on how to build a clean, model-agnostic **agent harness** — loops, memory, subagents, tools, MCPs, skills, voice — organized around a 5-tier architecture.

It pulls patterns from a dozen existing projects (Hermes, Codex, Pi, LangGraph, OpenClaw, LiteLLM, and others) and tries to say which layer each one is actually good at.

---

## It's a composite, not a merge

You are not supposed to fork Hermes, Codex, Pi, LangGraph, and OpenClaw into one giant monorepo. That's the mistake this whole thing is named after.

Instead, treat each project as a **pattern donor** for a specific layer, and wire them together through interfaces that already exist: OpenAI-compatible APIs, MCP, SSE, `SKILL.md`.

| The spec means | It does **not** mean |
|:---|:---|
| Tier 2 behaves *like* Hermes/Codex/Pi | Copy their codebases |
| Tier 5 talks to your model backend (Ollama, OpenRouter, …) | Vendor a proxy repo or require LiteLLM |
| Tier 4 borrows OpenClaw patterns | Fork OpenClaw as your base |

Narrow interfaces, opinionated layers.

→ [Full architecture recommendations](18_architecture_recommendations/README.md)

---

## Start here

| | |
|:---|:---|
| **The spec** | [Harness Architecture Specification](19_final_reports/harness_architecture_specification_report.md) |
| **Full TOC** | [Table of Contents](SUMMARY.md) |
| **Recommendations** | [Architecture Recommendations](18_architecture_recommendations/README.md) |
| **Citations** | [Source Registry](00_index/source_registry.md) · [Citation Map](00_index/citation_map.md) |

---

## The 5-tier stack

```mermaid
flowchart TB
  T5["Tier 5 · Model Gateway<br/>Ollama · OpenRouter · LiteLLM · direct APIs"]
  T4["Tier 4 · Canvas GUI<br/>OpenClaw"]
  T3["Tier 3 · IDE Extension<br/>Cursor · VS Code"]
  T2["Tier 2 · Cognitive Engine<br/>Hermes / Codex / Pi"]
  T1["Tier 1 · SDK / Hooks<br/>LangGraph / assistant-ui"]
  T5 --> T4 --> T3 --> T2 --> T1
```

Tier 3 leans on Cursor's agent model — see the [Cursor Agent docs](https://cursor.com/docs/agent/overview) and [SRC-021](00_index/source_registry.md).

---

## What's inside

| Part | Topics |
|:---|:---|
| I · Landscape | SDKs, frameworks, coding agents |
| II · Core systems | Loops, memory, subagents, tools, MCPs, skills, voice |
| III · Architecture | Model-agnostic harness, backend & frontend stacks |
| IV · Studies | Hermes, Codex, Pi, LangGraph, LangChain, OpenClaw, LiteLLM, … |
| V · Synthesis | Comparisons, recommendations, final spec |

---

## Reference codebases

Upstream repos — linked, not vendored. Learn from each; don't merge them.

| Project | Good for |
|:---|:---|
| [Hermes Agent](https://github.com/NousResearch/hermes-agent) | Autonomous loop, learning |
| [Codex](https://github.com/openai/codex) | Rust coding CLI, AGENTS.md |
| [Pi](https://github.com/badlogic/pi-mono) | Minimal terminal agent |
| [LangGraph](https://github.com/langchain-ai/langgraph) | Graph orchestration |
| [LangChain](https://github.com/langchain-ai/langchain) | Model abstraction |
| [OpenClaw](https://github.com/openclaw/openclaw) | Multi-platform assistant |
| [OpenRouter SDK](https://github.com/OpenRouterTeam/typescript-sdk) | Hosted multi-model routing |
| [LiteLLM](https://github.com/BerriAI/litellm) | Self-hosted proxy (optional) |
| [Ollama](https://ollama.com) | Local models via OpenAI-compat `/v1` |
| [Open Responses](https://github.com/open-responses/open-responses) | Responses API server |
| [assistant-ui](https://github.com/assistant-ui/assistant-ui) | React chat components |
| [LibreChat](https://github.com/danny-avila/LibreChat) | Personal assistant UI |
