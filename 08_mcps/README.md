# 08 — MCPs (Model Context Protocol)

## What Was Researched

The Model Context Protocol (MCP) — an open standard for connecting AI agents to external tools and data sources. How MCP is implemented across the studied codebases and its role in agent extensibility.

## Which Sources Were Used

| Source | Type | URL | Relevance |
|--------|------|-----|-----------|
| Hermes Agent (`hermes-agent/tools/mcp_tool.py`, `mcp_serve.py`) | Local codebase | https://github.com/NousResearch/hermes-agent | CRITICAL |
| Codex (`codex/AGENTS.md`) | Local codebase | https://github.com/openai/codex | HIGH |
| OpenClaw MCP docs | Local codebase | https://github.com/openclaw/openclaw | HIGH |
| Model Context Protocol Specification (SEP-1865: MCP Apps & Tasks) [SRC-023] | Online Docs | https://github.com/modelcontextprotocol/specification | CRITICAL |
| CopilotKit Framework [SRC-024] | GitHub Repo | https://github.com/copilotkit/copilotkit | HIGH |
| Vercel AI SDK UI [SRC-025] | Online Docs | https://sdk.vercel.ai/docs/ai-sdk-ui | CRITICAL |
| Mastra AI & mcp-use [SRC-026] | GitHub Repo | https://github.com/mastra-ai/mastra | HIGH |
| LibreChat (`LibreChat/`) | Local codebase | https://github.com/danny-avila/LibreChat | HIGH |
| LibreChat Agents SDK (`librechat-agents/`) | Local codebase | https://github.com/danny-avila/agents | CRITICAL |

## Key Findings

### MCP in Hermes (Most Comprehensive Implementation)

- **`mcp_tool.py`** (202KB) — The largest single tool file. Full MCP client implementation.
- **`mcp_serve.py`** (33KB) — Hermes can also act as an MCP server, exposing its tools to other MCP hosts.
- **`mcp_oauth.py`** (32KB) + **`mcp_oauth_manager.py`** (27KB) — Full OAuth integration for authenticated MCP servers.
- **MCP catalog** — Built-in catalog of MCP servers that can be connected (`optional-mcps/` directory).
- **Dynamic tool discovery** — MCP server tools are discovered at connection time and added to the agent's available tools.
- **Zero permanent core footprint** — MCP tools only appear when an MCP server is connected.

### MCP in Codex

- **First-class support** — MCP is the preferred extensibility mechanism.
- **MCP client built into core** — Not a plugin, but a fundamental capability.
- **Philosophy**: "If the capability genuinely needs to be a tool but isn't core-fundamental, prefer building it as an MCP server."

### MCP in OpenClaw

- **MCP integration** documented as a core feature.
- **Local MCP mode** — Windows Hub supports local MCP connections.

### MCP in LibreChat & Agents SDK

- **Redis-Based Flow Management** — Resolves user-scoped MCP connection status dynamically through stateful flows in a Redis cache (`flowsCache`), mapping client OAuth states to active connection flows [CLAIM-179](../00_index/citation_map.md#claim-179).
- **CSRF Token Binding** — Establishes secure cookie bindings (`OAUTH_CSRF_COOKIE`) to validate the callback browser match and prevent session hijack during cross-origin OAuth callbacks [CLAIM-179](../00_index/citation_map.md#claim-179).
- **Programmatic Handoff Tools** — Generates transfer tools dynamically based on graph edges, routing state changes using LangGraph Command structures (`Command.PARENT`) [CLAIM-185](../00_index/citation_map.md#claim-185).

### Generative UI, MCP Apps, and MCP UI (June 2026)

- **Structured Output Gating**: Enforces component safety using rigid schemas in outbound Responses API calls (`response_format`) [CLAIM-171](../00_index/citation_map.md#claim-171).
- **Isolated Iframe Widgets**: SEP-1865 standardizes rendering of interactive UI widgets served by remote MCP servers inside sandboxed iframes (`sandbox="allow-scripts"`) [CLAIM-174, CLAIM-175].
- **Bi-directional JSON-RPC Sync**: Communication maps interactive iframe buttons and form events to host agent actions via postMessage JSON-RPC [CLAIM-174](../00_index/citation_map.md#claim-174).
- **Stateless Core Tasks**: Transition to a stateless core utilizes the Tasks extension to run client-driven state machines, avoiding socket-connection memory bloat on servers [CLAIM-177, CLAIM-178].

For detailed research, specifications, and TS component registry/iframe hooks, see the dedicated document: **[mcp_apps_and_ui.md](08_mcps/mcp_apps_and_ui.md)**.

### MCP Architecture Pattern

```
┌──────────────────┐
│   Agent Core     │
│                  │
│  ┌────────────┐  │     stdio/SSE/HTTP      ┌──────────────────┐
│  │ MCP Client ├──┼──────────────────────────┤  MCP Server A    │
│  └────────────┘  │                          │  (filesystem)    │
│                  │                          └──────────────────┘
│  ┌────────────┐  │     stdio/SSE/HTTP      ┌──────────────────┐
│  │ MCP Client ├──┼──────────────────────────┤  MCP Server B    │
│  └────────────┘  │                          │  (database)      │
│                  │                          └──────────────────┘
└──────────────────┘
```

### MCP vs Custom Tools

| Aspect | MCP Tools | Custom/Core Tools |
|--------|-----------|-------------------|
| Discovery | Runtime (server announces) | Import-time (registry) |
| Footprint | Zero when disconnected | Always present in schema |
| Isolation | Separate process | In-process |
| Auth | OAuth / API key | Env vars |
| Reusability | Any MCP host | Framework-specific |
| Latency | Higher (IPC) | Lower (in-process) |

## What Is Confirmed

1. **MCP is becoming the standard extensibility mechanism** — all three major projects support it
2. **MCP should be preferred over custom tools** for non-core capabilities (Codex and Hermes both state this explicitly)
3. **Zero permanent footprint** — MCP tools only appear when servers are connected
4. **Bidirectional support** matters — agents should be both MCP clients AND MCP servers (Hermes does both)
5. **OAuth support** is required for production MCP deployments
6. **Generative UI must be gated behind structured schemas and client registries** to prevent injection risks [CLAIM-171, CLAIM-175].
7. **MCP Apps UI (SEP-1865) requires sandboxed iframe containers** communicating via JSON-RPC postMessage [CLAIM-174, CLAIM-175].
8. **Asynchronous loops are modeled via the Tasks extension** rather than stateful connection sockets [CLAIM-177, CLAIM-178].

## What Is Uncertain

- MCP performance overhead for latency-sensitive tools (IPC vs in-process)
- How to handle MCP server availability/reliability in production
- Whether MCP will fully replace custom tool implementations

## How This Applies to Building a Modern Model-Agnostic Agent Harness

1. **Implement MCP client from day one** — the standard extensibility path
2. **Consider MCP server capability** — allows other agents to use your harness's tools
3. **Support OAuth for MCP** — required for authenticated services
4. **Prefer MCP over core tools** for non-fundamental capabilities
5. **Implement MCP server catalog** — curated list of connectable servers
6. **Support sandboxed iframe rendering** for remote MCP server visual tools [CLAIM-175](../00_index/citation_map.md#claim-175).
7. **Adopt client-driven Tasks checkpointing** to support long-running agent threads without bloating sockets [CLAIM-178](../00_index/citation_map.md#claim-178).

