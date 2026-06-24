# Pi Mono — Local Codebase Study

## Repository: `badlogic/pi-mono`
## Local Path: `C:\Users\Adam\Desktop\agent2\pi-mono\`
## Language: TypeScript | License: MIT

## Overview

Minimal, extensible terminal AI coding agent. A monorepo with 4 packages demonstrating the cleanest architectural separation of any framework studied.

## Architecture

### Package Hierarchy
```
packages/
├── ai/              — Multi-provider LLM API (provider abstraction)
├── agent/           — Agent runtime (tool calling, state management)
├── coding-agent/    — Interactive coding agent CLI (application layer)
└── tui/             — Terminal UI (Ink/React)
```

### Three-Layer Separation
1. **AI SDK** (`pi-ai`) — Handles model abstraction, streaming, tool schemas. No agent logic.
2. **Agent Runtime** (`pi-agent-core`) — Agent loop, tool dispatch, state management. No LLM specifics.
3. **Application** (`pi-coding-agent`) — CLI interface, user interaction. No runtime internals.

This is the cleanest architecture studied and should be the reference for new harness design.

## Key Design Principles (from AGENTS.md)

1. **No `any` types** — Strict TypeScript
2. **No inline imports** — Top-level only
3. **Exact dependency pinning** — Supply-chain security
4. **Shrinkwrap** — `npm-shrinkwrap.json` with lifecycle script allowlist
5. **Lockstep versioning** — All packages share one version
6. **No permission system** — Containerization is external
7. **Session sharing** — Publishes sessions to Hugging Face for training data

## Testing Approach
- **Faux provider** — Fake LLM provider for deterministic testing without API costs
- **No full vitest suite** — E2E tests only with explicit env vars
- **`test.sh`** from repo root for non-E2E tests

## Supply-Chain Security Model
- Direct external deps pinned to exact versions
- `npm install --ignore-scripts` (never run lifecycle scripts)
- New deps with lifecycle scripts require explicit allowlist entry
- Pre-commit blocks lockfile commits unless `PI_ALLOW_LOCKFILE_CHANGE=1`

## Relevance to Harness Research
- Reference implementation for: clean package separation (AI → Agent → Application)
- Key patterns to adopt: three-layer architecture, supply-chain hardening, faux provider testing
- Shows that a production coding agent can be built with extreme minimalism
