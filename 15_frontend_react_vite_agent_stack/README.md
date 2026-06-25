# 15 — Frontend / React+Vite Agent Stack

## What Was Researched

Frontend technologies used to build AI agent user interfaces — chat UIs, terminal UIs, dashboard UIs, and companion apps. Focus on React, Vite, and modern web frameworks.

## Which Sources Were Used

| Source | Type | URL | Relevance |
|--------|------|-----|-----------|
| assistant-ui (`assistant-ui/`) | Local codebase | https://github.com/assistant-ui/assistant-ui | CRITICAL |
| Hermes Agent (ui-tui, apps/desktop, web) | Local codebase | https://github.com/NousResearch/hermes-agent | CRITICAL |
| OpenClaw (Control UI, companion apps) | Local codebase | https://github.com/openclaw/openclaw | HIGH |
| Codex Desktop App | Standalone App | https://openai.com/codex-desktop-app | HIGH [CLAIM-158](../00_index/citation_map.md#claim-158) |
| GitHub Copilot Agent Mode in VS Code | IDE Extension | https://code.visualstudio.com/docs/copilot/agent-mode | HIGH [CLAIM-161](../00_index/citation_map.md#claim-161) |
| Cursor Composer & Agent Mode | IDE Editor | https://cursor.sh/docs/composer | HIGH [CLAIM-164](../00_index/citation_map.md#claim-164) |
| Google Antigravity | IDE & App | https://antigravity.google/docs | HIGH [CLAIM-166](../00_index/citation_map.md#claim-166) |
| Model Context Protocol Spec | Protocol Spec | https://github.com/modelcontextprotocol/specification | HIGH [CLAIM-174](../00_index/citation_map.md#claim-174) |
| CopilotKit (AG-UI) | React Framework | https://github.com/copilotkit/copilotkit | HIGH [CLAIM-173](../00_index/citation_map.md#claim-173) |
| Vercel AI SDK | React SDK | https://sdk.vercel.ai/docs/ai-sdk-ui | HIGH [CLAIM-172](../00_index/citation_map.md#claim-172) |
| Mastra & mcp-use | TS Frameworks | https://github.com/mastra-ai/mastra | HIGH [CLAIM-176](../00_index/citation_map.md#claim-176) |
| LibreChat Client | Local codebase | https://github.com/danny-avila/LibreChat | HIGH |

## Key Findings

### assistant-ui (`assistant-ui/assistant-ui`)

**The reference React component library for AI chat UIs** (3,636 files):

- **`@assistant-ui/react`** — Core React components for AI chat interfaces
- **Headless architecture** — Components provide behavior, styling is fully customizable
- **Streaming support** — Token-level streaming with optimistic UI updates
- **Tool calls** — Renders tool invocations and results inline
- **Branching** — Conversation branching for exploring alternatives
- **Runtime adapters** — Connect to any AI backend (OpenAI, Vercel AI SDK, LangChain, custom)
- **Thread management** — Multi-conversation support
- **Attachments** — File upload and inline media
- **Used by**: Hermes desktop app (Electron + React + @assistant-ui/react)

### Hermes Frontend Stack

Three distinct frontends:

#### 1. Classic CLI (prompt_toolkit)
- **Rich** for banner/panels
- **prompt_toolkit** for input with autocomplete
- **KawaiiSpinner** — Animated faces during API calls

#### 2. TUI (Ink / React in Terminal)
- **Ink** — React renderer for the terminal (TypeScript)
- **JSON-RPC over stdio** — Communication between Node.js TUI and Python backend
- **Full React component architecture** in the terminal
- **Components**: `messageLine.tsx`, `thinking.tsx`, `prompts.tsx`, `sessionPicker.tsx`
- **Theming**: `theme.ts` + skin engine
- **Embeddable**: Dashboard embeds the TUI via PTY bridge

#### 3. Desktop (Electron + React)
- **Electron** — Native desktop application
- **@assistant-ui/react** — Chat component library
- **Nanostore** — Lightweight state management
- **JSON-RPC** to `tui_gateway` backend

### OpenClaw Frontend Stack

- **Control UI** — Web-based dashboard (`pnpm ui:build`)
- **Windows Hub** — Native Windows companion app (setup, tray, chat, MCP)
- **macOS app** — Menu bar control, Voice Wake, WebChat
- **iOS node** — Voice + Canvas via WebSocket
- **Android node** — Chat + Voice + Canvas + Camera

### Frontend Architecture Patterns

| Pattern | Used By | Strengths |
|---------|---------|-----------|
| React + assistant-ui | Hermes desktop | Rich chat components |
| Ink (React in terminal) | Hermes TUI | Same React skills for CLI |
| PTY bridge + xterm.js | Hermes dashboard | Embed terminal in web |
| WebSocket nodes | OpenClaw | Thin mobile/desktop clients |
| pnpm workspace | OpenClaw | Shared code across apps |
| Parallel Threading Dashboard | Codex Desktop | Multi-tasking workspace management [CLAIM-158](../00_index/citation_map.md#claim-158) |
| Separate Agent Surface | VS Code Copilot Agents Window | Orchestrates cross-repo/multi-project tasks [CLAIM-161](../00_index/citation_map.md#claim-161) |
| Multi-file Edit Composer | Cursor Composer | High-context side-by-side editing in editor [CLAIM-164](../00_index/citation_map.md#claim-164) |
| Planning & Artifact Tracking | Google Antigravity | Transparent visual plan-to-walkthrough pipeline [CLAIM-167](../00_index/citation_map.md#claim-167) |
| Declarative Generative UI | CopilotKit / Vercel AI SDK | Dynamic schema-based React component rendering [CLAIM-172, CLAIM-173] |
| Sandboxed Widget Host | MCP Apps (SEP-1865) | Secure HTML/JS widget rendering in iframes [CLAIM-174, CLAIM-175] |
| Open Responses Stream Adapter | LibreChat Client / Server | Translates SSE completions to semantic event structures (`response.output_text.delta`) [CLAIM-180](../00_index/citation_map.md#claim-180) |

### Key Design Principle (Hermes)

> "Do not re-implement the primary chat experience in React. The main transcript, composer, and PTY-backed terminal belong to the embedded hermes --tui — anything new you add to Ink shows up in the dashboard automatically."

This means: **build the core UI once (in Ink/React), embed it everywhere** via PTY bridge.

## What Is Confirmed

1. **React is the dominant frontend framework** for agent UIs
2. **assistant-ui** is the go-to component library for AI chat interfaces
3. **Ink (React in terminal)** enables sharing React skills between web and CLI
4. **PTY bridge** allows embedding terminal UIs in web dashboards
5. **Nanostore** is preferred over Redux/Zustand for lightweight state in agent UIs
6. **JSON-RPC** is the standard transport between frontend and agent backend
7. **Workspace Orchestration requires dual surfaces**: a chat interface for inline changes and a dedicated window/pane for multi-project planning and background agents [CLAIM-158, CLAIM-161, CLAIM-166].
8. **Generative UI pipelines must be allowlist-driven or declarative** (JSON schema parsing) to prevent code injection vulnerabilities [CLAIM-170, CLAIM-171, CLAIM-175].
9. **MCP Apps (SEP-1865) represent the modern standard** for modular UI extensibility in agent hosts [CLAIM-174](../00_index/citation_map.md#claim-174).
10. **MCP Tasks modeling is key** to avoiding context bloat during long-running loops [CLAIM-178](../00_index/citation_map.md#claim-178).

## What Is Uncertain

- Whether to build a web-first or terminal-first UI
- Whether Electron is the right choice for desktop (vs. Tauri)
- How to handle real-time streaming efficiently in React
- Best default auto-run permission thresholds for CLI commands (Ask vs Sandbox vs YOLO) [CLAIM-165, CLAIM-169].

## How This Applies to Building a Modern Model-Agnostic Agent Harness

1. **Use React** for all frontend surfaces (web, terminal via Ink, desktop)
2. **Adopt assistant-ui** as the chat component library
3. **JSON-RPC over stdio** for frontend-backend communication
4. **Consider PTY bridge** for embedding terminal UIs in web dashboards
5. **Use Nanostore** for lightweight state management
6. **Build UI once, embed everywhere** — Hermes's approach is the reference pattern
7. **Provide a dedicated 3-column workspace with a planning artifact panel** — modeled after Google Antigravity's lifecycle and Cursor's Composer [CLAIM-164, CLAIM-167].
8. **Implement structured output mapping and sandboxed iframe widgets** (MCP Apps style) for safe, dynamic UI rendering [CLAIM-172, CLAIM-175].
9. **Support the MCP Tasks extension** for client-driven asynchronous agent execution [CLAIM-178](../00_index/citation_map.md#claim-178).
