# Conversation Completions, Responses API, and Anthropic Shape Translation

## 1. Stateless vs. Stateful API Paradigms

When building a model-agnostic agent harness, managing the conversation context requires selecting or abstracting between two primary backend API paradigms: stateless completions and stateful thread APIs.

### 1.1 Chat Completions (Stateless Request/Response)
The classic OpenAI-style `/v1/chat/completions` API is stateless. The model does not retain any memory of prior turns.
*   **Mechanics**: The client is responsible for assembling, maintaining, and sending the entire message history array on every single request.
*   **Truncation & Context Management**: The client must track token usage, detect context window boundaries, and perform local compression, summarization, or message eviction (e.g., pruning older tools or base64 images) before sending the payload.
*   **Advantages**: Ultimate client-side control over context budget, prompt layout, and routing. Simple to implement and universally supported across model providers.
*   **Disadvantages**: Significant network payload overhead as the conversation grows. Higher latency due to re-sending the same history. The client must pay for prompt caching explicitly (if supported by the provider, e.g., Anthropic or deepseek).

### 1.2 Responses API / Assistants API (Stateful Server-Side Threads)
OpenAI's stateful Assistants (or the newer `Responses API` primitive) shift the state management to the server.
*   **Mechanics**: The server hosts a persistent thread object identified by a `thread_id`. The client posts new user messages to the thread and triggers a "Run" (`/v1/threads/{id}/runs`).
*   **Tool Runs**: If the model decides to run a tool, the API returns a status of `requires_action`. The client executes the local tool, submits the outputs back to the server, and the server resumes execution.
*   **Automatic Compaction**: The backend provider automatically compacts, summarizes, or truncates the thread history when it approaches the model's context limit, using proprietary heuristics.
*   **Advantages**: Extremely low bandwidth overhead (client only sends incremental messages). Leverages server-side prefix caching automatically. Keeps the client execution loop simpler since it doesn't manage token windows.
*   **Disadvantages**: Provider lock-in (hard to swap to Anthropic or open-weight models without a complex client-side translation layer that mimics threads). Truncation and summarization are "black boxes"—the client cannot control what gets deleted.

### 1.3 Conversation Thread Management
A robust harness architecture must support stateless execution while providing stateful session management.
*   **Lineage Trees**: Conversations are represented as trees rather than flat lists. Every user steering or alternative path forks a child node from the parent message ID, allowing easy session rollback.
*   **Compaction Gates**: Rather than running compression on every turn, a gate monitors token usage and triggers compression only when the message history exceeds a threshold (e.g., 80% of the model's context window).
*   **Eviction Policies**: Different data types have distinct eviction priorities. Multimodal screenshots are evicted first, followed by verbose tool results, then assistant reasoning steps, while user prompts are protected.

---

## 2. Anthropic Message Shape Translation

Anthropic's Messages API enforces strict schema constraints that differ significantly from OpenAI's lax chat completion format. A model-agnostic harness routing to Anthropic (directly or via Bedrock/Azure) must perform defensive translation to avoid non-retryable HTTP 400 errors.

The primary translation mechanics are implemented in [anthropic_adapter.py](https://github.com/NousResearch/hermes-agent/agent/anthropic_adapter.py).

### 2.1 System Prompt Extraction
OpenAI includes system instructions as a message object (`{"role": "system", "content": "..."}`) in the message array. Anthropic's API rejects system messages in the message array and requires it as a top-level parameter (`system`).
*   **Translation**: [convert_messages_to_anthropic](https://github.com/NousResearch/hermes-agent/agent/anthropic_adapter.py#L2238-L2300) extracts all system messages from the list.
*   **Cache Control**: If cache markers exist, it preserves the system prompt as an array of content blocks; otherwise, it joins them with newlines into a single string to pass as `kwargs["system"]`.

### 2.2 Strict Alternation Enforcement
Anthropic's Messages API requires strict alternation between `user` and `assistant` roles. Consecutive messages of the same role (e.g., `user` followed by `user`) cause HTTP 400 errors.
*   **Translation**: [_merge_consecutive_roles](https://github.com/NousResearch/hermes-agent/agent/anthropic_adapter.py#L2045-L2095) walks the message array and merges consecutive identical roles.
*   *User Turns*: Joins text strings with newlines, or concatenates multimodal block arrays.
*   *Assistant Turns*: Combines text content and tool call blocks, propagating signature invalidation flags, and stripping duplicate thinking blocks to prevent signature mismatch errors.

### 2.3 Tool Role Mapping and Grouping
In OpenAI, each tool execution outputs a standalone `tool` message matching a prior `assistant` tool call ID. Anthropic does not have a `tool` role; it models tool execution outcomes as `tool_result` content blocks inside a `user` message.
*   **Translation**: [_convert_tool_message_to_result](https://github.com/NousResearch/hermes-agent/agent/anthropic_adapter.py#L1909-L1970) intercepts OpenAI `tool` messages and converts them into `tool_result` blocks.
*   **Merging**: If the preceding message in the array is a `user` turn containing a `tool_result` block, the new result is appended to the existing `content` array of that user message. This ensures all parallel tool results are submitted in a single turn.

### 2.4 Orphan Tool Pair Mitigation
If context compression, truncation, or session history pruning removes a tool execution block but leaves the tool response, or vice versa, Anthropic throws a validation error.
*   **Translation**: [_strip_orphaned_tool_blocks](https://github.com/NousResearch/hermes-agent/agent/anthropic_adapter.py#L1988-L2044) scans the message array before sending:
    1. It collects all `tool_result` IDs and filters out any assistant `tool_use` blocks that lack a corresponding result.
    2. It collects all `tool_use` IDs and filters out any `tool_result` blocks in user messages that lack a corresponding tool call.
*   **Thinking Signature Invalidation**: If stripping an orphaned tool call modifies an assistant turn containing a thinking block, the signature (computed over the original block order) becomes invalid. The adapter flags the message (`_thinking_signature_invalidated = True`) and demotes the thinking blocks to plain text so the turn replays cleanly.

### 2.5 Proprietary Thinking Signatures
Claude 3.7+ introduces extended thinking, emitting `thinking` blocks containing the model's reasoning. On direct Anthropic endpoints, these blocks must carry the cryptographic `signature` to be replayed.
*   **Translation**: [_manage_thinking_signatures](https://github.com/NousResearch/hermes-agent/agent/anthropic_adapter.py#L2097-L2202) implements the following policy cascade:
    1.  **Third-Party Endpoints** (Azure AI Foundry, AWS Bedrock, MiniMax): Completely strips all thinking and redacted thinking blocks. These endpoints do not support Anthropic's proprietary signature validation and will throw HTTP 400.
    2.  **Kimi & DeepSeek**: Speak the Anthropic protocol but require unsigned reasoning blocks. The adapter strips signed/redacted blocks and preserves unsigned ones derived from `reasoning_content` to let them round-trip.
    3.  **Direct Anthropic Endpoints**: Strips thinking blocks from all historical assistant messages except the latest turn. If the latest turn has its tool call sequence modified (invalidating the signature), it demotes the thinking block to text to avoid HTTP 400.
    4.  **Cache Control Stripping**: Removes `cache_control` markers from thinking blocks, as they interfere with signature verification.

### 2.6 Visual Context Eviction
Multimodal screenshots represent a significant token cost (~1,465 tokens per image). Accumulating them across long loops causes rapid context window exhaustion.
*   **Translation**: [_evict_old_screenshots](https://github.com/NousResearch/hermes-agent/agent/anthropic_adapter.py#L2203-L2237) performs backward-walking context cleaning:
    *   It tracks the count of image blocks in `tool_result` messages.
    *   It keeps only the 3 most recent screenshots.
    *   Older screenshots are replaced with a lightweight text placeholder: `{"type": "text", "text": "[screenshot removed to save context]"}`.

### 2.7 Boundary Keyword Sanitization
During API mode switches (e.g., swapping from a stateful Responses loop to a stateless Anthropic Messages loop), OpenAI-only parameters may leak into the keyword arguments.
*   **Translation**: [sanitize_anthropic_kwargs](https://github.com/NousResearch/hermes-agent/agent/anthropic_adapter.py#L2554-L2583) intercepts the keyword arguments and pops keys like `instructions`, `input`, `store`, and `parallel_tool_calls` before calling the SDK, logging a warning rather than crashing.

### 2.8 Tool Name Normalization for Subscription Billing
On Anthropic OAuth/subscription setups (such as Claude Code's login credentials), Anthropic runs a billing classifier. If the model is exposed to tools prefixed with a single underscore `mcp_` (e.g. `mcp_read_file`), it routes the request to the "third-party extra usage" lane and throws HTTP 400 ("Third-party apps now draw from extra usage, not plan limits").
*   **Translation**: [build_anthropic_kwargs](https://github.com/NousResearch/hermes-agent/agent/anthropic_adapter.py#L2376-L2440) translates all tool names in the schema and the replayed `tool_use` history to use a double underscore prefix `mcp__` (e.g. `mcp__read_file`). This bypasses the classifier, allowing execution to remain under the user's plan limit.

---

## 3. Architectural Recommendations for the Harness

To achieve model-agnosticism, the harness should not expose provider-specific shapes to the core agent loop. Instead, implement a **Unified Message Schema** (OpenAI-aligned) and route requests through **Provider Adapter Modules** that isolate these rules:

1.  **State Isolation**: Keep the agent execution loop entirely stateless. If a stateful thread provider (like OpenAI Responses) is used, abstract it behind a thread wrapper that exposes a standard stateless `/completions` signature.
2.  **Strict Adapter Pipelines**: Every adapter must define two-way serialization:
    *   `to_provider_payload(messages, tools)`: Extracts system prompts, merges roles, strips orphans, manages signatures, and sanitizes parameter names.
    *   `from_provider_response(payload)`: Normalizes response text, thinking blocks, and tool calls back to the Unified Message Schema.
3.  **Visual Eviction and Token Budgets**: Implement image eviction and output token clamps at the adapter level to enforce physical boundaries before payloads reach the network.
