# 14 — Backend Agent Stack Engineering

## What Was Researched

Backend technology stacks used to build AI agent systems — languages, runtimes, databases, deployment patterns, and infrastructure choices for the server-side of agent harnesses.

## Which Sources Were Used

| Source | Type | URL | Relevance |
|--------|------|-----|-----------|
| Hermes Agent (Python) | Local codebase | https://github.com/NousResearch/hermes-agent | CRITICAL |
| OpenClaw (TypeScript/Node.js) | Local codebase | https://github.com/openclaw/openclaw | CRITICAL |
| Codex (Rust) | Local codebase | https://github.com/openai/codex | CRITICAL |
| Pi (TypeScript) | Local codebase | https://github.com/badlogic/pi-mono | HIGH |
| LangGraph (Python) | Local codebase | https://github.com/langchain-ai/langgraph | HIGH |
| LiteLLM (Python) | Local codebase | https://github.com/BerriAI/litellm | HIGH |
| Open Responses (Go) | Local codebase | https://github.com/open-responses/open-responses | MEDIUM |

## Key Findings

### Language Distribution Across Studied Projects

| Language | Projects | Strengths |
|----------|----------|-----------|
| **Python** | Hermes, LangGraph, LangChain, LiteLLM | Ecosystem (ML libs), rapid prototyping, most LLM SDK support |
| **TypeScript** | OpenClaw, Pi, OpenRouter SDK, assistant-ui | Full-stack (frontend + backend), npm ecosystem, type safety |
| **Rust** | Codex | Performance, memory safety, cross-platform sandboxing |
| **Go** | Open Responses | Simplicity, single-binary deployment, concurrency |

### Backend Architecture Patterns

#### 1. Monolithic Python Agent (Hermes)
- **Runtime**: Python 3.11 + uv package manager
- **Database**: SQLite + FTS5 (session storage, search)
- **State**: In-memory during conversation, SQLite for persistence
- **Deployment**: Direct install, Docker, VM (Modal, Daytona)
- **Files**: `run_agent.py` (246KB), `cli.py` (693KB) — massive monolithic files
- **Tests**: ~1,655 test files (verified 2026-06-23)
- **Key insight**: Python is dominant for agents because the LLM SDK ecosystem is Python-first

#### 2. Gateway-Centric TypeScript (OpenClaw)
- **Runtime**: Node 24+ (recommended) or Node 22.19+
- **Package manager**: pnpm workspace
- **Architecture**: Gateway process manages all sessions, channels, and lifecycle
- **Daemon**: launchd/systemd user service for always-on operation
- **Extensions**: pnpm workspace plugins in `extensions/*`
- **Key insight**: TypeScript enables shared code between backend gateway and frontend apps

#### 3. Modular Rust Crates (Codex)
- **Build**: Cargo workspace with 128 crates
- **Performance**: Near-zero overhead for tool execution
- **Safety**: Compile-time memory safety, no GC pauses
- **Sandboxing**: Native OS sandboxing (Seatbelt, Landlock)
- **Key insight**: Rust is ideal for the sandboxing and tool execution layer

#### 4. LLM Proxy (LiteLLM)
- **Dual layer**: SDK (Python library) + Proxy (HTTP server)
- **Database**: PostgreSQL via Prisma ORM for proxy state
- **Caching**: Redis for response caching
- **Key insight**: Proxy architecture enables centralized model management

### Database Choices

| Project | Primary DB | Use Case |
|---------|-----------|----------|
| Hermes | SQLite + FTS5 | Sessions, search, config |
| LiteLLM Proxy | PostgreSQL (Prisma) | Proxy state, budgets |
| LiteLLM Proxy | Redis | Response caching |
| Open Responses | PostgreSQL + Redis | Responses API state |
| LangGraph | Pluggable checkpointers | State persistence |

### Deployment Patterns

| Pattern | Projects | Description |
|---------|----------|-------------|
| Local install | All | Direct on developer machine |
| Docker | Hermes, OpenClaw, Open Responses | Container-based |
| Daemon/service | OpenClaw | Always-on background service |
| Serverless | Hermes (Modal, Daytona) | Pay-per-use, hibernation |
| CLI binary | Codex, Pi | Single executable |

## What Is Confirmed

1. **Python dominates** for agent logic due to LLM SDK ecosystem
2. **TypeScript dominates** for gateway/frontend due to full-stack capability
3. **SQLite + FTS5** is the right choice for local-first agent storage
4. **PostgreSQL + Redis** is the right choice for multi-user proxy/gateway deployments
5. **Monorepo with workspace packages** is the standard for TypeScript projects (OpenClaw, Pi)
6. **uv** is the modern Python package manager (Hermes uses it extensively)

## What Is Uncertain

- Whether to choose Python or TypeScript for a new harness (Python has ecosystem, TS has full-stack)
- Whether Rust is worth the complexity for non-sandboxing components
- Whether SQLite scales sufficiently for multi-user deployments

## How This Applies to Building a Modern Model-Agnostic Agent Harness

1. **Python for agent core** — LLM SDK ecosystem advantage is decisive
2. **TypeScript for gateway/frontend** — shared types and full-stack capability
3. **SQLite + FTS5 for local storage** — zero-dependency, fast, proven
4. **PostgreSQL + Redis for multi-user** — scale when needed
5. **uv for Python dependency management** — modern, fast, reproducible
6. **Consider monorepo** (pnpm workspace or cargo workspace) for clean package separation
