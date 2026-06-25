# 01 — Open-Source Agentic SDKs

## What Was Researched

SDKs and libraries that provide the building blocks for constructing AI agents — model abstraction layers, tool-calling interfaces, structured output parsing, and provider-agnostic LLM interaction. Distinguished from full *frameworks* (02) by scope: SDKs give you components, frameworks give you an opinionated architecture.

## Which Sources Were Used

| Source | Type | URL | Relevance |
|--------|------|-----|-----------|
| LangChain (`langchain/`) | Local codebase | https://github.com/langchain-ai/langchain | CRITICAL |
| Pi AI package (`pi-mono/packages/ai/`) | Local codebase | https://github.com/badlogic/pi-mono | HIGH |
| LiteLLM (`litellm/`) | Local codebase | https://github.com/BerriAI/litellm | HIGH (optional proxy reference) |
| OpenRouter SDK (`openrouter-sdk/`) | Local codebase | https://github.com/OpenRouterTeam/typescript-sdk | HIGH |
| Open Responses (`open-responses/`) | Local codebase | https://github.com/open-responses/open-responses | MEDIUM |
| LibreChat Agents SDK (`librechat-agents/`) | Local codebase | https://github.com/danny-avila/agents | CRITICAL |

## Key Findings

### 1. LangChain SDK (`langchain-ai/langchain`)

**Language**: Python | **License**: MIT | **Status**: Production (millions of installs/month)

The foundational LLM application SDK. Self-describes as "the agent engineering platform." Core components:

- **`init_chat_model()`** — Universal model initializer: `init_chat_model("openai:gpt-5.5")` works across any supported provider. The `provider:model` URI format is the de facto standard.
- **Model interoperability** — Standard interface for chat models, embeddings, vector stores, retrievers. Swap providers without code changes.
- **Integrations library** — 700+ third-party integrations (model providers, tools, vector stores, document loaders).
- **Deep Agents** — Higher-level package built on LangChain for agents with planning, subagents, and filesystem capabilities. Represents the "batteries-included" layer above the SDK.
- **Composability** — Chains, runnables, and LCEL (LangChain Expression Language) for declarative pipeline composition.

**Key architectural pattern**: Provider packages are separate (`langchain-openai`, `langchain-anthropic`, etc.) — the core SDK defines interfaces, provider packages implement them. This is the canonical approach to model-agnostic design in Python.

### 2. Pi AI Package (`@badlogic/pi-ai`)

**Language**: TypeScript | **License**: MIT | **Status**: Active development

Minimal, focused LLM abstraction. Three packages:
- **`pi-ai`** — Unified multi-provider LLM API (OpenAI, Anthropic, Google, etc.)
- **`pi-agent-core`** — Agent runtime with tool calling and state management
- **`pi-coding-agent`** — Interactive coding agent CLI built on top

**Key architectural pattern**: Monorepo with clear separation. The AI package is truly minimal — just model abstraction. Agent logic is a separate package. The coding agent is another layer on top. This three-layer stack (AI → Agent → Application) is the cleanest separation studied.

### 3. LiteLLM SDK (`BerriAI/litellm`)

**Language**: Python | **License**: MIT | **Status**: Production (enterprise-grade)

Dual-layer architecture (studied in depth in `16_local_codebase_studies/litellm/`):
- **SDK layer** — Direct Python SDK: `litellm.completion()` translates any provider's API into OpenAI format
- **Proxy layer** — HTTP gateway that exposes a unified OpenAI-compatible API endpoint for any downstream consumer

**Key architectural pattern**: `BaseConfig` per provider with `transform_request()` / `transform_response()` methods. Useful **reference if you build a self-hosted multi-provider proxy** — not required when using Ollama or OpenRouter directly (both already speak OpenAI-compat).

### 4. OpenRouter SDK (`OpenRouterTeam/typescript-sdk`)

**Language**: TypeScript | **License**: MIT | **Status**: Active

Provider-routing SDK (studied in `16_local_codebase_studies/openrouter_sdk/`):
- **Hybrid architecture** — Auto-generated from OpenAPI specs (Speakeasy) + hand-written extensions
- **Three tool types** — Regular, generator, and manual tools with Zod-based type safety
- **Stop conditions** — `maxModelResponses`, `maxToolCalls`, `stopConditions` for agentic loop control
- **Async parameter resolution** — Any parameter can be a function that resolves at call time

### 5. Open Responses (`open-responses/open-responses`)

**Language**: Go + Python | **License**: MIT | **Status**: Active

Drop-in replacement for OpenAI's Responses API (studied in `16_local_codebase_studies/open_responses/`):
- Implements the `POST /v1/responses` endpoint with compatibility for any backend model
- Docker-first deployment with Redis/PostgreSQL persistence
- Shows how to build an API-compatible proxy layer

### 6. LibreChat Agents SDK (`danny-avila/agents`)

**Language**: TypeScript | **License**: MIT | **Status**: Active development

An agentic runtime SDK supporting token-calibrated ReAct execution and context management:
- **Token Calibration Ratio** — Computes `calibrationRatio = cumulativeProviderReported / cumulativeRawSent` from `usageMetadata` return objects to correct discrepancies between local tokenizers (like tiktoken) and the provider's billing [CLAIM-183](../00_index/citation_map.md#claim-183).
- **Dynamic Overhead Calibration** — Adjusts the tool schema token ceiling when estimated vs. calibrated variance exceeds a 15% threshold (`CALIBRATION_VARIANCE_THRESHOLD`) [CLAIM-184](../00_index/citation_map.md#claim-184).
- **Observation Masking & Compaction** — Truncates consumed `ToolMessage` payloads to ~300 character previews when context pressure exceeds 80% [CLAIM-187](../00_index/citation_map.md#claim-187), and uses full LLM compaction to summarize long run histories [CLAIM-188](../00_index/citation_map.md#claim-188).

## What Is Confirmed

1. **Provider:model URI format** is becoming standard (LangChain, Pi, Hermes all use it)
2. **OpenAI-compatible wire format** is the lingua franca — Ollama, OpenRouter, LiteLLM, and Open Responses all expose it
3. **Three-layer separation** (AI SDK → Agent Runtime → Application) produces the cleanest architecture (Pi's design)
4. **Separate provider packages** (LangChain's approach) scales better than monolithic provider support
5. **Provider translation layers** (LiteLLM `BaseConfig`, LangChain provider packages) matter when you self-host a multi-provider proxy — skip them if you point at Ollama or OpenRouter directly

## What Is Uncertain

- Whether to use a hosted router (OpenRouter), local runtime (Ollama), self-hosted proxy (LiteLLM), or direct provider APIs
- How to handle provider-specific features (extended thinking, reasoning effort) in a generic SDK
- The right granularity for streaming abstractions across different SDK approaches

## How This Applies to Building a Modern Model-Agnostic Agent Harness

1. **Default to an OpenAI-compatible client** — set `base_url` to Ollama, OpenRouter, a LiteLLM proxy, or a direct provider endpoint
2. **Use the `provider:model` URI format** where your backend expects it (OpenRouter, LangChain, Hermes)
3. **Separate the AI SDK from the agent runtime** — Pi's three-layer approach is the reference architecture
4. **Study LiteLLM's `BaseConfig` pattern** only if you need a self-hosted translation layer — otherwise OpenRouter or Ollama is enough
5. **Do not treat LiteLLM as a required dependency** — it is one studied option for enterprise proxy features (auth, budgets, 100+ providers)
