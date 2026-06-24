# Prompt Engineering, Context Engineering & Agent Instruction Engineering

> **Temporal anchor**: June 23, 2026 — state of the art.
>
> **Primary sources**: `hermes-agent/agent/system_prompt.py` (537 lines), `hermes-agent/agent/prompt_builder.py` (1,889 lines, 93 KB), `hermes-agent/agent/coding_context.py` (790 lines), `hermes-agent/agent/subdirectory_hints.py` (271 lines), `hermes-agent/agent/turn_context.py` (439 lines), `codex/codex-rs/core/src/agents_md.rs` (498 lines), `codex/codex-rs/core/src/session/turn_context.rs` (851 lines), `pi-mono/packages/coding-agent/src/core/system-prompt.ts` (174 lines).
>
> **Scope**: How production agent harnesses assemble, cache, structure, protect, and evolve the instructions that steer an LLM across multi-turn, multi-model, multi-platform sessions.

---

## Table of Contents

1. [The Three Disciplines Defined](#1-the-three-disciplines-defined)
2. [System Prompt Architecture: The Three-Tier Model](#2-system-prompt-architecture-the-three-tier-model)
3. [Prompt Engineering: Guidance Constants & Model-Family Steering](#3-prompt-engineering-guidance-constants--model-family-steering)
4. [Context Engineering: Dynamic Context Assembly](#4-context-engineering-dynamic-context-assembly)
5. [Agent Instruction Engineering: Project-Level Instructions](#5-agent-instruction-engineering-project-level-instructions)
6. [Prefix-Cache Preservation: The Foundational Constraint](#6-prefix-cache-preservation-the-foundational-constraint)
7. [Prompt Security: Injection Detection & Promptware Defense](#7-prompt-security-injection-detection--promptware-defense)
8. [Skills as Deferred Prompt Material](#8-skills-as-deferred-prompt-material)
9. [Cross-Framework Comparison](#9-cross-framework-comparison)
10. [Architecture Recommendations](#10-architecture-recommendations)
11. [Implementation Checklist](#11-implementation-checklist)

---

## 1. The Three Disciplines Defined

These three terms are frequently conflated. In production agent harnesses, they are distinct concerns with distinct engineering:

### Prompt Engineering
The craft of **authoring static guidance text** that steers LLM behavior. Examples: the `TOOL_USE_ENFORCEMENT_GUIDANCE` constant, the `CODING_AGENT_GUIDANCE` string, the `MEMORY_GUIDANCE` constant. These are human-authored, version-controlled strings that tell the model *how to behave*. They are the same for every user, every session.

**Key insight (June 2026)**: Prompt engineering in an agent harness is not "write a good system prompt." It is a **library of behavioral constants** — each one addressing a specific model failure mode observed in production, each one gated on the model family or toolset that exhibits that failure mode, each one kept deliberately short because it rides the cached prefix and its token cost is amortised across every turn of every session.

### Context Engineering
The discipline of **dynamically assembling the information the model needs** to do its job — and keeping that information *fresh, relevant, and within token budget*. Examples: loading AGENTS.md, probing the git workspace, injecting memory snapshots, truncating oversized context files with head/tail preservation, and the entire compaction/summarization lifecycle from the previous document.

**Key insight**: Context engineering is the engineering of *what the model knows about the world right now*. It is entirely dynamic — different per user, per session, per turn.

### Agent Instruction Engineering
The discipline of **designing the instruction formats and discovery mechanisms** that let users, project teams, and platform operators inject their own rules into the agent's behavior — without modifying the agent's source code. Examples: AGENTS.md, SOUL.md, .cursorrules, .hermes.md, CLAUDE.md, platform hints, config.yaml overrides.

**Key insight**: This is the API surface between the agent harness and the humans who configure it. The engineering challenge is not authoring the instructions themselves — it's building the *discovery, loading, precedence, security scanning, truncation, and caching* infrastructure that makes user-authored instructions safe and reliable.

---

## 2. System Prompt Architecture: The Three-Tier Model

Hermes Agent implements the most sophisticated system prompt architecture observed in any open-source agent harness. The prompt is assembled from three explicitly named tiers (`system_prompt.py`, lines 10–19):

```
Three tiers are joined with "\n\n":

* stable   — identity (SOUL.md or DEFAULT_AGENT_IDENTITY), tool
  guidance, computer-use guidance, nous subscription block, tool-use
  enforcement guidance + per-model operational guidance, skills prompt,
  alibaba model-name workaround, environment hints, platform hints.
* context  — caller-supplied system_message plus context files
  (AGENTS.md / .cursorrules / etc.) discovered under TERMINAL_CWD.
* volatile — memory snapshot, USER.md profile, external memory
  provider block, timestamp/session/model/provider line.
```

### 2.1 The Stable Tier

**Purpose**: Everything that is identical across all turns within a session.

**Contents** (in injection order, from `build_system_prompt_parts`, lines 147–402):

| Slot | Source | Cache Impact |
|------|--------|-------------|
| Identity | SOUL.md or `DEFAULT_AGENT_IDENTITY` | Byte-stable |
| Help guidance | `HERMES_AGENT_HELP_GUIDANCE` | Static constant |
| Task completion | `TASK_COMPLETION_GUIDANCE` | Gated on tools loaded |
| Parallel tool calls | `PARALLEL_TOOL_CALL_GUIDANCE` | Gated on tools loaded |
| Tool-specific guidance | Memory, session_search, skills, kanban — conditional | Only present if tool is loaded |
| Steer channel note | `STEER_CHANNEL_NOTE` | Static when tools present |
| Computer-use guidance | Platform-aware (macOS/Windows/Linux variants) | Static per host OS |
| Subscription prompt | Nous subscription block | Static |
| Tool-use enforcement | `TOOL_USE_ENFORCEMENT_GUIDANCE` | Model-gated |
| Model-family guidance | `GOOGLE_MODEL_OPERATIONAL_GUIDANCE` or `OPENAI_MODEL_EXECUTION_GUIDANCE` | Model-gated |
| Skills index | Cached skill manifest (2-layer: in-process LRU + disk snapshot) | Stable per session |
| Model identity fix | Alibaba API model-name workaround | Provider-gated |
| Environment hints | OS, user home, cwd, shell type, WSL, remote backend probe | Stable per process |
| Coding posture | `CODING_AGENT_GUIDANCE` + workspace snapshot + edit-format nudge | Stable per session |
| Python toolchain probe | pip/uv/PEP-668 detection | Stable per process |
| Active profile hint | Profile name + cross-profile write guard | Stable per session |
| Platform hints | WhatsApp/Telegram/Discord/Slack/CLI/SMS/Email/Cron/WebUI/etc. | Stable per session |

**Critical design principle**: Every element in the stable tier is evaluated **once** and cached on `agent._cached_system_prompt` for the lifetime of the session (`system_prompt.py`, lines 126–129). Only context compression triggers a rebuild. This keeps the upstream prefix cache warm.

### 2.2 The Context Tier

**Purpose**: Project-level instructions and caller-supplied directives.

**Contents**:
- `system_message` (caller-supplied, passed from the API/gateway)
- Context files — **first match wins** from priority order:
  1. `.hermes.md` / `HERMES.md` (walk to git root)
  2. `AGENTS.md` / `agents.md` (cwd only)
  3. `CLAUDE.md` / `claude.md` (cwd only)
  4. `.cursorrules` / `.cursor/rules/*.mdc` (cwd only)

**Important**: Only **one** project context type is loaded — the priority chain short-circuits (`prompt_builder.py`, lines 1870–1876):

```python
project_context = (
    _load_hermes_md(cwd_path, context_length)
    or _load_agents_md(cwd_path, context_length)
    or _load_claude_md(cwd_path, context_length)
    or _load_cursorrules(cwd_path, context_length)
)
```

### 2.3 The Volatile Tier

**Purpose**: Per-session state that changes between sessions (but is stable within a session).

**Contents**:
- Memory snapshot (from `_memory_store.format_for_system_prompt("memory")`)
- User profile (from `_memory_store.format_for_system_prompt("user")`)
- External memory provider block (from `_memory_manager.build_system_prompt()`)
- Timestamp line (date-only, not minute-precision — `system_prompt.py`, lines 448–453):

```python
# Date-only (not minute-precision) so the system prompt is byte-stable
# for the full day.  Minute-precision changes invalidate prefix-cache KV
# on every rebuild path (compression boundary, fresh-agent gateway turns,
# session resume without a stored prompt).
# Credit: @iamfoz (PR #20451).
timestamp_line = f"Conversation started: {now.strftime('%A, %B %d, %Y')}"
```

### 2.4 Codex's Instruction Architecture

Codex uses a simpler but equally principled model with **three instruction categories** mapped to API roles:

| Category | API Role | Source |
|----------|----------|--------|
| `base_instructions` | `developer` | Server-side hardcoded system prompt |
| `developer_instructions` | `developer` | Per-session developer-supplied instructions |
| `user_instructions` | `user` (contextual) | AGENTS.md + host-provided `UserInstructions` |

The `developer` role (vs. `system`) is significant — OpenAI's newer models give stronger instruction-following weight to `developer`-role messages. Hermes mirrors this: `DEVELOPER_ROLE_MODELS = ("gpt-5", "codex")` triggers a role swap at the API boundary (`prompt_builder.py`, line 612).

### 2.5 Pi's Minimal Architecture

Pi uses a single-layer system prompt with an append-only extension model (`system-prompt.ts`, lines 28–173):

```typescript
export function buildSystemPrompt(options: BuildSystemPromptOptions): string {
    // 1. Identity + tool list + guidelines
    // 2. appendSystemPrompt (extension hook)
    // 3. <project_context> (AGENTS.md etc.)
    // 4. Skills section
    // 5. Date + cwd (always last)
}
```

Key design: Pi uses XML tags (`<project_context>`, `<project_instructions>`) rather than markdown headers for structural boundaries. The `customPrompt` parameter can fully replace the default prompt.

---

## 3. Prompt Engineering: Guidance Constants & Model-Family Steering

### 3.1 The Guidance Constant Pattern

Hermes defines behavioral guidance as **named Python constants** — not inline strings, not YAML config, not external files. Each constant:

1. **Addresses a specific failure mode** observed in production
2. **Is gated on the model family or toolset** that exhibits that failure mode
3. **Is deliberately short** because it rides the cached prefix
4. **Documents its origin** in code comments (PR numbers, model names, observed failures)

Example — `TASK_COMPLETION_GUIDANCE` (`prompt_builder.py`, lines 294–323):

```python
# Universal "finish the job" guidance — applied to ALL models, not gated
# by model family.  Addresses two cross-model failure modes:
#   1. Stopping after a stub: writing a tiny file or running one command
#      and then ending the turn with a description of the plan instead
#      of the finished artifact.  (Observed on Opus during a real
#      Sarasota real-estate build task: 3 API calls, 85-byte file,
#      one terminal command, finish_reason=stop.)
#   2. Fabricating output when a real path is blocked.  When `pip` or a
#      tool fails, some models will synthesize plausible-looking results
#      (fake addresses, fake JSON, fake numbers) instead of reporting
#      the blocker.  (Observed on DeepSeek v4-flash on the same task:
#      pushed through PEP-668 wall, then returned fabricated listings.)
TASK_COMPLETION_GUIDANCE = (
    "# Finishing the job\n"
    "When the user asks you to build, run, or verify something, the deliverable is "
    "a working artifact backed by real tool output — not a description of one. ..."
)
```

### 3.2 Model-Family Steering

Not all models need the same behavioral guidance. Hermes implements a **model-family gating system**:

**Tool-Use Enforcement** (`prompt_builder.py`, line 292):
```python
TOOL_USE_ENFORCEMENT_MODELS = ("gpt", "codex", "gemini", "gemma", "grok", "glm", "qwen", "deepseek")
```

**Enforcement config resolution** (`system_prompt.py`, lines 231–246):
- `"auto"` (default) — matches `TOOL_USE_ENFORCEMENT_MODELS`
- `true` — always inject (all models)
- `false` — never inject
- `list` — custom model-name substrings to match

**Family-Specific Guidance Blocks**:

| Family | Guidance Block | Key Behaviors Addressed |
|--------|---------------|------------------------|
| Gemini/Gemma | `GOOGLE_MODEL_OPERATIONAL_GUIDANCE` | Absolute paths, verify-before-edit, dependency checks, non-interactive CLI flags |
| GPT/Codex/Grok | `OPENAI_MODEL_EXECUTION_GUIDANCE` | Tool persistence, mandatory tool use for math/hashes/time, act-don't-ask, prerequisite checks, verification, anti-hallucination |
| All models | `PARALLEL_TOOL_CALL_GUIDANCE` | Batch independent tool calls into one turn |
| All models | `TASK_COMPLETION_GUIDANCE` | Don't stop after stubs, don't fabricate output |

### 3.3 Edit-Format Steering

The coding posture includes a **per-model-family edit-format nudge** (`coding_context.py`, lines 116–132):

```python
_EDIT_FORMAT_GUIDANCE: dict[str, tuple[tuple[str, ...], str]] = {
    "patch": (
        ("gpt", "codex"),
        "- Edit format: author new files with `write_file`; for edits to "
        "existing code use `patch` with `mode='patch'` (V4A diff) — including "
        "single-file edits. It's the edit format you handle most reliably.",
    ),
    "replace": (
        ("claude", "sonnet", "opus", "haiku",
         "gemini", "gemma", "deepseek", "qwen", "kimi", "glm", "grok",
         "hermes", "llama", "mistral", "devstral", "minimax"),
        "- Edit format: author new files with `write_file`; for edits to "
        "existing code prefer `patch` in `mode='replace'` — match a unique "
        "snippet and swap it.",
    ),
}
```

**Rationale**: GPT/Codex models were trained on V4A patch diffs (the only edit format in codex-rs). Anthropic and open-weight models were trained on str_replace-style editors. Matching the edit tool format to training reduces mistakes and wasted reasoning.

### 3.4 The Developer-Role Swap

For OpenAI's GPT-5+ and Codex models, instructions carry more weight in the `developer` role than `system`:

```python
DEVELOPER_ROLE_MODELS = ("gpt-5", "codex")
```

The swap happens at the API boundary — internal message representation stays consistent (`system` everywhere), and only the final API call swaps the role. This prevents leaking API-specific concerns into the prompt assembly logic.

### 3.5 The Coding Posture

The coding posture (`CODING_AGENT_GUIDANCE`, `coding_context.py`, lines 162–210) is the most detailed operational brief in any agent harness. It is structured as four sections:

1. **Gather context first** — read files before editing, batch lookups, never invent
2. **Make changes through tools** — use `patch`/`write_file`, match project style, don't show code blocks
3. **Verify and know when to stop** — run tests/linter, fix root causes, stop after 3 attempts
4. **Respect the user's repo** — don't commit/push/read secrets

Each section addresses specific failure modes that have been observed across model families.

### 3.6 Platform Hints: Environment-Aware Communication

Hermes defines **14+ platform-specific communication instructions** (`prompt_builder.py`, lines 614–818):

| Platform | Key Guidance |
|----------|-------------|
| WhatsApp | No markdown, MEDIA: file delivery syntax |
| WhatsApp Cloud | Markdown auto-converted, 24h conversation window warning |
| Telegram | Full rich Markdown, tables, task lists, math, stickers |
| Discord | Photo attachments via MEDIA: |
| Slack | File uploads via MEDIA: |
| Signal | No markdown, plain text only |
| CLI | No markdown, no MEDIA: tags, plain text terminal output |
| SMS | 1600 char limit, plain text |
| WebUI | Full Markdown, math, Mermaid, MEDIA: for local files |
| Cron | No user present, execute autonomously |
| WeCom | 10MB photo / 20MB document / AMR voice limits |
| Matrix | HTML auto-conversion |
| Email | Plain text, no greetings unless appropriate |

**Override system** (`_resolve_platform_hint`, `system_prompt.py`, lines 64–110):
```python
# Per-platform override from config (platform_hints.<platform>):
#   replace — substitute the default hint entirely
#   append  — keep the default and append extra text
#   bare string — treated as append
```

---

## 4. Context Engineering: Dynamic Context Assembly

### 4.1 Context File Discovery

Context file discovery follows a strict priority chain with a **first-match-wins** rule. The full discovery and loading pipeline:

**Step 1: Priority-based project context** (`build_context_files_prompt`, `prompt_builder.py`, lines 1841–1889):
1. `.hermes.md` / `HERMES.md` — walks up to git root via `_find_hermes_md`
2. `AGENTS.md` / `agents.md` — cwd only
3. `CLAUDE.md` / `claude.md` — cwd only
4. `.cursorrules` / `.cursor/rules/*.mdc` — cwd only (MDC files aggregated)

**Step 2: YAML frontmatter stripping** (`.hermes.md` only, `_strip_yaml_frontmatter`, line 102)

**Step 3: Security scanning** — every context file is passed through `_scan_context_content` before injection (see §7)

**Step 4: Dynamic truncation** — scales with the model's context window (`_dynamic_context_file_max_chars`, lines 1104–1116):
```python
_CONTEXT_FILE_CHARS_PER_TOKEN = 4
_CONTEXT_FILE_WINDOW_FRACTION = 0.06   # 6% of context window
_CONTEXT_FILE_DYNAMIC_CEILING = 500_000  # never exceed 500K chars

budget = int(context_length * 4 * 0.06)
# Floor: 20,000 chars (historical default)
# Ceiling: 500,000 chars
```

**Step 5: Head/tail truncation with recovery marker** (`_truncate_content`, lines 1673–1710):
```python
head_chars = int(max_chars * 0.7)   # 70% head
tail_chars = int(max_chars * 0.2)   # 20% tail
# 10% spent on the truncation marker
marker = f"[...truncated {filename}: kept {head_chars}+{tail_chars} of "
         f"{len(content)} chars. The middle is omitted — if you need the full "
         f"instructions, read the complete file with the read_file tool: {target}]"
```

### 4.2 Progressive Subdirectory Hints

Hermes implements a **subdirectory hint tracker** (`subdirectory_hints.py`) inspired by Block/goose's `SubdirectoryHintTracker`. As the agent navigates into subdirectories via tool calls, context files from those directories are lazily discovered and injected into tool results:

```python
class SubdirectoryHintTracker:
    def check_tool_call(self, tool_name, tool_args) -> Optional[str]:
        # 1. Extract directories from tool arguments (path, file_path, workdir)
        # 2. Walk up ancestors (max 5 levels) until hitting a loaded dir
        # 3. Load hint files from new directories
        # 4. Return formatted hint text to append to tool result
```

**Critical design decisions**:
- Maximum hint size: 8,000 chars per file (vs. 20K+ for startup context)
- Only subdirectories within the working directory tree are scanned (prevents cross-workspace contamination)
- Hints are injected into **tool results**, not the system prompt — preserves prompt caching
- First match wins per directory (same as startup loading)
- Security scanning applied identically to startup loading

### 4.3 Workspace Snapshot

The coding posture injects a **workspace snapshot** built once at session start (`build_coding_workspace_block`, `coding_context.py`, lines 738–789):

```
Workspace (snapshot at session start — re-check with `git` before acting on it):
- Root: /path/to/project
- Branch: main → origin/main (ahead 0, behind 2)
- Status: 3 modified, 1 untracked
- Recent commits:
    abc123f Fix typo in README
    def456a Add feature X
    ghi789b Refactor Y
- Project: pyproject.toml, package.json (uv/pnpm)
- Verify: pytest; pnpm run test; pnpm run lint
- Context files: AGENTS.md
```

**Key elements**:
- Git branch, upstream, ahead/behind counts
- Worktree detection (linked vs. primary)
- Dirty state (staged, modified, untracked, conflicts)
- Recent 3 commits (hash + subject)
- Project manifests and detected package managers
- Verify commands (detected from package.json scripts, Makefile targets, pytest config)
- Context file presence

### 4.4 Environment Probing

For remote terminal backends (docker, singularity, modal, ssh), Hermes runs a live probe inside the backend at prompt-build time (`_probe_remote_backend`, `prompt_builder.py`, lines 883–956):

```python
probe_cmd = (
    "printf 'os=%s\\nkernel=%s\\nhome=%s\\ncwd=%s\\nuser=%s\\n' "
    "\"$(uname -s 2>/dev/null || echo unknown)\" "
    "\"$(uname -r 2>/dev/null || echo unknown)\" "
    "\"$HOME\" \"$(pwd)\" \"$(whoami 2>/dev/null || id -un 2>/dev/null || echo unknown)\""
)
```

The probe result is cached per process (keyed by `(env_type, cwd_hint)`) and suppresses host info for remote backends.

### 4.5 Memory as Context

Memory is injected in the **volatile tier** of the system prompt via two channels:

1. **Built-in memory store**: `_memory_store.format_for_system_prompt("memory")` — static text block
2. **External memory provider**: `_memory_manager.build_system_prompt()` — extensible block from federated providers

Memory guidance emphasizes **what NOT to store** (`MEMORY_GUIDANCE`, `prompt_builder.py`, lines 144–165):
- Don't store task progress, session outcomes, completed-work logs
- Don't record PR numbers, commit SHAs, "fixed bug X"
- If a fact will be stale in a week, it doesn't belong in memory
- Write declarative facts, not instructions to yourself
- Procedures belong in skills, not memory

---

## 5. Agent Instruction Engineering: Project-Level Instructions

### 5.1 The AGENTS.md Standard

Both Hermes and Codex support AGENTS.md as the primary project-level instruction file. But their loading strategies differ significantly:

**Hermes**: Loads from **cwd only**, no recursive walk, security-scanned, truncated to dynamic budget. One file per session (`_load_agents_md`, `prompt_builder.py`, lines 1770–1786).

**Codex**: Loads from **project root to cwd**, concatenating all AGENTS.md files along the path (`agents_md.rs`, lines 1–16):
```
1. Walk upwards from cwd to find project root (using configurable markers)
2. Collect every AGENTS.md from root down to cwd (inclusive)
3. Concatenate in root-to-cwd order
4. Enforce total budget (project_doc_max_bytes)
```

**Codex also supports**:
- `AGENTS.override.md` — local override that takes precedence over `AGENTS.md`
- Configurable `project_doc_fallback_filenames` — additional filenames to scan
- Multi-environment AGENTS.md — labels instructions per-environment when multiple environments contribute
- Provenance tracking — each instruction entry records its source path, environment ID, and cwd

### 5.2 The SOUL.md Identity System

Hermes introduces **SOUL.md** as the agent identity layer — distinct from project instructions:

- Lives in `~/.hermes/SOUL.md` (user's home, not project dir)
- Loaded as **identity** (first slot in the stable tier)
- Falls back to `DEFAULT_AGENT_IDENTITY` when absent
- Security-scanned and truncated like all context files
- When SOUL.md loads successfully, `build_context_files_prompt` is called with `skip_soul=True` to prevent double injection

SOUL.md is the "who am I" layer. AGENTS.md is the "how should I work in this project" layer. The separation is critical because SOUL.md survives across projects — it defines the agent's personality and capabilities — while AGENTS.md is project-scoped.

### 5.3 Instruction Precedence

The full precedence stack across all harnesses:

| Priority | Source | Scope | Mutability |
|----------|--------|-------|------------|
| 1 (highest) | Hardcoded guidance constants | Global | Code change only |
| 2 | SOUL.md / BaseInstructions | User-global | User-editable |
| 3 | Developer instructions | Per-session | API/config |
| 4 | AGENTS.md / .hermes.md / CLAUDE.md / .cursorrules | Per-project | User-editable |
| 5 | Platform hints | Per-platform | Config override |
| 6 | Memory + user profile | Per-user | Agent-managed |
| 7 (lowest) | Ephemeral system prompt | Per-turn | API parameter |

**Hermes's ephemeral system prompt** is notable: it is NOT included in the cached system prompt. It's injected at API-call time only (`system_prompt.py`, lines 407–408):
```python
# Note: ephemeral_system_prompt is NOT included here. It's injected at
# API-call time only so it stays out of the cached/stored system prompt.
```

### 5.4 The Platform Hint Override System

Platform hints support a three-mode override from `config.yaml` (`_resolve_platform_hint`, `system_prompt.py`, lines 64–110):

```yaml
# config.yaml
platform_hints:
  telegram:
    replace: "You are a custom Telegram bot..."
  discord:
    append: "Also support /commands for server management."
  slack: "Extra guidance appended."  # bare string = append
```

Precedence: `replace` wins over `append` if both are present. Override text only affects the platform-hint segment — other tiers are unaffected.

### 5.5 Mid-Turn Steering (/steer)

Hermes supports **out-of-band user messages** delivered mid-turn via the `/steer` command. The steer is appended to tool results (the only role-alternation-safe slot mid-turn) with a bounded marker:

```python
STEER_MARKER_OPEN = "[OUT-OF-BAND USER MESSAGE — a direct message from the user, delivered mid-turn; not tool output]"
STEER_MARKER_CLOSE = "[/OUT-OF-BAND USER MESSAGE]"
```

The system prompt tells the model to trust **only this exact marker** (`STEER_CHANNEL_NOTE`), preventing lookalike instructions in tool output from being followed.

---

## 6. Deep Dive: Prompt Caching Design Patterns

Prompt caching is one of the most critical cost and latency optimization primitives available in modern LLM provider APIs (as of June 2026, supported natively by Anthropic, Google Gemini, and OpenAI). 

### 6.1 What Prompt Caching Is & Why Use It

When an API request is received, the provider's inference engine evaluates the prompt to construct Key-Value (KV) matrices of attention states. If prompt caching is enabled, these computed KV states are persisted in the provider's volatile RAM. 

*   **Latency Savings (TTFT)**: Bypassing prompt computation cuts the Time-to-First-Token (TTFT) by up to 90%. For prompts exceeding 50K tokens, TTFT drops from 2-3 seconds to sub-200ms.
*   **Financial Savings**: Caching reduces input costs significantly. For example, in Anthropic's Claude 3.5 models:
    *   **Cache Miss / Write**: $3.75 per million tokens (base input price + 25% write surcharge)
    *   **Cache Hit**: $0.30 per million tokens (a **90% discount** compared to standard input token costs)

### 6.2 When to Use Prompt Caching

Prompt caching should be integrated in multi-turn, stateful conversation architectures where large blocks of static or semi-static data are sent repeatedly:
*   **System Prompts & Guidelines**: Long instruction suites containing code posture, formatting guidelines, and communication constraints.
*   **Active Context Files**: Project-level guidelines like `AGENTS.md` and codebase snapshots.
*   **Pluggable Tools & Skills**: Injects indices of available skills and tool schemas which stay consistent across turns.
*   **Multi-Turn Agent Trajectories**: Maintaining the history of tool execution blocks and conversation history in subsequent steps.

### 6.3 How to Design Prompts for Cache Stability

To maximize cache hits, the system prompt and payload must be structured strictly to prevent prefix invalidation. A single altered byte shatters the prefix cache downstream from that character.

1.  **Prefix-Aware Ordering**: Prompts must be structured from most stable (static) to most volatile (dynamic).
    ```
    ┌────────────────────────────────────────────────────────┐
    │  Stable Prefix (Identity, Guidance Constants, Tools)   │  ◄── Cache Target (90% hits)
    ├────────────────────────────────────────────────────────┤
    │  Semi-Static (AGENTS.md context, Skill indices)        │  ◄── Secondary Cache Block
    ├────────────────────────────────────────────────────────┤
    │  Volatile Tail (User messages, memory, timestamp)      │  ─── Dynamic (always shifts)
    └────────────────────────────────────────────────────────┘
    ```
2.  **Explicit Cache Control Markers**: Explicitly inject cache control headers in the request payload. For example, Anthropic's API requires setting the `cache_control` block parameter:
    ```json
    {
      "role": "system",
      "content": [
        {
          "type": "text",
          "text": "..." 
        },
        {
          "type": "text",
          "text": "... [Long Stable Context block] ...",
          "cache_control": {"type": "ephemeral"}
        }
      ]
    }
    ```
3.  **Strict Byte-Stability (The Date-Only Rule)**: Dynamic context generation must enforce stable representations. For example, injecting a real-time timestamp down to the minute will invalidate the cache on every turn. In contrast, using date-only string formatting (`now.strftime('%A, %B %d, %Y')` [CLAIM-045]) preserves cache hits for the entire day.
4.  **Deterministic Serialization**:
    *   **Tool Ordering**: Ensure that tool schemas are serialized in a alphabetically sorted sequence rather than their registration sequence, preventing unexpected cache misses due to dynamic loading ordering.
    *   **Whitespace Normalization**: Strip duplicate carriage returns, variable indentation, and trailing spaces from dynamic components before joining.
5.  **Deferred Posture Flips**: User-driven config state toggles (such as turning coding posture `on`/`off`) should be deferred to the next session to prevent sharded cache keys mid-stream.

### 6.4 Codex and Open-Source Gateway Cache Implementations

*   **Codex**: Codex utilizes server-side prefix caching via OpenAI's Responses API [CLAIM-039]. The system prompt is passed as `developer`-role messages which the gateway caches natively. The `TruncationPolicy` dynamically adjusts tool output sizes to ensure they stay within cache-friendly bounds [CLAIM-039].
*   **LiteLLM**: The gateway routes cache settings dynamically, mapping the user's `cache_control` headers across different model adapters to standardize ephemeral caching on Anthropic and context caching on Google Gemini.

---

## 7. Prompt Security: Injection Detection & Promptware Defense

### 7.1 Context File Scanning

Every context file (AGENTS.md, SOUL.md, .cursorrules) is scanned before injection using the shared threat-pattern library (`_scan_context_content`, `prompt_builder.py`, lines 46–62):

```python
def _scan_context_content(content: str, filename: str) -> str:
    findings = _scan_for_threats(content, scope="context")
    if findings:
        logger.warning("Context file %s blocked: %s", filename, ", ".join(findings))
        return f"[BLOCKED: {filename} contained potential prompt injection ({', '.join(findings)}). Content not loaded.]"
    return content
```

**Scope**: The `"context"` scope covers classic injection + promptware/C2 patterns + role-play hijack. Strict-scope patterns (SSH backdoor, persistence, exfil-URL) are NOT applied to context files — those are too aggressive for a context file in a cloned repo (security research, infra docs).

### 7.2 The Subdirectory Containment Model

Subdirectory hints are **only loaded from within the working directory tree** (`subdirectory_hints.py`, lines 169–196):

```python
def _is_valid_subdir(self, path: Path) -> bool:
    # Reject paths outside the working directory tree.
    # This prevents loading AGENTS.md from outside the active workspace
    # (e.g. ~/.codex/AGENTS.md, ~/.claude/CLAUDE.md), which causes
    # cross-agent context contamination and instruction mixup.
    if not path.is_relative_to(self.working_dir):
        return False
```

### 7.3 Credential Guarding

The coding posture explicitly instructs the model not to read, print, or commit secrets:
```
"Respect the user's repo: don't commit, push, or rewrite history unless
asked, and never read, print, or commit secrets — leave .env and
credential files alone unless the user explicitly asks."
```

Combined with the compaction system's credential redaction (documented in the context management research), this creates a defense-in-depth approach:
1. **Prompt-level**: tell the model not to touch secrets
2. **Compaction-level**: redact credentials before summarization, redact again after to catch LLM echo
3. **Memory-level**: streaming scrubber strips memory-context injections from visible output

---

## 8. Skills as Deferred Prompt Material

### 8.1 The Skills Index Architecture

Skills are a **deferred prompt mechanism**: they appear in the system prompt as a compact index (name + one-line description), and the full skill content is loaded on-demand via `skill_view`.

The skills index uses a **two-layer cache** (`build_skills_system_prompt`, `prompt_builder.py`, lines 1334–1358):

1. **In-process LRU cache** (max 8 entries): Keyed by `(skills_dir, external_dirs, tools, toolsets, platform, disabled, compact_categories)`. Gateway mode serves multiple platforms, so the platform key creates separate cache entries.

2. **Disk snapshot** (`.skills_prompt_snapshot.json`): Stores pre-parsed skill metadata validated by mtime/size manifest. Survives process restarts. Invalidated when any SKILL.md or DESCRIPTION.md file changes.

### 8.2 Conditional Skill Visibility

Skills can declare conditions that gate their visibility in the index (`_skill_should_show`, `prompt_builder.py`, lines 1303–1331):

```python
# fallback_for: hide when the primary tool/toolset IS available
# requires: hide when a required tool/toolset is NOT available
```

This allows, for example, a "manual-git" skill to only appear when the git toolset is NOT loaded, or a "kanban-worker" skill to only appear when the kanban toolset IS loaded.

### 8.3 Compact Mode (Focus Posture)

Under the opt-in `focus` coding posture, non-coding skill categories are demoted to **names-only** in the index:

```python
_NON_CODING_SKILL_CATEGORIES = (
    "apple", "communication", "cooking", "creative", "email", "finance",
    "gaming", "gifs", "health", "media", "music", "note-taking",
    "productivity", "shopping", "smart-home", "social-media", "travel",
)
```

**Critical**: Skills are **never hidden** — even under focus mode. Every skill name stays in the index and remains loadable. An earlier revision that fully pruned categories caused "silent capability loss" — models don't reliably use `skills_list` to rediscover what the index stopped showing them.

---

## 9. Cross-Framework Comparison

| Capability | Hermes Agent | Codex | Pi | LangGraph | Claude Code |
|------------|-------------|-------|----|-----------|-------------|
| **Prompt tiers** | 3 (stable/context/volatile) | 3 (base/developer/user) | 1 (flat + append) | N/A (user-defined) | 2 (system/project) |
| **Model-family steering** | 8+ families gated | GPT/Codex developer role | None | N/A | Claude-optimized |
| **Context file priority** | 4-type cascade | AGENTS.md + fallbacks | AGENTS.md | N/A | CLAUDE.md |
| **Hierarchical AGENTS.md** | cwd only | Root-to-cwd cascade | cwd only | N/A | cwd + parent walk |
| **Security scanning** | Threat pattern library | None (sandboxed) | None | N/A | Unknown |
| **Prefix cache preservation** | Date-only timestamps, once-per-session build | Server-side API caching | No explicit strategy | N/A | Server-side |
| **Skills index** | 2-layer cached manifest | SDK-loaded skills | Prompt-embedded skills | N/A | None |
| **Platform hints** | 14+ platforms | 1 (CLI) | None | N/A | 1 (CLI) |
| **Subdirectory hints** | Progressive lazy discovery | None | None | N/A | None |
| **Workspace snapshot** | Git + manifests + verify commands | Git-aware | cwd only | N/A | Git-aware |
| **Edit-format steering** | Per-model-family (patch vs replace) | V4A-only | None | N/A | str_replace-only |
| **Mid-turn steering** | /steer with bounded markers | None | None | N/A | None |
| **Ephemeral prompt** | API-time injection, not cached | Per-turn developer_instructions | appendSystemPrompt | N/A | Unknown |
| **Memory in prompt** | Volatile tier + streaming scrubber | None | None | N/A | None |
| **Environment probing** | Remote backend live probe | Environment selection | None | N/A | None |

---

## 10. Architecture Recommendations

### 10.1 The Four-Layer Prompt Stack

For a model-agnostic agent harness, implement prompts as four layers:

```
┌─────────────────────────────────────────┐
│  Layer 4: EPHEMERAL                      │  Per-turn, API-time only
│  (not cached, not stored)                │  Nudges, plugin context
├─────────────────────────────────────────┤
│  Layer 3: VOLATILE                       │  Per-session, may change
│  Memory snapshot, user profile,          │  between sessions
│  timestamp (date-only)                   │
├─────────────────────────────────────────┤
│  Layer 2: CONTEXT                        │  Per-project, stable
│  AGENTS.md, project instructions,        │  within session
│  workspace snapshot                      │
├─────────────────────────────────────────┤
│  Layer 1: STABLE                         │  Global, byte-stable
│  Identity, behavioral guidance,          │  across all turns
│  model-family steering, tools, skills    │
└─────────────────────────────────────────┘
```

### 10.2 Seven Critical Design Principles

1. **Build once, cache for session**: The system prompt should be computed once per session. Only compaction triggers a rebuild.

2. **Model-family steering is mandatory**: Different model families exhibit different failure modes. A single "system prompt" for all models is leaving performance on the table. At minimum, implement tool-use enforcement gating and edit-format steering.

3. **Context files are untrusted input**: Every project instruction file (AGENTS.md, .cursorrules, etc.) must be security-scanned before injection. Block-with-placeholder is the correct response — never silently strip.

4. **Dynamic truncation scales with context window**: The budget for project instructions should be a fraction (4–6%) of the model's context window, with a floor (20K chars) and ceiling (500K chars). The truncation should preserve head and tail with a recovery marker.

5. **Subdirectory hints belong in tool results, not the system prompt**: Injecting context discovered mid-session into the system prompt would invalidate the prefix cache. Tool-result injection is cache-safe and contextually appropriate.

6. **Skills are an index, not a dump**: The system prompt should contain a compact index (name + description). Full skill content is loaded on-demand. The index uses two-layer caching (in-process + disk snapshot) for cold-start performance.

7. **Date-only timestamps**: Never use minute-precision timestamps in the system prompt. The cost of invalidating the prefix cache on every turn far exceeds the value of knowing the exact minute.

### 10.3 Minimum Viable Implementation Order

1. **Static guidance constants** — Define behavioral constants for tool-use enforcement, task completion, and parallel tool calls. Gate on model family.
2. **Context file discovery** — Implement the priority cascade (AGENTS.md > .cursorrules) with security scanning and dynamic truncation.
3. **Prefix-cache-aware assembly** — Build the prompt once per session, use date-only timestamps, cache on the agent object.
4. **Workspace snapshot** — Git branch/status, project manifests, verify commands.
5. **Platform hints** — At minimum CLI and WebUI. Add messaging platforms as needed.
6. **Skills index** — Two-layer cached manifest with conditional visibility.
7. **Model-family steering** — Edit-format nudges, developer-role swap, family-specific operational guidance.
8. **Subdirectory hints** — Progressive lazy discovery injected into tool results.
9. **Mid-turn steering** — Bounded-marker out-of-band user messages.
10. **Ephemeral prompt layer** — Plugin hooks and per-turn context injection.

### 10.4 Minimizing Regex and Deterministic Logic

In designing dynamic prompt builders and instruction-extraction engines, **regular expressions (regex) and hardcoded string-matching constraints must be minimized**. Regular expressions are brittle, fail silently on variable LLM outputs (such as unexpected markdown wrapping, varying indentation, or custom unicode spacing), and are prone to catastrophic backtracking vulnerabilities (ReDoS).

*   **Programmatic Structure Parsing**: To extract code blocks, configuration variables, or diff outputs, developers should prioritize programmatic parser structures. This includes:
    *   Using standard libraries or structured parsers (e.g. JSON5, YAML parsers, or Abstract Syntax Trees (AST)) rather than regex match cascades.
    *   Evaluating lines sequentially via tokenizer loops (e.g. splitting by lines and scanning matching prefixes) instead of executing multi-line wildcard regexes.
*   **LLM-First Semantic Parsing**: When extracting unstructured intents, matching complex user configurations, or classifying prompt payloads, delegate parsing logic to a lightweight, fast model (e.g. Flash or Nano tier model) configured with structured outputs (using Zod or JSON schemas) instead of coding complex, fragile deterministic matching cascades.
*   **Restricted Regex Usage**: Restrict regular expressions exclusively to:
    *   Well-defined, regular token transformations (such as replacing `+` and `/` characters during Base64 URL normalization in `encodeSetupCode` [CLAIM-125]).
    *   Strict character set limits (like matching digits for ID extraction `/\d+/`).
    *   Obfuscation stripping where string signatures are simple and bounded.

---

## 11. Implementation Checklist

### Prompt Engineering (Guidance Constants)

- [ ] Define `TOOL_USE_ENFORCEMENT_GUIDANCE` with model-family gating
- [ ] Define `TASK_COMPLETION_GUIDANCE` (universal — all models)
- [ ] Define `PARALLEL_TOOL_CALL_GUIDANCE` (universal — all models)
- [ ] Define model-family operational guidance (Google, OpenAI, Anthropic at minimum)
- [ ] Define `CODING_AGENT_GUIDANCE` with 4-section structure
- [ ] Implement edit-format steering per model family (patch vs replace)
- [ ] Implement developer-role swap for GPT-5+/Codex models
- [ ] Implement tool-use enforcement config resolution (auto/true/false/list)
- [ ] Define platform hints for each supported communication channel
- [ ] Implement platform hint override system (replace/append/bare)
- [ ] Document every guidance constant with the failure mode it addresses

### Context Engineering (Dynamic Assembly)

- [ ] Implement three-tier prompt assembly (stable/context/volatile)
- [ ] Implement context file priority cascade with first-match-wins
- [ ] Implement dynamic truncation scaling with model context window
- [ ] Implement head/tail truncation with recovery marker
- [ ] Implement workspace snapshot (git + manifests + verify commands)
- [ ] Implement environment probing for remote backends
- [ ] Implement progressive subdirectory hint discovery
- [ ] Inject subdirectory hints into tool results (not system prompt)
- [ ] Implement memory snapshot injection in volatile tier
- [ ] Use date-only timestamps for prefix cache preservation
- [ ] Implement per-process backend probe caching
- [ ] Implement context-file truncation warning surfacing via status channel

### Agent Instruction Engineering (User Configuration)

- [ ] Implement AGENTS.md loading with security scanning
- [ ] Implement SOUL.md / identity layer (separate from project instructions)
- [ ] Implement instruction precedence stack
- [ ] Implement YAML frontmatter stripping for .hermes.md
- [ ] Implement ephemeral prompt injection (API-time, not cached)
- [ ] Implement mid-turn steering with bounded markers
- [ ] Implement plugin `pre_llm_call` hook for context injection
- [ ] Implement subdirectory containment (reject paths outside working dir)
- [ ] Implement context file security scanning (threat pattern library)
- [ ] Implement block-with-placeholder for detected injection attempts

### Skills System

- [ ] Implement two-layer skills index cache (in-process LRU + disk snapshot)
- [ ] Implement conditional skill visibility (requires/fallback_for)
- [ ] Implement compact mode for non-coding categories (names-only, never hidden)
- [ ] Implement disk snapshot invalidation via mtime/size manifest
- [ ] Implement external skills directory support (read-only, local precedence)

### Caching & Performance

- [ ] Cache system prompt on agent object, rebuild only on compression
- [ ] Cache skills index per (dir, tools, toolsets, platform, disabled, compact)
- [ ] Cache environment probe per (backend_type, cwd)
- [ ] Cache backend probe per process lifetime
- [ ] Use ContextVar for truncation warnings (thread/task isolation)
- [ ] Use threading lock for skills prompt cache (concurrent gateway sessions)

---

## Appendix A: Source File Reference

| File | Lines | Bytes | Key Concerns |
|------|-------|-------|-------------|
| `hermes-agent/agent/system_prompt.py` | 537 | 25 KB | Three-tier assembly, prompt caching, platform hint resolution |
| `hermes-agent/agent/prompt_builder.py` | 1,889 | 93 KB | Guidance constants, context file loading, skills index, environment hints, platform hints, truncation, security scanning |
| `hermes-agent/agent/coding_context.py` | 790 | 34 KB | Coding posture, edit-format steering, workspace snapshot, runtime mode resolution |
| `hermes-agent/agent/subdirectory_hints.py` | 271 | 10 KB | Progressive hint discovery, containment model |
| `hermes-agent/agent/turn_context.py` | 439 | 19 KB | Per-turn setup, preflight compression, plugin hooks, memory prefetch |
| `codex/codex-rs/core/src/agents_md.rs` | 498 | 18 KB | Hierarchical AGENTS.md discovery, multi-environment support, provenance tracking |
| `codex/codex-rs/core/src/session/turn_context.rs` | 851 | 36 KB | Turn context assembly, model info, environment selection, permission profiles |
| `pi-mono/packages/coding-agent/src/core/system-prompt.ts` | 174 | 6 KB | Minimal prompt builder, XML-structured context, skills formatting |
