# Local Codebase Study: Codex

## What Was Researched

Architecture and implementation of Codex (openai/codex) — OpenAI's open-source agentic coding CLI. Built primarily in Rust with a monorepo containing 128 crates (verified 2026-06-23). Supports CLI, desktop app, and IDE integration. Uses AGENTS.md for context, MCP for tools, and implements sophisticated sandboxing across macOS, Linux, and Windows.

## Which Sources Were Used

- Local clone: `c:\Users\Adam\Desktop\agent2\codex`
- Files analyzed: `AGENTS.md`, `README.md`, `codex-rs/Cargo.toml`, `codex-rs/core/README.md`, `codex-rs/core/Cargo.toml`, directory structure of `codex-rs/`, `codex-cli/`, `sdk/`, `docs/`

## Key Findings

### Architecture Overview

- **Monorepo**: ~5,190 files across `codex-rs/` (Rust core), `codex-cli/` (Node.js CLI wrapper), `sdk/` (TypeScript SDK)
- **Build System**: Dual Bazel + Cargo builds, with `justfile` commands for developer workflow
- **128 Rust crates** in workspace (verified: 128 `Cargo.toml` files) — massive, highly modular architecture
- **Multi-platform support**: macOS (Seatbelt), Linux (Bubblewrap/Landlock), Windows (restricted tokens)

### Rust Crate Architecture (codex-rs/)

Key crates organized by function:

**Core Agent Loop:**
- `core/` — Business logic, agent loop, context management, session handling
- `core-api/` — Public API types for the core
- `core-plugins/` — Plugin system
- `core-skills/` — Built-in skills
- `protocol/` — Communication protocol definitions

**Model & Provider:**
- `model-provider/` — Model provider abstraction layer
- `model-provider-info/` — Provider metadata
- `models-manager/` — Model lifecycle management
- `ollama/` — Ollama integration
- `lmstudio/` — LM Studio integration
- `chatgpt/` — ChatGPT backend integration

**Tool System:**
- `tools/` — Tool definitions and execution
- `codex-mcp/` — MCP (Model Context Protocol) integration
- `mcp-server/` — MCP server implementation
- `rmcp-client/` — Remote MCP client
- `exec/` — Command execution
- `exec-server/` — Execution server
- `shell-command/` — Shell command handling
- `apply-patch/` — File patching tool
- `file-search/` — File search tool

**Sandboxing (Critical Feature):**
- `sandboxing/` — Cross-platform sandbox abstraction
- `linux-sandbox/` — Linux-specific (Bubblewrap + Landlock)
- `bwrap/` — Bubblewrap wrapper
- `windows-sandbox-rs/` — Windows restricted token sandbox
- `execpolicy/` — Execution policy engine
- `process-hardening/` — Process-level security

**Memory & State:**
- `memories/` — Memory system
- `message-history/` — Conversation history
- `thread-store/` — Thread persistence
- `state/` — State management
- `agent-graph-store/` — Graph-based agent state

**UI:**
- `tui/` — Terminal UI (ratatui-based)
- `cli/` — CLI argument parsing

**App Server:**
- `app-server/` — App server for desktop/IDE
- `app-server-protocol/` — JSON-RPC v2 protocol
- `app-server-client/` — Client library
- `app-server-daemon/` — Background daemon
- `app-server-transport/` — Transport layer

**Infrastructure:**
- `config/` — Configuration management
- `connectors/` — External service connectors
- `hooks/` — Lifecycle hooks
- `otel/` — OpenTelemetry observability
- `analytics/` — Analytics
- `secrets/` — Secret management

### AGENTS.md Pattern (Most Influential)

Codex popularized (or at least heavily promoted) the `AGENTS.md` convention:
- A repository-level context file that tells the agent about the codebase
- Contains coding conventions, test patterns, build commands, architectural decisions
- Read at session start to provide workspace context
- Already adopted by other projects (LiteLLM has `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`)

### Model Context System

Critical design decisions for model-visible context:
1. **No history rewrite** — context builds incrementally only
2. **Avoid frequent context changes** — minimize cache misses
3. **No unbounded items** — hard caps on everything
4. **10K token cap per item** — strict size limits
5. **ContextualUserFragment trait** — all context items implement this trait

### App-Server Protocol (v2)

- JSON-RPC 2.0 based protocol for IDE ↔ Codex communication
- Resource/method pattern: `thread/read`, `app/list`
- Cursor pagination: `cursor` + `limit` / `data` + `next_cursor`
- TypeScript type generation from Rust structs via `ts-rs`
- Experimental API gating with `#[experimental("method/or/field")]`

### Key Design Principles from AGENTS.md

- Modules under 500 LoC (800 max), prefer new modules over growing existing ones
- Resist adding code to `codex-core` — it's already too large
- Integration tests preferred over unit tests for agent logic
- `#[tracing::instrument(...)]` for async observability
- No `#[async_trait]` — use native RPITIT with explicit `Send` bounds
- Exhaustive `match` statements, no wildcards

## What Is Confirmed

- Repository cloned successfully (5,190 files)
- 128 Rust crates in workspace verified (128 `Cargo.toml` files)
- Multi-platform sandbox support confirmed (macOS/Linux/Windows)
- AGENTS.md is 22KB — comprehensive project context document
- Uses MCP for tool integration
- Bazel + Cargo dual build system
- gpt-5.1 and gpt-5.2 prompt files exist in core/ (model-specific prompts)

## What Is Uncertain

- How the model-provider abstraction handles non-OpenAI models in practice
- Whether the agent loop architecture can be extracted independently of the Codex-specific UI
- How the plugin system (`core-plugins/`) works and how extensible it is
- What the `skills/` crate contains vs. MCP tools vs. core tools
- Whether the `v8-poc/` crate indicates plans for JavaScript-based extensions
- How the `agent-graph-store` relates to conversation memory

## How This Applies to Building a Modern Model-Agnostic Agent Harness

Codex is the **most architecturally relevant** reference for building a model-agnostic agent harness:

1. **Crate Architecture Model**: The 128-crate workspace is the gold standard for modular agent design. Each concern (sandboxing, tools, MCP, memory, model providers) is isolated with clear API boundaries
2. **Sandboxing**: The cross-platform sandboxing system (Seatbelt/Bubblewrap/Windows restricted tokens) is the most sophisticated in any open-source agent
3. **AGENTS.md Convention**: This pattern should be adopted directly in the harness
4. **Context Management**: The strict rules (no rewrite, bounded items, 10K cap) provide a battle-tested model for context window management
5. **MCP Integration**: First-class MCP support with `codex-mcp`, `mcp-server`, and `rmcp-client` — demonstrates how to integrate the MCP ecosystem
6. **App-Server Protocol**: The JSON-RPC v2 protocol for IDE integration is a reference for harness ↔ frontend communication
7. **Model Provider Abstraction**: Has both OpenAI (ChatGPT) and local model (Ollama, LM Studio) support — model-agnostic pattern
8. **Skills System**: The `core-skills/` crate suggests a skills-based extensibility model
9. **Memory Architecture**: Separate `memories/`, `message-history/`, and `thread-store/` crates show thoughtful memory decomposition
10. **Anti-Pattern to Watch**: `codex-core` is explicitly called out as too large — proves even well-architected projects can suffer from "core crate bloat"

### Relevance Score: CRITICAL — primary reference for agent harness architecture
