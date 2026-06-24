# Developer Agent Interface Layers and Interoperability Architectures

As the agentic coding ecosystem has matured, developer-oriented AI agent platforms have shifted from simple command-line utilities to complex multi-layered environments. To build a modern, model-agnostic agent harness, it is critical to taxonomize these distinct layers and understand the interoperability architectures that allow gateways to support or unify tools like **Claude Code**, **Codex**, **Cursor**, and **Ollama**.

---

## 1. The 5-Tier Agent Interface Taxonomy

An agentic platform is structured across five primary layers, each operating with distinct privileges, bounds, and capabilities:

```
┌─────────────────────────────────────────────────────────┐
│ Tier 5: Gateway & Proxy Servers                         │
│ (LiteLLM, Open Responses, OpenCode API)                 │
└───────────────────────────┬─────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────┐
│ Tier 4: Desktop / Mobile Frontends                      │
│ (OpenClaw Canvas, Codex Desktop App)                    │
└───────────────────────────┬─────────────────────────────┘
                            ▼
┌───────────────────────────┴─────────────────────────────┐
│ Tier 3: IDE & Editor Extensions                         │
│ (Cursor IDE fork, VS Code plugins, Positron)            │
└───────────────────────────┬─────────────────────────────┘
                            ▼
┌───────────────────────────┴─────────────────────────────┐
│ Tier 2: Core Engines / CLI Agents                       │
│ (Claude Code CLI, Codex CLI, Hermes core, Pi core)      │
└───────────────────────────┬─────────────────────────────┘
                            ▼
┌───────────────────────────┴─────────────────────────────┐
│ Tier 1: Agent SDKs & Abstractions                       │
│ (LangGraph, LangChain, assistant-ui React hooks)        │
└─────────────────────────────────────────────────────────┘
```

### Tier 1: Agent SDKs & Abstractions
*   **Definition**: The low-level programming blocks, state-management frameworks, and model routing wrappers.
*   **Scope & Context**: They manage graph nodes, transitions, message state schemas, checkpointing databases, and tool schemas.
*   **Examples**: [LangGraph](https://github.com/langchain-ai/langgraph) (defining state charts and Pregel supersteps), [LangChain](https://github.com/langchain-ai/langchain) (offering generic model and tool connectors), and React-native hooks like those in [assistant-ui](https://github.com/assistant-ui/assistant-ui) that bind chat interfaces to live SSE streams.

### Tier 2: Core Engines / CLI Agents
*   **Definition**: Standalone, terminal-native local runtimes executing cognitive ReAct loops with direct access to local system resources.
*   **Scope & Context**: They execute in the developer's shell environment or container sandboxes. They have high-privilege access to read files, run compiler checks, construct git logs, execute bash tools, and run tests.
*   **Examples**: [Claude Code](https://platform.claude.com/docs/en/about-claude/models/migration-guide) CLI, [Codex CLI](https://github.com/openai/codex) (written in Rust), [Hermes Agent](https://github.com/NousResearch/hermes-agent) core runner, and the [Pi Coding Agent](https://github.com/badlogic/pi-mono/packages/coding-agent) core.

### Tier 3: IDE & Editor Extensions
*   **Definition**: Integrations running inside the developer's primary IDE (either as a plugin or a custom editor fork).
*   **Scope & Context**: They hook directly into editor-specific APIs. They read active editor buffers, file selection arrays, workspace trees, and language server protocols (LSP) to provide autocomplete, inline edits (e.g. diff views), and sidebars.
*   **Examples**: Custom IDE forks like **Cursor** (a proprietary fork of VS Code) or **Positron** (a fork of VS Code for data science), and extensions like the **Codex VS Code Extension** or the Copilot extension.

### Tier 4: Desktop / Mobile Frontends
*   **Definition**: Graphical wrappers enclosing the engine and providing cross-platform visual UI, settings panels, canvas flows, and notifications.
*   **Scope & Context**: They run as Electron, Tauri, or native window executables. They orchestrate the lifecycle of background daemons, manage global hotkeys, and provide canvas/graph visualizations of multi-agent execution steps.
*   **Examples**: [OpenClaw](https://github.com/openclaw/openclaw) (voice-enabled multi-agent Canvas app), the **Codex Desktop App**, and Electron-wrapped agent consoles.

### Tier 5: Gateway & Proxy Servers
*   **Definition**: Abstract API routers sitting between frontends, extensions, local engines, and backend model endpoints.
*   **Scope & Context**: They expose standard OpenAI or Anthropic API endpoints (e.g., `/v1/chat/completions` or `/v1/responses`) to clients. Behind the scenes, they translate payloads, manage token rate-limiting, audit costs, execute telemetry logging, and handle OAuth tokens.
*   **Examples**: [LiteLLM](https://github.com/BerriAI/litellm) (wrapping 100+ backends into an OpenAI format), [Open Responses](https://github.com/open-responses/open-responses) (a drop-in replacement proxy for OpenAI's stateful Responses API), and custom enterprise proxies like **OpenCode**.

---

## 2. Interoperability & Integration Architectures

To bridge these tiers—such as allowing a Tier 4 Desktop App or a Tier 3 IDE plugin to route through local or proprietary models—platforms implement several key integration architectures:

### 2.1 Credential Shadowing & OAuth Hijacking
When a client wishes to run a custom local loop but utilize the developer's official cloud plan limits, it can perform "credential shadowing." For instance, [hermes-agent](https://github.com/NousResearch/hermes-agent) supports running tasks via Claude's Console by reading first-party login tokens from Claude Code.
*   **Extraction Mechanics**: The adapter scans the local system for credentials written by Claude Code's login command. As implemented in [anthropic_adapter.py](https://github.com/NousResearch/hermes-agent/agent/anthropic_adapter.py#L917-L954), it checks the macOS Keychain under service name `"Claude Code-credentials"` and scans the file `~/.claude/.credentials.json`.
*   **Token Refreshing**: If the credential has expired, the adapter executes a POST request to Anthropic's OAuth token endpoints (`platform.claude.com/v1/oauth/token`) using the refresh token (as shown in [refresh_anthropic_oauth_pure](https://github.com/NousResearch/hermes-agent/agent/anthropic_adapter.py#L972-L1034)).
*   **Spoofing & Signature Verification**: To bypass subscription gates, the adapter appends Claude Code's official OAuth client ID (`9d1c250a-e61b-44d9-88ed-5944d1962f5e`), sets custom headers (`"User-Agent": "claude-cli/2.1.74"`), and sends specific beta headers like `oauth-2025-04-20` and `claude-code-20250219`.

### 2.2 API Emulation & Wire-Protocol Translation
To support tools like **Cursor** or the **OpenAI Agents SDK** without binding them to a single closed provider, developers insert an emulation proxy.
*   **Open Responses**: As detailed in [open-responses/README.md](https://github.com/open-responses/open-responses/README.md#L17-L32), the proxy emulates OpenAI's new stateful [Responses API](https://platform.openai.com/docs/api-reference/responses). The client points its SDK base URL to the local proxy (`http://localhost:8080/v1`). The proxy manages the server-side state machine (run loops, tool requests, thread logs) but delegates the actual LLM generation to any configured backend (like Anthropic Claude, DeepSeek R1, or Qwen).
*   **LiteLLM**: Provides parameter translation. When a client requests `/v1/chat/completions`, LiteLLM translates standard parameters (`max_tokens`, `temperature`, `response_format`) to the specific shapes required by Cohere, Anthropic, Gemini, or local HuggingFace endpoints.

### 2.3 Local Daemon Spawning & Subprocess Orchestration
For developers running local open-weight models (like Llama 3.2 or DeepSeek R1 via **Ollama**), gateways must manage the local model server process.
*   **Subprocess Spawning**: LiteLLM's initialization helper [_run_ollama_serve](https://github.com/BerriAI/litellm/tests/test_litellm/proxy/proxy_server/test_lifecycle.py#L442-L457) checks if the `ollama` CLI is available and automatically invokes `ollama serve` in a background subprocess (`subprocess.Popen`).
*   **Wildcard Routing**: The gateway maps model calls prefixing `ollama/` (e.g. `ollama/gemma3:1b`) directly to Ollama's local port (typically `12700.0.0.1:11434`), translating the OpenAI request format to Ollama's native endpoint specs.

### 2.4 Bridge Protocols (MCP & WebSockets)
To decouple the engine's execution capabilities from the visual presentation layer, systems rely on standard bridge protocols:
*   **MCP (Model Context Protocol)**: Defined by Anthropic, it lets Tier 2 Engines and Tier 3 Extensions query and run tools provided by external services via standard JSON-RPC over `stdio` or HTTP SSE. This allows a tool defined in a standalone database to be registered by the engine and exposed to the IDE.
*   **WebSocket CDP Bridges**: Allows local engines to take control of external browsers. As detailed in [sandboxes_and_browser_bridges.md](07_tools/sandboxes_and_browser_bridges.md), the engine connects to a Chrome instance's Chrome DevTools Protocol (CDP) WebSocket port, inheriting the developer's session state and cookies to automate web interactions.

To decouple the engine's execution capabilities from the visual presentation layer, systems rely on standard bridge protocols:
*   **MCP (Model Context Protocol)**: Defined by Anthropic, it lets Tier 2 Engines and Tier 3 Extensions query and run tools provided by external services via standard JSON-RPC over `stdio` or HTTP SSE. This allows a tool defined in a standalone database to be registered by the engine and exposed to the IDE.
*   **WebSocket CDP Bridges**: Allows local engines to take control of external browsers. As detailed in [sandboxes_and_browser_bridges.md](07_tools/sandboxes_and_browser_bridges.md), the engine connects to a Chrome instance's Chrome DevTools Protocol (CDP) WebSocket port, inheriting the developer's session state and cookies to automate web interactions.

---

## 3. Agent Bootstrapping and Tenancy Engineering

When architecting a custom developer agent platform from scratch, engineers must make key strategic decisions regarding the initial bootstrapping entrypoint and the transition path toward multi-tenant capability.

### 3.1 The Bootstrapping Entrypoint: Why CLI-First is the Gold Standard

When beginning a project, developers are often tempted to jump straight to building IDE sidebars (Tier 3 VS Code Extensions) or complex multi-agent state engines (Tier 1 SDKs). In practice, the industry standard (demonstrated by Claude Code, Codex, and Hermes) is to **bootstrap CLI-first (Tier 2 Core Engine)**.

#### 1. Prototyping and Bare-Metal Validation
A CLI engine isolates the core ReAct execution loop, state tracking, and tool execution in a raw shell environment.
*   **Minimal Boilerplate**: It requires no complex web servers, IPC channels, WebSocket framing, or graphical renders.
*   **Immediate Logging Visibility**: Raw LLM prompts, raw tool arguments, and stdout/stderr stream directly to the terminal, making debugging and tracing instantaneous.
*   **Example: Core Loop Prototype**:
    ```python
    # bootstrap/core_engine.py
    import sys
    import json
    from openai import OpenAI
    
    client = OpenAI()
    messages = [{"role": "system", "content": "You are a coding assistant. Execute tools when needed."}]
    
    # 1. Bare-metal tool definitions
    def read_file(path: str) -> str:
        with open(path, "r", encoding="utf-8") as f:
            return f.read()

    TOOL_MAP = {"read_file": read_file}

    # 2. Main Cognitive ReAct Loop
    def run_turn(user_prompt: str):
        messages.append({"role": "user", "content": user_prompt})
        while True:
            # Call LLM with tool schemas configured
            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=messages,
                tools=[{
                    "type": "function",
                    "function": {
                        "name": "read_file",
                        "description": "Read file content",
                        "parameters": {"type": "object", "properties": {"path": {"type": "string"}}}
                    }
                }]
            )
            assistant_msg = response.choices[0].message
            messages.append(assistant_msg)
            
            # If the model requests a tool call, execute locally
            if assistant_msg.tool_calls:
                for tc in assistant_msg.tool_calls:
                    tool_name = tc.function.name
                    tool_args = json.loads(tc.function.arguments)
                    print(f"\n[ENGINE] Executing tool: {tool_name} with {tool_args}")
                    
                    # Execute tool and append observation
                    output = TOOL_MAP[tool_name](**tool_args)
                    messages.append({
                        "role": "tool",
                        "tool_call_id": tc.id,
                        "content": output
                    })
                continue # Loop back to feed observations to the model
            else:
                # Turn is complete, output response text
                print(f"\nAssistant> {assistant_msg.content}")
                break

    if __name__ == "__main__":
        print("Developer Agent Bootstrapped. Type your prompt below.")
        while True:
            prompt = input("Developer> ")
            run_turn(prompt)
    ```

#### 2. Evolving from CLI Engine to Reusable SDK
Once the core ReAct loop is stable and its prompts are calibrated, it is abstracted. The CLI script becomes a library class (`class AgentLoop:`) containing the execution logic.
*   The class is packaged as an SDK (Tier 1) that can be imported by other services.
*   To support other interfaces, this SDK is wrapped in an HTTP/WebSocket server or registered as an MCP server. A VS Code extension (Tier 3) or Web App (Tier 4) then simply calls the server's API endpoints rather than executing code directly.

---

### 3.2 Tenancy Transition Architecture: Single-Tenant to Multi-Tenant

Developer agent platforms begin as **single-tenant (local-first)**. The agent runs locally on the developer's workstation, possessing the developer's shell privileges, SSH key mappings, and file directory accesses. 

If the platform transitions to a shared web service (e.g. Codex Web App, OpenCode API server, or corporate shared environments), the architecture **must be re-engineered for multi-tenancy**.

```
[Local-First (Single-Tenant)]
Developer OS/Workspace -> Run Agent CLI -> Executes commands directly on Local Host (High Privilege)

[Platform SaaS (Multi-Tenant)]
User browser ──> API Gateway (Tier 5 Proxy) ──> Spawn isolated Workspace Sandbox (Docker/MicroVM)
                                                    └─ Private SQLite DB per Workspace Sandbox
```

#### 1. Compute Isolation (Disposable Sandboxes)
*   **The Problem**: Code interpreters and terminal execution tools (`execute_command`, `bash`) execute arbitrary instructions. If a tenant's agent is compromised via prompt injection, or if an untrusted user runs malicious code on a shared server host, they can access other tenants' directory trees, exfiltrate environment variables, or execute denial-of-service commands.
*   **The Architecture**: Transition from direct subprocess runs to isolated, disposable containers spawned dynamically per workspace session.
*   **Example: Docker Sandbox Spawner**:
    ```python
    # platform/tenant_sandbox.py
    import docker
    
    class SandboxManager:
        def __init__(self):
            self.client = docker.from_env()
            
        def spawn_workspace_sandbox(self, tenant_id: str, repo_mount_path: str) -> str:
            """Spawn an isolated workspace container with resource caps and capability stripping."""
            container = self.client.containers.run(
                image="secure-dev-sandbox:latest",
                command="tail -f /dev/null",  # keeps container alive
                detach=True,
                mem_limit="2g",               # cap RAM usage
                nano_cpus=2000000000,         # limit to 2 CPUs
                network_mode="bridge",
                volumes={
                    repo_mount_path: {"bind": "/workspace", "mode": "rw"}
                },
                cap_drop=["ALL"],             # strip all kernel capabilities
                cap_add=["CHOWN", "SETUID"],  # add only essentials
                read_only=False
            )
            return container.id

        def execute_in_sandbox(self, container_id: str, command: str) -> str:
            """Run an agent command inside the tenant's isolated sandbox container."""
            container = self.client.containers.get(container_id)
            exec_res = container.exec_run(
                cmd=["bash", "-c", command],
                workdir="/workspace",
                user="developer"              # run as unprivileged user
            )
            return exec_res.output.decode("utf-8")
    ```

#### 2. State Isolation (Session Database Partitioning)
*   **The Problem**: Single-tenant engines write session logs and vector indices to local directories (e.g. `~/.cache/qmd/index.sqlite`). In a multi-tenant platform, multiple users writing concurrently to a single global SQLite file will cause write locks (`database is locked`) and expose cross-tenant session leaks.
*   **The Architecture**: Shift to a hybrid database layout:
    *   *Shared Metadata*: Store user accounts, billing profiles, and workspace memberships in a centralized multi-tenant database (such as PostgreSQL) utilizing explicit tenant keys on tables (`tenant_id` columns).
    *   *Isolated Session State*: Store individual session threads, files indices, and tool history in **workspace-scoped SQLite files** located directly inside the tenant's private workspace directory or container mount. Since each tenant owns a private filesystem, database locks are isolated, and data separation is physically guaranteed.

#### 3. Gateway & Billing Isolation (Tier 5 Gateway)
*   **The Problem**: A shared platform cannot run entirely on a single master OpenAI or Anthropic API key without rate-limiting conflicts and cost tracing difficulties.
*   **The Architecture**: Intercept all client outbound LLM requests at the gateway level.
    *   *Key Pools & Rotation*: The gateway manages a pool of provider API keys, mapping request costs directly to the `tenant_id` extracted from the client's JWT auth token.
    *   *Rate-limiting & Token Caching*: Implemented in Tier 5 layers like **LiteLLM** or **Open Responses**, the gateway tracks active tokens per user/organization and rejects requests that exceed quotas before forwarding them to LLM providers.

---

## 4. Architectural Summary of Developer Agent Platforms

| Platform / Tool | Tier Level | Primary Execution Layer | Access to Local System | Model Compatibility | Integration Architecture |
|:---|:---|:---|:---|:---|:---|
| **Claude Code** | Tier 2 | CLI Engine (terminal) | Direct system commands, file I/O, git | Anthropic Claude models only | Direct client-to-console via OAuth |
| **Cursor** | Tier 3 | IDE Fork (custom VS Code) | Editor workspace APIs, local terminal | OpenAI, Anthropic, Gemini, local models | Local/cloud API endpoints, custom proxies |
| **Codex** | Tier 2/3/4 | CLI Engine + VS Code Ext + Desktop | Direct shell execution, MCP servers | OpenAI, Anthropic, Local (Ollama) | Emulates OpenAI Responses, runs MCP servers |
| **LiteLLM** | Tier 5 | Gateway Proxy Server | Local system (spawns subprocesses) | 100+ LLM API providers + Ollama | translates OpenAI spec -> provider spec |
| **Open Responses** | Tier 5 | Gateway Proxy Server | N/A (routes to LLM providers) | Model-agnostic (routes to any LLM) | Emulates OpenAI stateful Responses API |
| **Ollama** | Tier 5 | Local Model Runtime | N/A (runs GGUF inference) | Open-weight GGUF models | Exposes local `/v1/chat/completions` API |
