# 16 — Local Codebase Studies

## What Was Researched

Deep-dive studies of locally cloned open-source agent codebases to extract architectural patterns, implementation strategies, and design decisions.

## Codebases Under Study

| Codebase | Local Path | URL | Subdirectory |
|----------|-----------|-----|--------------|
| Hermes Agent | `c:\Users\Adam\Desktop\agent2\hermes-agent` | https://github.com/NousResearch/hermes-agent | `hermes/` |
| OpenClaw | `c:\Users\Adam\Desktop\agent2\openclaw` | https://github.com/openclaw/openclaw | `openclaw/` |
| Pi | `c:\Users\Adam\Desktop\agent2\pi-mono` | https://github.com/badlogic/pi-mono | `pi/` |
| LangGraph | `c:\Users\Adam\Desktop\agent2\langgraph` | https://github.com/langchain-ai/langgraph | `langgraph/` |
| LangChain | `c:\Users\Adam\Desktop\agent2\langchain` | https://github.com/langchain-ai/langchain | `langchain/` |
| Open Responses | `c:\Users\Adam\Desktop\agent2\open-responses` | https://github.com/open-responses/open-responses | `open_responses/` |
| Codex | `c:\Users\Adam\Desktop\agent2\codex` | https://github.com/openai/codex | `codex/` |
| LiteLLM | `c:\Users\Adam\Desktop\agent2\litellm` | https://github.com/BerriAI/litellm | `litellm/` |
| OpenRouter SDK | `c:\Users\Adam\Desktop\agent2\openrouter-sdk` | https://github.com/OpenRouterTeam/typescript-sdk | `openrouter_sdk/` |
| LibreChat | `c:\Users\Adam\Desktop\agent2\LibreChat` | https://github.com/danny-avila/LibreChat | `librechat/` |
| LibreChat Agents SDK | `c:\Users\Adam\Desktop\agent2\librechat-agents` | https://github.com/danny-avila/agents | `librechat_agents/` |

## Which Sources Were Used

The locally cloned repositories listed above, plus their official documentation sites.

## Key Findings

### Completed Studies (11 of 11)

| Codebase | Relevance | Key Insight |
|----------|-----------|-------------|
| **Codex** | CRITICAL | 128 Rust crate workspace — gold standard for modular agent architecture. Sandboxing, MCP, AGENTS.md convention |
| **LiteLLM** | CRITICAL | Provider translation pattern (BaseConfig → transform_request/response). 100+ providers. Production-proven gateway |
| **OpenRouter SDK** | HIGH | Three-tier tool system (regular/generator/manual). Stop conditions. Async parameter resolution. Streaming architecture |
| **Open Responses** | HIGH | Responses API compatibility layer. Multi-provider self-hosted proxy. Drop-in OpenAI SDK replacement |
| **Hermes Agent** | CRITICAL | Pluggable memory/model adapters, AST tool registration, prompt caching preservation, autonomous skill learning loop |
| **OpenClaw** | CRITICAL | Gateway-centric multi-channel messaging broker (26+ channels). Voice Wake+Talk, A2UI Live Canvas, workspace files |
| **Pi** | HIGH | Minimal TS 3-package monorepo. Supply-chain hardening, Gondolin VM, Hugging Face session publishing |
| **LangGraph** | CRITICAL | Graph-based state machine Pregel execution, node checkpointers, first-class human-in-the-loop interrupts |
| **LangChain** | HIGH | Large ecosystem integrations library, LCEL pipeline composition, separate provider packages pattern |
| **LibreChat** | HIGH | Multi-tenant MCP with Redis stateful flow managers, CSRF cookie bindings, and Open Responses API server routes |
| **LibreChat Agents SDK** | CRITICAL | Dynamic token calibration ratios, observation masking context compaction, and LangGraph-based multi-agent Command routing |

## What Is Confirmed

- All 11 codebases successfully cloned and analyzed
- assistant-ui also available as supplementary reference (12 total repos)
- All 11 studies completed with detailed architectural analysis

## What Is Uncertain

- Depth of analysis needed per codebase
- Which codebases are most relevant to each research topic

## How This Applies to Building a Modern Model-Agnostic Agent Harness

Studying real, production-quality open-source agent implementations provides ground truth about what works in practice. Patterns extracted from these codebases directly inform architecture decisions for the new harness.
