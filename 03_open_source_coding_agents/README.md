# 03 — Open-Source Coding Agents

## What Was Researched

AI agents specifically designed for code generation, editing, debugging, and software engineering tasks. These are the most mature and commercially viable category of AI agents as of June 2026.

## Which Sources Were Used

| Source | Type | URL | Relevance |
|--------|------|-----|-----------|
| Codex (`codex/`) | Local codebase | https://github.com/openai/codex | CRITICAL |
| Pi Coding Agent (`pi-mono/packages/coding-agent/`) | Local codebase | https://github.com/badlogic/pi-mono | CRITICAL |
| Hermes Agent (`hermes-agent/`) | Local codebase | https://github.com/NousResearch/hermes-agent | HIGH |
| OpenClaw (`openclaw/`) | Local codebase | https://github.com/openclaw/openclaw | MEDIUM |

## Key Findings

### Coding Agent Architecture Patterns

#### 1. Codex (openai/codex) — Rust, 128 crates
- **Strictest context management**: 10K token cap per tool output. Forces structured, efficient context use.
- **AGENTS.md convention**: Every project provides instructions the agent reads at start. This has become an industry standard.
- **Cross-platform sandboxing**: macOS Seatbelt profiles, Linux Landlock, Docker containers. The agent runs with restricted permissions by default.
- **MCP-first extensibility**: New tools arrive via MCP servers, not core code changes.
- **File-watching**: Monitors workspace for changes, integrates with the conversation.

#### 2. Pi Coding Agent (`@badlogic/pi-coding-agent`) — TypeScript
- **Minimal design**: Built on pi-agent-core + pi-ai. Three-layer clean architecture.
- **Containerization options**: Gondolin (host pi + VM tools), plain Docker, OpenShell sandbox.
- **Supply-chain security**: Exact pinned deps, shrinkwrap, CI audits, lifecycle script allowlists.
- **Session sharing**: Publishes sessions to Hugging Face for community model training.
- **Faux provider testing**: Test suite uses a fake LLM provider for deterministic testing without API costs.

#### 3. Hermes as Coding Agent
- **87+ tool files** in `tools/` directory — file operations, terminal, code execution, browser, MCP, and more.
- **Delegate tool** (`delegate_tool.py`, 140KB) — Spawns subagents for parallel coding workstreams.
- **File operations** (`file_operations.py`, 106KB; `file_tools.py`, 81KB) — Comprehensive file manipulation.
- **Terminal tool** (`terminal_tool.py`, 122KB) — Full terminal control with 7 backends.
- **Checkpoint system** (`checkpoint_manager.py`, 64KB) — Saves agent state for recovery.
- **Code execution** (`code_execution_tool.py`, 77KB) — Sandboxed code running.

### Common Patterns Across Coding Agents

| Feature | Codex | Pi | Hermes |
|---------|-------|-----|--------|
| AGENTS.md support | ✅ Creator | ✅ | ✅ |
| Sandboxing | ✅ Multi-platform | ✅ External | ✅ 7 backends |
| MCP support | ✅ First-class | ❌ | ✅ |
| Subagent delegation | ❌ | ❌ | ✅ |
| Skills system | ❌ | ❌ | ✅ |
| File editing | ✅ | ✅ | ✅ |
| Terminal control | ✅ | ✅ | ✅ |
| Context management | ✅ 10K cap | ✅ | ✅ Compression |

## What Is Confirmed

1. **AGENTS.md is the universal context file convention** for coding agents
2. **Sandboxing is non-negotiable** for production coding agents — all three implement it
3. **File + terminal tools** are the minimum viable toolset for a coding agent
4. **Context management** is a key differentiator — Codex's strict 10K cap vs. Hermes's compression approach
5. **TypeScript and Rust** are the preferred languages for coding agent implementations (not Python, despite LLM SDK dominance)

## What Is Uncertain

- Optimal context window management strategy for code editing (strict cap vs. dynamic compression)
- Whether MCP will fully replace custom tool implementations
- How to handle multi-file refactoring across large codebases within context limits

## How This Applies to Building a Modern Model-Agnostic Agent Harness

1. **Implement AGENTS.md support** as a core feature — the harness should read and respect project-level instructions
2. **Design sandboxing as a first-class concern**, not an afterthought — support multiple backends (Docker, VM, native OS)
3. **Context management discipline** — implement both hard caps (Codex-style) and smart compression (Hermes-style)
4. **File + terminal + code execution** are the minimum tool triad for any coding-capable agent
5. **Subagent delegation** (Hermes pattern) enables parallel coding workflows and should be considered for complex tasks
