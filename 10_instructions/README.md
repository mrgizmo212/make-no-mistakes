# 10 — Instructions (AGENTS.md / Context Files)

## What Was Researched

Instruction files that provide project-level and workspace-level context to AI agents — how agents receive, parse, and respect project-specific rules, conventions, and constraints.

## Which Sources Were Used

| Source | Type | URL | Relevance |
|--------|------|-----|-----------|
| Codex (`codex/AGENTS.md`) | Local codebase | https://github.com/openai/codex | CRITICAL |
| Hermes Agent (`hermes-agent/AGENTS.md`) | Local codebase | https://github.com/NousResearch/hermes-agent | CRITICAL |
| OpenClaw (`openclaw/`) — AGENTS.md, SOUL.md, TOOLS.md | Local codebase | https://github.com/openclaw/openclaw | HIGH |
| Pi (`pi-mono/AGENTS.md`) | Local codebase | https://github.com/badlogic/pi-mono | HIGH |
| LangChain (`langchain/AGENTS.md`) | Local codebase | https://github.com/langchain-ai/langchain | MEDIUM |

## Key Findings

### AGENTS.md — The Universal Convention

Every studied codebase with an agent context file uses `AGENTS.md`. This has become the de facto standard for providing project-level instructions to AI agents.

**Codex** (creator of the convention):
- Reads AGENTS.md at conversation start
- Hierarchical: root AGENTS.md + subdirectory AGENTS.md files
- Mandates strict rules: no file rewriting, 10K token cap, sandboxing
- 22KB in the Codex repo itself

**Hermes** (71KB AGENTS.md — the most comprehensive):
- Development guide, contribution rubric, architecture overview
- Footprint Ladder for tool addition decisions
- Plugin system documentation
- Slash command registry
- Config loader documentation
- Test philosophy

**Pi** (11KB AGENTS.md):
- Conversational style rules
- Code quality standards
- Dependency security rules
- Git workflow (multi-session safety)
- Testing rules
- Release process

**LangChain** (15KB AGENTS.md):
- Also has CLAUDE.md (identical content) — supports both conventions

### Context File Hierarchy

| File | Purpose | Used By |
|------|---------|---------|
| `AGENTS.md` | Project instructions for AI agents | Codex, Hermes, Pi, LangChain, OpenClaw |
| `CLAUDE.md` | Same purpose, Anthropic convention | LangChain, LiteLLM, OpenRouter SDK |
| `SOUL.md` | Agent persona/identity | OpenClaw, Hermes (migration) |
| `TOOLS.md` | Tool-specific instructions | OpenClaw |

### Injection Patterns

1. **System prompt injection** (Codex, OpenClaw) — AGENTS.md content goes into system message
2. **User message injection** (Hermes for skills) — Preserves prompt cache
3. **Hierarchical merging** (Codex) — Root + subdirectory AGENTS.md files merged

## What Is Confirmed

1. **AGENTS.md is the universal standard** — 5 of 6 studied codebases use it
2. **CLAUDE.md is a secondary convention** — some projects support both
3. **Hierarchical context** (root + subdirectory) enables project-specific instructions
4. **SOUL.md for persona** is a useful separate file (OpenClaw's approach)
5. **Context files should be read-only** — the agent reads but does not modify them

## What Is Uncertain

- Whether AGENTS.md should go in system prompt or user message
- How to handle conflicting instructions between root and subdirectory AGENTS.md
- Maximum practical size for context files (Hermes's 71KB is very large)

## How This Applies to Building a Modern Model-Agnostic Agent Harness

1. **Support AGENTS.md** — read at conversation start, inject into context
2. **Support CLAUDE.md** as a fallback/alias
3. **Implement hierarchical context** — root + subdirectory merging
4. **Consider SOUL.md** for agent persona configuration
5. **Keep context files read-only** from the agent's perspective
