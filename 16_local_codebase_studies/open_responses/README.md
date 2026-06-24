# Local Codebase Study: Open Responses

## What Was Researched

Architecture and implementation of Open Responses (open-responses/open-responses) — a self-hosted, drop-in replacement for OpenAI's Responses API. Built by the Julep AI team, it enables any LLM provider (Claude, Qwen, Deepseek, Ollama, etc.) to be used with existing OpenAI Agents SDK code without modification.

## Which Sources Were Used

- Local clone: `c:\Users\Adam\Desktop\agent2\open-responses`
- Files analyzed: `README.md`, `CLAUDE.md`, `CLI.md`, `main.go`, `open_responses/__init__.py`, `package.json`, `pyproject.toml`, `go.mod`

## Key Findings

### Architecture

- **Hybrid Go/Python/Node.js project**: The core server is implemented as a single `main.go` file (~80KB), with Python and Node.js wrappers for distribution via `pip` and `npm`
- **Docker Compose orchestration**: The runtime deploys an API server, database, and management UI as containerized services
- **Configuration**: Uses `open-responses.json` to track setup state, supporting both camelCase and snake_case for backward compatibility
- **CLI-first design**: CLI built with Go's Cobra framework, all Docker Compose commands proxied through it (up, down, logs, ps, exec, etc.)
- **Code navigation**: Uses marker comment system (`CLAUDE-{type}-{descriptor}`) for navigating the large `main.go` file — interesting pattern for large single-file codebases

### API Compatibility Layer

- Implements OpenAI's **Responses API** endpoints — the newer, agentic-first API that replaces Chat Completions for agent workflows
- Supports: web search, file search, computer use (built-in tools)
- Drop-in compatible with `openai` Python/JS SDK — just change `base_url` to `http://localhost:8080/`
- Works with OpenAI's official **Agents SDK** via `set_default_openai_client()`

### Multi-Provider Support

- Models addressed via provider-prefixed strings: `openrouter/deepseek/deepseek-r1`, `anthropic/claude-3`, etc.
- Environment variables for multiple providers: `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `OPENROUTER_API_KEY`, etc.
- Rate limiting, request timeout, and payload size controls built in

### Distribution Strategy

- **npm**: `npx -y open-responses init` (primary recommended path)
- **pip**: `uvx open-responses init`
- **Docker**: Pre-built images on Docker Hub (`julepai/*`)
- Python wrapper (`open_responses/__init__.py`) simply shells out to a platform-specific binary — the Go binary is the actual runtime

### Key Architectural Decisions

1. **Single-binary Go core** — entire server in one `main.go` (80KB) rather than a modular Go package structure
2. **Docker Compose V1/V2 compatibility** — auto-detects and abstracts both formats
3. **Multi-location config search** — current dir → parent dir → git root
4. **Thin language wrappers** — Python/Node packages are just binary launchers, no native reimplementation

## What Is Confirmed

- Repository successfully cloned
- Hybrid Go/Python/Node.js architecture verified
- OpenAI Responses API compatibility confirmed
- Julep AI is the parent project

## What Is Uncertain

- How the Go server translates between Responses API format and different provider formats internally (main.go is very large)
- Whether streaming is fully supported across all providers
- Performance characteristics vs. direct provider access
- Completeness of Responses API coverage (web search, file search, computer use)
- Whether it supports the OpenAI Realtime API in addition to Responses

## How This Applies to Building a Modern Model-Agnostic Agent Harness

Open Responses is directly relevant to harness design in several ways:

1. **API Compatibility Pattern**: Demonstrates how to build a self-hosted API-compatible proxy — a core concern for model-agnostic harnesses that need to work with existing SDKs
2. **Responses API as Target**: The shift from Chat Completions to Responses API for agent workflows is a significant trend. The harness should consider Responses API as a first-class interface
3. **Multi-Provider Configuration**: The environment variable + config file approach for managing multiple provider keys is a practical reference
4. **Distribution Model**: The hybrid Go binary + thin language wrappers is an interesting cross-platform distribution strategy worth studying
5. **CLI-First UX**: The setup wizard and Docker Compose abstraction provide a reference for how agent harnesses might handle deployment
6. **Single-File Monolith Warning**: The 80KB `main.go` shows what happens when architecture isn't modularized from the start — a pattern to avoid

### Relevance Score: HIGH (especially for API compatibility layer and multi-provider routing)
