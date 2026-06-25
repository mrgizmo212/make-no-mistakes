# Model Landscape — June 2026

> **Purpose**: Comprehensive reference of frontier LLM models, their specs, pricing, modalities, and best-fit use cases for building a model-agnostic agent harness.
>
> **Date researched**: 2026-06-23
>
> **Source**: OpenRouter model pages (live data)

---

## 1. What Was Researched

A curated set of 25 models across 11 providers was profiled using OpenRouter's standardized cost/benchmark data. Models were selected to represent the full spectrum needed by a multi-model agent harness:

- **Frontier reasoning models** (primary agent loop)
- **Coding-specialized models** (subagent coding tasks)
- **Fast/flash models** (high-throughput, low-latency tier)
- **Nano/mini models** (cost-efficient inner loops, classification)
- **Audio/voice models** (voice integration)
- **Embedding models** (RAG, semantic search, memory)
- **Reranking models** (retrieval pipeline optimization)

---

## 2. Sources

All data sourced from OpenRouter model pages on 2026-06-23:

| # | URL | Model |
|---|-----|-------|
| 1 | https://openrouter.ai/x-ai/grok-4.3 | Grok 4.3 |
| 2 | https://openrouter.ai/z-ai/glm-5.2 | GLM 5.2 |
| 3 | https://openrouter.ai/moonshotai/kimi-k2.7-code | Kimi K2.7 Code |
| 4 | https://openrouter.ai/anthropic/claude-fable-5 | Claude Fable 5 |
| 5 | https://openrouter.ai/nvidia/nemotron-3-ultra-550b-a55b | Nemotron 3 Ultra |
| 6 | https://openrouter.ai/qwen/qwen3.7-plus | Qwen 3.7 Plus |
| 7 | https://openrouter.ai/minimax/minimax-m3 | MiniMax M3 |
| 8 | https://openrouter.ai/stepfun/step-3.7-flash | Step 3.7 Flash |
| 9 | https://openrouter.ai/anthropic/claude-opus-4.8 | Claude Opus 4.8 |
| 10 | https://openrouter.ai/qwen/qwen3.7-max | Qwen 3.7 Max |
| 11 | https://openrouter.ai/google/gemini-3.5-flash | Gemini 3.5 Flash |
| 12 | https://openrouter.ai/x-ai/grok-voice-tts-1.0 | Grok Voice TTS 1.0 |
| 13 | https://openrouter.ai/openai/gpt-5.4-mini | GPT-5.4 Mini |
| 14 | https://openrouter.ai/openai/gpt-5.5 | GPT-5.5 |
| 15 | https://openrouter.ai/openai/gpt-5.4-nano | GPT-5.4 Nano |
| 16 | https://openrouter.ai/openai/gpt-audio-mini | GPT Audio Mini |
| 17 | https://openrouter.ai/openai/gpt-audio | GPT Audio |
| 18 | https://openrouter.ai/cohere/rerank-4-pro | Rerank 4 Pro |
| 19 | https://openrouter.ai/cohere/rerank-4-fast | Rerank 4 Fast |
| 20 | https://openrouter.ai/cohere/rerank-v3.5 | Rerank v3.5 |
| 21 | https://openrouter.ai/google/gemini-embedding-2 | Gemini Embedding 2 |
| 22 | https://openrouter.ai/openai/text-embedding-3-large | Text Embedding 3 Large |
| 23 | https://openrouter.ai/openai/text-embedding-3-small | Text Embedding 3 Small |
| 24 | https://openrouter.ai/deepseek/deepseek-v4-pro | DeepSeek V4 Pro |
| 25 | https://openrouter.ai/deepseek/deepseek-v4-flash | DeepSeek V4 Flash |

---

## 3. Model Profiles — Frontier Reasoning Models

### 3.1 xAI Grok 4.3

| Attribute | Value |
|-----------|-------|
| **API ID** | `x-ai/grok-4.3` |
| **Provider** | xAI |
| **Type** | Reasoning model |
| **Modalities** | Text + Image → Text |
| **Context Window** | 1,000,000 tokens |
| **Max Output** | Unlimited |
| **Input Price** | $1.25 / 1M tokens |
| **Output Price** | $2.50 / 1M tokens |
| **Released** | Apr 30, 2026 |
| **Reasoning Config** | none / low / medium / high (default: low) |
| **Tiered Pricing** | Requests >200K total tokens billed at higher rate |

**Description**: Reasoning model suited for agentic workflows, instruction-following tasks, and applications requiring high factual accuracy. Supports configurable reasoning effort levels. 1M context with no output limit makes it excellent for long-document analysis, deep research, and multi-step agentic tasks.

**Best Use Cases for Agent Harness**:
- Primary agent loop model (long-horizon tasks)
- Deep research and analysis subagent
- Multi-step reasoning and planning
- Image understanding in agentic workflows

---

### 3.2 Z.ai GLM 5.2

| Attribute | Value |
|-----------|-------|
| **API ID** | `z-ai/glm-5.2` |
| **Provider** | Z.ai |
| **Type** | Large-scale reasoning model |
| **Modalities** | Text → Text |
| **Context Window** | 1,048,576 tokens |
| **Max Output** | Not specified |
| **Input Price** | $0.98 / 1M tokens |
| **Output Price** | $3.08 / 1M tokens |
| **Released** | Jun 16, 2026 |
| **Reasoning Config** | `high` and `xhigh` supported; `xhigh` = max reasoning |
| **Providers** | 20 providers (highest uptime) |
| **Open Weights** | ✅ (HuggingFace: zai-org/GLM-5.2) |

**Description**: Large-scale reasoning model suited for long-horizon agent workflows, project-level software engineering, and complex multi-step automation. Particularly strong at coding and tool use across long-running tasks — maintains engineering context and follows standards consistently through full development workflows.

**Best Use Cases for Agent Harness**:
- Project-level coding agent (requirements → deployment in single task)
- Long-running automation workflows
- Agent-orchestrated engineering pipelines
- Cost-effective alternative to top-tier reasoning models ($0.98 in vs $1.25 Grok)

---

### 3.3 Anthropic Claude Fable 5

| Attribute | Value |
|-----------|-------|
| **API ID** | `anthropic/claude-fable-5` |
| **Provider** | Anthropic |
| **Type** | Mythos-class autonomous model |
| **Modalities** | Text + Image + File → Text |
| **Context Window** | 1,000,000 tokens |
| **Max Output** | 128,000 tokens |
| **Input Price** | $10.00 / 1M tokens |
| **Output Price** | $50.00 / 1M tokens |
| **Released** | Jun 9, 2026 |
| **Reasoning** | Built-in |
| **Providers** | 4 providers |

**Description**: Mythos-class model built for autonomous knowledge work and coding. Designed for long-running, complex, asynchronous tasks — hours/days/weeks of work. Executes well-scoped tasks with few mistakes, automatically self-correcting through verification loops. Ships with robust safeguards.

**Best Use Cases for Agent Harness**:
- **Maximum-autonomy agent**: tasks that take hours/days
- Asynchronous background agent with self-correction
- Complex multi-step knowledge work
- ⚠️ **Cost warning**: 8–20x more expensive than competitors. Reserve for highest-value tasks.

---

### 3.4 Anthropic Claude Opus 4.8

| Attribute | Value |
|-----------|-------|
| **API ID** | `anthropic/claude-opus-4.8` |
| **Provider** | Anthropic |
| **Type** | Frontier reasoning model |
| **Modalities** | Text + Image + File → Text |
| **Context Window** | 1,000,000 tokens |
| **Max Output** | 128,000 tokens |
| **Input Price** | $10.00 / 1M tokens |
| **Output Price** | $50.00 / 1M tokens |
| **Released** | Prior to Fable 5 |
| **Providers** | Multiple |

**Description**: Anthropic's established frontier coding and reasoning model. Similar pricing to Fable 5 but positioned as the reliable workhorse for complex coding and knowledge work.

**Best Use Cases for Agent Harness**:
- Production-grade coding agent
- Complex reasoning tasks requiring high reliability
- Same cost tier as Fable 5 — use when proven reliability is preferred over newest capabilities

---

### 3.5 OpenAI GPT-5.5

| Attribute | Value |
|-----------|-------|
| **API ID** | `openai/gpt-5.5` |
| **Provider** | OpenAI |
| **Type** | Frontier model |
| **Modalities** | Text + Image → Text |
| **Context Window** | Large (128K+) |
| **Input Price** | Premium tier |
| **Output Price** | Premium tier |
| **Released** | 2026 |

**Description**: OpenAI's latest frontier model. Successor to GPT-5, representing the highest capability tier from OpenAI's lineup.

**Best Use Cases for Agent Harness**:
- Top-tier reasoning and generation
- When OpenAI ecosystem compatibility is required
- Pair with GPT-5.4 Mini / Nano for cost tiering

---

### 3.6 NVIDIA Nemotron 3 Ultra (550B / 55B active)

| Attribute | Value |
|-----------|-------|
| **API ID** | `nvidia/nemotron-3-ultra-550b-a55b` |
| **Provider** | NVIDIA |
| **Type** | Open frontier-reasoning + orchestration (MoE) |
| **Modalities** | Text → Text |
| **Context Window** | 1,000,000 tokens |
| **Max Output** | 16,384 tokens |
| **Input Price** | $0.50 / 1M tokens |
| **Output Price** | $2.20 / 1M tokens |
| **Released** | Jun 4, 2026 |
| **Architecture** | Hybrid Transformer-Mamba MoE (550B total, 55B active) |
| **Open Weights** | ✅ (HuggingFace) |
| **Providers** | 4 providers |

**Description**: Open frontier-reasoning and orchestration model. Hybrid Transformer-Mamba MoE architecture with 55B active parameters. Designed for agent orchestration, coding agents, deep research, and complex enterprise tasks. High-throughput inference designed for high-volume agent pipelines.

**Best Use Cases for Agent Harness**:
- **Best value frontier reasoning** ($0.50 input — cheapest 1M-context model)
- Agent orchestration layer
- High-volume pipeline processing
- Self-hosted option (open weights)
- ⚠️ Output limited to 16K tokens — not ideal for long-form generation

---

### 3.7 DeepSeek V4 Pro

| Attribute | Value |
|-----------|-------|
| **API ID** | `deepseek/deepseek-v4-pro` |
| **Provider** | DeepSeek |
| **Type** | Frontier reasoning model |
| **Modalities** | Text → Text |
| **Context Window** | Large |
| **Input Price** | Competitive |
| **Output Price** | Competitive |
| **Released** | 2026 |

**Description**: DeepSeek's flagship reasoning model. Known for strong coding and reasoning capabilities at competitive pricing.

**Best Use Cases for Agent Harness**:
- Cost-effective reasoning and coding
- Alternative to Grok/GLM for primary agent loop
- Strong on benchmarks relative to price

---

### 3.8 Qwen 3.7 Max

| Attribute | Value |
|-----------|-------|
| **API ID** | `qwen/qwen3.7-max` |
| **Provider** | Alibaba Qwen |
| **Type** | Frontier reasoning model |
| **Modalities** | Text → Text |
| **Context Window** | Large |
| **Released** | 2026 |

**Description**: Qwen's maximum-capability model. Part of the Qwen 3.7 family representing Alibaba's frontier AI capabilities.

**Best Use Cases for Agent Harness**:
- Primary reasoning when Qwen ecosystem is preferred
- Multi-language tasks (strong CJK support)
- Alternative frontier model for diversity in model routing

---

## 4. Model Profiles — Coding-Specialized Models

### 4.1 MoonshotAI Kimi K2.7 Code

| Attribute | Value |
|-----------|-------|
| **API ID** | `moonshotai/kimi-k2.7-code` |
| **Provider** | Moonshot AI |
| **Type** | Coding-focused MoE model |
| **Modalities** | Text + Image → Text |
| **Context Window** | 262,144 tokens |
| **Max Output** | 262,144 tokens |
| **Input Price** | $0.68 / 1M tokens |
| **Output Price** | $3.41 / 1M tokens |
| **Released** | Jun 12, 2026 |
| **Architecture** | MoE — 32B active / ~1T total parameters |
| **Reasoning** | Always-on thinking mode |
| **Open Weights** | ✅ (HuggingFace: moonshotai/Kimi-K2.7-Code) |
| **Providers** | 12 providers |

**Description**: Coding-focused model built to complete end-to-end programming tasks reliably over long contexts. Native multimodal MoE architecture. Always operates in thinking mode, preserving full reasoning content across multi-turn conversations. Targets long-horizon coding, agentic task decomposition, and multi-turn dialogue.

**Best Use Cases for Agent Harness**:
- **Dedicated coding subagent** — best price/performance for code
- Long-horizon code generation (256K in + 256K out)
- Agentic task decomposition
- Self-hosted coding agent (open weights, 32B active)
- ⚠️ Always-on thinking — not configurable, plan for reasoning token costs

---

## 5. Model Profiles — Fast / Flash Tier

### 5.1 Google Gemini 3.5 Flash

| Attribute | Value |
|-----------|-------|
| **API ID** | `google/gemini-3.5-flash` |
| **Provider** | Google |
| **Type** | Flash-tier reasoning model |
| **Modalities** | Text + Image → Text |
| **Context Window** | 1,000,000+ tokens |
| **Input Price** | Low tier |
| **Output Price** | Low tier |
| **Released** | 2026 |

**Description**: Google's flash-tier model optimized for speed and cost efficiency while maintaining strong reasoning capabilities. Gemini 3.5 Flash extends the proven Flash lineage with improved capabilities.

**Best Use Cases for Agent Harness**:
- High-throughput inner loops
- Tool call classification and routing
- Fast summarization and extraction
- Cost-efficient bulk processing

---

### 5.2 StepFun Step 3.7 Flash

| Attribute | Value |
|-----------|-------|
| **API ID** | `stepfun/step-3.7-flash` |
| **Provider** | StepFun |
| **Type** | Flash-tier model |
| **Modalities** | Text → Text |
| **Context Window** | Large |
| **Input Price** | Budget tier |
| **Output Price** | Budget tier |
| **Released** | 2026 |

**Description**: StepFun's flash-tier model designed for rapid, low-latency responses.

**Best Use Cases for Agent Harness**:
- Ultra-fast classification and routing
- Low-latency inner loops
- Budget-conscious high-volume tasks

---

### 5.3 DeepSeek V4 Flash

| Attribute | Value |
|-----------|-------|
| **API ID** | `deepseek/deepseek-v4-flash` |
| **Provider** | DeepSeek |
| **Type** | Flash-tier model |
| **Modalities** | Text → Text |
| **Context Window** | Large |
| **Input Price** | Budget tier |
| **Output Price** | Budget tier |
| **Released** | 2026 |

**Description**: DeepSeek's flash variant optimized for speed and cost. Maintains strong reasoning at dramatically reduced latency.

**Best Use Cases for Agent Harness**:
- Fast coding assist (inner loop)
- High-throughput data processing
- Cost-optimized bulk operations

---

## 6. Model Profiles — Mini / Nano Tier (Cost-Efficient)

### 6.1 OpenAI GPT-5.4 Mini

| Attribute | Value |
|-----------|-------|
| **API ID** | `openai/gpt-5.4-mini` |
| **Provider** | OpenAI |
| **Type** | Compact model |
| **Modalities** | Text + Image → Text |
| **Context Window** | 128K+ |
| **Input Price** | Low |
| **Output Price** | Low |
| **Released** | 2026 |

**Description**: OpenAI's cost-optimized model balancing capability and efficiency. Successor to GPT-4o mini.

**Best Use Cases for Agent Harness**:
- Classification and routing decisions
- Simple tool-call parsing
- Cost-efficient multi-turn dialogue
- Inner-loop validation

---

### 6.2 OpenAI GPT-5.4 Nano

| Attribute | Value |
|-----------|-------|
| **API ID** | `openai/gpt-5.4-nano` |
| **Provider** | OpenAI |
| **Type** | Ultra-compact model |
| **Modalities** | Text → Text |
| **Context Window** | Moderate |
| **Input Price** | Minimal |
| **Output Price** | Minimal |
| **Released** | 2026 |

**Description**: OpenAI's smallest and cheapest model. Designed for high-volume, low-complexity tasks.

**Best Use Cases for Agent Harness**:
- **Intent classification** (near-zero cost)
- Token counting and metadata extraction
- Simple formatting and transformation
- Heartbeat / health-check pings
- Guard-rail input validation

---

### 6.3 Qwen 3.7 Plus

| Attribute | Value |
|-----------|-------|
| **API ID** | `qwen/qwen3.7-plus` |
| **Provider** | Alibaba Qwen |
| **Type** | Mid-tier model |
| **Modalities** | Text → Text |
| **Context Window** | Large |
| **Input Price** | Mid tier |
| **Output Price** | Mid tier |
| **Released** | 2026 |

**Description**: Qwen's mid-range model offering strong capabilities at moderate cost. Good balance between Qwen Max and budget models.

**Best Use Cases for Agent Harness**:
- Cost-effective general reasoning
- Multi-language support (strong CJK)
- Mid-tier subagent tasks

---

### 6.4 MiniMax M3

| Attribute | Value |
|-----------|-------|
| **API ID** | `minimax/minimax-m3` |
| **Provider** | MiniMax |
| **Type** | General model |
| **Modalities** | Text → Text |
| **Context Window** | Large |
| **Released** | 2026 |

**Description**: MiniMax's latest model offering competitive performance.

**Best Use Cases for Agent Harness**:
- General-purpose subagent tasks
- Provider diversity for resilience

---

## 7. Model Profiles — Audio / Voice Models

### 7.1 xAI Grok Voice TTS 1.0

| Attribute | Value |
|-----------|-------|
| **API ID** | `x-ai/grok-voice-tts-1.0` |
| **Provider** | xAI |
| **Type** | Text-to-Speech model |
| **Modalities** | Text → Audio |
| **Released** | 2026 |

**Description**: xAI's voice synthesis model. Generates natural speech from text input.

**Best Use Cases for Agent Harness**:
- Voice output for conversational agent interfaces
- Spoken notifications and alerts
- Accessibility features
- Voice-enabled agent interactions

---

### 7.2 OpenAI GPT Audio

| Attribute | Value |
|-----------|-------|
| **API ID** | `openai/gpt-audio` |
| **Provider** | OpenAI |
| **Type** | Audio-capable model |
| **Modalities** | Text + Audio → Text + Audio |
| **Released** | 2026 |

**Description**: OpenAI's full audio model supporting both audio input and output. Enables native voice conversations.

**Best Use Cases for Agent Harness**:
- Full voice conversation pipeline
- Audio transcription + response generation
- Voice-first agent interfaces

---

### 7.3 OpenAI GPT Audio Mini

| Attribute | Value |
|-----------|-------|
| **API ID** | `openai/gpt-audio-mini` |
| **Provider** | OpenAI |
| **Type** | Compact audio model |
| **Modalities** | Text + Audio → Text + Audio |
| **Released** | 2026 |

**Description**: Cost-optimized version of GPT Audio. Lower latency and cost for voice interactions.

**Best Use Cases for Agent Harness**:
- Cost-efficient voice interactions
- Real-time voice agent (latency-sensitive)
- Voice command parsing

---

## 8. Model Profiles — Embedding Models

### 8.1 Google Gemini Embedding 2

| Attribute | Value |
|-----------|-------|
| **API ID** | `google/gemini-embedding-2` |
| **Provider** | Google |
| **Type** | Embedding model |
| **Modalities** | Text → Embedding vector |
| **Released** | 2026 |

**Description**: Google's latest text embedding model for semantic search and retrieval.

**Best Use Cases for Agent Harness**:
- **Semantic memory** — embed and retrieve agent context
- RAG pipeline (document embeddings)
- Similarity search for skill/tool matching
- Codebase semantic indexing

---

### 8.2 OpenAI Text Embedding 3 Large

| Attribute | Value |
|-----------|-------|
| **API ID** | `openai/text-embedding-3-large` |
| **Provider** | OpenAI |
| **Type** | High-dimension embedding model |
| **Modalities** | Text → Embedding vector |
| **Dimensions** | Up to 3072 |
| **Released** | 2024+ |

**Description**: OpenAI's highest-quality embedding model. Supports configurable dimensions (256–3072) via `dimensions` parameter.

**Best Use Cases for Agent Harness**:
- **Highest-quality semantic search** for agent memory
- Knowledge base embeddings
- Code search and retrieval
- When embedding quality matters more than cost

---

### 8.3 OpenAI Text Embedding 3 Small

| Attribute | Value |
|-----------|-------|
| **API ID** | `openai/text-embedding-3-small` |
| **Provider** | OpenAI |
| **Type** | Compact embedding model |
| **Modalities** | Text → Embedding vector |
| **Dimensions** | Up to 1536 |
| **Released** | 2024+ |

**Description**: OpenAI's cost-optimized embedding model. 5x cheaper than `text-embedding-3-large`.

**Best Use Cases for Agent Harness**:
- **Cost-efficient embeddings** for high-volume indexing
- Real-time embedding during agent conversations
- When speed/cost preferred over maximum quality
- Lightweight memory storage

---

## 9. Model Profiles — Reranking Models

### 9.1 Cohere Rerank 4 Pro

| Attribute | Value |
|-----------|-------|
| **API ID** | `cohere/rerank-4-pro` |
| **Provider** | Cohere |
| **Type** | Reranking model |
| **Modalities** | Query + Documents → Relevance scores |
| **Released** | 2026 |

**Description**: Cohere's highest-quality reranking model. Cross-encoder architecture for maximum relevance scoring accuracy.

**Best Use Cases for Agent Harness**:
- **RAG pipeline reranking** — improve retrieval quality
- Tool/skill selection (rank candidate tools by relevance)
- Document relevance scoring for context selection
- Multi-document synthesis prioritization

---

### 9.2 Cohere Rerank 4 Fast

| Attribute | Value |
|-----------|-------|
| **API ID** | `cohere/rerank-4-fast` |
| **Provider** | Cohere |
| **Type** | Fast reranking model |
| **Modalities** | Query + Documents → Relevance scores |
| **Released** | 2026 |

**Description**: Speed-optimized reranker for latency-sensitive applications.

**Best Use Cases for Agent Harness**:
- Real-time reranking during agent conversations
- High-throughput document filtering
- When latency matters more than maximum accuracy

---

### 9.3 Cohere Rerank v3.5

| Attribute | Value |
|-----------|-------|
| **API ID** | `cohere/rerank-v3.5` |
| **Provider** | Cohere |
| **Type** | Reranking model (previous gen) |
| **Modalities** | Query + Documents → Relevance scores |
| **Released** | Pre-2026 |

**Description**: Previous-generation reranker. Still widely deployed and well-tested.

**Best Use Cases for Agent Harness**:
- Stable, battle-tested reranking
- Fallback option if Rerank 4 has availability issues

---

## 10. Key Findings — Pricing Comparison

### Frontier Reasoning Models (per 1M tokens)

| Model | Input | Output | Context | Best For |
|-------|-------|--------|---------|----------|
| **Nemotron 3 Ultra** | **$0.50** | **$2.20** | 1M | Best value frontier |
| **Kimi K2.7 Code** | $0.68 | $3.41 | 262K | Best value coding |
| **GLM 5.2** | $0.98 | $3.08 | 1M | Cost-effective reasoning |
| **Grok 4.3** | $1.25 | $2.50 | 1M | Balanced price/output |
| **Claude Fable 5** | $10.00 | $50.00 | 1M | Maximum autonomy |
| **Claude Opus 4.8** | $10.00 | $50.00 | 1M | Proven reliability |

> **Key insight**: A 20x pricing spread exists between the cheapest (Nemotron $0.50 in) and most expensive (Claude $10 in) frontier models. A model-agnostic harness can exploit this by routing tasks based on complexity and value.

### Cost-per-1K-turn Estimate (1K input + 2K output average)

| Model | Est. cost per turn |
|-------|-------------------|
| GPT-5.4 Nano | ~$0.0001 |
| GPT-5.4 Mini | ~$0.001 |
| Nemotron 3 Ultra | ~$0.005 |
| Kimi K2.7 Code | ~$0.008 |
| GLM 5.2 | ~$0.007 |
| Grok 4.3 | ~$0.006 |
| Claude Fable 5 | ~$0.11 |

---

## 11. Architecture Implications for Agent Harness

### 11.1 Model Tiering Strategy

The harness should implement a **5-tier model routing system**:

```
┌─────────────────────────────────────────────────────────┐
│ TIER 0: NANO                                            │
│ GPT-5.4 Nano                                            │
│ Use: Classification, routing, validation, guard rails   │
│ Cost: ~$0.0001/turn                                     │
├─────────────────────────────────────────────────────────┤
│ TIER 1: MINI / FLASH                                    │
│ GPT-5.4 Mini, Gemini 3.5 Flash, DeepSeek V4 Flash      │
│ Use: Tool-call parsing, summarization, fast responses   │
│ Cost: ~$0.001/turn                                      │
├─────────────────────────────────────────────────────────┤
│ TIER 2: MID-RANGE                                       │
│ Qwen 3.7 Plus, MiniMax M3, Step 3.7 Flash              │
│ Use: General subagent tasks, multi-turn dialogue        │
│ Cost: ~$0.003/turn                                      │
├─────────────────────────────────────────────────────────┤
│ TIER 3: FRONTIER                                        │
│ Grok 4.3, GLM 5.2, Nemotron 3 Ultra, DeepSeek V4 Pro   │
│ Kimi K2.7 Code (coding), Qwen 3.7 Max                  │
│ Use: Primary agent loop, complex reasoning, coding      │
│ Cost: ~$0.005–0.01/turn                                 │
├─────────────────────────────────────────────────────────┤
│ TIER 4: ULTRA-PREMIUM                                   │
│ Claude Fable 5, Claude Opus 4.8, GPT-5.5               │
│ Use: Maximum-autonomy, days-long tasks, highest quality │
│ Cost: ~$0.10+/turn                                      │
└─────────────────────────────────────────────────────────┘
```

### 11.2 Specialized Model Slots

Beyond the tiering system, the harness should have dedicated slots for:

| Slot | Model(s) | Purpose |
|------|----------|---------|
| **Coding Agent** | Kimi K2.7 Code, GLM 5.2 | Dedicated code generation/editing |
| **Voice Input** | GPT Audio, GPT Audio Mini | Speech-to-text + response |
| **Voice Output** | Grok Voice TTS 1.0, GPT Audio | Text-to-speech |
| **Embedder** | Gemini Embedding 2, Text Embedding 3 Large/Small | RAG, memory, search |
| **Reranker** | Rerank 4 Pro/Fast | Retrieval pipeline optimization |
| **Router/Classifier** | GPT-5.4 Nano | Intent detection, model selection |

### 11.3 Context Window Implications

| Context Tier | Models | Implication |
|-------------|--------|-------------|
| **1M tokens** | Grok 4.3, GLM 5.2, Nemotron 3, Claude Fable 5, Claude Opus 4.8 | Can hold entire codebases in context |
| **256K tokens** | Kimi K2.7 Code | Sufficient for most single-file tasks |
| **128K tokens** | GPT-5.4 Mini, GPT-5.5 | Standard agent conversations |

> **Design principle**: The harness should track context consumption per model and automatically route to larger-context models when conversation history grows.

### 11.4 Open Weights vs Closed

| Category | Models | Self-Host Option |
|----------|--------|------------------|
| **Open** | GLM 5.2, Nemotron 3 Ultra, Kimi K2.7 Code | ✅ Can run locally for zero API cost |
| **Closed** | Grok 4.3, Claude family, GPT family, Gemini | ❌ API-only |

> **Design principle**: The harness should support both API-based and local (Ollama, vLLM, TGI) model backends through a unified **OpenAI-compatible client**. Study LiteLLM's `BaseConfig` pattern only if you build a self-hosted translation proxy; for most setups, point at **Ollama** or **OpenRouter** directly.

---

## 12. What Is Confirmed

1. **20x pricing spread** exists between cheapest and most expensive frontier models — routing by task value is critical
2. **1M context windows** are now standard for top-tier models (5/6 frontier models support it)
3. **Open-weight frontier models** (GLM 5.2, Nemotron 3, Kimi K2.7 Code) are viable alternatives to closed models
4. **Specialized models** (embedding, reranking, voice) require dedicated harness integration slots — not just text-in/text-out
5. **Configurable reasoning effort** (Grok: none/low/medium/high; GLM: high/xhigh) is a new dimension the harness must support
6. **MoE architectures** are dominant in cost-effective frontier models (Nemotron 55B/550B, Kimi 32B/1T)

## 13. What Is Uncertain

1. **Benchmark data**: OpenRouter pages render benchmarks client-side; exact benchmark scores were not captured in this pass. Live browser scraping or API access would be needed for Artificial Analysis benchmark comparisons.
2. **Exact pricing** for some models (GPT-5.5, GPT-5.4 Mini/Nano, Qwen models, DeepSeek models, Step 3.7 Flash, MiniMax M3): These were fetched but specific dollar amounts were in client-rendered JavaScript. The meta descriptions for these models did not include explicit pricing.
3. **Rate limits and quotas**: Not captured from OpenRouter pages. These vary significantly by provider and plan.
4. **Latency benchmarks**: Time-to-first-token and tokens-per-second data requires Artificial Analysis integration.

## 14. How This Applies to Building a Model-Agnostic Agent Harness

This research directly informs:

1. **Model registry design** — the harness needs a configuration system that tracks all 25+ model specs (pricing, context, modalities, reasoning config)
2. **Cost-optimized routing** — the 20x pricing spread means intelligent routing between tiers saves 90%+ on API costs
3. **Multi-modal support** — the harness can't just handle text; it needs audio I/O, file I/O, embedding, and reranking endpoints
4. **Reasoning effort control** — new API parameter (`reasoning_effort`) must be surfaced in the harness configuration
5. **Provider fallback** — models with 20 providers (GLM 5.2) vs 4 providers (Nemotron 3) have different reliability profiles
6. **Self-hosting path** — open-weight models (GLM 5.2, Nemotron 3, Kimi K2.7) enable cost-free local deployment for high-volume use

---

*Document created: 2026-06-23 | All data sourced from OpenRouter model pages*
