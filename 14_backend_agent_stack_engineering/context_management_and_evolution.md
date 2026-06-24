# Context Management & Evolution

> **Temporal Anchor**: June 23, 2026 — State of the Art  
> **Source codebases**: Hermes Agent, Codex (OpenAI), Pi, LangGraph, LiteLLM, OpenClaw  
> **Primary sources analyzed**:  
> - `hermes-agent/agent/context_compressor.py` (2,650 lines, 132 KB) — the most comprehensive open-source compaction engine  
> - `hermes-agent/agent/conversation_compression.py` (1,058 lines, 55 KB) — session rotation / in-place orchestrator  
> - `hermes-agent/agent/memory_manager.py` (1,032 lines, 42 KB) — provider-based memory federation  
> - `hermes-agent/tools/session_search_tool.py` (798 lines, 34 KB) — FTS5-backed past conversation recall  
> - `codex/codex-rs/rollout-trace/src/compaction.rs` — Rust compaction tracing  
> - `codex/codex-rs/core/src/tools/spec_plan.rs` — auto-compaction feature gate  
> - `codex/codex-rs/tui/src/chatwidget/tests/slash_commands.rs` — `/compact` UX  

---

## Table of Contents

1. [Core Problem Statement](#1-core-problem-statement)
2. [Compaction Mechanics](#2-compaction-mechanics)
3. [Summarization Architecture](#3-summarization-architecture)
4. [Maintaining Context Across Conversations](#4-maintaining-context-across-conversations)
5. [Using Past Conversations as Reference](#5-using-past-conversations-as-reference)
6. [Keeping the Current Conversation Relevant and Strong](#6-keeping-the-current-conversation-relevant-and-strong)
7. [Conversation Forking: When, Why, and How](#7-conversation-forking-when-why-and-how)
8. [Error Handling for Context Management](#8-error-handling-for-context-management)
9. [Cross-Framework Comparison](#9-cross-framework-comparison)
10. [Architecture Recommendations](#10-architecture-recommendations)
11. [Implementation Checklist](#11-implementation-checklist)

---

## 1. Core Problem Statement

Every LLM has a finite context window. As of June 2026, frontier models offer 1M tokens (Gemini 3.5, GPT-5.5, Grok 4.3) down to 128K tokens (Claude Opus 4.8, Qwen 3.7). But context windows are not free:

| Concern | Impact |
|---------|--------|
| **Cost** | A 1M-token context at $10/1M = $10 per API call. Each turn re-sends the entire history. |
| **Latency** | Time-to-first-token scales with prompt length. 500K-token prompts add 3–8 seconds TTFT. |
| **Quality degradation** | "Lost in the middle" — models attend less to content in the center of long contexts (confirmed through June 2026). |
| **Provider limits** | Many providers enforce lower hard limits than the model's theoretical maximum. |
| **Concurrency** | Background tasks (review agents, delegation subagents) share or fork the context. |

The engineering challenge: **how to keep a conversation infinitely long while using finite context windows, without losing critical information, and while handling every failure gracefully.**

---

## 2. Compaction Mechanics

### 2.1 The Two Strategies: Rotation vs In-Place

Hermes Agent implements **both** strategies as of June 2026 (PR #38763), with a config toggle:

#### Strategy A: Session Rotation (Legacy, Default)

```
┌──────────────────────────────────────────┐
│ Session ABC (parent)                      │
│  [system] [user1] [asst1] ... [userN]    │
│  ─── END (reason: "compression") ───     │
└──────────────────────────────────────────┘
         │ parent_session_id = ABC
         ▼
┌──────────────────────────────────────────┐
│ Session DEF (child)                       │
│  [system'] [SUMMARY] [tail messages...]  │
│  ─── continues ───                       │
└──────────────────────────────────────────┘
```

**How it works** (from `conversation_compression.py:557–658`):
1. Flush unwritten messages to the OLD session's DB rows
2. Call `end_session(old_id, "compression")`
3. Generate a new session ID: `YYYYMMDD_HHMMSS_<6-hex>`
4. Create a child session with `parent_session_id = old_id`
5. Propagate title (auto-numbered: "Task #2", "Task #3", etc.)
6. Migrate persistent `/goal` to the new session
7. Update `ContextVar`, `os.environ`, and logging context to the new ID
8. Notify memory providers via `on_session_switch()`

**Advantages**: Clean audit trail, each session is immutable once ended, easy to `/resume` any ancestor.

**Disadvantages**: Session ID changes mid-conversation → complex plumbing to keep gateway, logging, memory, and context engines in sync. Race conditions when two agents compress the same session simultaneously (the "Damien incident" — two children parented to the same dead session, one orphaned).

#### Strategy B: In-Place Compaction (New, Config-Gated)

```
┌──────────────────────────────────────────────┐
│ Session ABC (same ID throughout)              │
│  [system] [user1] [asst1] ... [userN]        │
│           ▲ active=0 (archived)              │
│  ────────────────────────────────────────     │
│  [system'] [SUMMARY] [tail messages...]      │
│           ▲ active=1 (live)                  │
│  ─── continues ───                           │
└──────────────────────────────────────────────┘
```

**How it works** (from `conversation_compression.py:527–556`):
1. Call `archive_and_compact(session_id, compressed)` — atomically:
   - Set `active=0` on all existing messages (soft-archive; kept on disk, FTS-searchable, recoverable)
   - Insert `compressed` messages as `active=1` (the new live set)
2. Reset the flush identity set so the next turn diffs against the compacted transcript
3. No session ID change, no title renumbering, no contextvar update, no memory provider session-switch

**Advantages**: One durable ID for the conversation's entire life. Eliminates session-rotation bugs. Gateway routing stays stable. Archived turns remain searchable via FTS5. Simpler.

**Disadvantages**: Newer pattern (PR #38763, rollout phase). Requires `archive_and_compact` DB primitive. UI must handle the "reset" of visible messages.

### 2.2 The Compression Algorithm (5 Phases)

From `context_compressor.py:2354–2649`, the `compress()` method:

```
Phase 1: Tool Output Pruning (cheap, no LLM)
  └─ _prune_old_tool_results()
     ├─ Pass 1: Deduplicate identical tool results (MD5 hash, keep newest)
     ├─ Pass 2: Replace old tool content with informative 1-line summaries
     │          e.g. "[terminal] ran `npm test` → exit 0, 47 lines output"
     │          e.g. "[read_file] read config.py from line 1 (3,400 chars)"
     └─ Pass 3: Truncate large tool_call arguments in assistant messages
                (JSON-safe: parse → trim string values → re-serialize)

Phase 2: Boundary Determination
  ├─ Head: system prompt + protect_first_n (decays to 0 after first compression)
  ├─ Tail: token-budget walk backward from end (default: threshold × target_ratio)
  │        With hard minimum floor (3–MAX_TAIL_MESSAGE_FLOOR messages)
  │        Soft ceiling: 1.5× budget to avoid cutting mid-message
  ├─ Anchoring: ensure last user message in tail (fix #10896)
  ├─ Anchoring: ensure last assistant message in tail (fix #29824)
  └─ Alignment: never cut inside tool_call/tool_result groups

Phase 3: Summary Generation
  ├─ First compression: summarize from scratch with structured template
  ├─ Re-compression: iterative update of previous summary
  ├─ Auto-focus: derive focus topic from recent user turns
  └─ Manual focus: /compact <topic> prioritizes that topic (60–70% of budget)

Phase 4: Assembly
  ├─ [HEAD messages (preserved verbatim)]
  ├─ [SUMMARY message (role chosen to avoid consecutive same-role)]
  │   With SUMMARY_PREFIX ("REFERENCE ONLY") and _SUMMARY_END_MARKER
  └─ [TAIL messages (preserved verbatim)]

Phase 5: Sanitization
  ├─ _sanitize_tool_pairs(): fix orphaned tool_call/tool_result references
  ├─ _strip_historical_media(): remove old base64 images from tail
  └─ Anti-thrashing: track savings %, skip if <10% saved twice in a row
```

### 2.3 Threshold Mechanics

```python
# From context_compressor.py:823–836
context_length = get_model_context_length(model)
threshold_tokens = context_length × threshold_percent  # default 50%
                   # Floor: never below MINIMUM_CONTEXT_LENGTH (64K)
                   # Ceiling: must be < context_length when max_tokens is reserved

# Trigger condition (context_compressor.py:956–976)
def should_compress(prompt_tokens):
    if prompt_tokens < threshold_tokens: return False
    if ineffective_compression_count >= 2: return False  # anti-thrashing
    return True
```

### 2.4 Token Budget Allocation

```python
# From context_compressor.py:839–844
target_tokens = threshold_tokens × summary_target_ratio  # default ~0.35
tail_token_budget = target_tokens                         # ~20K for 128K models
max_summary_tokens = min(context_length × 0.05, 8192)    # cap at 8K tokens

# Summary budget scales with content being compressed:
summary_budget = max(MIN_SUMMARY_TOKENS, min(content_tokens × SUMMARY_RATIO, max_summary_tokens))
```

### 2.5 Codex Compaction (Contrast)

Codex (OpenAI) uses the **Responses API's built-in compaction** (server-side) rather than client-side compression:

```rust
// From codex-rs/core/src/tools/spec_plan.rs:711
if features.enabled(Feature::AutoCompaction) {
    // Responses API handles compaction transparently
}
```

Key differences from Hermes:
- **Server-side**: The Responses API compacts internally; Codex just sends `ResponseItem::Compaction` markers
- **No custom summary template**: Relies on OpenAI's built-in summarizer
- **TruncationPolicy**: Configurable per-tool output (`TruncationPolicy::Tokens(10_000)`)
- **No session rotation**: The thread ID stays constant; compaction is a protocol-level event

---

## 3. Summarization Architecture

### 3.1 The Summary Template (Structured)

Hermes uses a **13-section structured template** that forces the summarizer to preserve specific kinds of information. From `context_compressor.py:1527–1600`:

```markdown
## Historical Task Snapshot
[THE SINGLE MOST IMPORTANT FIELD. Capture the user's most recent unfulfilled
input verbatim — the exact words they used. This includes:
- Explicit task assignments ("refactor the auth module")
- Questions awaiting an answer
- Decisions awaiting input
- Ongoing discussions where the assistant owes the next substantive reply]

## Goal
[What the user is trying to accomplish overall]

## Constraints & Preferences
[User preferences, coding style, constraints, important decisions]

## Completed Actions
[Numbered list — N. ACTION target — outcome [tool: name]]

## Active State
[Working directory, branch, modified files, test status, running processes]

## Historical In-Progress State
[Work underway when compaction fired]

## Blocked
[Any blockers, errors, issues. Include exact error messages.]

## Key Decisions
[Important technical decisions and WHY they were made]

## Resolved Questions
[Questions already answered — include the answer]

## Historical Pending User Asks
[STALE — from compacted turns. Reference only. DO NOT act on them.]

## Relevant Files
[Files read, modified, created — with brief note]

## Historical Remaining Work
[STALE — reference only.]

## Critical Context
[Values, error messages, config details. NEVER include credentials.]
```

### 3.2 Iterative vs From-Scratch Summarization

**First compaction**: Summarize from scratch using the full template.

**Re-compaction** (from `context_compressor.py:1602–1616`):
```
"You are updating a context compaction summary.
 PREVIOUS SUMMARY: <existing summary>
 NEW TURNS TO INCORPORATE: <new messages>
 
 PRESERVE all existing information that is still relevant.
 ADD new completed actions (continue numbering).
 Move items from 'In Progress' to 'Completed Actions' when done.
 Move answered questions to 'Resolved Questions'.
 Update 'Active State' to reflect current state.
 Remove information only if clearly obsolete.
 CRITICAL: Update '## Active Task' to reflect the user's most recent
 unfulfilled input."
```

This is a critical design: the `_previous_summary` is stored per-compressor instance and evolves across compressions rather than regenerating from scratch. This prevents **summary drift** — each pass incorporates only the NEW turns, preserving context from earlier compactions that no longer exists in the raw message history.

### 3.3 The "Reference Only" Prefix Problem

The summary is injected as a regular message (role=user or role=assistant). Without explicit guarding, models treat it as a new instruction. Hermes addresses this with:

1. **`SUMMARY_PREFIX`**: 400+ character preamble saying "REFERENCE ONLY... Do NOT answer questions mentioned here... Respond ONLY to the latest user message AFTER this summary"
2. **`_SUMMARY_END_MARKER`**: Explicit boundary — `"--- END OF CONTEXT SUMMARY — respond to the message below, not the summary above ---"`
3. **Section headings prefixed with "Historical"**: `"## Historical Task Snapshot"` instead of `"## Active Task"` — prevents models from reading stale tasks as active instructions
4. **Reverse-signal awareness**: The prefix explicitly says "Reverse signals (stop, undo, roll back) must immediately end any in-flight work described in the summary"

### 3.4 Temporal Anchoring

From `context_compressor.py:1508–1524`:

```
"TEMPORAL ANCHORING: The current date is 2026-06-23.
 When an action has already been carried out, phrase it as a completed,
 dated, past-tense fact rather than an open instruction. For example,
 rewrite 'email John about the proposal' as 'Sent the proposal email
 to John on 2026-06-23.' Never leave a finished action worded as if it
 still needs doing."
```

This prevents a common failure mode: the summary says "next step: deploy to staging" and the model re-executes a deployment that already happened.

### 3.5 Focus Topic Compression

Inspired by Claude Code's `/compact`:

```python
# From context_compressor.py:1632–1636
if focus_topic:
    prompt += f"""
FOCUS TOPIC: "{focus_topic}"
This compaction should PRIORITISE preserving all information related to
the focus topic above... 60-70% of the summary token budget.
For content NOT related to the focus topic, summarise more aggressively."""
```

**Auto-focus**: When the user doesn't specify a topic, Hermes derives one from the most recent user messages (`_derive_auto_focus_topic`). This ensures the summary is biased toward preserving the user's current area of concern.

### 3.6 Content Serialization for the Summarizer

From `context_compressor.py:1168–1222`, the `_serialize_for_summary` method:

- **Tool results**: Content truncated to 6,000 chars (4,000 head + 1,500 tail)
- **Tool call arguments**: Truncated to 1,500 chars (1,200 head)
- **All content**: Redacted via `redact_sensitive_text()` before summarization — API keys, tokens, passwords are replaced with `[REDACTED]`
- **Media**: Replaced with `[media attachment]`
- **Output**: Labeled turns: `[USER]: ...`, `[ASSISTANT]: ...`, `[TOOL RESULT call_id]: ...`

### 3.7 Static Fallback Summary

When the LLM summarizer is unavailable (network error, auth failure, rate limit), Hermes generates a **deterministic fallback** from `_build_static_fallback_summary()`:

```python
# Locally extracts:
user_asks = []           # from user-role messages
assistant_actions = []   # tool call names
tool_actions = []        # _summarize_tool_result() for each
relevant_files = []      # from JSON tool arguments (path, file_path, etc.)
blockers = []            # messages containing "error", "failed", "exception"
last_dropped_turns = []  # last 8 turns for continuity
```

This fallback is intentionally less rich than an LLM summary but preserves enough "continuity anchors" (recent user asks, file paths, error messages) for the model to pick up where it left off.

---

## 4. Maintaining Context Across Conversations

### 4.1 The Memory Provider Federation

From `memory_manager.py:314–403`, the `MemoryManager` class:

```
┌─────────────────────────────────────────────┐
│              MemoryManager                   │
│  ┌─────────────────────────────────┐        │
│  │  Built-in Provider (always)     │        │
│  │  • MEMORY.md, USER.md files     │        │
│  │  • System prompt injection      │        │
│  └─────────────────────────────────┘        │
│  ┌─────────────────────────────────┐        │
│  │  External Provider (at most 1)  │        │
│  │  • Mem0, Hindsight, etc.        │        │
│  │  • Custom tool schemas          │        │
│  │  • Vectorized memory search     │        │
│  └─────────────────────────────────┘        │
│                                              │
│  Lifecycle: prefetch → turn → sync → end    │
│  Execution: background ThreadPoolExecutor    │
└─────────────────────────────────────────────┘
```

**Key design rules**:
- Only ONE external memory provider at a time (prevents tool schema bloat)
- Built-in provider is always registered first
- Memory provider tool names cannot shadow core tools (e.g., `clarify`, `delegate_task`)
- Provider failures are **non-blocking** — one provider's crash never prevents the other from working
- Sync writes are **serialized through a single background worker** (turn N lands before turn N+1)
- Background executor is **lazily created** (no extra threads for simple sessions)

### 4.2 Lifecycle Hooks

```python
# Every turn:
prefetch_all(query)           # Before the LLM call — inject relevant memories
sync_all(user, assistant)     # After the LLM call — persist new memories (background)
queue_prefetch_all(query)     # Warm the cache for the next turn (background)

# Session boundaries:
on_turn_start(turn_number, message)
on_session_end(messages)
on_session_switch(new_session_id, parent_session_id, reset, rewound)
on_pre_compress(messages)     # Before compaction — extract memories before they're summarized away
```

### 4.3 Memory Context Injection

From `memory_manager.py:297–311`:

```xml
<memory-context>
[System note: The following is recalled memory context,
NOT new user input. Treat as authoritative reference data —
this is the agent's persistent memory and should inform all responses.]

<memory content here>
</memory-context>
```

The `StreamingContextScrubber` (lines 132–294) runs a **stateful state machine** across streaming deltas to strip `<memory-context>` blocks from the output stream. This prevents memory content from leaking to the user while allowing it to inform the model's response.

### 4.4 Skill Scaffolding Stripping

When a user invokes a `/skill`, Hermes expands the turn into a model-facing message that embeds the entire skill body. The `_strip_skill_scaffolding` method (lines 436–451) extracts just the user's actual instruction before passing to memory providers — preventing skill prompt templates from polluting memory embeddings.

---

## 5. Using Past Conversations as Reference

### 5.1 Session Search Tool Architecture

From `session_search_tool.py`, the `session_search` tool provides **4 calling shapes**:

| Shape | Args | What It Does |
|-------|------|--------------|
| **Discovery** | `query` | FTS5 search across all sessions. Dedupes by lineage. Returns per-session: snippet, ±5 message window, bookend_start (first 3), bookend_end (last 3) |
| **Scroll** | `session_id` + `around_message_id` | ±N messages centered on an anchor. No FTS5, no bookends. Paginate forward/backward by passing edge message IDs |
| **Read** | `session_id` | Dumps entire session (first 20 + last 10 if large) |
| **Browse** | *(no args)* | Recent sessions chronologically: titles, previews, timestamps |

**Key implementation details**:

1. **Lineage deduplication**: FTS5 may hit a message that lives in a child session (post-compression). `_resolve_to_parent()` walks the `parent_session_id` chain to the root, so the same logical conversation doesn't appear multiple times.

2. **Cross-profile search**: `_resolve_profile_db()` opens another Hermes profile's `state.db` in read-only mode. A session link from profile B can be resolved while running in profile A.

3. **Lineage rebind**: If the model passes a parent `session_id` with a `message_id` that lives in a child session (common after compression), the scroll shape transparently rebinds to the correct child.

4. **Current-session exclusion**: Discovery and scroll shapes reject messages from the current session lineage — they're already in context.

5. **Source filtering**: Sessions tagged as `"subagent"` or `"tool"` are excluded from browsing/searching by default.

### 5.2 Anchored View Pattern

The "bookend + window" pattern is the key innovation for efficient past-conversation recall:

```
┌─ bookend_start (3 msgs) ──────────────────────┐
│  [user] "Build me a REST API for..."           │
│  [asst]  "I'll create a FastAPI project..."    │
│  [user] "Use PostgreSQL, not SQLite"           │
├─ ... gap (messages not shown) ... ─────────────┤
│  [user] ◀── FTS5 match (±5 window)             │
│  [asst]  "Here's the auth middleware..."       │
│  [tool]  "[read_file] auth.py..."              │
├─ ... gap ... ──────────────────────────────────┤
│  [user] "Great, deploy to staging"             │
│  [asst]  "Deployed. URL: https://..."          │
│  [user] "Works perfectly, thanks"              │
└─ bookend_end (3 msgs) ─────────────────────────┘
```

This gives the model: **(1)** the goal/kickoff, **(2)** the specific context around the search hit, **(3)** the resolution/outcome — without paying for the entire 500-message transcript.

### 5.3 The SQLite FTS5 Backend

From `hermes_state.py` (analyzed in database research):
- FTS5 index on message content (trigram tokenizer for partial matches)
- WAL mode for concurrent reads during searches
- `search_messages()` supports role filtering, source exclusion, limit/offset, sort by newest/oldest
- `get_anchored_view()` returns the window + bookend structure
- `get_messages_around()` returns a raw ±N window centered on a message ID

---

## 6. Keeping the Current Conversation Relevant and Strong

### 6.1 Tail Protection

The single most important mechanism for conversation quality during compaction. From `context_compressor.py:2231–2333`:

```python
def _find_tail_cut_by_tokens(messages, head_end, token_budget=None):
    """Walk backward from end, accumulating tokens until budget is reached."""
    
    # Default budget: threshold × target_ratio (~20K for 128K models)
    # Hard minimum: max(3, protect_last_n) messages always kept
    # Soft ceiling: 1.5× budget to avoid cutting mid-message
    
    # Two passes when entire transcript fits in soft_ceiling:
    #   1. Soft ceiling (1.5×) — check if everything fits
    #   2. Raw budget (1×) — find meaningful cut point for summarizer
    
    # Post-walk anchoring:
    #   - _ensure_last_user_message_in_tail() — prevents active task loss
    #   - _ensure_last_assistant_message_in_tail() — prevents visible reply vanishing
    #   - _align_boundary_backward() — keeps tool_call/result groups together
```

**Why tail protection matters**: Without it, the model's most recent exchange gets summarized away, and it loses track of what it was doing. The ~20K token tail budget ensures enough "active context" for the current task, while the summary provides background.

### 6.2 Head Protection Decay

```python
# From context_compressor.py:2006–2021
def _effective_protect_first_n():
    """protect_first_n decays after first compression."""
    if compression_count >= 1 or _previous_summary:
        return 0  # After first compression, head protection decays to 0
    return protect_first_n  # Only for the FIRST compression
```

**Rationale**: `protect_first_n` preserves the original task framing for the first compaction. But applying it on every pass **fossilizes early turns** — they're re-copied into each child session and never summarized, growing the head unboundedly. After the first compression, the head is just the system prompt (always protected separately).

### 6.3 Anti-Thrashing Guard

```python
# From context_compressor.py:956–976
def should_compress(prompt_tokens):
    if prompt_tokens < threshold_tokens: return False
    if _ineffective_compression_count >= 2:
        logger.warning(
            "Compression skipped — last %d compressions saved <10% each. "
            "Consider /new to start a fresh session, or /compress <topic> "
            "for focused compression.",
            _ineffective_compression_count,
        )
        return False
    return True
```

**What it prevents**: Infinite compression loops where each pass removes only 1–2 messages because the tool outputs are too large, the tail is too generous, or the summary is nearly as large as the removed content.

### 6.4 Deferred Preflight to Real Usage

```python
# From context_compressor.py:914–954
def should_defer_preflight_to_real_usage(rough_tokens):
    """Return True when a high rough estimate is known-noisy."""
    
    # After compression, rough token estimates include schema overhead
    # that doesn't appear in the actual API prompt_tokens.
    # If the provider proved the request fit under threshold on the
    # last call, defer re-compression for one turn to avoid
    # double-compacting.
```

**Problem solved**: `estimate_request_tokens_rough()` overestimates when tools have large JSON schemas. After compression, the rough estimate might still exceed the threshold even though the actual `prompt_tokens` from the provider is well under. This guard prevents a second compaction immediately after the first.

### 6.5 Summary-Model Fallback Chain

```python
# From context_compressor.py:1638–1828
# Fallback chain when summary generation fails:
#
# 1. Try configured summary_model
# 2. If model_not_found/timeout/JSON decode → fall back to main model
# 3. If main model fails → set cooldown (30s for JSON/stream, 60s otherwise)
# 4. If auth failure (401/403) → ABORT compression entirely (non-recoverable)
# 5. If abort_on_summary_failure=True → ABORT, return messages unchanged
# 6. If abort_on_summary_failure=False → insert deterministic fallback summary
```

### 6.6 Media Stripping

```python
# From context_compressor.py:2620–2626
compressed = _strip_historical_media(compressed)
# Replaces base64 images in tail messages (except the most recent image-bearing
# user turn) with text placeholders. Without this, a 1MB base64 screenshot
# survives every compression pass forever and can exceed provider body-size limits.
```

---

## 7. Conversation Forking: When, Why, and How

### 7.1 When to Fork

| Trigger | Mechanism | Source |
|---------|-----------|--------|
| **Auto-compression** | Threshold exceeded → session rotation | `conversation_compression.py:557–658` |
| **User `/branch`** | Explicit UI command | `tui_gateway/server.py:5964` |
| **User `/new`** | Start fresh session | CLI handler |
| **Delegation** | Subagent gets its own session | `delegate_cascade` module |
| **Background review** | Review fork gets a copy of the session | `background_review.py` |
| **API fork** | `POST /api/sessions/{id}/fork` | `gateway/session_api.py` |

### 7.2 The Session Tree (Lineage Model)

```
Session A (root)
  ├── ended: "compression"
  └── Session B (child, parent=A)
       ├── ended: "branched"
       ├── Session C (child, parent=B)  ← /branch
       └── Session D (child, parent=B)  ← compression
            └── Session E (child, parent=D) ← compression
                 └── ... (active)
```

Key properties:
- **Lineage root**: `_resolve_to_parent()` walks up the chain
- **Resume resolution**: `resolve_resume_session_id()` walks DOWN to find the latest leaf
- **FTS5 deduplication**: Searches group by lineage root, showing only the best match per logical conversation
- **Title auto-numbering**: `get_next_title_in_lineage()` produces "Task #2", "Task #3"

### 7.3 Compression Lock (Preventing Fork Races)

From `conversation_compression.py:349–444`:

```python
_lock_holder = f"pid={os.getpid()}:tid={threading.get_ident()}:agent={id(agent):x}:nonce={uuid4().hex[:8]}"

_lock_acquired = db.try_acquire_compression_lock(session_id, _lock_holder)
if not _lock_acquired:
    # Another path is mid-compression. ABORT — don't fork.
    return messages, existing_system_prompt
```

**The "Damien incident"**: Without this lock, the parent-turn agent and its background-review fork can both compress the same session simultaneously, creating two children parented to the same (now dead) session. The gateway only catches one rotation → orphan session with silent write leaks.

**Lock holder format**: `pid:tid:agent-instance:nonce` — lets ops distinguish crashed holders from live ones. Expiry-based recovery (timestamp in DB) handles crashed processes.

**Fail-open design**: If the lock subsystem is broken (version skew after update), skip locking and proceed. A rare concurrent fork is strictly better than an infinite no-progress loop.

### 7.4 Fork Types

| Type | Session End Reason | Parent Preserved? | Child Gets |
|------|-------------------|-------------------|------------|
| **Compression** | `"compression"` | Yes (immutable) | Summary + tail messages |
| **Branch** | `"branched"` | Yes (immutable) | Full message copy up to branch point |
| **Delegation** | `"subagent"` | No (stays active) | Delegated task + context |
| **Reset** | `"reset"` | Yes | Empty session |

### 7.5 Goal Migration Across Forks

From `conversation_compression.py:646–650`:

```python
from hermes_cli.goals import migrate_goal_to_session
migrate_goal_to_session(old_session_id, new_session_id, reason="compression")
```

Without this, a persistent `/goal` silently dies at the compression boundary — `load_goal` does a flat per-session lookup with no parent walk.

### 7.6 In-Place as the Fork Eliminator

In-place compaction (strategy B) eliminates ALL fork-related concerns:
- No session ID change → no routing updates, no contextvar sync, no title renumbering
- No fork race → no compression lock needed
- No goal migration → goal stays on the same session
- No orphan sessions → impossible by construction
- Archived turns remain under the SAME ID → FTS5 search finds them naturally

---

## 8. Error Handling for Context Management

### 8.1 Summary Generation Failure

The most critical error path. From `context_compressor.py:1691–1828` and `conversation_compression.py:465–510`:

```
Summary Generation Failed
    │
    ├── Is this a separate summary_model? (not the main model)
    │   ├── YES → Fall back to main model, retry immediately
    │   │         Record _last_aux_model_failure_error for /usage display
    │   │         Clear summary_model="" so future calls use main
    │   └── NO → Enter cooldown
    │
    ├── Is this an auth failure (401/403)?
    │   └── YES → ABORT compression entirely
    │            Session NOT rotated. Messages preserved unchanged.
    │            "Check your provider credential / inference endpoint"
    │
    ├── Is abort_on_summary_failure=True? (config)
    │   └── YES → ABORT compression entirely
    │            _last_compress_aborted = True
    │            "Conversation is frozen until next /compress or /new"
    │
    └── Is abort_on_summary_failure=False? (default)
        └── Insert deterministic fallback summary
            _last_summary_fallback_used = True
            _last_summary_dropped_count = N
            Surface warning to user
```

### 8.2 Cooldown Periods

```python
# JSON decode / streaming premature-close: 30 second cooldown
# All other transient errors: 60 second cooldown
# No provider configured: SUMMARY_FAILURE_COOLDOWN_SECONDS (longer)
# Manual /compress (force=True): bypasses cooldown
```

### 8.3 Session Rotation Failure Recovery

From `conversation_compression.py:603–640`:

```python
try:
    db.create_session(new_session_id, parent_session_id=old_session_id)
except Exception:
    # CRITICAL: Roll back to old_session_id to prevent orphan
    agent.session_id = old_session_id
    set_current_session_id(old_session_id)  # Fix ContextVar
    set_session_context(old_session_id)      # Fix logging
    db.reopen_session(old_session_id)        # Un-end the parent
    agent._session_db_created = True
    raise  # Propagate to outer handler
```

**Why this matters**: Without rollback, the old session is ended (dead), the new session row was never created, and every subsequent message goes to a session ID that doesn't exist in the DB — an orphan that's invisible to `/resume`, `/sessions`, and search.

### 8.4 Tool-Pair Sanitization

From `context_compressor.py:1936–1994`:

```python
def _sanitize_tool_pairs(messages):
    """Fix orphaned tool_call / tool_result pairs after compression."""
    
    # Problem 1: A tool *result* references a call_id whose assistant 
    # tool_call was removed (summarized/truncated)
    # → Remove the orphaned result
    
    # Problem 2: An assistant message has tool_calls whose results were dropped
    # → Insert stub: "[Result from earlier conversation — see context summary]"
```

**Why**: OpenAI-compatible APIs **reject** payloads where tool_call IDs don't match tool results. After compression removes middle messages, orphaned pairs are common. Without sanitization, every API call after compression fails.

### 8.5 Empty Content Guard

From `context_compressor.py:1670–1680`:

```python
if not content.strip():
    raise RuntimeError(
        "Context compression LLM returned empty content..."
    )
```

Some OpenAI-compatible proxies (cmkey.cn, one-api) return HTTP 200 with empty content. Without this guard, an empty string gets stored as the summary, silently wiping all compacted turns.

### 8.6 Anti-Thrashing as Error Prevention

```python
# From context_compressor.py:2631–2637
if savings_pct < 10:
    _ineffective_compression_count += 1
else:
    _ineffective_compression_count = 0

# After 2 ineffective compressions, should_compress() returns False
# Prevents infinite loop of: compress → save <10% → re-trigger → compress → ...
```

### 8.7 Lock Subsystem Version Skew

From `conversation_compression.py:376–410`:

```python
try:
    _lock_acquired = db.try_acquire_compression_lock(sid, holder)
except Exception as _lock_err:
    # Broken lock subsystem (module version skew after update).
    # Log once per session. Proceed WITHOUT lock.
    # Rationale: infinite no-progress loop is strictly worse than
    # a rare concurrent-compression session fork.
    _lock_holder = None  # don't try to release what we don't own
    _lock_acquired = True  # treat as acquired-but-unlocked
```

### 8.8 SQLite Database Write Lock Contention

SQLite in Write-Ahead Log (WAL) mode enables concurrent reads from multiple processes/threads. However, concurrent writes are strictly serialized. If two concurrent threads attempt to write to the same database file simultaneously, one will fail with `SQLITE_BUSY`. 

**The Gotcha**: Under high concurrency (such as multi-user gateways), concurrent writes to user session history or memory checkpoints can crash active agent turns.
*   **Design Pattern 1 (Tenancy Isolation)**: Provision one isolated SQLite database file per user/tenant workspace (`state.db`) rather than pointing all users to a shared local database, eliminating lock contention between distinct sessions [CLAIM-122].
*   **Design Pattern 2 (Jittered Retries)**: Implement an exponential backoff loop for all database write transactions, trying up to 15 times with a randomized jitter between 20ms and 150ms before failing [CLAIM-084].
*   **Design Pattern 3 (Write-Ahead Logging)**: Always configure `PRAGMA journal_mode=WAL` and `PRAGMA synchronous=NORMAL` during database initialization.

### 8.9 Message Role Alternation Violations

Providers like Anthropic Messages API enforce strict user-assistant role alternation. If consecutive user messages or consecutive assistant messages are dispatched, the API throws a non-recoverable `400` parameter validation error.

**The Gotcha**: Real-time user steering (`/steer`), background evaluation runs, or automated subagent feedbacks frequently append messages out-of-band, causing consecutive user messages.
*   **Mitigation (Programmatic Message Merger)**: The adapter must run a message sequence pass immediately before formatting the final JSON payload. If consecutive messages share the same role (e.g. User turn followed by another User steer), they must be merged programmatically into a single message with double-newline spacing (`\n\n`) [CLAIM-106].
*   **Mitigation (Orphaned Tool Call Handling)**: Assistant messages containing tool calls whose matching results were dropped during compaction must be sanitized by inserting placeholder results, avoiding API validation failure [CLAIM-108].

### 8.10 Gotcha: Brittle Regex Code/JSON Extraction

Extracting code snippets or JSON structures from LLM responses using regular expressions is highly brittle. Slight model variations (such as omitting block tags, inserting markdown notes, or adding trailing commas) cause regex matches to fail silently or extract empty strings.

**The Gotcha**: Writing custom regexes like ``/```json([\s\S]*?)```/`` fails when the model outputs raw JSON without block wrappers or uses alternative backtick wrappers.
*   **Design Pattern (Avoid Regex)**: Regex should be avoided entirely in favor of programmatic parsing. Parse strings sequentially, strip leading/trailing whitespace, and feed the clean output to robust JSON5 parsers that tolerate trailing commas and missing brackets. If unstructured extraction is required, route the payload to a lightweight model configured with structured JSON mode instead of writing complex regular expressions.

---

## 9. Cross-Framework Comparison

| Capability | Hermes Agent | Codex (OpenAI) | Pi | LangGraph | Claude Code |
|-----------|-------------|----------------|-----|-----------|-------------|
| **Compaction** | Client-side, 5-phase | Server-side (Responses API) | None (short sessions) | Checkpoint-based | `/compact` command |
| **Summary Template** | 13-section structured | Provider internal | N/A | N/A | Unstructured |
| **Session Rotation** | Yes (+ in-place option) | No (thread persists) | No | No | No |
| **Iterative Summary** | Yes (`_previous_summary`) | Unknown (server-side) | No | No | Unknown |
| **Focus Topic** | Yes (`/compact <topic>`) | No | No | No | Yes |
| **Anti-Thrashing** | Yes (10% threshold, 2-strike) | Unknown | N/A | N/A | Unknown |
| **Tool Pruning** | 3-pass (dedup, summarize, truncate) | Per-tool `TruncationPolicy` | N/A | N/A | Unknown |
| **Cross-Session Search** | FTS5, anchored views, lineage | Resume picker | No | No | No |
| **Memory Providers** | Federated (built-in + 1 external) | No | No | No | No |
| **Concurrent Lock** | DB-backed, fail-open | N/A (single-process) | N/A | N/A | N/A |
| **Error Recovery** | 6-level fallback chain | Provider-managed | N/A | N/A | Unknown |
| **Media Stripping** | Yes (base64 → placeholder) | Yes (TruncationPolicy) | No | No | Unknown |

---

## 10. Architecture Recommendations

### 10.1 For the Agent Harness: A 4-Layer Context Management Stack

```
Layer 4: Cross-Conversation Memory
  ├── Memory Provider Federation (built-in + optional external)
  ├── Session Search (FTS5 + anchored views)
  ├── Knowledge Base (MEMORY.md, USER.md, AGENTS.md)
  └── Vector Memory (optional: Qdrant, Mem0, etc.)

Layer 3: Conversation-Level Context
  ├── Session Lineage (parent_session_id tree)
  ├── Compaction Summary (structured, iterative)
  ├── Goal/State Migration across session boundaries
  └── Context Engine Lifecycle Hooks

Layer 2: Turn-Level Context
  ├── System Prompt (rebuilt after compression)
  ├── Memory Context Injection (<memory-context> blocks)
  ├── Tool Output Pruning (cheap pre-pass)
  └── Tail Protection (token-budgeted recent context)

Layer 1: Token-Level Management
  ├── Threshold Detection (should_compress)
  ├── Token Estimation (rough + real usage)
  ├── Budget Allocation (tail, summary, head)
  └── Anti-Thrashing Guards
```

### 10.2 Critical Design Principles

1. **Iterative, not regenerative**: Each compaction updates the previous summary rather than regenerating from scratch. This prevents information loss across multiple compressions.

2. **In-place over rotation**: Session rotation creates a cascade of session management complexity (ID sync, goal migration, lock contention, orphan recovery). In-place compaction with soft-archived turns is simpler and equally powerful.

3. **Structured summaries**: Free-form summaries lose critical information. A mandatory template with sections for active task, completed actions, file state, blocked items, and pending asks ensures the model can pick up exactly where it left off.

4. **Fail-safe, not fail-fast**: Context compression MUST succeed. If the summary LLM fails, insert a deterministic fallback. If session rotation fails, roll back to the parent. If the lock subsystem is broken, proceed without it. The worst outcome is losing context; every error path should preserve what it can.

5. **Background memory, not blocking**: Memory sync and prefetch run on a background thread. A slow memory provider (e.g., a misconfigured Hindsight daemon blocking 298 seconds) must never stall the turn.

6. **The tail is sacred**: The most recent ~20K tokens of conversation (user's last message, assistant's last reply, recent tool outputs) must never be compressed away. This is the "active working set" that the model needs to stay coherent.

7. **Past conversations are search results, not context**: Don't inject entire past conversations into the prompt. Use FTS5 search + anchored views to retrieve specific relevant snippets. The bookend + window pattern (goal → match → resolution) gives the model what it needs without blowing up the context.

### 10.3 Minimum Viable Implementation

For a new agent harness, implement in this order:

1. **Token counting** — rough estimation using `len(json.dumps(messages)) / 4`
2. **Threshold trigger** — compress when tokens exceed 50% of context window
3. **Simple head/tail split** — protect system prompt + last 10 messages
4. **LLM summarization** — use the main model with a structured template
5. **Tool output pruning** — replace old tool results with one-line summaries
6. **Session persistence** — SQLite with FTS5 for search
7. **Iterative summaries** — store `_previous_summary` and update instead of regenerate
8. **Fallback summary** — deterministic extraction when LLM fails
9. **Memory providers** — built-in file-based + optional external
10. **Anti-thrashing** — track compression effectiveness, skip if <10% saved

---

## 11. Implementation Checklist

### Compaction Engine
- [ ] Token estimation (rough and real-usage tracking)
- [ ] Configurable threshold (percentage of context window)
- [ ] 3-pass tool output pruning (dedup, summarize, truncate arguments)
- [ ] Token-budgeted tail protection (not fixed message count)
- [ ] Head protection with decay (protect first N only on first compression)
- [ ] Tool_call/tool_result group alignment (never split pairs)
- [ ] Last-user-message anchoring (always in tail)
- [ ] Last-assistant-message anchoring (always in tail)
- [ ] Summary role selection (avoid consecutive same-role)
- [ ] Anti-thrashing guard (skip after 2 ineffective compressions)

### Summarization
- [ ] Structured summary template (13+ sections)
- [ ] Iterative summary updates (preserve `_previous_summary`)
- [ ] Temporal anchoring (completed actions in past tense with date)
- [ ] Focus topic support (/compact <topic>)
- [ ] Auto-focus derivation from recent user turns
- [ ] Credential redaction before summarization
- [ ] Summary budget scaling (proportional to compressed content)
- [ ] Summary end marker (explicit "summary ends here" boundary)
- [ ] "Reference Only" prefix (prevent model from treating summary as instruction)
- [ ] Historical section headings (prevent stale tasks from re-activating)

### Session Management
- [ ] Session lineage (parent_session_id tree)
- [ ] In-place compaction with soft-archiving (preferred over rotation)
- [ ] Session rotation as fallback/legacy option
- [ ] Compression lock (DB-backed, fail-open)
- [ ] Goal migration across session boundaries
- [ ] Title auto-numbering across lineage
- [ ] ContextVar / env / logging sync on rotation

### Error Handling
- [ ] Summary model fallback chain (aux → main → deterministic)
- [ ] Auth failure detection (401/403 → abort, don't rotate)
- [ ] Empty content guard (HTTP 200 with empty body)
- [ ] Session rotation rollback (reopen parent on failure)
- [ ] Tool-pair sanitization (fix orphaned call/result IDs)
- [ ] Lock version-skew recovery (fail-open)
- [ ] Cooldown periods (30s/60s based on error type)
- [ ] Manual /compress bypass of cooldown

### Cross-Conversation Memory
- [ ] Memory provider federation (built-in + 1 external)
- [ ] Non-blocking background sync (ThreadPoolExecutor)
- [ ] Memory context injection with streaming scrubber
- [ ] Skill scaffolding stripping for memory
- [ ] FTS5-backed session search (discovery + scroll + browse)
- [ ] Anchored view pattern (bookend_start + window + bookend_end)
- [ ] Lineage deduplication in search results
- [ ] Cross-profile session access (read-only)

---

## Sources

| ID | Source | Location |
|----|--------|----------|
| SRC-CTX-001 | Hermes context_compressor.py | `hermes-agent/agent/context_compressor.py` (2,650 lines) |
| SRC-CTX-002 | Hermes conversation_compression.py | `hermes-agent/agent/conversation_compression.py` (1,058 lines) |
| SRC-CTX-003 | Hermes memory_manager.py | `hermes-agent/agent/memory_manager.py` (1,032 lines) |
| SRC-CTX-004 | Hermes session_search_tool.py | `hermes-agent/tools/session_search_tool.py` (798 lines) |
| SRC-CTX-005 | Codex compaction.rs | `codex/codex-rs/rollout-trace/src/compaction.rs` |
| SRC-CTX-006 | Codex spec_plan.rs | `codex/codex-rs/core/src/tools/spec_plan.rs` |
| SRC-CTX-007 | Codex TruncationPolicy | `codex/codex-rs/core/src/unified_exec/process.rs` |
| SRC-CTX-008 | Hermes PR #38763 | In-place compaction design |
| SRC-CTX-009 | Hermes PR #10896 | Last-user-message-in-tail fix |
| SRC-CTX-010 | Hermes PR #29824 | Last-assistant-message-in-tail fix |
| SRC-CTX-011 | Hermes PR #40803 | Anti-thrashing infinite loop fix |
| SRC-CTX-012 | Hermes PR #34351 | Compression lock subsystem |
| SRC-CTX-013 | Hermes PR #33906 | Orphan session rollback |
| SRC-CTX-014 | Hermes PR #11475 | Summary prefix hijacking fix |
| SRC-CTX-015 | Hermes PR #33618 | Goal migration across compression |
