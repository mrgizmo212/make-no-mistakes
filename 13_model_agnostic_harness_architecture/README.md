# 13 — Model-Agnostic Harness Architecture

## What Was Researched

Architectural patterns for building AI agent harnesses that are not tied to any specific LLM provider — abstraction layers, provider adapters, unified message formats, capability negotiation, fallback strategies, and runtime model switching.

Additionally, a comprehensive **model landscape survey** covering 25 models across 11 providers was conducted to inform the architecture with real-world pricing, context windows, modalities, and capability data.

## Which Sources Were Used

- **25 OpenRouter model pages** (fetched live 2026-06-23) — see [model_landscape_june_2026.md](model_landscape_june_2026.md) for full source table
- Providers: xAI, Z.ai, Anthropic, OpenAI, NVIDIA, Google, MoonshotAI, Qwen, MiniMax, StepFun, Cohere, DeepSeek

## Key Findings

### Model Landscape (June 2026)

See full document: **[model_landscape_june_2026.md](model_landscape_june_2026.md)**

Key takeaways:

1. **20x pricing spread** between cheapest ($0.50/M Nemotron) and most expensive ($10/M Claude) frontier models — intelligent model routing is critical
2. **1M context windows** are now standard for top-tier models (5 of 8 frontier models)
3. **Open-weight frontier models** (GLM 5.2, Nemotron 3, Kimi K2.7 Code) are now viable alternatives to closed models
4. **5 model tiers** recommended for the harness: Nano → Mini/Flash → Mid-Range → Frontier → Ultra-Premium
5. **Specialized model slots** required beyond text generation: Coding Agent, Voice I/O, Embedder, Reranker, Router/Classifier
6. **Configurable reasoning effort** (Grok: none/low/medium/high; GLM: high/xhigh) is a new API parameter dimension

## What Is Confirmed

- Research topic scoped and defined
- Model landscape research complete with verified pricing data from OpenRouter
- 5-tier routing architecture is supported by the pricing data
- Open-weight models provide a viable self-hosting path

## What Is Uncertain

- How to handle provider-specific features (e.g., caching, extended thinking) in a model-agnostic way
- Optimal abstraction granularity — too abstract loses features, too concrete loses portability
- How to handle heterogeneous tool calling formats across providers
- Exact benchmark scores (rendered client-side on OpenRouter; would need Artificial Analysis API)
- Exact pricing for some models where meta descriptions didn't include explicit dollar amounts

## How This Applies to Building a Modern Model-Agnostic Agent Harness

> **Model routing is not LiteLLM-specific.** Use an OpenAI-compatible client pointed at Ollama (local), OpenRouter (hosted), a LiteLLM proxy (optional), or direct provider APIs.

This is the central architectural question. The harness must define a clean abstraction boundary that allows swapping LLM providers without changing agent logic, while still exposing provider-specific capabilities through an extension mechanism.

The model landscape research directly informs:

1. **Model registry design** — track specs for 25+ models (pricing, context, modalities, reasoning config)
2. **Cost-optimized routing** — 20x pricing spread enables 90%+ cost savings through intelligent tiering
3. **Multi-modal support** — harness needs audio I/O, file I/O, embedding, and reranking endpoints, not just text
4. **Reasoning effort control** — new `reasoning_effort` parameter must be surfaced in configuration
5. **Provider fallback** — models range from 4 to 20 providers; reliability profiles differ significantly
6. **Self-hosting path** — open-weight models (GLM 5.2, Nemotron 3, Kimi K2.7) enable zero-API-cost local deployment
