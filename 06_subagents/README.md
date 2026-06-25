# 06 — Subagents

## What Was Researched

Patterns for spawning, managing, and coordinating child agents from a parent agent — enabling parallel workstreams, task delegation, and specialized sub-task execution.

## Which Sources Were Used

| Source | Type | URL | Relevance |
|--------|------|-----|-----------|
| Hermes Agent (`hermes-agent/tools/delegate_tool.py`, `tools/async_delegation.py`) | Local codebase | https://github.com/NousResearch/hermes-agent | CRITICAL |
| LangGraph subgraphs | Local codebase | https://github.com/langchain-ai/langgraph | HIGH |
| OpenClaw multi-agent routing | Local codebase | https://github.com/openclaw/openclaw | HIGH |
| Pi Agent Core | Local codebase | https://github.com/badlogic/pi-mono | MEDIUM |

## Key Findings

### Hermes Delegation System (Most Advanced)

Hermes has the most sophisticated subagent system studied:

- **`delegate_tool.py`** (140KB) — Full delegation system for spawning isolated subagents
- **`async_delegation.py`** (22KB) — Async subagent orchestration
- **Parallel workstreams** — Multiple subagents can work simultaneously on different tasks
- **RPC-based tool calls** — Python scripts call tools via RPC, collapsing multi-step pipelines into zero-context-cost turns
- **Isolated contexts** — Each subagent has its own conversation context (doesn't pollute parent's prompt cache)
- **Iteration budget sharing** — Parent shares its remaining budget with subagents
- **Kanban plugin** (`plugins/kanban/`) — Multi-agent board dispatcher + worker pattern for structured delegation

### LangGraph Subgraphs

- **Composable graphs** — A graph can contain other graphs as nodes
- **State isolation** — Each subgraph maintains its own state
- **Communication via state** — Parent passes state to subgraph, receives modified state back
- **Branching** — Conditional routing to different subgraphs based on state

### OpenClaw Multi-Agent Routing

- **Agent routing** — Route inbound channels/accounts to isolated agents
- **Per-agent sessions** — Each agent has its own workspace and session history
- **Session tools** — `sessions_list`, `sessions_history`, `sessions_send` for inter-agent communication
- **Session spawning** — `sessions_spawn` creates new agent sessions

### Key Design Decisions

| Decision | Hermes | LangGraph | OpenClaw |
|----------|--------|-----------|----------|
| Isolation model | Process-level | State-level | Session-level |
| Communication | RPC + tool results | State passing | Session messages |
| Parallelism | ✅ True parallel | ✅ Branching | ✅ Per-channel |
| Budget sharing | ✅ | N/A | N/A |
| Context isolation | ✅ Separate context | ✅ Separate state | ✅ Separate session |

## What Is Confirmed

1. **Context isolation is critical** — Subagent conversation context must not pollute parent's prompt cache
2. **Budget sharing prevents runaway costs** — Parent must limit subagent token consumption
3. **RPC-based tool access** is elegant — subagents call parent's tools without duplicating registrations
4. **Kanban/task-board pattern** (Hermes) enables structured multi-agent workflows
5. **Multi-model deliberation achieves beyond-frontier performance** — Budget fusion panels outperform individual frontier models on DRACO benchmarks [CLAIM-157](../00_index/citation_map.md#claim-157)
6. **Panel isolation prevents anchoring bias** — Models must deliberate independently before cross-pollination [CLAIM-145](../00_index/citation_map.md#claim-145)
7. **Anonymity in peer review prevents lab-bias** — Strip model identifiers to prevent self-preference [CLAIM-150](../00_index/citation_map.md#claim-150)

## What Is Uncertain

- Optimal number of concurrent subagents (cost vs. speed tradeoff)
- How to handle subagent failures gracefully (retry vs. escalate to parent)
- Whether subagents should share memory with parent
- Optimal panel size for fusion (diminishing returns beyond 3–5 panelists observed)
- Whether adaptive stopping thresholds generalize across domain-specific tasks

## How This Applies to Building a Modern Model-Agnostic Agent Harness

1. **Implement subagent spawning with context isolation** — separate conversation per subagent
2. **Share budget between parent and subagents** — prevent cost explosions
3. **Support parallel execution** — multiple subagents working simultaneously
4. **RPC-based tool sharing** — subagents access parent's tools via RPC
5. **Consider task-board orchestration** (Hermes Kanban) for complex multi-agent workflows
6. **Implement gateway-level fusion tool** — Panel + Judge deliberation as a reusable tool [CLAIM-145](../00_index/citation_map.md#claim-145)
7. **Use structured JSON judge schemas** — consensus, contradictions, blind spots, unique insights [CLAIM-145](../00_index/citation_map.md#claim-145)
8. **Support multiple deliberation patterns** — Fusion for research, Council for debate, Swarm for task decomposition

## Multi-Model Deliberation Patterns (Detailed Research)

For comprehensive research on multi-model orchestration patterns — including taxonomy, self-hosted implementation, anti-patterns, benchmarks, and decision matrices — see:

→ [multi_model_deliberation_and_swarms.md](06_subagents/multi_model_deliberation_and_swarms.md)

Patterns covered:
| Pattern | Architecture | Hallmark |
| :--- | :--- | :--- |
| **Panel + Judge (Fusion)** | Parallel fan-out → structured judge → synthesis | OpenRouter Fusion |
| **Mixture-of-Agents (MoA)** | Multi-layered iterative refinement | Wang et al. (ICLR 2025) |
| **Council / Debate** | Multi-round peer review with chairman | Karpathy's `llm-council` |
| **Supervisor-Worker Swarm** | Hierarchical delegation to specialists | Hermes `Team*`, CrewAI |
| **Graph Orchestration** | Explicit state machine with conditional edges | LangGraph `StateGraph` |

