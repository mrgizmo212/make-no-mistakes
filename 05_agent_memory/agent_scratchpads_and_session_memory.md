# Agent Scratchpads & Session Memory

## 1. Concept Validation: Is it Real?

Yes. AI agents operating in complex environments (such as IDEs, terminal shells, and long-horizon tasks) consistently require externalized scratchpads or session memory stores to maintain state, prioritize checklist subtasks, and track progress. 

Because LLMs are stateless and have finite, cost-sensitive context windows, relying purely on the conversation history or large system prompts causes three primary failure modes:
1. **Context Decay**: As conversation history grows, earlier planning steps and task descriptions are compressed or evicted, leading to agent "forgetfulness."
2. **Instruction Drift**: Long system prompts carrying verbose plans suffer from the "lost in the middle" effect, causing the agent to diverge from its target objectives.
3. **Workspace Contamination**: Allowing agents to write temporary notes directly into the user's codebase root clutters version control history and risks contaminating build artifacts.

To solve this, modern agent harnesses implement **Agent Scratchpads and Session Memory** using three distinct patterns [CLAIM-197, CLAIM-201, CLAIM-203].

---

## 2. In-Memory & Re-Injected Scratchpads (The Hermes Pattern)

Nous Hermes [SRC-002] implements a dedicated `todo` tool [CLAIM-197](../00_index/citation_map.md#claim-197) backed by an in-memory `TodoStore` (`tools/todo_tool.py`) [CLAIM-198](../00_index/citation_map.md#claim-198).

### Core Architecture
1. **Tool Interface**: The agent calls `todo(todos=[...], merge=true)` to create, edit, or prioritize tasks. Calling `todo()` without arguments reads the current list [CLAIM-197](../00_index/citation_map.md#claim-197).
2. **Session Persistence**: The `TodoStore` instance is tied directly to the `AIAgent` session lifecyle. It stores an ordered list of tasks containing `id`, `content`, and `status` (`pending`, `in_progress`, `completed`, `cancelled`) [CLAIM-198](../00_index/citation_map.md#claim-198).
3. **Size Gating**: To prevent the scratchpad itself from consuming the message budget, the `TodoStore` enforces hard safety boundaries [CLAIM-198](../00_index/citation_map.md#claim-198):
   * `MAX_TODO_ITEMS = 256` items max.
   * `MAX_TODO_CONTENT_CHARS = 4000` characters per item.
   * Excess items are truncated from the tail to preserve high-priority heads.

### Post-Compaction Re-Injection Block
When a context compression event occurs (e.g., summarizing raw messages), the conversation history is wiped clean, save for a text summary. To prevent the agent from losing its current plan, the runtime reads the `TodoStore` and **re-injects** the active tasks back into the active context window [CLAIM-199](../00_index/citation_map.md#claim-199):

```python
# tools/todo_tool.py - Simplified re-injection format logic
def format_for_injection(self) -> Optional[str]:
    if not self._items:
        return None

    # Filter: ONLY inject active items. If completed or cancelled items
    # are re-injected, the model frequently repeats finished tasks post-compaction.
    active_items = [
        item for item in self._items
        if item["status"] in {"pending", "in_progress"}
    ]
    if not active_items:
        return None

    lines = ["[Your active task list was preserved across context compression]"]
    for item in active_items:
        marker = "[>]" if item["status"] == "in_progress" else "[ ]"
        lines.append(f"- {marker} {item['id']}. {item['content']} ({item['status']})")

    return "\n".join(lines)
```

By injecting this block dynamically, the plan survives the compression barrier without inflating the system instructions ceiling [CLAIM-199, CLAIM-200].

---

## 3. Workspace Scratchpad Files (The Claude Code Pattern)

Rather than keeping the scratchpad entirely in-memory, CLI agents like Claude Code [SRC-020] utilize user-visible workspace files to persist state across sessions.

### Project Memory vs. Task Scratchpads
*   **Global Rules (`CLAUDE.md`)**: A persistent project file placed in the repository root containing development workflows, test commands, and coding standards [CLAIM-202](../00_index/citation_map.md#claim-202). The agent automatically parses this file at session start. Large rule sets can be modularized into `.claude/rules/*.md` files [CLAIM-202](../00_index/citation_map.md#claim-202).
*   **Checklist Scratchpads (`TODO.md` / `NOTES.md`)**: For temporary task plans, the agent dynamically creates a workspace markdown file (`TODO.md`) [CLAIM-201](../00_index/citation_map.md#claim-201). The agent reads this file to align on sub-tasks and updates the file directly as progress is made (e.g., ticking off boxes or appending diagnostic notes) [CLAIM-201](../00_index/citation_map.md#claim-201).

### Auto-Memory Logs
Claude Code features a learned preference manager [CLAIM-204](../00_index/citation_map.md#claim-204). When a user corrects the agent (e.g., "always use double quotes in JS" or "do not edit test files directly"), the agent dynamically logs this instruction to a project-specific memory file (located inside the `.claude/` subfolder) [CLAIM-204](../00_index/citation_map.md#claim-204). These learnings can be reviewed, edited, or deleted by the user via `/memory` commands [CLAIM-204](../00_index/citation_map.md#claim-204).

---

## 4. Private Sandbox Scratch Areas (The Antigravity Pattern)

For IDE-based developer agents (like Google Antigravity or Cursor), cluttering the user's workspace with scratch files, experimental script variants, or raw text blocks is undesirable.

### Private Directory Isolation
Antigravity [SRC-022] isolates scratchpads to a private, conversation-locked directory on the filesystem [CLAIM-203](../00_index/citation_map.md#claim-203):
*   **Path Structure**: `<appDataDir>\brain\<conversation-id>\scratch\` [CLAIM-203](../00_index/citation_map.md#claim-203).
*   **Behavior**: 
    1. When the agent needs to write a temporary testing script, run a script validation benchmark, or cache an intermediary JSON block, it writes directly to this conversation directory [CLAIM-203](../00_index/citation_map.md#claim-203).
    2. These files are persisted across the conversation session, allowing subagents and subsequent turns to read them.
    3. Because they live outside the workspace tree (`c:\Users\Adam\Desktop\agent2`), they never clutter git commits, trigger project linters, or contaminate staging areas.

---

## 5. Architectural Comparison: Scratchpad Models

| Aspect | Hermes In-Memory `[SRC-002]` | Claude Code Workspace `[SRC-020]` | Antigravity Private `[SRC-022]` |
| :--- | :--- | :--- | :--- |
| **Storage Location** | Runtime Memory (Agent instance) | Workspace root (`TODO.md`, `CLAUDE.md`) | Session-isolated App Data directory |
| **Visibility** | Hidden from workspace tree (Tool only) | User-visible in repository | Private to agent sandbox |
| **Compaction Action** | Formatted and re-injected as a message block [CLAIM-199](../00_index/citation_map.md#claim-199) | Persistent in workspace; survives session death | Read on demand; referenced in logs |
| **Clutter Risk** | Zero | High (requires user to delete files or ignore them) | Zero (completely outside user workspace) |
| **Use Case** | Short-term subtask lists, checklists | High-level plans, project rules, style preferences | Scratch scripts, testing utilities, diagnostic caches |
| **Auto-Cleanup** | Wiped at session end | Manual user cleanup | Managed by app-data eviction policy |

---

## 6. Graph-Based Memory in Session Architectures (Mem0, Graphiti, Cognee)

Knowledge Graph Memory represents the next evolution of agent session storage. Rather than saving logs as raw text spans or vector-indexed chunks, these systems extract structured entity-relationship triplets (`[Subject] -> [Relation] -> [Object]`) to build a semantic network of the conversation [CLAIM-205](../00_index/citation_map.md#claim-205).

### Core Open Source Engines
*   **Mem0**: Combines vector indexing with a dynamic knowledge graph [CLAIM-205](../00_index/citation_map.md#claim-205). It is designed as a drop-in memory layer that tracks user profiles, session details, and agent-level preferences across conversations. (Mem0 is supported in Nous Hermes under `plugins/memory/` as a built-in provider).
*   **Graphiti (by Zep)**: A specialized temporal graph library designed for agents [CLAIM-205](../00_index/citation_map.md#claim-205). It tracks *how facts change over time* (e.g., "User lives in New York" -> "User moved to London") and maintains relationship provenance across sessions.
*   **Cognee**: Automates the ingestion of unstructured chat transcripts, parsing them into structured Neo4j or local graph representations, and exposing them via graph+vector queries.
*   **Hermes Hindsight**: Local knowledge-graph provider that runs entity resolution and multi-strategy traversal (semantic search + keyword matching + graph traversal) [CLAIM-207](../00_index/citation_map.md#claim-207).

### When Graph Memory Fits in Session Management

Graph memory should not be used as a simple short-term checklist. It fits specifically in three high-value architectural concerns [CLAIM-206](../00_index/citation_map.md#claim-206):

1.  **Cross-Session Personalization & User Modeling**:
    *   *When*: The agent needs to build a deep, contextual profile of the user's setup, dependencies, and rules across distinct chat threads (e.g. mapping "User works on Project A" and "Project A uses Docker").
    *   *Why*: Vector-only RAG misses structural associations. Graphs preserve multi-hop relationships (e.g., querying "what docker tools does the user need?").
2.  **Temporal Contradiction Resolution**:
    *   *When*: The project state or user preferences change dynamically during execution (e.g., "we upgraded to Node 24" invalidates a past entry "we use Node 20").
    *   *Why*: Graphiti and Mem0 allow edge weighting and timestamped updates, letting the agent easily deprecate stale nodes rather than feeding contradictory facts into the context window.
3.  **Semantic Context Compression (Triplets as Summaries)**:
    *   *When*: High context pressure requires condensing hundreds of turns without losing key factual links.
    *   *Why*: Triplet-extraction replaces raw text messages with a list of facts (e.g., `[Agent] -> [fixed] -> [issue #109]` and `[App] -> [depends_on] -> [react-resizable-panels]`). This reduces context token consumption by up to 90% while maintaining absolute factual grounding.

