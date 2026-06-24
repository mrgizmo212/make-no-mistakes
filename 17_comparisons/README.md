# 17 — Comparisons

## What Was Researched

Cross-cutting comparisons across all studied codebases, identifying common patterns, divergent approaches, and relative strengths/weaknesses.

## Which Sources Were Used

All 10 local codebases + model landscape research from directory 13.

## Key Findings

### Master Comparison: Agent Frameworks

| Feature | Hermes | OpenClaw | Codex | Pi | LangGraph |
|---------|--------|----------|-------|-----|-----------|
| **Language** | Python | TypeScript | Rust | TypeScript | Python |
| **License** | MIT | MIT | Apache-2.0 | MIT | MIT |
| **Architecture** | Monolithic + plugins | Gateway-centric | Modular crates | Minimal monorepo | Graph state machine |
| **Agent loop** | While-loop (sync) | While-loop | While-loop | While-loop | Graph traversal |
| **Model-agnostic** | ✅ 200+ via OpenRouter | ✅ Multi-provider | ⚠️ OpenAI-focused | ✅ Multi-provider | ✅ Via LangChain |
| **Tools** | 87+ files | First-class | Minimal core + MCP | Minimal | Via LangChain tools |
| **MCP** | ✅ Client + Server | ✅ Client | ✅ First-class | ❌ | ⚠️ Via integration |
| **Skills** | ✅ Autonomous | ✅ Manual | ❌ | ❌ | ❌ |
| **Memory** | ✅ 8 providers | ✅ Files | ❌ | ❌ | ✅ Checkpoints |
| **Subagents** | ✅ Advanced | ✅ Session-based | ❌ | ❌ | ✅ Subgraphs |
| **Voice** | ✅ Full pipeline | ✅ Wake + Talk | ❌ | ❌ | ❌ |
| **Channels** | 20+ platforms | 26+ platforms | CLI only | CLI only | N/A (library) |
| **Sandboxing** | ✅ 7 backends | ✅ Docker/SSH | ✅ OS-native | ✅ External | N/A |
| **AGENTS.md** | ✅ 71KB | ✅ | ✅ Creator | ✅ | ⚠️ |
| **Cron/automation** | ✅ | ✅ + webhooks | ❌ | ❌ | ❌ |
| **Desktop app** | ✅ Electron | ✅ Win/Mac/iOS/Android | ❌ | ❌ | N/A |
| **Test suite** | ~1,655 test files | CI | N/A | vitest | pytest |
| **Community** | Nous Research | 200+ contributors | OpenAI | Small team | LangChain Inc |

### SDK / Proxy Comparison

| Feature | LiteLLM | OpenRouter SDK | LangChain | Open Responses |
|---------|---------|----------------|-----------|----------------|
| **Language** | Python | TypeScript | Python | Go |
| **Approach** | SDK + Proxy | SDK | SDK + integrations | API proxy |
| **Providers** | 100+ | 200+ (via OR) | 700+ integrations | Any OpenAI-compat |
| **Wire format** | OpenAI-compat | OpenAI-compat | Custom + adapters | OpenAI Responses |
| **Provider translation** | BaseConfig pattern | Speakeasy-gen | Provider packages | Go structs |
| **Streaming** | ✅ | ✅ ReusableStream | ✅ | ✅ |
| **Caching** | ✅ Redis | N/A | ⚠️ | ✅ Redis |
| **Self-hostable** | ✅ | N/A (client SDK) | N/A | ✅ |
| **Production scale** | ✅ 8ms P95 | ✅ | ✅ | ⚠️ Single monolith |

### Model Tier Comparison (June 2026 pricing)

| Tier | Best Value | Best Quality | Best for Coding |
|------|-----------|-------------|-----------------|
| **Frontier** | Nemotron 3 Ultra ($0.50/M in) | Claude Fable 5 ($10/M in) | Kimi K2.7 Code ($0.68/M in) |
| **Flash** | Gemini 3.5 Flash | GPT-5.4 Mini | DeepSeek V4 Flash |
| **Nano** | GPT-5.4 Nano | — | — |
| **Embedding** | Text Embedding 3 Small ($0.02/M) | Text Embedding 3 Large ($0.13/M) | — |
| **Reranking** | Rerank 4 Fast | Rerank 4 Pro | — |

### Architecture Pattern Comparison

| Pattern | Proponent | Tradeoffs |
|---------|-----------|-----------|
| **Monolithic agent** | Hermes | Simple deploy, hard to scale, huge files |
| **Gateway-centric** | OpenClaw | Scalable, distributed, complex setup |
| **Modular crates** | Codex | Maximum modularity, Rust learning curve |
| **Minimal monorepo** | Pi | Clean separation, limited features |
| **Graph state machine** | LangGraph | Best debugging, academic overhead |
| **SDK + Proxy** | LiteLLM | Flexible, dual deployment, two codebases |

## What Is Confirmed

1. **No single framework has it all** — Hermes leads in features, OpenClaw in channels, Codex in security, Pi in simplicity, LangGraph in debuggability
2. **Python + TypeScript is the winning stack** — Python for agent logic, TypeScript for gateway/frontend
3. **OpenAI-compatible wire format** is the universal choice
4. **AGENTS.md + SKILL.md** are the emerging file conventions
5. **MCP is the extensibility standard** — all major frameworks support it
6. **20x pricing spread** in models means intelligent routing is critical

## How This Applies to Building a Modern Model-Agnostic Agent Harness

The ideal harness would combine:
- **Hermes's learning loop** (skills, memory, autonomous improvement)
- **OpenClaw's gateway architecture** (multi-channel, distributed)
- **Codex's security model** (sandboxing, context discipline)
- **Pi's clean separation** (AI → Agent → Application layers)
- **LangGraph's state management** (checkpointing, interrupts)
- **LiteLLM's provider translation** (100+ models, BaseConfig pattern)
