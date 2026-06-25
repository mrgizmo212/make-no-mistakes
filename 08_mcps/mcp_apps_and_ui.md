# Generative UI in Responses and Model Context Protocol (MCP) Apps & UI — June 2026

## What Was Researched

This document details the June 2026 state-of-the-art standards and frameworks for **Generative User Interfaces (GenUI)** and **Model Context Protocol (MCP) Apps & UI**. It outlines security models, API specifications, and bi-directional communications to design a modular, safe, and highly interactive frontend for the model-agnostic agent harness.

---

## Which Sources Were Used

| Source | Type | URL | Relevance |
|:---|:---|:---|:---|
| **Model Context Protocol (SEP-1865)** [SRC-023] | Specification | https://github.com/modelcontextprotocol/specification | CRITICAL |
| **CopilotKit Open-Source Framework** [SRC-024] | GitHub Repo | https://github.com/copilotkit/copilotkit | HIGH |
| **Vercel AI SDK UI & Streaming** [SRC-025] | Online Docs | https://sdk.vercel.ai/docs/ai-sdk-ui | CRITICAL |
| **Mastra AI & mcp-use SDKs** [SRC-026] | GitHub Repo | https://github.com/mastra-ai/mastra | HIGH |
| **LibreChat & Agents SDK** [SRC-027, SRC-028] | Local codebase | https://github.com/danny-avila/LibreChat | HIGH |

---

## 1. Generative UI (GenUI) in responses

Generative UI represents a paradigm shift where the LLM does not merely generate static text answers but constructs dynamic interface layouts on the fly, tailoring the frontend to user intent and conversation context [CLAIM-170](../00_index/citation_map.md#claim-170).

```
┌────────────────────────────────────────────────────────────────────────┐
│                        GENERATIVE UI STREAMING                         │
│                                                                        │
│  LLM (Structured Output) ──> Client Parser ──> Component Registry      │
│  {"component": "Invoice",      (Vercel SDK)    { Weather: WeatherCard, │
│   "props": {...}}                              Invoice: InvoiceForm }  │
│                                                          │             │
│                                                          ▼             │
│                                                    Rendered React      │
│                                                      Component         │
└────────────────────────────────────────────────────────────────────────┘
```

### A. Structured outputs Gating
To enforce type safety and protect the client application from executing arbitrary code, GenUI implementations use strict schema constraints in the model's responses API (such as the OpenAI Responses API or the self-hosted Open Responses proxy) [CLAIM-171, CLAIM-118].
*   **API Payload**: Outbound LLM requests include a structured JSON Schema under the `response_format` configuration [CLAIM-171](../00_index/citation_map.md#claim-171):
    ```json
    {
      "type": "json_object",
      "schema": {
        "type": "object",
        "properties": {
          "component": { 
            "type": "string", 
            "enum": ["WeatherCard", "StockChart", "InvoiceForm", "TaskChecklist"] 
          },
          "props": { 
            "type": "object",
            "properties": {
              "title": { "type": "string" },
              "data": { "type": "array", "items": { "type": "object" } },
              "status": { "type": "string" }
            },
            "required": ["title"]
          }
        },
        "required": ["component", "props"]
      }
    }
    ```

### B. Client-Side Component Registry
The React client maintains an allowlist registry mapping these schema identifiers to type-safe visual components [CLAIM-171](../00_index/citation_map.md#claim-171). Raw, un-registered components are blocked by default:
```tsx
import { WeatherCard } from "@/components/ui/weather";
import { StockChart } from "@/components/ui/charts";
import { InvoiceForm } from "@/components/ui/forms";

const ComponentRegistry: Record<string, React.ComponentType<any>> = {
  WeatherCard: (props) => <WeatherCard {...props} />,
  StockChart: (props) => <StockChart {...props} />,
  InvoiceForm: (props) => <InvoiceForm {...props} />,
};

interface DynamicUiProps {
  component: string;
  props: Record<string, any>;
}

export function DynamicUiRenderer({ component, props }: DynamicUiProps) {
  const Component = ComponentRegistry[component];
  if (!Component) {
    return <div className="text-red-500">Component {component} not registered.</div>;
  }
  return <Component {...props} />;
}
```

### C. Stream Parsing and Rendering
*   **Vercel AI SDK (AI SDK UI)**: Serves as the primary React hook utility to process these incoming response streams [CLAIM-172](../00_index/citation_map.md#claim-172).
*   **Progressive Rendering**: The SDK's JSON parser processes chunks as they stream. The UI renders the skeleton of the component as soon as the `component` property name is identified, then incrementally populates its parameters (e.g. table lines, chart coordinates) as their corresponding property nodes materialize [CLAIM-172](../00_index/citation_map.md#claim-172).
*   **AG-UI Protocol (CopilotKit)**: Used to coordinate and synchronize these client-side React components directly with background agent states, letting agent pipelines dynamically mutate properties or trigger state changes on active forms [CLAIM-173](../00_index/citation_map.md#claim-173).

---

## 2. Model Context Protocol (MCP) Apps & UI (SEP-1865)

In June 2026, the Model Context Protocol was updated via **SEP-1865** to support **MCP Apps**—standardizing how remote tool servers serve interactive graphical widgets and mini-applications directly to compatible hosts [CLAIM-174](../00_index/citation_map.md#claim-174).

### A. Iframe Sandboxing & Security Isolation
To prevent cross-site scripting (XSS) and local token theft, MCP Apps enforce strict sandbox boundaries [CLAIM-175](../00_index/citation_map.md#claim-175):
1.  **Direct DOM Injection Prohibited**: Host applications are forbidden from injecting raw HTML strings or loading remote JS scripts into the primary DOM.
2.  **Isolated Iframe**: All server-provided widgets are rendered inside an `<iframe>` container with minimal privileges [CLAIM-175](../00_index/citation_map.md#claim-175):
    ```html
    <iframe
      srcdoc="&lt;html&gt;&lt;body&gt;...widget code...&lt;/body&gt;&lt;/html&gt;"
      sandbox="allow-scripts"
      csp="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline';"
      referrerpolicy="no-referrer"
    ></iframe>
    ```
    *   `sandbox="allow-scripts"` allows the widget to run local visual calculations but prevents parent page navigation, cookies access, or local storage inspection [CLAIM-175](../00_index/citation_map.md#claim-175).
    *   **CSP Header** restricts network access to prevent credentials or sensitive project files from leaking to third-party endpoints.

### B. Bi-directional JSON-RPC State Synchronization
Communication between the sandboxed widget and the host agent loop operates over a JSON-RPC channel mapped via `window.postMessage` [CLAIM-174](../00_index/citation_map.md#claim-174):

```
┌────────────────────────────────────────────────────────┐
│                        HOST CLIENT                     │
│                                                        │
│   ┌───────────────────────────────┐                    │
│   │ Isolated Iframe (allow-script)│                    │
│   │                               │                    │
│   │ Widget Action ──(postMessage)───> JSON-RPC Bridge  │
│   │ {"method": "click_submit",          │              │
│   │  "params": {...}}                   ▼              │
│   └───────────────────────────────┘  Trigger Host      │
│                                      Tool Execution    │
└────────────────────────────────────────────────────────┘
```

1.  **Widget to Host (Actions)**: Interactive triggers (like clicking "Submit Invoice") dispatch message payloads:
    ```javascript
    window.parent.postMessage({
      jsonrpc: "2.0",
      method: "mcp/appAction",
      params: {
        action: "submit_form",
        payload: { amount: 150.00, billingEmail: "user@example.com" }
      }
    }, "*");
    ```
2.  **Host to Widget (Updates)**: When the agent completes the corresponding action or edits a file, the host notifies the widget:
    ```javascript
    iframeRef.current.contentWindow.postMessage({
      jsonrpc: "2.0",
      method: "mcp/appStateUpdate",
      params: { status: "processed", transactionId: "tx_12345" }
    }, "*");
    ```

### C. Developer SDKs
*   **Mastra AI & `mcp-use`**: Provide standard TypeScript structures to define MCP tool endpoints that pack static assets (HTML/CSS widget templates) directly into their metadata declarations [CLAIM-176](../00_index/citation_map.md#claim-176). This keeps tool logic and visual render templates co-located in the server code.

### D. Multi-Tenant OAuth Stateful Flow Management
In production multi-tenant environments like LibreChat, user-scoped MCP connections are governed by a stateful Redis flow manager (`getFlowStateManager`) [CLAIM-179](../00_index/citation_map.md#claim-179).
*   **CSRF Bindings**: When starting an OAuth callback from non-standard channels (like SSE chat completed events), the server binds the user's connection request to a unique `OAUTH_CSRF_COOKIE` matching the flow ID [CLAIM-179](../00_index/citation_map.md#claim-179).
-   **Automatic Transport Reinitialization**: Upon callback completion, the token storage persists credentials, deletes the pending flows, and instructs the client-scoped manager to reconnect the server and refresh available tools [CLAIM-179](../00_index/citation_map.md#claim-179).

---

## 3. Stateless Core and the Tasks Extension

With MCP's transition to a stateless Core in mid-2026, context and long-running execution states are managed via dedicated Extensions [CLAIM-177](../00_index/citation_map.md#claim-177). The **Tasks Extension** was introduced to govern async agent threads [CLAIM-177](../00_index/citation_map.md#claim-177).

### A. Durable State Machines
*   **Connection Bloat Prevention**: Rather than keeping TCP or HTTP sockets open for the entire duration of a multi-minute agent job (which exhausts server memory pools), tasks are modeled as client-driven durable state machines [CLAIM-178](../00_index/citation_map.md#claim-178).
*   **Checkpoint Persistence**: The client stores state checkpoints in its local database (SQLite). The remote MCP server is stateless, executing single-step tasks and writing results back to the client-managed pipeline [CLAIM-178](../00_index/citation_map.md#claim-178).

### B. Progress and Step Modeling
The Tasks extension updates the MCP UI using step-by-step progress streams:
```json
{
  "jsonrpc": "2.0",
  "method": "mcp/taskProgress",
  "params": {
    "taskId": "task_9876",
    "status": "in_progress",
    "completedSteps": 3,
    "totalSteps": 5,
    "currentStepDescription": "Running project compiler checks..."
  }
}
```
This lets the frontend render smooth progress bars, detailed nested sub-task checklists, and time estimates while keeping the underlying connections ephemeral and lightweight.

---

## What Is Confirmed

1.  **Allowlist Component Gating is Mandatory**: To prevent security compromises, only components defined in the client registry can be rendered from completions JSON [CLAIM-170, CLAIM-171, CLAIM-175].
2.  **SEP-1865 Iframe Isolation is the Extension Standard**: All remote MCP servers offering visual widgets run inside isolated, non-cookie-inheriting iframes using postMessage JSON-RPC bridges [CLAIM-174, CLAIM-175].
3.  **Stateless MCP Core + Tasks**: Solves connection bloat by storing execution state and checkpoints locally on the client (using FTS5 SQLite databases) [CLAIM-177, CLAIM-178].

## What Is Uncertain

*   How to handle high-frequency postMessage sync events (e.g. mouse movement or text input tracking) without degrading React rendering performance.
*   Standardizing CSS theme injection (dark mode / HSL tailwind configs) into remote, sandboxed widget iframes cleanly.

## Applicability to Harness

1.  **GenUI Registry**: Build a type-safe component lookup table mapping schema structures (like test result logs, diff tables) to React components [CLAIM-171](../00_index/citation_map.md#claim-171).
2.  **MCP Sandbox Widget Component**: Build a reusable `<McpIframeWidget>` component that compiles incoming MCP HTML/JS strings into a safe `srcdoc` iframe, listening to `window.addEventListener("message")` for actions [CLAIM-175](../00_index/citation_map.md#claim-175).
3.  **MCP Tasks State Manager**: Integrate state-machine checkpoint tracking within the SQLite session log to support asynchronous background execution logs [CLAIM-178](../00_index/citation_map.md#claim-178).
