# 18 — Architecture Recommendations

## What Was Researched

Synthesized architecture recommendations for building a modern, model-agnostic agent harness, based on findings from all 17 preceding research directories and 10 local codebase studies.

## Which Sources Were Used

All previous research directories (01–15, 17) and all 10 local codebases.

## Recommended Architecture: The Composite Approach

### Core Principle: Narrow Waist, Rich Edges

Adopt Hermes's "narrow core, capability at edges" principle as the foundational design constraint.

```
┌──────────────────────────────────────────────────────────────┐
│                    APPLICATION LAYER                         │
│  Coding Agent │ Personal Assistant │ Research Agent │ Custom │
├──────────────────────────────────────────────────────────────┤
│                    GATEWAY / ORCHESTRATION                   │
│  Multi-channel routing │ Session management │ Cron scheduler │
├──────────────────────────────────────────────────────────────┤
│                    AGENT RUNTIME                             │
│  Agent loop │ Tool dispatch │ Memory │ Skills │ Subagents    │
├──────────────────────────────────────────────────────────────┤
│                    AI SDK (NARROW WAIST)                     │
│  Provider translation │ Streaming │ Tool calling │ Caching   │
├──────────────────────────────────────────────────────────────┤
│                    MODEL PROVIDERS                           │
│  OpenAI │ Anthropic │ Google │ xAI │ NVIDIA │ via LiteLLM   │
└──────────────────────────────────────────────────────────────┘
```

### Layer 1: AI SDK (Narrow Waist)

**Recommendation**: Use LiteLLM as the provider translation layer

| Decision | Recommendation | Rationale |
|----------|---------------|-----------|
| Provider translation | LiteLLM's BaseConfig pattern | 100+ providers, battle-tested, OpenAI-compat output |
| Model specification | `provider:model` URI format | Industry standard (LangChain, Pi, Hermes) |
| Wire format | OpenAI Chat Completions | Universal, maximum ecosystem compatibility |
| Streaming | SSE (Server-Sent Events) | Standard for LLM streaming |
| Type system | TypeScript with Zod | Pi/OpenRouter SDK pattern for type safety |

### Layer 2: Agent Runtime

**Recommendation**: While-loop agent with LangGraph-inspired state management

| Decision | Recommendation | Rationale |
|----------|---------------|-----------|
| Agent loop | While-loop with budget tracking | Simpler than graph, proven (Hermes/Pi/Codex) |
| Iteration cap | Default 90, configurable | Hermes's default, prevents runaway costs |
| Grace call | One extra turn after budget | Hermes pattern, improves completion quality |
| State persistence | SQLite + FTS5 checkpoints | Zero-dependency, fast, proven (Hermes) |
| Memory | MemoryProvider ABC | Hermes pattern, pluggable backends |
| Skills | SKILL.md format | Emerging standard |
| Subagents | Context-isolated, budget-shared | Hermes delegation pattern |
| Tool registry | Auto-discovery with `register()` | Hermes pattern |
| Tool extensibility | MCP first, plugins second | Codex + Hermes principle |
| Token Calibration | Cumulative billing ratio scaling | Corrects local tokenizer discrepancies against provider bills [CLAIM-183] |
| Overhead Calibration | Dynamic tool schema ceiling (15% variance) | Corrects estimated schema overhead using real provider feedback [CLAIM-184] |
| Multi-Agent Handoffs | LangGraph Command-based transfers | Outgoing handoffs return Command parenting with incoming receiver context filtering [CLAIM-185, CLAIM-186] |
| Observation Masking | Character-limited ToolMessage previews (~300 chars) | Mask consumed tool results above 80% context pressure to keep system cache hits high [CLAIM-187] |
| Summary Infiltration | HumanMessage injection on clean state | Mid-run summaries compete for message budget rather than inflating system instructions [CLAIM-188] |

### Layer 3: Gateway / Orchestration

**Recommendation**: OpenClaw-inspired gateway with Hermes features

| Decision | Recommendation | Rationale |
|----------|---------------|-----------|
| Architecture | Gateway-centric (OpenClaw) | Scalable, multi-channel |
| Language | TypeScript (Node.js) | Full-stack, shared with frontend |
| Session management | Per-channel isolated sessions | OpenClaw pattern |
| Multi-agent | Route channels to agents | OpenClaw pattern |
| Cron scheduling | Natural language + cron syntax | Hermes pattern |
| Platform delivery | Webhook-based routing | Both Hermes and OpenClaw |

### Layer 4: Application Layer

**Recommendation**: Modular applications built on the runtime

| Application | Stack | Reference |
|-------------|-------|-----------|
| CLI | prompt_toolkit or Ink | Hermes/Pi |
| TUI | Ink (React in terminal) | Hermes |
| Desktop | Electron + assistant-ui | Hermes |
| Web dashboard | React + Vite + assistant-ui | OpenClaw |
| Mobile | React Native / WebSocket node | OpenClaw |

## Technology Choices

### Primary Stack

| Component | Technology | Why |
|-----------|-----------|-----|
| Agent core | Python 3.11+ | LLM SDK ecosystem dominance |
| Gateway | TypeScript (Node 24+) | Full-stack, shared with frontend |
| Frontend | React + assistant-ui | Reference component library |
| Package manager (Python) | uv | Modern, fast, reproducible |
| Package manager (TS) | pnpm workspace | Efficient monorepo management |
| Local database | SQLite + FTS5 | Zero-dependency, fast |
| Scale database | PostgreSQL + Redis | When multi-user is needed |
| TTS | ElevenLabs (pluggable) | Dominant open-source choice |
| Observability | OpenTelemetry | Standard, LangSmith-compatible |

### Model Routing Strategy (5-Tier)

From `13_model_agnostic_harness_architecture/model_landscape_june_2026.md`:

| Tier | Use Case | Recommended Default |
|------|----------|-------------------|
| Frontier reasoning | Complex analysis, planning | Claude Fable 5 or GPT-5.5 |
| Fast frontier | Standard agent tasks | Kimi K2.7 Code or Nemotron 3 Ultra |
| Flash | Real-time, high-volume | Gemini 3.5 Flash or GPT-5.4 Mini |
| Nano | Embeddings, classification | GPT-5.4 Nano |
| Voice | Audio I/O | GPT Audio or Grok Voice TTS |

### Security Model

| Aspect | Recommendation | Reference |
|--------|---------------|-----------|
| Sandboxing | Docker (default) + OS-native (option) | Codex |
| Dependency pinning | `>=floor,<ceiling` | Hermes |
| Supply-chain | Exact versions + shrinkwrap | Pi |
| Tool approval | User approval for destructive ops | Hermes |
| Skill validation | AST-level auditing | Hermes |
| Context files | Read-only from agent | All |

## File Convention Standards

| File | Purpose | Standard |
|------|---------|----------|
| `AGENTS.md` | Project instructions | De facto universal |
| `SKILL.md` | Procedural knowledge | agentskills.io |
| `SOUL.md` | Agent persona | OpenClaw |
| `config.yaml` | User configuration | Hermes |
| `.env` | Secrets only | Hermes |

## Critical Design Constraints

1. **Prompt Caching is Sacred (Design for Byte-Stability)**
   *   **What/Why**: Modern frontier models (Anthropic, DeepSeek, OpenAI) charge up to 90% less for cached input tokens. Prompt caching works by storing prefix spans in memory. Any modification to a prefix invalidates the entire cache downstream.
   *   **When to Use**: Essential for multi-turn cognitive loops where the system instruction and tool definitions remain static, but message histories accumulate.
   *   **How to Design**:
       *   **Order Matters**: Place volatile variables (such as the current date/time, user query, and dynamic database context) at the absolute *tail* of the message array. Keep the system prompt, guidelines, and tool schemas at the *head*.
       *   **Byte-Stability**: Clean whitespaces, sort tools alphabetically by name, and standardize date strings to UTC-day-only formats.
       *   **Tailored Slicing**: Ensure the prefix hits model-defined cache boundaries (e.g., Anthropic's 1024-token minimum or 2048-token increments).
2. **Minimize Regex & Deterministic Logic (LLM-First and AST Parsing)**
   *   **Constraint**: Restrict the use of regular expressions to trivial boundary validation (e.g., prefix checks like `text.startsWith('/')`). Never use regex to parse tool call payloads, JSON configurations, or nested structures.
   *   **Rationale**: Regex parsing is brittle to formatting variations, markdown wrapping, escaping, and presents a risk of catastrophic backtracking (ReDoS).
   *   **Alternatives**:
       *   **Programmatic Parsers**: Use standard JSON/JSON5 parsers or AST builders to parse code blocks or JSON payloads.
       *   **LLM-First Parsing**: Use model-native structured output schemas (JSON schema validation) or delegate parsing to a fast, dedicated LLM helper.
3. **Tool footprint matters** — Every core tool costs tokens on every API call.
4. **Context discipline** — Implement both caps and compression.
5. **Budget tracking from day one** — Token + cost + iteration budgets.
6. **Message role alternation** — Never two same-role messages in a row.
7. **Skills as user messages** — Don't inject into system prompt.

---

## Tracing & Observability Architecture

To debug agent loops, analyze performance bottlenecks, and monitor production runs, the harness must support unified tracing.

### 1. Tracing Standard: OpenTelemetry (OTel)
*   **Recommendation**: Use OpenTelemetry Semantic Conventions for GenAI to decouple tracing from specific backend vendors.
*   **Implementation**: Instrument LLM clients and tool dispatch functions with OTel Spans. Trace attributes should follow standard keys:
    *   `gen_ai.system` (e.g., `openai`, `anthropic`)
    *   `gen_ai.request.model` and `gen_ai.response.model`
    *   `gen_ai.usage.input_tokens` and `gen_ai.usage.output_tokens`
    *   `gen_ai.request.temperature`

### 2. Tracing Tool Integrations
*   **LangSmith (Commercial/Enterprise)**:
    *   **Use Case**: Deep run nesting visualizer, run feedback loops (attaching feedback scores to runs), and exporting failing agent runs directly into test datasets.
    *   **Integration**: Seamlessly enabled via environment flags (`LANGCHAIN_TRACING_V2=true`) and standard callback handlers.
*   **Langfuse (Open-Source/Self-Hostable)**:
    *   **Use Case**: Zero-dependency self-hosted tracing. Offers visual traces, cost estimation, prompt version management, and SDK middleware.
    *   **Integration**: Connect via `@langfuse/typescript` or `langfuse` Python SDK using decorators or client wrappers.
*   **Arize Phoenix (Open-Source/Local-First)**:
    *   **Use Case**: Local Jupyter notebook evaluations and zero-config local tracer servers. Excellent for checking prompt drift and conducting cosine-similarity evals on agent retrievals.
    *   **Integration**: Run `phoenix.server.start()` locally and export OTel traces directly to the local collector endpoint (`http://localhost:6006/v1/traces`).

### 3. Decoupled Middleware Pattern (Callbacks)
*   Do not hardcode vendor-specific tracing code directly inside the agent loop. Instead, implement a **Lifecycle Callback Registry** in the runtime:
    ```typescript
    interface AgentLifecycleCallbacks {
      onLlmStart?: (runId: string, prompt: Message[]) => void;
      onLlmEnd?: (runId: string, response: LlmResponse) => void;
      onToolStart?: (runId: string, toolName: string, args: any) => void;
      onToolEnd?: (runId: string, toolName: string, result: any) => void;
      onException?: (runId: string, error: Error) => void;
    }
    ```
    This callback interface broadcasts events to active tracers (LangSmith, Langfuse, OTel) without leaking tracking libraries into cognitive reasoning files.

---

## Multi-Model Deliberation & Fusion Recommendations

### When to Use Multi-Model Deliberation

| Scenario | Recommended Pattern | Reasoning |
| :--- | :--- | :--- |
| **Research reports requiring citations** | Panel + Judge (Fusion) | Diverse perspectives improve factual accuracy and coverage |
| **Code review / security audit** | Council / Debate | Peer critique catches bugs that single-model consensus misses |
| **Complex multi-file refactoring** | Supervisor-Worker Swarm | Task decomposition across specialist workers |
| **High-stakes legal/medical analysis** | Council with HITL gate | Peer review + human sign-off for critical decisions |
| **Simple extraction / summarization** | Single model | Fusion adds unnecessary latency and cost — it is an escalation lane |

### Recommended Implementation

1. **Gateway-Level Fusion Tool**: Register `harness__fusion` as a gateway-injected tool. The primary model decides when to invoke deliberation — it is not forced on every request [CLAIM-145].
2. **Budget Panels First**: Start with 3× Flash-tier panel + 1 frontier judge. Budget panels outperform standalone frontier models on DRACO at ~50% cost [CLAIM-157].
3. **Structured JSON Judge Output**: Judge must produce structured analysis (consensus, contradictions, blind spots) — not freeform merge [CLAIM-145].
4. **Anonymize Panel Responses**: Strip model identifiers before judge evaluation to prevent lab-bias [CLAIM-150].
5. **Recursion Protection**: Depth headers prevent infinite nested fusion calls [CLAIM-146].
6. **`Promise.allSettled()` for Panel Dispatch**: Partial panel failures should not abort the entire deliberation.

### Framework Selection for Deliberation

| Framework | Best Pattern | Why |
| :--- | :--- | :--- |
| **LangGraph** | All patterns (via StateGraph) | Production-grade, auditable, supports cycles and conditional edges |
| **CrewAI** | Supervisor-Worker | Intuitive role-based setup, quick prototyping |
| **OpenAI Agents SDK** | Supervisor-Worker (handoffs) | Production-grade, built-in tracing |
| **Microsoft Agent Framework** | Enterprise graph workflows | Type-safe, Azure-native, successor to AutoGen |
| **Custom Gateway Tool** | Panel + Judge (Fusion) | Lightweight, no framework dependency, integrates with LiteLLM proxy |

For detailed research including taxonomy, self-hosted implementation code, anti-patterns, benchmarks, and decision matrices, see [multi_model_deliberation_and_swarms.md](06_subagents/multi_model_deliberation_and_swarms.md).

---

## Generative UI & MCP UI Recommendations

### Core Recommendations for Dynamic UIs

| Recommendation | Implementation Details | Rationale |
|:---|:---|:---|
| **Declarative Registry Gating** | Client-side Component Registry mapping schemas to React components | Blocks arbitrary code execution, establishing a strict security perimeter [CLAIM-171, CLAIM-175] |
| **Isolated Sandbox Rendering** | Load remote MCP widgets inside an isolated `<iframe>` with `sandbox="allow-scripts"` and a strict Content Security Policy (CSP) | Prevents remote server templates from stealing user cookies or parent window access [CLAIM-175] |
| **Bi-directional postMessage Sync** | Establish JSON-RPC bridges over `postMessage` to sync iframe widget state to host agent variables | Keeps host-engine and visual views in lockstep, letting user interactions run subsequent tools [CLAIM-174] |
| **Stateless Core Tasks** | Implement client-driven durable state machines (durable Tasks) storing checkpoint state in SQLite | Eliminates TCP/HTTP socket exhaustion on background loops [CLAIM-177, CLAIM-178] |

### Framework Selection for Agent UIs

*   **Vercel AI SDK (AI SDK UI)**: Use for progressive JSON token stream rendering, letting client components render layouts immediately as parameter nodes materialize [CLAIM-172].
*   **CopilotKit**: Use for active state updates (AG-UI protocol) syncing client components directly with background agent states [CLAIM-173].
*   **Mastra AI & `mcp-use`**: Use to construct and expose rich visual tools on local/remote MCP servers [CLAIM-176].

For detailed security guidelines, postMessage schemas, and Tasks lifecycles, see the dedicated document: **[mcp_apps_and_ui.md](08_mcps/mcp_apps_and_ui.md)**.


---

## Human-in-the-Loop & Execution Control Recommendations

### Core HITL Design Guidelines

| Aspect | Recommendation | Rationale |
|:---|:---|:---|
| **Conversation Steering** | Implement dynamic user message injection between tool executions (mid-turn) rather than force-killing the session context. Enforce strict alternation constraints immediately post-injection [CLAIM-189]. | Lets users correct errors in real-time without wasting historical token context and compute [CLAIM-189]. |
| **Request-Local Aborts** | Wire up request-local cancellation tokens to worker exception handlers. When force-closing connections, check this token to bypass default connection retries [CLAIM-191]. | Prevents cascading retry hangs where cancelled workers persist and conflict with subsequent user messages (PR #6600 fix) [CLAIM-191]. |
| **Granular Bypass Policies** | Support 3 bypass policy levels: `Ask` (micro-confirmations for every tool execution), `Session Bypass` (auto-approve tools during current session), and `Workspace Safe` (auto-approve non-sensitive workspace paths) [CLAIM-194]. | Maximizes developer velocity while maintaining tight boundaries for critical resources. |
| **Path Sensitivity Gates** | Hardcode file edit exclusions for sensitive files (e.g. `.env`, `.git/config`, SSH keys) to always force interactive approvals, regardless of bypass policy settings [CLAIM-195]. | Mitigates prompt injection attacks targeting private credentials. |
| **Headless Swarm Auto-Deny** | Subagent loops triggered by webhooks or cron workers should default to auto-deny policies when prompting for dangerous tool execution [CLAIM-196]. | Prevents runaway resource consumption or automated workspace corruption in unattended loops [CLAIM-196]. |

For detailed code paradigms, cascading cancellation fixes, and framework implementations, see the dedicated document: **[human_in_the_loop_steering.md](04_agent_loops/human_in_the_loop_steering.md)**.



---

## Agent Scratchpad & Graph-Based Session Memory Recommendations

### Core Memory & Scratchpad Design Guidelines

| Aspect | Recommendation | Rationale |
|:---|:---|:---|
| **Private Sandbox Scratchpads** | Isolate transient experimental scripts, temporary data caches, and test script variants to a private, conversation-locked directory outside the workspace tree [CLAIM-203]. | Prevents polluting the user's repository version history and avoids triggering project linting or staging tools [CLAIM-203]. |
| **Active Task Re-Injection** | Support in-memory or database-backed task lists. Upon context compression/compaction events, format and re-inject active items back into the prompt window [CLAIM-199]. | Preserves the agent's task state and active plan across history compactions, preventing lost focus [CLAIM-199]. |
| **Completed Task Gating** | Filter out completed and cancelled checklist items from the re-injection stream [CLAIM-200]. | Gating completed work prevents the agent from re-doing already finished sub-tasks [CLAIM-200]. |
| **Workspace Rule Files** | Standardize project instructions in `CLAUDE.md` and custom rules in `.claude/rules/*.md` files [CLAIM-202]. | Provides static, version-controlled coding guidelines that are easily parsed on session bootstrap [CLAIM-202]. |
| **Graph-Based Memory Traversal** | Utilize open-source Knowledge Graph memory solutions (such as Mem0, Graphiti, or Cognee) for multi-hop personalization [CLAIM-205] and temporal fact resolution [CLAIM-206]. | Resolves contradictory facts dynamically by deprecating stale graph edges and allows reasoning over complex relationship networks [CLAIM-206]. |

For detailed research covering scratchpad patterns, auto-memory logs, and knowledge graphs, see: **[agent_scratchpads_and_session_memory.md](05_agent_memory/agent_scratchpads_and_session_memory.md)**.

---

## Agent Self-Improvement & Curation Recommendations

### Core Self-Improvement & Curation Guidelines

| Aspect | Recommendation | Rationale |
|:---|:---|:---|
| **Inactivity Curation** | Trigger background curation passes when the gateway is idle (e.g., 7 days elapsed, 2 hours user idle) [CLAIM-208]. Run passes on a dedicated background fork and cheaper auxiliary model (`auxiliary.curator`) to preserve prompt caches [CLAIM-208]. | Avoids interrupting active developer loops and controls model execution costs. |
| **Telemetry Separation** | Record skill views, uses, and patches inside an isolated JSON sidecar file (`.usage.json`) rather than raw file frontmatter [CLAIM-209]. | Keeps telemetry out of user-authored code trees and prevents VCS merge conflicts. |
| **Lifecycle State Transitions** | Automatically transition unused agent-created skills from `active` -> `stale` (30 days) -> `archived` (90 days, moved to `.archive/` directory) [CLAIM-211]. | Eliminates skill catalog rot and prevents token budget leakage during index scans. |
| **Umbrella Consolidation** | Parse candidate skills to cluster groups, merging overlaps into existing or new class-level umbrella files [CLAIM-213], and demoting narrow session bugfixes to references/templates/scripts [CLAIM-213], while rewriting relative links to preserve package integrity [CLAIM-214]. | Restructures micro-skills into structured, high-signal procedural directories. |
| **Vulnerability Gating** | Run static AST checks and security scanners on newly generated skills before registering them to the harness [CLAIM-215]. | Mitigates prompt injection attacks injecting arbitrary code execution paths. |
| **Pre-Curation Tarballs** | Auto-generate tarball snapshots (`skills.tar.gz`) pre-run under `.curator_backups/` alongside a manifest [CLAIM-216]. | Enables complete developer audibility and rollback of bad curation runs [CLAIM-216]. |
| **Workspace Preference Logs** | Extract developer style preferences to `.claude/memory.md` using a local auto-memory logger [CLAIM-204]. | Keeps preferences auditable and editable using simple CLI tools [CLAIM-204]. |

For detailed research covering curation engines, preferences, and RISE/TT-SI loops, see: **[self_improving_agents_and_learning_loops.md](09_skills_md/self_improving_agents_and_learning_loops.md)**.

## Open Questions for Implementation

1. **Python or TypeScript for agent core?** — Python has ecosystem, TS has full-stack advantage.
2. **Monolithic or distributed?** — Hermes monolith is simpler, OpenClaw gateway scales better.
3. **LiteLLM as dependency or custom provider layer?** — Dependency saves years of work.
4. **Graph-based or while-loop?** — While-loop for v1, graph for v2?
5. **Which memory providers to support first?** — Start with SQLite + one cloud provider?

