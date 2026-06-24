# Model-Agnostic Agent Harness: Technical Architecture Specification

## Executive Summary
This document synthesizes findings across all 19 topic areas and 10 local reference codebases (June 2026) to define the technical specifications for building a modern, model-agnostic developer agent harness. The harness balances advanced cognitive capabilities (memory, subagents, learning loops) with strict execution safety, budget quotas, and low-latency client streaming.

---

## 1. The 5-Tier Interface Taxonomy & Interoperability

To separate graphical rendering, command execution, and network routing, the harness is designed as a **5-Tier system**:

```
┌─────────────────────────────────────────────────────────┐
│ Tier 5: Gateway & Proxy Server (LiteLLM/Open Responses)  │
│ - Exposes OpenAI-compatible API, routes to 100+ models  │
└───────────────────────────┬─────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────┐
│ Tier 4: Desktop / Canvas GUI (OpenClaw)                 │
│ - Visual session state, companion app, Voice Wake       │
└───────────────────────────┬─────────────────────────────┘
                            ▼
┌───────────────────────────┴─────────────────────────────┐
│ Tier 3: IDE & Editor Extension (Cursor fork / VS Code)  │
│ - AST index, editor buffers, active selections          │
└───────────────────────────┬─────────────────────────────┘
                            ▼
┌───────────────────────────┴─────────────────────────────┐
│ Tier 2: Core Cognitive Engine (Hermes/Codex/Pi Core)   │
│ - Main ReAct execution loop, native tools, permissions  │
└───────────────────────────┬─────────────────────────────┘
                            ▼
┌───────────────────────────┴─────────────────────────────┐
│ Tier 1: Programming SDK / Hooks (LangGraph/assistant-ui)│
│ - Graph supersteps, SSE parsing, state channels         │
└─────────────────────────────────────────────────────────┘
```

### Interoperability Standards
*   **Credential Shadowing**: Outbound model calls route through first-party plan limits by reading credentials from macOS Keychain (service `"Claude Code-credentials"`) or parsing `~/.claude/.credentials.json`, spoofing client signatures (`User-Agent: claude-cli/2.1.74`), and injecting header markers [CLAIM-116, CLAIM-117].
*   **API Emulation**: The gateway emulates OpenAI's stateful Responses wire protocol (`POST /v1/responses`), managing server-side runs while translating payloads to any backend model (Claude, DeepSeek, Qwen) [CLAIM-118].
*   **Open Responses API Server**: Exposes standard Open Responses endpoints (`/v1/responses`), converting input lists to internal messages and streaming semantic events like `response.output_text.delta` via Server-Sent Events (SSE) [CLAIM-180].
*   **BFS Agent Discovery**: The controller utilizes a Breadth-First Search (BFS) discovery algorithm starting from the primary agent's edges, validating remote agent permissions for each hop and establishing isolated sub-agent run contexts [CLAIM-181].
*   **Daemon Orchestration**: Spawns local models programmatically via subprocesses (`ollama serve`) to route GGUF models automatically when offline [CLAIM-119].

---

## 2. Core Execution Loop and Context Engineering

### A. The ReAct Loop
The cognitive loop operates as a stateful ReAct while-loop bounded by dual limits:
1.  **Iteration Cap**: Prevents infinite loops (default: 30 iterations).
2.  **Token Budget**: Monitors costs dynamically.
3.  **Grace turns**: Upon hitting limits, the loop injects a system reminder granting one final `_budget_grace_call` turn to let the model write a final output instead of crashing [CLAIM-081].
4.  **Steer Injection**: Pulls pending messages mid-turn from a thread-safe queue, appending them into the last tool message to maintain strict message role alternation [CLAIM-082].
5.  **Self-Healing Parsing Errors**: When tool parsing or validation fails, rather than crashing the loop, the exception text is wrapped in a virtual tool observation (using a virtual tool similar to LangChain's `_Exception` tool) and sent back to the LLM for correction. This correction loop is bounded to 1-2 attempts to prevent runaway API costs [CLAIM-142].

### B. Context Pruning and Compaction
To minimize token costs and avoid "lost-in-the-middle" retrieval rot, the harness implements a **5-Phase Compaction Pipeline**:
*   *Phase 1: Deduplication*: MD5 hashes tool payloads to prevent re-reading identical files [CLAIM-070].
*   *Phase 2: Screen Eviction*: Retains only the 3 most recent multimodal screenshots, replacing older images with text placeholders [CLAIM-110].
*   *Phase 3: Tail Protection*: Preserves the last 20K tokens of raw conversation history [CLAIM-031].
*   *Phase 4: Summarization*: Utilizes a 13-section structured summary template to compact historical turns into a single persistent block [CLAIM-027].
*   *Phase 5: Anti-Thrashing*: Bypasses compaction if a turn yields less than a 10% context reduction [CLAIM-032].

### C. Conversational Shape Adapters
To support Anthropic Claude 3.7+ models, the adapter converts OpenAI-style inputs:
*   Extracts system prompt objects to top-level parameters [CLAIM-105].
*   Merges consecutive identical roles to enforce strict user-assistant alternation [CLAIM-106].
*   Converts tool messages into `tool_result` content arrays inside user messages [CLAIM-107].
*   Strips thinking blocks for third-party endpoints (Bedrock/Azure) while preserving signatures for direct Anthropic APIs [CLAIM-108, CLAIM-109].
*   Applies a double-underscore prefix `mcp__` to tool names to bypass subscription billing filters [CLAIM-112].

### D. Prompt Caching & Byte-Stability Specifications
To leverage cost savings on modern LLM APIs (up to 90% discount on cached input prefix tokens), the context builder must guarantee byte-stability [CLAIM-136]:
*   **Static Header Placement**: Place all stable elements (system identity instructions, static tool schemas, and custom skills) at the beginning of the prompt array [CLAIM-136].
*   **Volatile Tail Separation**: Place dynamic parameters (e.g., the current time, user query, memory search recalls, and the very tail of the conversation thread) at the end of the payload to prevent prefix invalidation [CLAIM-136].
*   **Canonical Ordering & Formatting**: Always sort tool definitions alphabetically by name, strip trailing whitespaces, and use date-only strings (UTC-day) in dynamic system messages to preserve cache matches [CLAIM-136].

### E. Minimizing Regular Expressions & Deterministic Logic
*   **Design Rule**: Regular expressions are strictly prohibited for parsing structured LLM data (such as extracting JSON blocks, parsing code snippets, or extracting tool parameters) [CLAIM-137].
*   **Rationale**: LLM responses exhibit layout variations, code comments, and markdown wrapper formatting that easily break regex matches. Furthermore, complex regular expressions present catastrophic backtracking security risks (ReDoS) [CLAIM-137].
*   **Alternatives**:
    *   **Programmatic Decoders**: Parse tool outputs using standard, tolerant JSON/JSON5 libraries or AST parsers [CLAIM-137].
    *   **LLM-First Semantic Extraction**: Use native LLM structured output modes or route parsing to a lightweight helper model [CLAIM-137].
    *   Deterministic code should be used minimally, restricted only to simple exact prefix check operations (e.g. `text.startsWith('/pair')`) [CLAIM-137].

### F. Token Calibration, Compaction, & Memory Gating
To prevent cost overruns and maintain context efficiency, the loop features adaptive token tracking and memory protection:
*   **Token Calibration Ratio**: Measures tokenizer discrepancies dynamically to calculate `calibrationRatio = cumulativeProviderReported / cumulativeRawSent`, scaling local token estimates to match provider billing [CLAIM-183].
*   **Dynamic Overhead Calibration**: Corrects schema token overhead against provider feedback when estimated vs calibrated variance exceeds a 15% threshold (`CALIBRATION_VARIANCE_THRESHOLD`) [CLAIM-184].
*   **Observation Masking**: Truncates consumed `ToolMessage` payloads to character-limited previews (~300 characters) when context pressure reaches 80%, keeping unconsumed outputs intact and preserving prompt cache hits [CLAIM-187].
*   **Summary Infiltration**: Injects mid-run summaries as a `HumanMessage` when the message stack is empty, allowing summaries to compete for message budget instead of lowering the system instructions ceiling [CLAIM-188].
*   **Memory Prime Filtering**: Trims out skill-primed meta messages containing large `SKILL.md` bodies from personalization windows, preventing instruction contamination during user memory updates [CLAIM-182].

---

## 3. Data Layer and Retrieval Pipelines

The harness adopts a **3-Tier Database Stack**:

```
[ Tier 1: Local-First ]  ──────>  SQLite + FTS5 (WAL Mode, Trigram tokenizers)
                                  - Session history, search recall, self-healing schema
                                  - Lock contention retries: 15 attempts, 20-150ms backoff
                                  - Database isolation: One SQLite file per active tenant

[ Tier 2: Multi-Tenant ] ──────>  PostgreSQL (Prisma ORM) + Redis
                                  - Accounts, budgets, API key pools, cached completions
                                  - Atomic INCR for RPM/TPM rate limits
                                  - Redis flow state managers for multi-tenant MCP OAuth redirects [CLAIM-179]
                                  - CSRF binding cookies (OAUTH_CSRF_COOKIE) for SSE connection mappings [CLAIM-179]

[ Tier 3: Memory / RAG ] ──────>  Qdrant (Vector) + Meilisearch (Faceted)
                                  - Dense HNSW indexes, typo-tolerant skill search
```

### SQLite Write Lock Contention Gotchas
*   **Gotcha**: SQLite in WAL (Write-Ahead Logging) mode allows multiple concurrent readers, but only a single writer. Concurrent writes on shared SQLite databases throw `SQLITE_BUSY` write-lock exceptions, which can abort active agent turns.
*   **Mitigation**:
    1.  **Jittered Retry Backoff**: Wrap all database write operations in a retry loop executing up to 15 attempts with randomized backoff delays ranging from 20ms to 150ms [CLAIM-138].
    2.  **Database Separation**: Provision separate SQLite files per conversation or active tenant to eliminate write lock contention across users [CLAIM-138].

### Hybrid Retrieval Pipeline
1.  **Retrieval**: Merges sparse (BM25) and dense vector search (using `embeddinggemma-300M-Q8_0` [CLAIM-113]).
2.  **Fusion**: Applies Reciprocal Rank Fusion (RRF with $k=60$) to combine candidate documents [CLAIM-114].
3.  **Reranking**: Runs a cross-encoder model (`qwen3-reranker-0.6b-q8_0` [CLAIM-113]) to rank the top 30 documents.
4.  **Context Blending**: Scores are blended dynamically, trusting the reranker for the long tail [CLAIM-115].

---

## 4. Tool Sandboxing and Security Controls

### A. Sandbox Infrastructure & Gotchas
*   **Containers**: Spawns isolated Docker/Podman workspace containers.
    *   **Zombie Process Gotcha**: Spawning subprocesses in headless Docker containers without an init system leads to PID 1 zombie process build-ups, consuming system resources and leaking file descriptors.
    *   **Mitigation**: Always run `tini` or `catatonit` as the container's PID 1 process to reap exited processes properly [CLAIM-139].
*   **MicroVMs**: Boots AWS Firecracker KVM microVMs (<5ms boot, 5MB RAM) with a minimal custom compiled `vmlinux` kernel and virtio devices [CLAIM-101, CLAIM-103].
*   **Linux Primitives**: Sandboxes built from scratch utilize `unshare` namespaces (MNT, PID, NET, USER, IPC, UTS), `cgroups v2` resource quotas (CPU limits, 256M memory max, PID ceilings to block fork bombs), `pivot_root` mount pivots, seccomp filters, and stripped Linux capabilities [CLAIM-102].
*   **Browser control**: Connects to the user's headed browser session via a Chrome Extension WebSocket CDP Bridge. This inherits active cookies and session states to bypass Cloudflare and bot-detection systems [CLAIM-104].

### B. Native Tool Safety & Gotchas
*   **Safe Path Resolution**:
    *   **Path Escape Gotcha**: Letting the agent pass relative directory sentinels (`"."`, `"cwd"`, or `".."`) can trick path validators into exposing files outside the workspace root or in incorrect git worktrees.
    *   **Mitigation**: Rejects sentinel paths completely. Enforce resolving paths to absolute formats using realpath evaluation before validating them against the workspace boundary [CLAIM-140].
*   **Sensitive Blocklists**: Blocks modifications to configuration files (`config.yaml`, `.env`) and system paths (`/etc/`, `/boot/`, `~/.ssh/`) [CLAIM-069].
*   **Command Sanitization**: Normalizes terminal strings by stripping ANSI escapes and quotes, NFKC character mapping, and matching commands against a hardline blocklist (`rm -rf /`, `mkfs`, `dd` to raw disks) [CLAIM-071, CLAIM-072].
*   **Sudo & Background Processes**:
    *   **Interactive Hang Gotcha**: In headless, TTY-less terminals, interactive prompts like `sudo` or background processes that do not close their stdout/stderr pipes cause the execution tool to hang indefinitely.
    *   **Mitigation**: Transform blocking `sudo` queries to `sudo -S -p ''` (piping credentials to stdin [CLAIM-141]), and brace-group background compounds (`A && { B & }` [CLAIM-141]) to detach background streams from the terminal session.

---

## 5. Technology Specifications

### Monorepo Stack
*   **Core Engine (Python 3.11+)**: Leverages the Python machine learning and LLM SDK ecosystem. Configured with the **uv** package manager.
*   **API Gateway & Frontend UI (TypeScript / Node 24+)**: Uses **pnpm workspaces** for monorepo routing and type sharing. Binds UI streaming to Server-Sent Events (SSE) reconnecting loops.
*   **Skills & Context conventions**: Adheres to the **SKILL.md** standard (agentskills.io) and **AGENTS.md** configuration walk [CLAIM-047, CLAIM-080].

### Model Routing Specifications (June 2026 Costs)
1.  **Intent Classifier (Nano Tier)**: `openai/gpt-5.4-nano` (~$0.0001/turn).
2.  **summarization & Tool-call parsing (Flash Tier)**: `google/gemini-3.5-flash` / `openai/gpt-5.4-mini` (~$0.001/turn).
3.  **Primary ReAct Loop (Frontier Tier)**: `nvidia/nemotron-3-ultra-550b-a55b` ($0.50 in / $2.20 out - best value [CLAIM-022]) or `z-ai/glm-5.2` ($0.98 in / $3.08 out - open weights [CLAIM-020]).
4.  **Specialized Coding (Subagent Tier)**: `moonshotai/kimi-k2.7-code` ($0.68 in / $3.41 out - 256K context [CLAIM-023]).
5.  **Voice Interaction**: `openai/gpt-audio` / `openai/gpt-audio-mini` (native multi-modal voice processing).

---

## 6. Gateway Channel Connectors & Secure Pairing Protocol

To enable secure remote operator control via third-party messaging clients (SMS, Telegram, Slack, WhatsApp, Discord) and headless CLI/companion app nodes, the harness standardises a gateway connector layer:

### A. Secure Device-Pairing Primitives
*   **One-Time Handshake Token**: Pairing requests generate a transient `SetupPayload` structure holding the gateway URL, a cryptographically random, one-shot bootstrap token, and a 3-minute expiration timestamp (`expiresAtMs`) [CLAIM-124].
*   **URL-Safe Codec**: Setup payloads are serialized to JSON, Base64-encoded, and normalized to a URL-safe alphabet (replacing `+` with `-` and `/` with `_`, stripping trailing `=`) [CLAIM-125].
*   **Network Security Bounds**: Cleartext WebSockets (`ws://`) are strictly disallowed for mobile setup codes unless loopback, emulator bridges (`10.0.2.2`), or private LAN domain configurations (`.local` or private subnet subnets) are resolved. Public routing defaults to `wss://` [CLAIM-128].
*   **Approvals Pipeline**: Ingress handshakes from scanning devices are held in a pending approvals queue (`list.pending`) until explicitly armed (`armPairNotifyOnce`) and approved via CLI `/pair approve` triggers to prevent unauthorized credential grants [CLAIM-129].

### B. Platform-Specific Messaging Connectors
*   **Twilio SMS**: Outbound dispatches are routed to the Twilio REST endpoint using basic auth [CLAIM-130]. Webhook security verifies authenticity by computing the HMAC-SHA1 signature of the concatenated URL and sorted parameters using the Twilio `AuthToken`, validating in a timing-safe manner [CLAIM-131].
*   **Slack**: Inbound requests are validated via signing secret HMAC-SHA256 headers [CLAIM-132]. Outbound translations map agent Markdown text to Slack Block Kit layouts, and conversation mapping resolves using cached `thread_ts` keys [CLAIM-132].
*   **Telegram**: Incoming updates are spooled asynchronously to prevent web server timeouts under load [CLAIM-133]. Forum topic binding creates canonical session threads mapped as `chatId:topicId` to isolate sub-chats [CLAIM-134].
*   **WhatsApp**: Emulates WA Web websocket loops, capturing dynamic QR strings to render setup codes and caching session credentials (`creds.json`) in a local auth store for reconnection stability [CLAIM-135].

### C. Channel Connector Webhook & Socket Gotchas
*   **Twilio Reverse Proxy Gotcha**: When deployed behind reverse proxies or API gateways, Twilio webhook signature verification fails due to absolute URL mismatches (e.g. proxy terminating SSL, swapping `https` to `http`, or altering host headers).
    *   **Mitigation**: Read proxy headers like `X-Forwarded-Proto` and `X-Forwarded-Host` to reconstruct the exact absolute incoming URL before performing the HMAC-SHA1 signature match [CLAIM-143].
*   **WhatsApp Session File Corruption Gotcha**: Personal WhatsApp web clients run dynamic WebSocket loops that update credentials files (`creds.json`) frequently. Sudden connection drops or crashes during a write operation cause file corruption, breaking silent logins.
    *   **Mitigation**: Implement transaction-safe double-buffered file writes. Write credentials updates to a temporary sibling file and perform an atomic rename operation to replace the live `creds.json` file [CLAIM-144].

---

## 7. Observability, Logging, and Tracing Specifications

To inspect nested execution loops, debug agent reasoning steps, and monitor token consumption, the harness defines a standardized observability framework.

### A. OpenTelemetry (OTel) GenAI Semantic Conventions
The harness decouples metrics and traces from third-party vendor libraries by instrumenting the core engine with OpenTelemetry spans. Traces must export the following standard GenAI metadata attributes:
*   `gen_ai.system`: Represents the backend provider (e.g. `openai`, `anthropic`).
*   `gen_ai.request.model` & `gen_ai.response.model`: Specifies target models.
*   `gen_ai.usage.input_tokens` & `gen_ai.usage.output_tokens`: Tracks cost metrics.
*   `gen_ai.request.temperature`: Records generation hyperparameters.

### B. Tracing Provider Integrations
*   **LangSmith**: Used for visual trace rendering of nested loops, run feedback evaluation tags, and direct export of failed runs to test datasets. Enabled via env configurations (`LANGCHAIN_TRACING_V2=true`).
*   **Langfuse**: Open-source, self-hostable trace analyzer that calculates API costs, offers prompt management APIs, and logs execution details. Integrated using the `@langfuse/typescript` or `langfuse` Python client middleware.
*   **Arize Phoenix**: Utilized for local, notebook-driven workspace evaluations and checking prompt embeddings drift. Configured to collect OTel traces on `http://localhost:6006/v1/traces`.

### C. Decoupled Middleware Callback Pattern
Tracer code must never be hardcoded directly inside the core cognitive loops. Instead, the runtime registers event listeners that trigger on execution events:
```typescript
interface AgentLifecycleCallbacks {
  onLlmStart?: (runId: string, prompt: Message[]) => void;
  onLlmEnd?: (runId: string, response: LlmResponse) => void;
  onToolStart?: (runId: string, toolName: string, args: any) => void;
  onToolEnd?: (runId: string, toolName: string, result: any) => void;
  onException?: (runId: string, error: Error) => void;
}
```
The gateway engine intercepts these callback events and broadcasts them to any active tracer backend (LangSmith, Langfuse, or OTel), preserving a clean separation of concerns.

---

## 8. Multi-Model Deliberation & Fusion Architecture

To achieve **beyond-frontier performance** on complex research, analysis, and high-stakes decision tasks, the harness implements a gateway-level multi-model deliberation system inspired by OpenRouter Fusion [CLAIM-145].

### A. The Panel + Judge Pipeline

```
┌─────────────────────────────────────────────────────────────────┐
│ Gateway receives tool call: harness__fusion                     │
│                                                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                     │
│  │ Panel A  │  │ Panel B  │  │ Panel C  │  (parallel, isolated)│
│  │ + search │  │ + search │  │ + search │                      │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘                     │
│       │              │              │                            │
│       └──────────────┼──────────────┘                            │
│                      ▼                                           │
│              ┌──────────────┐                                    │
│              │  Judge Model │  (structured JSON analysis)        │
│              └──────┬───────┘                                    │
│                     ▼                                            │
│  { consensus, contradictions, blind_spots, unique_insights }     │
│                     ▼                                            │
│              Primary Model writes final answer                   │
└─────────────────────────────────────────────────────────────────┘
```

### B. Specifications

*   **Panel Dispatch**: The gateway dispatches the query to 2–8 panel models in parallel via `Promise.allSettled()` through the LiteLLM proxy. `allSettled` ensures partial panel failures don't abort the entire deliberation [CLAIM-145].
*   **Panel Isolation**: Panel models operate in **strict isolation** — they never see each other's outputs during the initial response phase, preventing anchoring bias [CLAIM-145].
*   **Judge Schema**: The judge produces **structured JSON** (not freeform merge) identifying: consensus (high-confidence agreements), contradictions, partial coverage, unique insights, and blind spots [CLAIM-145].
*   **Anonymity**: Model identifiers are stripped from panel responses before presentation to the judge to prevent lab-bias (e.g., GPT judges favoring GPT outputs) [CLAIM-150].
*   **Recursion Protection**: Fusion calls carry an `x-harness-fusion-depth` header. The tool refuses injection at depth > 0, keeping deliberation bounded to a single level [CLAIM-146].
*   **Anti-Sycophancy** (Council variant): When implementing debate rounds, use rotating challengers and anti-capitulation prompts to prevent models from simply agreeing with the majority [CLAIM-150].

### C. Cost & Performance Evidence

*   **DRACO Benchmark**: Budget fusion panels (e.g., 3× Flash-tier models + 1 frontier judge) outperform standalone frontier models at ~50% of the cost [CLAIM-157].
*   **Self-Synthesis**: Even pairing a model with itself and synthesizing produces measurably better outputs than a single run [CLAIM-157].
*   **MoA Paper (ICLR 2025)**: Open-source-only layered MoA achieved state-of-the-art on AlpacaEval 2.0, outperforming GPT-4 standalone [CLAIM-147].
*   **Hallucination Reduction**: Multi-agent consensus reduces hallucination rates by ~35.9% compared to single-model setups [CLAIM-151].

### D. Supported Deliberation Patterns

The harness supports multiple orchestration patterns, selectable per-request:

| Pattern | Implementation | Best For |
| :--- | :--- | :--- |
| **Panel + Judge (Fusion)** | Gateway tool: `harness__fusion` | Research, factual accuracy |
| **Supervisor-Worker Swarm** | `Team*` tools / `Agent` delegation | Task decomposition |
| **Council / Debate** | Multi-round via graph nodes | Contentious analysis |
| **Mixture-of-Agents** | Layered sequential refinement | Complex reasoning |
| **Command-Based Handoff** | LangGraph `Command.PARENT` updates [CLAIM-185] | Sequential transitions, dynamic multi-agent delegation |

*   **Command-Based Handoff Routing**: Outgoing edges compile to specialized transfer tools. When called, the tool returns a LangGraph `Command` to parental graphs (`graph: Command.PARENT`), dynamically routing execution to the target subgraph [CLAIM-185].
*   **Handoff Receiver Filtering**: The receiving agent node runs a reception filter (`processHandoffReception`) to extract handoff instructions, source agent, and parallel siblings, stripping out preceding tool calls and messages from the prompt window so the target agent receives a clean context and avoids premature termination [CLAIM-186].

For detailed research including taxonomy, self-hosted implementation code, anti-patterns, benchmarks, and decision matrices, see [multi_model_deliberation_and_swarms.md](06_subagents/multi_model_deliberation_and_swarms.md).

---

## 9. Generative UI, MCP Apps, & MCP UI Specifications

To deliver interactive graphical tools without violating security principles or bloating backend resources, the harness supports **Intent-Based Generative UIs** and **SEP-1865 MCP Apps** [CLAIM-170, CLAIM-174].

### A. Generative UI Streaming Specification
1.  **JSON-Schema Gating**: The frontend must never render unstructured agent-generated code. Outbound Response calls restrict output structures using a JSON Schema (passed in `response_format` payload) detailing permissible components and properties [CLAIM-171].
2.  **Client-Side Component Registry**: The client maintains a mapping registry of allowed schemas to concrete React components. Unmapped components are rejected [CLAIM-171].
3.  **Progressive Parsing**: Uses `sdk.vercel.ai/docs/ai-sdk-ui` stream parsing hooks to incrementally build and render dynamic cards as properties flow over Server-Sent Events (SSE) [CLAIM-172].

### B. MCP Apps UI Sandboxing Specification (SEP-1865)
1.  **Isolated Iframe Boundaries**: Remote MCP servers offering dynamic visual widgets deliver standalone HTML/JS bundles. The host container renders them inside an isolated `<iframe>` configured with strict security headers:
    *   `sandbox="allow-scripts"` blocks cookies access, document path modifications, and top-level navigation [CLAIM-175].
    *   Content Security Policies (CSP) block external network endpoints [CLAIM-175].
2.  **postMessage Communication Bridge**: Interactive components communicate via `postMessage` using JSON-RPC structures [CLAIM-174]:
    *   *Iframe to Host (Actions)*: `mcp/appAction` calls trigger host-side agent tools or state changes [CLAIM-174].
    *   *Host to Iframe (Updates)*: `mcp/appStateUpdate` broadcasts tool result states back to the sandboxed visual card [CLAIM-174].

### C. Stateless Core & Asynchronous Tasks Extension
1.  **Durable Session Checkpointing**: The core cognitive loops are stateless. Session state, conversation history, and progress checkpoints are saved locally (using WAL trigram SQLite databases) [CLAIM-177, CLAIM-178].
2.  **Tasks Extension Progress Streams**: Long-running background processes (such as remote compile or test execution checks) are modeled as client-driven durable Tasks, emitting step progress notifications (`mcp/taskProgress`) to keep connection sockets ephemeral and prevent memory leaks [CLAIM-178].

For the complete technical breakdown, security sandboxing, and TypeScript sdk configurations, refer to the topic research: **[mcp_apps_and_ui.md](08_mcps/mcp_apps_and_ui.md)**.

---

## 10. Human-in-the-Loop (HITL) & Conversation Steering Specifications

To guarantee safety, steerability, and control during autonomous executions, the harness implements a dual-layer Human-in-the-Loop (HITL) subsystem supporting message steering, request-local cancellations, and multi-tier auto-approve policies [CLAIM-190, CLAIM-194].

### A. Conversation Steering Protocol
1.  **Steering Intercept Node**: When executing loops (either state graphs or linear while-loops), the runner checks a shared message buffer before the next generation step [CLAIM-190].
2.  **Mid-Turn Injection**: If a human operator injects a direction message, the loop inserts a `HumanMessage` immediately after the last `ToolMessage`, bypassing the current turn's tool response sequence [CLAIM-189].
3.  **Strict Alternation Correction**: Adapter middlewares must re-serialize the turn payload (collapsing consecutive User messages, inserting placeholders, or updating instruction parameters) to guarantee role alternation requirements before hitting provider APIs [CLAIM-189].

### B. Request-Local Cancellation Specification
1.  **Thread Abort Signal**: When a session interrupt is requested, the controller issues an abort command [CLAIM-190].
2.  **Connection Termination**: The network client wrapper force-closes the socket connections for any active LLM generation calls.
3.  **Request-Local Cancellation Token Check**: The request-local handler traps any HTTP transport errors (e.g. `RemoteProtocolError`, `ConnectError`). It checks a request-local thread cancellation token. If the token is active, it raises an `InterruptedError` and bubbles up cleanly [CLAIM-191]. If the token is inactive, it propagates the exception to trigger the standard retry/failover cascade (preventing the cascading retry hang described in PR #6600) [CLAIM-191].

### C. Tool Approval Governance Gates
1.  **Dangerous Action Gating**: High-risk tool categories (e.g. shell execute, destructive file write, subagent delegation) trigger a loop pause.
2.  **Approval Handshake Broker**: The engine blocks execution, caches current session state to SQLite WAL checkpointers, and publishes a JSON-RPC notification payload (`harness/toolApprovalPending`) over SSE/WebSockets or mobile APNS push tokens [CLAIM-192].
3.  **Response Handling**: The runner resumes execution ONLY upon receiving a signed approval payload:
    *   *Approve*: Executes the tool with the original arguments.
    *   *Deny*: Returns a custom `ToolError` message to the loop ("User rejected tool execution").
    *   *Edit*: Replaces args with user-edited versions and resumes.

### D. Bypass & Exclusions Policies
The harness supports global and session configuration modes to tune safety constraints [CLAIM-194]:

*   **Bypass Configurations**:
    *   `ask`: Force approval prompts for every dangerous execution [CLAIM-194].
    *   `workspace_session`: Auto-approve operations inside the target project workspace boundaries [CLAIM-194].
    *   `session`: Auto-approve all tools for the current active socket session [CLAIM-194].
*   **Path Sensitivity Exceptions**: Regardless of active auto-approve/bypass settings, file writes targeting credentials, system files, or project configs (e.g., `.env`, `.git/config`, SSH private keys) are hard-gated and must always prompt for interactive user confirmation [CLAIM-195].
*   **Headless Swarm Gating**: Child agents spawned by cron tasks or webhooks operate with auto-deny gates by default, preventing unattended loops from consuming unauthorized cloud spends or writing destructive files [CLAIM-196].

For detailed code paradigms, cascading cancellation fixes, and framework implementations, see the dedicated document: **[human_in_the_loop_steering.md](04_agent_loops/human_in_the_loop_steering.md)**.

---

## 11. Agent Scratchpads & Session Memory Specifications

To maintain planning integrity, preserve context across compactions, and isolate testing scripts, the harness implements a tripartite session memory architecture comprising in-memory checklist stores, isolated workspace rules, and Knowledge Graph indexing [CLAIM-197, CLAIM-203, CLAIM-205].

### A. In-Memory Todo & Re-Injection Specification
1.  **State Schema**: The runtime allocates a session-isolated `TodoStore` tracking checklist items in JSON [CLAIM-198]:
    ```json
    {
      "id": "item_identifier",
      "content": "actionable task description",
      "status": "pending | in_progress | completed | cancelled"
    }
    ```
2.  **Tool-Driven Mutation**: The agent reads and writes this list via the `todo` tool [CLAIM-197].
3.  **Active List Re-Injection**: Upon context compression (compaction events), the compiler evicts old raw messages but reads active `pending` and `in_progress` checklist items. It formats and appends them as a system-like message block to the head of the new context window, preserving task focus [CLAIM-199].
4.  **Completed Item Gating**: To avoid infinite loops or duplicate execution of already-resolved items, the re-injection block explicitly filters out and discards `completed` and `cancelled` status items [CLAIM-200].

### B. Workspace Rule and Instruction Spec
1.  **Repository Setup Instructions**: The agent boots by reading and parsing a static instruction file (`CLAUDE.md`) in the repository root to load coding standards, test rules, and directory structures [CLAIM-202].
2.  **Modular Rule Directories**: The compiler progressive-loads specific subfolder guidelines from a hidden `.claude/rules/*.md` directory cascade as tool calls traverse sub-directories [CLAIM-202].
3.  **Learned Auto-Memory Logs**: Agent corrections and preferences (e.g. "prefer pnpm workspaces") are dynamically logged to a local `.claude/memory.md` file [CLAIM-204]. This file remains editable by the developer and is fed to the agent on session startup [CLAIM-204].

### C. Isolated App Data Sandbox Specification
1.  **Workspace Directory Containment**: The agent must never write scratch scripts, diagnostics caches, or mock outputs to the user's primary code tree [CLAIM-203].
2.  **Isolated App Path Allocation**: The host allocates a conversation-locked app data directory:
    *   `<appDataDir>/brain/<conversation-id>/scratch/` [CLAIM-203].
3.  **Write Isolation Gates**: All temporary script compilations, environment probes, and scratch variables are forced into this isolated directory path, maintaining user workspace cleanliness [CLAIM-203].

### D. Knowledge Graph Memory Specification
1.  **Triplet Extraction**: The memory manager runs an asynchronous pipeline that extracts entity-relation triplets (`[Subject] -> [Relation] -> [Object]`) from chat transcripts [CLAIM-205].
2.  **Pluggable Graph Providers**: The harness implements a pluggable `MemoryProvider` interface supporting graph-based engines (such as Mem0, Graphiti, or Cognee) [CLAIM-205, CLAIM-207].
3.  **Temporal Edge Weighting**: Graph stores (e.g., local SQLite-based Hindsight or cloud Graphiti Neo4j databases) index triplets with edge timestamps [CLAIM-205, CLAIM-207].
4.  **Personalization & Contradiction Resolution**:
    *   *Fact Resolution*: Stale relationships (e.g. `[App] -> [uses] -> [Node 20]`) are invalidated or updated dynamically when contradictory triplets flow in (e.g. `[App] -> [uses] -> [Node 24]`), resolving context amnesia [CLAIM-206].
    *   *Semantic Compaction*: High context pressure triggers the compaction engine to replace raw conversation histories with multi-hop graph triplet traversals, reducing token load by up to 90% while retaining absolute logical grounding [CLAIM-206].

For detailed research covering scratchpad patterns, auto-memory logs, and knowledge graphs, see: **[agent_scratchpads_and_session_memory.md](05_agent_memory/agent_scratchpads_and_session_memory.md)**.

---

## 12. Agent Self-Improvement & Curation Specifications

To continuously adapt to new development guidelines, resolve catalog drift, and track developer behavior without manual maintenance, the harness implements a background curation and self-improvement subsystem [CLAIM-208, CLAIM-213].

### A. Curation Telemetry sidecar (`.usage.json`)
1.  **Observability Partitioning**: Telemetry metrics are isolated from instruction files to prevent context contamination and VCS conflicts. The system writes tracking logs to a central, lock-serialized sidecar file (`~/.hermes/skills/.usage.json`) [CLAIM-209].
2.  **Usage Counters**: Standard counters track:
    *   `view_count`: Programmatic reads by the model [CLAIM-209].
    *   `use_count`: Prompts loaded into session context [CLAIM-209].
    *   `patch_count`: Model-driven instruction corrections [CLAIM-209].

### B. Curation Invocation Lifecycle
1.  **Inactivity Checking Gate**: An inactivity check runs during CLI session startups and on cron-ticker loops, verifying:
    *   Time elapsed since the last curator run exceeds `interval_hours` (default: 7 days) [CLAIM-208].
    *   The primary conversation session has been idle for `min_idle_hours` (default: 2 hours) [CLAIM-208].
2.  **Isolated Background review**: When the gate is cleared, the system forks an `AIAgent` instance executing on a cheaper auxiliary model slot (`auxiliary.curator`) on a separate prompt cache to prevent active conversation disruptions [CLAIM-208].

### C. State Transitions and Safety Guards
1.  **Timelines**: Inactive, agent-created skills automatically transition states:
    *   *Stale*: Idle for `stale_after_days` (default: 30) [CLAIM-211].
    *   *Archived*: Idle for `archive_after_days` (default: 90), triggering automated directory moves into `.archive/` paths [CLAIM-211].
2.  **Pin Shielding**: Pinned skills (`"pinned": true`) bypass all auto-transitions and block deletion requests (`skill_manage(action="delete")`) while still permitting `patch` modifications to fix logic bugs without unpinning [CLAIM-212].
3.  **Built-in Exclusions**: Protected built-in commands (e.g. `plan` skill) and manual user skills are hardcoded as non-curatable to safeguard core system command paths [CLAIM-210].

### D. LLM Curation & Consolidation
When `curator.consolidate: true` is active, the background reviews agent evaluates candidate skills:
1.  **Clustering & Merging**: Group candidate skills by prefix domains, merging overlapping behaviors into class-level umbrella files [CLAIM-213].
2.  **Subfile Demotion**: Demote micro-fixes to references, templates, or scripts files inside the umbrella directory and archive the source skill [CLAIM-213].
3.  **Link Integrity**: Rewrite relative links and re-home assets to prevent broken reference pointers [CLAIM-214].
4.  **Vulnerability Scanner**: Run AST-level checking and threat scanners before registering new skills to prevent remote code injection [CLAIM-215].
5.  **Snapshots & Rollbacks**: Pre-run folders are tarballed (`skills.tar.gz`) under `.curator_backups/` to allow developers to rollback buggy merges [CLAIM-216].

### E. Developer Preference Logs
1.  **Auto-Memory Logger**: Collect user style preference corrections (e.g. library preferences, styling formats) and commit them to a local workspace `.claude/memory.md` file [CLAIM-204].
2.  **Audits**: Developers inspect and modify preferences using CLI commands (`/memory`) or manual file edits [CLAIM-204].

For detailed research covering curation engines, preference logs, and RISE/TT-SI loops, see: **[self_improving_agents_and_learning_loops.md](09_skills_md/self_improving_agents_and_learning_loops.md)**.



