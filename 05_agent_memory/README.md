# 05 — Agent Memory

## What Was Researched

Memory systems that enable AI agents to persist knowledge across sessions, recall past conversations, maintain user models, and build procedural knowledge (skills). Memory is what separates a stateless chatbot from a personal AI agent.

## Which Sources Were Used

| Source | Type | URL | Relevance |
|--------|------|-----|-----------|
| Hermes Agent (`hermes-agent/AGENTS.md`, `agent/`, `plugins/memory/`) | Local codebase | https://github.com/NousResearch/hermes-agent | CRITICAL |
| LangGraph (`langgraph/`) | Local codebase | https://github.com/langchain-ai/langgraph | HIGH |
| OpenClaw (`openclaw/`) | Local codebase | https://github.com/openclaw/openclaw | HIGH |
| Codex (`codex/`) | Local codebase | https://github.com/openai/codex | MEDIUM |
| LibreChat Agents SDK (`librechat-agents/`) | Local codebase | https://github.com/danny-avila/agents | CRITICAL |

## Key Findings

### Memory Types in Production Agents

#### 1. Short-Term Working Memory (Conversation Context)
Every agent maintains the current conversation as a message array. The challenge is managing growth:
- **Hermes**: Context compression (`/compress`) — LLM summarizes older messages to reduce context size. System prompt stays byte-stable.
- **LangGraph**: Explicit state object passed between nodes. Checkpointed automatically.
- **Codex**: 10K token cap per tool output. Aggressive truncation.
- **OpenClaw**: `/compact` command for context compression.
- **LibreChat**: Context compaction through **observation masking** (truncating consumed ToolMessages when pressure reaches 80% to ~300 character previews) [CLAIM-187] and **full compaction** (summarizing the whole conversation and injecting it as a `HumanMessage` on clean state turns to optimize system prompt cache hits and message budgets) [CLAIM-188]. Also uses a dynamic **calibration ratio** to keep token counts aligned with provider billing [CLAIM-183].

#### 2. Long-Term Persistent Memory (Cross-Session)
- **Hermes memory system**: `memory_tool.py` (47KB) with pluggable backend:
  - **MemoryProvider ABC** (`agent/memory_provider.py`) — Interface: `sync_turn()`, `prefetch()`, `shutdown()`, `post_setup()`
  - **8 built-in providers**: Honcho, Mem0, SuperMemory, ByteRover, Hindsight, Holographic, OpenViking, RetainDB
  - **Memory Manager** (`agent/memory_manager.py`) — Orchestrates lifecycle, auto-syncs after turns
  - **Periodic nudges** — Agent periodically reminds itself to persist important knowledge
- **LangGraph**: Built-in memory system with short-term + long-term storage. Persistent across sessions via checkpointers.
- **OpenClaw**: Workspace-based memory files (AGENTS.md, SOUL.md)
- **LibreChat**: Stateful **Memories** database sync using custom personalization gates and token window filters to clean skill-primed meta messages [CLAIM-182].

#### 3. Session Search (Episodic Memory)
- **Hermes**: `session_search_tool.py` (34KB) — FTS5 full-text search across all past sessions with LLM summarization
- **Hermes SessionDB** (`hermes_state.py`, 227KB) — SQLite with FTS5 for fast cross-session search

#### 4. User Modeling (Identity Memory)
- **Hermes**: Honcho dialectic user modeling — builds a deepening model of who the user is across sessions
- **OpenClaw**: SOUL.md persona file — static but user-editable identity description

#### 5. Procedural Memory (Skills)
- **Hermes**: Skills created autonomously from experience. Skills self-improve during use. This is unique — no other framework has autonomous skill creation.
- **OpenClaw**: Workspace skills, but manually created (not autonomous)
- **LibreChat**: Dynamic injection of manual and always-apply skill primes, with count limits to stay within provider token constraints.

### Memory Architecture Comparison

| Feature | Hermes | LangGraph | OpenClaw | Codex | LibreChat / Agents SDK |
|---------|--------|-----------|----------|-------|------------------------|
| Short-term (context) | ✅ Compression | ✅ State | ✅ Compact | ✅ 10K cap | ✅ Calibrated Masking & Compaction |
| Long-term (persistent) | ✅ 8 providers | ✅ Checkpoints | ✅ Files | ❌ | ✅ Memories DB Sync |
| Session search | ✅ FTS5 | ❌ | ❌ | ❌ | ❌ |
| User modeling | ✅ Honcho | ❌ | ✅ SOUL.md | ❌ | ❌ |
| Procedural (skills) | ✅ Autonomous | ❌ | ✅ Manual | ❌ | ✅ Skill Primes |
| Pluggable backend | ✅ 8 providers | ✅ Checkpointers | ❌ | ❌ | ❌ |

## What Is Confirmed

1. **Pluggable memory backends** are essential — Hermes's MemoryProvider ABC is the reference pattern
2. **Context compression** is the standard solution for growing conversations
3. **Session search** (FTS5/vector) enables cross-session recall and is a significant differentiator
4. **Autonomous skill creation** is Hermes's unique contribution and represents the cutting edge
5. **SQLite + FTS5** is a proven, lightweight solution for session storage and search
6. **Agent scratchpads and session todo lists** (investigated in [agent_scratchpads_and_session_memory.md](05_agent_memory/agent_scratchpads_and_session_memory.md)) are vital to maintaining task planning context across context compression events [CLAIM-199] and isolating experimental scratch scripts from the user's workspace [CLAIM-203].

## What Is Uncertain

- Best approach for long-term memory: vector DB vs. structured memory vs. file-based
- How to prevent memory hallucination (agent "remembering" things that didn't happen)
- Optimal memory sync frequency (every turn vs. periodic vs. event-driven)

## How This Applies to Building a Modern Model-Agnostic Agent Harness

1. **Implement the MemoryProvider ABC pattern** — pluggable memory backends from day one
2. **Build session storage with SQLite + FTS5** — proven, zero-dependency, fast
3. **Support context compression** — critical for long-running conversations
4. **Plan for user modeling** — even a simple key-value store for user preferences is valuable
5. **Consider autonomous skill creation** — Hermes's learning loop is the most advanced pattern studied
6. **Isolate scratch files and scripts** to a private, conversation-locked directory outside the workspace tree to prevent VCS pollution [CLAIM-203], and support in-memory todo list re-injection after compression [CLAIM-199].
