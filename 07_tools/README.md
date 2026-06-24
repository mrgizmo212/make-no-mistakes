# 07 — Tools

## What Was Researched

Tool systems that enable AI agents to interact with the world — file systems, terminals, browsers, APIs, databases, and external services. How tools are registered, discovered, dispatched, and managed.

## Which Sources Were Used

| Source | Type | URL | Relevance |
|--------|------|-----|-----------|
| Hermes Agent (`hermes-agent/tools/`, `toolsets.py`, `model_tools.py`) | Local codebase | https://github.com/NousResearch/hermes-agent | CRITICAL |
| Codex (`codex/AGENTS.md`) | Local codebase | https://github.com/openai/codex | HIGH |
| OpenRouter SDK (`openrouter-sdk/`) | Local codebase | https://github.com/OpenRouterTeam/typescript-sdk | HIGH |
| OpenClaw tools docs | Local codebase | https://github.com/openclaw/openclaw | HIGH |
| Pi Agent Core | Local codebase | https://github.com/badlogic/pi-mono | MEDIUM |

## Key Findings

### Hermes Tool System (Most Comprehensive)

**87+ tool files** in `tools/` directory. Architecture:

```
tools/registry.py  (no deps — imported by all tool files)
       ↑
tools/*.py  (each calls registry.register() at import time)
       ↑
model_tools.py  (imports tools/registry + triggers tool discovery)
       ↑
run_agent.py, cli.py, batch_runner.py
```

**Registry pattern** (`tools/registry.py`, 25KB):
```python
registry.register(
    name="example_tool",
    toolset="example",
    schema={"name": "example_tool", "description": "...", "parameters": {...}},
    handler=lambda args, **kw: example_tool(param=args.get("param"), task_id=kw.get("task_id")),
    check_fn=check_requirements,  # Availability gate
    requires_env=["EXAMPLE_API_KEY"],  # Required env vars
)
```

**Key tool categories** (by file size, verified 2026-06-23):

| Tool | File Size | Category |
|------|-----------|----------|
| `mcp_tool.py` | 202KB | MCP integration |
| `browser_tool.py` | 170KB | Web browsing |
| `skills_hub.py` | 149KB | Skills marketplace |
| `delegate_tool.py` | 140KB | Subagent delegation |
| `terminal_tool.py` | 122KB | Terminal control |
| `tts_tool.py` | 111KB | Text-to-speech |
| `file_operations.py` | 106KB | File manipulation |
| `process_registry.py` | 91KB | Process management |
| `approval.py` | 89KB | Command approval |
| `file_tools.py` | 81KB | File reading/writing |
| `code_execution_tool.py` | 75KB | Code running |
| `send_message_tool.py` | 75KB | Cross-platform messaging |
| `transcription_tools.py` | 71KB | Audio transcription |
| `vision_tools.py` | 64KB | Image/vision analysis |
| `checkpoint_manager.py` | 62KB | State checkpointing |
| `skills_tool.py` | 62KB | Skill management |
| `browser_supervisor.py` | 62KB | Browser automation |
| `image_generation_tool.py` | 61KB | Image generation |
| `web_tools.py` | 58KB | Web search/fetch |

**Toolset system** (`toolsets.py`, 33KB):
- `_HERMES_CORE_TOOLS` — Default bundle every platform inherits
- Toolsets group tools by purpose (core, browser, coding, messaging, etc.)
- Service-gated tools use `check_fn` to only appear when prerequisites are configured
- Zero footprint when disabled — tools not in active toolset don't appear in API calls

### Hermes Footprint Ladder (Tool Addition Decision)

From the AGENTS.md, ranked by footprint (prefer highest/least-footprint rung):

1. **Extend existing code** — Zero new surface
2. **CLI command + skill** — Zero model-tool footprint
3. **Service-gated tool (`check_fn`)** — Zero footprint when disabled
4. **Plugin** — Lives in `~/.hermes/plugins/`, not core
5. **MCP server** — External, zero permanent core footprint
6. **New core tool** — Last resort, appears on every API call

### OpenRouter SDK Tool Types

Three tool types with Zod-based type safety:
- **Regular tools** — Standard function calling with schema validation
- **Generator tools** — Yield multiple results over time
- **Manual tools** — Full control over tool execution flow

### Codex Tool Philosophy

- **Minimal core tools** — File, terminal, MCP client
- **MCP-first extensibility** — New capabilities via MCP servers
- **10K token output cap** — Forces efficient tool output

## What Is Confirmed

1. **Auto-discovery registry pattern** is the cleanest approach (Hermes: `registry.register()` at import time)
2. **Service-gated tools** (`check_fn`) prevent bloating the tool schema when services aren't configured
3. **Toolsets** allow grouping tools by purpose and platform
4. **Every core tool costs API tokens** — appears on every call, so the bar must be high
5. **MCP is the preferred extensibility path** over custom tool implementations

## What Is Uncertain

- Optimal number of core tools (too few limits capability, too many wastes tokens)
- How to handle tool output size limits (truncation vs. summarization vs. streaming)
- Whether generator/async tools are worth the complexity

## How This Applies to Building a Modern Model-Agnostic Agent Harness

1. **Implement an auto-discovery tool registry** — tools register at import, no manual wiring
2. **Use service gates (`check_fn`)** — tools only appear when their prerequisites are met
3. **Follow the Footprint Ladder** — resist adding core tools, prefer skills → plugins → MCP
4. **Implement toolsets** — group tools by purpose, allow per-session toolset configuration
5. **Cap tool output size** — prevent context explosion from verbose tool results
6. **All tool handlers must return JSON strings** — consistent serialization format
