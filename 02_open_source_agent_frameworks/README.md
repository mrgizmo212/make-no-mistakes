# 02 — Open-Source Agent Frameworks

## What Was Researched

Full-stack frameworks that provide opinionated architectures for building AI agents — complete with agent loops, state management, tool orchestration, persistence, and deployment infrastructure. Distinguished from SDKs (01) by providing a full architecture rather than just components.

## Which Sources Were Used

| Source | Type | URL | Relevance |
|--------|------|-----|-----------|
| LangGraph (`langgraph/`) | Local codebase | https://github.com/langchain-ai/langgraph | CRITICAL |
| Hermes Agent (`hermes-agent/`) | Local codebase | https://github.com/NousResearch/hermes-agent | CRITICAL |
| OpenClaw (`openclaw/`) | Local codebase | https://github.com/openclaw/openclaw | CRITICAL |
| Pi Agent Core (`pi-mono/packages/agent/`) | Local codebase | https://github.com/badlogic/pi-mono | HIGH |
| Codex (`codex/`) | Local codebase | https://github.com/openai/codex | CRITICAL |
| LibreChat (`LibreChat/`) | Local codebase | https://github.com/danny-avila/LibreChat | HIGH |
| LibreChat Agents SDK (`librechat-agents/`) | Local codebase | https://github.com/danny-avila/agents | CRITICAL |

## Key Findings

### 1. LangGraph (`langchain-ai/langgraph`)

**Language**: Python (+ JS via LangGraphJS) | **License**: MIT | **Architecture**: Graph-based state machine

The dominant open-source agent orchestration framework (June 2026). Core concepts:

- **Graph-based orchestration** — Agents are defined as directed graphs (nodes = functions, edges = transitions). Inspired by Google's Pregel and Apache Beam.
- **Durable execution** — Agents persist through failures and resume from exactly where they left off. Built-in checkpointing at every graph node.
- **Human-in-the-loop** — First-class interrupts that allow inspecting and modifying agent state at any point.
- **Comprehensive memory** — Short-term working memory (per-conversation) + long-term persistent memory (cross-session).
- **Subgraphs** — Composable graph nesting for multi-agent architectures.
- **Deep Agents** — Higher-level package for agents with planning, subagents, and filesystem capabilities.
- **LangSmith integration** — Observability, debugging, evaluation, and deployment.

**Key architectural pattern**: State is a first-class citizen. Every node receives and returns state. State transitions are explicit graph edges. This makes the agent loop inspectable, debuggable, and interruptible at every step.

**Production users**: Klarna, Replit, Elastic (per README).

### 2. Hermes Agent (`NousResearch/hermes-agent`)

**Language**: Python | **License**: MIT | **Architecture**: Monolithic agent with plugin system

The most feature-complete open-source personal AI agent (June 2026):

- **Learning loop** — Creates skills from experience, improves them during use, nudges itself to persist knowledge, searches past conversations (FTS5), builds user model (Honcho dialectic).
- **Multi-platform** — CLI, TUI (Ink/React), Electron desktop, messaging gateway (Telegram, Discord, Slack, WhatsApp, Signal + 20 more).
- **Plugin system** — Three plugin surfaces: general plugins (`register(ctx)`), memory-provider plugins (MemoryProvider ABC), model-provider plugins (`ProviderProfile`).
- **Subagents** — Spawns isolated subagents for parallel workstreams. Python scripts call tools via RPC.
- **Scheduled automation** — Built-in cron scheduler with platform delivery. Natural language scheduling.
- **Seven terminal backends** — Local, Docker, SSH, Singularity, Modal, Managed Modal, Daytona.
- **87 tools** — Browser, file operations, code execution, MCP, terminal, vision, TTS, image generation, web search, session search, and more.
- **Model-agnostic** — OpenRouter (200+ models), Nous Portal, OpenAI, Anthropic, NVIDIA NIM, multiple Chinese providers, or custom endpoints.

**Key architectural patterns**:
1. **Prompt caching is sacred** — System prompt must be byte-stable for conversation lifetime. No mid-conversation toolset swaps.
2. **Narrow core, capability at edges** — "Footprint Ladder": extend existing code → CLI + skill → service-gated tool → plugin → MCP server → core tool (last resort).
3. **Skills as procedural memory** — Skills are SKILL.md files that the agent creates, improves, and shares. Compatible with agentskills.io open standard.

### 3. OpenClaw (`openclaw/openclaw`)

**Language**: TypeScript (Node.js) | **License**: MIT | **Architecture**: Gateway-centric personal assistant

Personal AI assistant with the broadest channel support:

- **Gateway architecture** — Single control plane for sessions, channels, tools, and events. The Gateway IS the product.
- **26+ channels** — WhatsApp, Telegram, Slack, Discord, Google Chat, Signal, iMessage, IRC, Teams, Matrix, Feishu, LINE, and more.
- **Multi-agent routing** — Route inbound channels/accounts to isolated agents with separate workspaces and sessions.
- **Voice Wake + Talk Mode** — Wake words on macOS/iOS, continuous voice on Android.
- **Live Canvas** — Agent-driven visual workspace with A2UI (Agent-to-UI).
- **Companion apps** — Windows Hub, macOS menu bar, iOS/Android nodes.
- **Sandbox system** — Docker, SSH, OpenShell backends. Per-session sandbox policy.
- **Skills** — Workspace skills with SKILL.md format, ClawHub registry.
- **Context files** — AGENTS.md, SOUL.md, TOOLS.md injected into every conversation.

**Key architectural pattern**: Gateway-centric design where the gateway manages all state, routing, and lifecycle. Companion apps are thin clients that connect via WebSocket. This is the opposite of Hermes's monolithic approach — OpenClaw is fundamentally distributed.

### 4. Pi Agent (`badlogic/pi-mono`)

**Language**: TypeScript | **License**: MIT | **Architecture**: Minimal monorepo

Deliberately minimal agent harness:

- **Three-package architecture**: `pi-ai` (LLM abstraction) → `pi-agent-core` (agent runtime) → `pi-coding-agent` (CLI application)
- **No permission system** — Runs with user's permissions. Containerization is external (Gondolin VM, Docker, OpenShell).
- **Supply-chain hardening** — Pinned exact versions, shrinkwrap, lifecycle script allowlist, CI audits.
- **Session sharing** — `pi-share-hf` publishes sessions to Hugging Face for community training data.

**Key architectural pattern**: Extreme minimalism. The smallest footprint of any framework studied. Shows that a production-quality coding agent can be built with ~1000 files and three focused packages.

### 5. Codex (`openai/codex`)

**Language**: Rust | **License**: Apache-2.0 | **Architecture**: Modular crate system

OpenAI's open-source agentic coding CLI (studied in `16_local_codebase_studies/codex/`):

- **128 Rust crates** — Most modular architecture studied. Each concern is a separate crate.
- **AGENTS.md convention** — Canonical context file format that the agent reads at conversation start.
- **Cross-platform sandboxing** — macOS Seatbelt, Linux Landlock, Docker. Strict security by default.
- **10K token context cap** — Forces context management discipline. No "dump everything in the prompt" anti-pattern.
- **MCP first-class** — Built-in MCP client for tool extensibility.

### 6. LibreChat & LibreChat Agents SDK (`danny-avila/agents`)

**Language**: TypeScript | **License**: MIT | **Architecture**: Graph-based multi-agent state machines

A production-grade implementation of LangGraph JS/TS for multi-agent loops and tool handoffs:
- **Command-Based Multi-Agent Routing** — Outgoing handoff edges compile to transfer tools (e.g. `transfer_to_expert`) that return a LangGraph `Command` to update parent state graphs (`graph: Command.PARENT`) [CLAIM-185].
- **Handoff Reception Filtering** — Filters out transfer messages when receiving a handoff so the destination agent gets a clean context and doesn't terminate prematurely [CLAIM-186].
- **Multi-Tenant MCP Isolation** — Routes user-scoped MCP servers using stateful Redis flow managers and secure CSRF-binding cookies (`OAUTH_CSRF_COOKIE`) to handle SSE/chat client authentication callbacks [CLAIM-179].

## What Is Confirmed

1. **Two architectural camps**: Graph-based (LangGraph) vs. loop-based (Hermes, Pi, Codex). Both are production-proven.
2. **Skills/SKILL.md is an emerging standard** — Hermes, OpenClaw, and the agentskills.io standard all converge on SKILL.md.
3. **AGENTS.md is the context file convention** — Codex, Hermes, OpenClaw, Pi all use it.
4. **Gateway architecture** works for multi-platform agents (OpenClaw proves this at 26+ channels).
5. **Plugin systems are essential** — Every mature framework (Hermes, OpenClaw, LangGraph) has one.
6. **Prompt caching preservation** is a critical design constraint (Hermes documents this explicitly).

## What Is Uncertain

- Whether graph-based (LangGraph) or loop-based (Hermes/Pi) is better for a new harness
- Whether to build a monolithic agent (Hermes) or gateway-centric distributed system (OpenClaw)
- The right level of sandboxing granularity for a general-purpose harness

## How This Applies to Building a Modern Model-Agnostic Agent Harness

1. **Adopt SKILL.md and AGENTS.md conventions** — they're the emerging open standards
2. **Design a plugin system from day one** — every mature framework needs one
3. **Protect prompt caching** — Hermes's "sacred cache" principle should be a core architectural constraint
4. **Consider graph-based state management** for complex multi-step workflows (LangGraph's approach)
5. **Support multiple terminal backends** — Docker, SSH, and serverless (Hermes proves the value)
6. **Gateway pattern** is the right architecture for multi-channel agent deployment
