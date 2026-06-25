# 04 — Agent Loops

## What Was Researched

The core execution loop patterns used by AI agents — how they process user input, make API calls, handle tool calls, manage state between iterations, and determine when to stop. This is the central control flow of any agent.

## Which Sources Were Used

| Source | Type | URL | Relevance |
|--------|------|-----|-----------|
| Hermes Agent (`hermes-agent/AGENTS.md`, `run_agent.py`) | Local codebase | https://github.com/NousResearch/hermes-agent | CRITICAL |
| LangGraph (`langgraph/`) | Local codebase | https://github.com/langchain-ai/langgraph | CRITICAL |
| Codex (`codex/AGENTS.md`) | Local codebase | https://github.com/openai/codex | HIGH |
| Pi Agent Core (`pi-mono/packages/agent/`) | Local codebase | https://github.com/badlogic/pi-mono | HIGH |
| OpenRouter SDK (`openrouter-sdk/`) | Local codebase | https://github.com/OpenRouterTeam/typescript-sdk | MEDIUM |
| assistant-ui (`assistant-ui/`) | Local codebase | https://github.com/assistant-ui/assistant-ui | HIGH |
| OpenClaw (`openclaw/`) | Local codebase | https://github.com/openclaw/openclaw | HIGH |

## Key Findings

### Loop Pattern 1: Synchronous While-Loop (Hermes)

The most common pattern. Hermes's `run_conversation()` in `run_agent.py`:

```python
while (api_call_count < max_iterations and iteration_budget.remaining > 0) \
        or budget_grace_call:
    if interrupt_requested: break
    response = client.chat.completions.create(model=model, messages=messages, tools=tool_schemas)
    if response.tool_calls:
        for tool_call in response.tool_calls:
            result = handle_function_call(tool_call.name, tool_call.args, task_id)
            messages.append(tool_result_message(result))
        api_call_count += 1
    else:
        return response.content  # No tool calls = final response
```

**Key features**:
- **Budget tracking** — Dual limits: `max_iterations` (hard cap, default 90) + `iteration_budget` (configurable per-session)
- **Grace call** — One extra turn allowed after budget exhaustion to let the agent wrap up
- **Interrupt support** — `_interrupt_requested` flag checked every iteration
- **Message role alternation** — Strict enforcement: never two same-role messages in a row
- **Synchronous execution** — Entire loop is synchronous with async I/O handled internally

### Loop Pattern 2: Graph-Based State Machine (LangGraph)

LangGraph represents agent execution as a directed graph:

```
[START] → [call_model] → [should_continue?] → [tool_node] → [call_model] → ...
                                             ↘ [END]
```

**Key features**:
- **Explicit state transitions** — Each node transforms state, edges define flow
- **Checkpointing at every node** — Automatic persistence for durable execution
- **Interrupt points** — Any edge can be an interrupt for human-in-the-loop
- **Branching** — Conditional edges enable dynamic routing
- **Subgraphs** — Nested graphs for composable agent architectures
- **Streaming** — Token-level and node-level streaming

### Loop Pattern 3: Stop-Condition Driven (OpenRouter SDK)

The OpenRouter SDK introduces a declarative stop-condition model:

- **`maxModelResponses`** — Cap total model calls
- **`maxToolCalls`** — Cap total tool invocations
- **`stopConditions`** — Custom predicates for loop termination
- **`ModelResult`** for stream consumption — Unified result type for both streaming and non-streaming

### Loop Termination Strategies

| Strategy | Used By | Mechanism |
|----------|---------|-----------|
| No tool calls = stop | Hermes, Pi, Codex | Model returns text without tool calls |
| Iteration cap | Hermes (90), Codex | Hard limit on API call count |
| Budget tracking | Hermes | Token/cost budget with grace call |
| Graph end node | LangGraph | Explicit END node in graph |
| Stop conditions | OpenRouter SDK | Declarative predicates |
| Interrupt signal | Hermes, Pi | User sends Ctrl+C or new message |

### Reasoning Effort Control

A new dimension in agent loops (June 2026):
- **Grok 4.3**: `reasoning_effort` = none / low / medium / high (default: low)
- **GLM 5.2**: `reasoning_effort` = high / xhigh
- **Claude**: Built-in reasoning (not configurable)

The agent loop should support setting reasoning effort per-turn, potentially adapting it based on task complexity.
## What Is Confirmed

1. **While-loop with tool-call detection** is the dominant pattern (Hermes, Pi, Codex all use it)
2. **Budget/iteration limits** are essential — unbounded loops cause cost explosions
3. **Grace calls** (one extra turn after budget) improve completion quality
4. **Graph-based execution** (LangGraph) provides superior debuggability and interruptibility
5. **Message role alternation** must be strictly enforced (Hermes documents this as a hard requirement)
6. **Interrupt support** is required for production agents
7. **Human-in-the-loop and steering** (investigated in [human_in_the_loop_steering.md](04_agent_loops/human_in_the_loop_steering.md)) is standard for production agents to govern dangerous tools [CLAIM-192](../00_index/citation_map.md#claim-192), support runtime context injection [CLAIM-189](../00_index/citation_map.md#claim-189), and allow configurable bypass modes [CLAIM-194](../00_index/citation_map.md#claim-194).

## What Is Uncertain

- Whether graph-based or while-loop patterns are better for a new harness
- Optimal default iteration cap (Hermes uses 90, Codex appears lower)
- How to dynamically adjust reasoning effort based on task complexity
- The UX balance between micro-approvals (every tool) and macro-approvals (session bypasses) [CLAIM-193](../00_index/citation_map.md#claim-193)

## How This Applies to Building a Modern Model-Agnostic Agent Harness

1. **Start with a while-loop pattern** — simpler, proven, and sufficient for most use cases
2. **Implement budget tracking from day one** — token budget + iteration cap + grace call
3. **Support interrupt signals** — both user-initiated and programmatic with request-local cancellation safety to avoid HTTP retries [CLAIM-190, CLAIM-191]
4. **Enforce message role alternation** — critical for model compatibility
5. **Expose reasoning effort** as a per-turn configuration option
6. **Consider graph-based execution** for complex multi-step workflows (can be layered on later)
7. **Implement OpenRouter-style stop conditions** for declarative loop control
8. **Provide granular bypass policies** (e.g., Ask, Session Bypass, and Sensitive Path Gating) to balance developer velocity and security [CLAIM-194, CLAIM-195]
