# Agent Context — Harness Development Reference

> **This file is for the agent.** Refer to it at the start of any session when working inside the `agent_harness_research/harness` directory to understand the development scope, architecture decisions, and current implementation checklist.

---

## Workspace Directory

`c:\Users\Adam\Desktop\agent2\agent_harness_research\harness\`

This directory is the dedicated space for planning, prototyping, and building the **model-agnostic agent harness** based on the synthesized recommendations from our research phase.

For overall workspace context, see the root [agents.md](harness/agents.md).

---

## Architectural Blueprint (Narrow Waist, Rich Edges)

We adhere to the composite architecture detailed in [18 — Architecture Recommendations](18_architecture_recommendations/README.md).

```
┌──────────────────────────────────────────────────────────────┐
│                    APPLICATION LAYER                         │
│  Coding Agent │ Personal Assistant │ Research Agent │ Custom │
├──────────────────────────────────────────────────────────────┤
│                    GATEWAY / ORCHESTRATION                   │
│  Multi-channel routing │ Session management │ Cron scheduler │
├──────────────────────────────────────────────────────────────┤
│                    AGENT RUNTIME                             │
│  Agent loop │ Tool dispatch │ Memory │ Skills │ Subagents    │
├──────────────────────────────────────────────────────────────┤
│                    AI SDK (NARROW WAIST)                     │
│  Provider translation │ Streaming │ Tool calling │ Caching   │
├──────────────────────────────────────────────────────────────┤
│                    MODEL PROVIDERS                           │
│  OpenAI │ Anthropic │ Google │ xAI │ NVIDIA │ via LiteLLM   │
└──────────────────────────────────────────────────────────────┘
```

### Primary Stack
- **Agent Core**: Python 3.11+ (LLM SDK ecosystem dominance)
- **Gateway**: TypeScript (Node 24+) (Full-stack, shared with frontend)
- **Frontend**: React + Vite + [assistant-ui](https://github.com/assistant-ui/assistant-ui) (Reference component library)
- **Database**: SQLite + FTS5 (Local-first, fast checkpoints)
- **Package Manager**: `uv` (Python), `pnpm` workspaces (TypeScript monorepo)
- **Model Router**: LiteLLM (Supports 100+ providers via BaseConfig pattern)

---

## Critical Coding Constraints

Any agent writing code here **MUST** strictly follow these rules:

1. **Prompt Caching is Sacred (Design for Byte-Stability)**
   - Keep volatile parameters (date, time, dynamic context, user queries) at the absolute *tail* of LLM message lists.
   - Put static system instructions, formatting guidelines, and tool schemas at the *head*.
   - Alphabetize tools by name and normalize whitespaces to guarantee cache hits.

2. **Minimize Regex & Deterministic Logic (LLM-First and AST Parsing)**
   - Never use regular expressions to parse LLM outputs, JSON blocks, tool payloads, or markdown enclosures.
   - Use standard parsers (e.g. JSON/JSON5, Python AST) or let the LLM parse/structure data via model-native structured outputs.

3. **Message Role Alternation**
   - Strictly alternate message roles (e.g., `user`, `assistant`, `user`, `assistant`). Never place two messages with the same role in succession.

4. **Budget & Cost Tracking**
   - Track tokens, monetary cost, and iteration loops from step one. Stop execution when limits are hit, allowing exactly one grace call to finalize output if config permits.

5. **Sandbox Isolation**
   - Isolate transient runner directories, test scripts, and scratchpads to a private, git-ignored local folder. Do not pollute the main repository.

---

## Repository Layout (Planned)

```
harness/
  ├── package.json         - Monorepo root config (pnpm workspaces)
  ├── pnpm-workspace.yaml  - Monorepo definition
  ├── apps/
  │   ├── gateway/         - TS-based orchestration gateway
  │   └── web/             - React/Vite + assistant-ui frontend dashboard
  ├── packages/
  │   └── agent-core/      - Python-based agent loop, tool manager, memory providers
  ├── .env.example         - Template environment configuration
  └── agents.md            - This file (context & task tracker)
```

---

## Current Status & Next Steps

| Task | Status | Target | Reference / Action |
|:---|:---:|:---|:---|
| Create project structure | ⏳ Planned | Monorepo layout setup | Use `pnpm` and `uv` |
| Define LiteLLM gateway config | ⏳ Planned | Layer 1 configuration | Map OpenAI API interface |
| Implement Core Agent loop | ⏳ Planned | Layer 2 agent runtime | Python-based while-loop with budget tracking |
| Integrate Memory Provider | ⏳ Planned | SQLite + FTS5 checkpoints | Pluggable SQLite backend |
| Setup Gateway Routing | ⏳ Planned | Layer 3 Node.js Gateway | Webhook and WebSocket session handling |
| Build Web UI Dashboard | ⏳ Planned | Layer 4 React Application | Connect assistant-ui to Node gateway |

---

## Interaction Rules for AI Agents

1. **Check status on startup**: Always read this file ([agents.md](harness/agents.md)) and the project plan before making changes.
2. **Update task lists**: As you complete items listed in "Current Status & Next Steps", mark them as complete and update their status.
3. **Draft plans before writing code**: Create execution plans in `implementation_plan.md` in the current directory or the workspace artifacts when undertaking significant feature builds.
