# Hermes Agent — Local Codebase Study

## Repository: `NousResearch/hermes-agent`
## Local Path: `C:\Users\Adam\Desktop\agent2\hermes-agent\`
## Language: Python | License: MIT

## Overview

Hermes is the most feature-complete open-source personal AI agent studied. It runs the same agent core across CLI, TUI, Electron desktop, and messaging gateway (20+ platforms). Key differentiator: it **learns across sessions** (memory + skills), delegates to subagents, runs scheduled jobs, and drives a real terminal and browser.

## Architecture

### Core Files (by size, verified 2026-06-23)
- `cli.py` — ~693KB, HermesCLI class, interactive CLI orchestrator
- `run_agent.py` — ~246KB, AIAgent class, core conversation loop
- `hermes_state.py` — ~222KB, SessionDB, SQLite session store with FTS5

### Tool System (87 files)
Top tools by complexity (file size, verified 2026-06-23):
- `mcp_tool.py` (202KB) — MCP client/server
- `browser_tool.py` (170KB) — Web browsing
- `skills_hub.py` (149KB) — Skills marketplace
- `delegate_tool.py` (140KB) — Subagent delegation
- `terminal_tool.py` (122KB) — Terminal control (7 backends: docker, singularity, modal, managed_modal, daytona, local, ssh)
- `tts_tool.py` (111KB) — Text-to-speech
- `file_operations.py` (106KB) — File manipulation

### Plugin System (3 surfaces)
1. **General plugins** — `register(ctx)` with lifecycle hooks
2. **Memory providers** — MemoryProvider ABC (8 built-in)
3. **Model providers** — ProviderProfile registration

### Skills System
- 18 built-in skill categories (apple, computer-use, creative, data-science, email, github, media, mlops, note-taking, productivity, research, smart-home, social-media, software-development, etc.)
- Autonomous skill creation from experience
- Skills Hub marketplace integration

## Key Design Principles (from AGENTS.md)

1. **Prompt caching is sacred** — System prompt must be byte-stable for conversation lifetime
2. **Narrow core, capability at edges** — Footprint Ladder for tool additions
3. **Skills as user messages** — Preserve prompt cache
4. **Message role alternation** — Never two same-role messages in a row
5. **Plugins MUST NOT modify core files**

## Test Suite
- ~1,655 test files (`test_*.py` + `*_test.py` pattern, verified 2026-06-23)
- E2E validation preferred over unit mocks

## Relevance to Harness Research
- Reference implementation for: agent loop, tool registry, skills system, memory system, plugin architecture, subagent delegation, prompt caching preservation
- Key patterns to adopt: MemoryProvider ABC, auto-discovery registry, Footprint Ladder, budget tracking with grace call
