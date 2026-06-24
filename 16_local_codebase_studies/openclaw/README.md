# Local Codebase Study: OpenClaw

## Repository: `openclaw/openclaw`
## Local Path: `C:\Users\Adam\Desktop\agent2\openclaw\`
## Language: TypeScript | License: MIT

---

## 1. Overview
OpenClaw is a massive, enterprise-grade, gateway-centric distributed personal assistant platform. Comprising **20,561 files** organized in a monorepo workspace, it represents the most distributed architecture studied. Rather than running a monolithic agent locally, OpenClaw operates a centralized control plane gateway server that coordinates companion apps running thin client runtimes across macOS, Windows, iOS, and Android.

Key differentiators include **26+ messaging channel integrations** (WhatsApp, Teams, Signal, Feishu, matrix, etc.), an **always-listening Voice Wake + Talk Mode**, a **Live Canvas graphical UI**, and **remote push notifications** for system tool execution approvals.

---

## 2. Monorepo Package Structure

OpenClaw splits its codebase into 21 packages under `packages/` to separate LLM abstractions, core loop runtime, messaging protocols, and native tools:

*   **`llm-core` & `llm-runtime`**: Unified provider-agnostic LLM interface supporting streaming and delta-token updates.
*   **`agent-core`**: Defines the ReAct loop executor, type contracts, and runtime dependencies.
*   **`gateway-protocol` & `gateway-client`**: Handles JSON-RPC websocket serialization between backend gateways and client nodes.
*   **`speech-core`**: Core Whisper STT and MLX TTS bindings.
*   **`terminal-core` & `web-content-core`**: Native tool helpers for local execution and HTML-to-markdown extraction.
*   **`media-core`, `media-generation-core`, `media-understanding-common`**: Multi-modal audio/image/video pipelines.
*   **`plugin-sdk` & `plugin-package-contract`**: Extensibility layers for custom tool and skill extensions.

---

## 3. Deep-Dive: Agent Loop Runtime (`agent-loop.ts`)

Located in [packages/agent-core/src/agent-loop.ts](https://github.com/openclaw/openclaw/packages/agent-core/src/agent-loop.ts), OpenClaw's execution loop features a nested dual-loop structure:

### A. Dual-Loop Structure
*   **Outer Loop**: Continuously drains the follow-up message queue (`getFollowUpMessages`). This allows the agent to resume execution if a user queue input arrives after the loop would otherwise terminate.
*   **Inner Loop**: Handles the active turn cycle, checking for aborted states, injecting user steering messages (`getSteeringMessages`), requesting completions, running tools, and evaluating stop conditions.

### B. Parallel vs. Sequential Dispatching
Before executing a batch of tool calls, the loop inspects the execution modes of the requested tools:
*   If *any* requested tool specifies `executionMode === "sequential"`, the loop falls back to sequential execution (`executeToolCallsSequential`), executing tools one-by-one to prevent resource contention or race conditions.
*   Otherwise, it executes all tools concurrently using `Promise.all` (`executeToolCallsParallel`) to minimize completion latency.

### C. Abort & Cancellation
*   The loop accepts standard `AbortSignal` parameters.
*   If aborted mid-run, it appends an `aborted` stop-reason assistant message to the thread so that subsequent compaction or continuation steps do not attempt to resume from a broken state.

### D. Parameter Overriding and Multi-turn Evolution
At the end of each turn, the loop triggers `prepareNextTurn`, allowing the runtime to dynamically swap the active model, override thinking levels, or modify the active context array based on task progress.

---

## 4. Control Plane Gateway Features

OpenClaw's gateway (`src/gateway`) is a comprehensive server coordinating multiple nodes and channels:

*   **Push-Notification Approvals (`exec-approval-ios-push.ts`)**: When an agent attempts a dangerous terminal execution or file edit, the gateway can issue an Apple Push Notification Service (APNS) payload to the developer's mobile device. The developer can approve or deny the bash tool call directly from their lock screen, bridging headless execution with human-in-the-loop safety.
*   **Node Command Policies (`node-command-policy.ts`)**: Client nodes (like a connected Android phone) register their capabilities and enforce localized security restrictions, determining which terminal commands or workspace folders the gateway is allowed to access.
*   **Durable Compaction Checkpoints (`session-compaction-checkpoints.ts`)**: Implements SQLite-backed conversation checkpointing combined with incremental context compaction to automatically prune long histories.

---

## 5. Relevance to Harness Research

1.  **Distributed Gateway Reference**: OpenClaw is the canonical reference for building a multi-tenant corporate gateway where tools run on developer devices (nodes) while LLM orchestration resides in the cloud.
2.  **Human-in-the-Loop APNS Bridge**: Incorporating mobile push alerts for tool approval is a highly viable safety mechanism for long-horizon autonomous agents.
3.  **Strict Alternation / Continuation Guarantees**: Demonstrates how to write safe resume endpoints (`agentLoopContinue`) by validating that the thread does not contain consecutive same-role messages.
