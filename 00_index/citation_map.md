# Citation Map

> Maps every factual claim in final documents back to a registered source in `source_registry.md`.
> No final architecture recommendation may be made unless the supporting research is traceable here.

## Format

```
[CLAIM-XXX] "claim text" → [SRC-XXX] (file/section reference) — URL
  └─ Used in: <document path>
```

---

## Claims

### Codebase Study: Open Responses ([SRC-007](https://github.com/open-responses/open-responses))

<a id="claim-001"></a>
[CLAIM-001] "Open Responses is a self-hosted drop-in replacement for OpenAI's Responses API" → [SRC-007](https://github.com/open-responses/open-responses) (README.md, line 5)
  └─ Used in: None

<a id="claim-002"></a>
[CLAIM-002] "Open Responses core is a single main.go file (~80KB)" → [SRC-007](https://github.com/open-responses/open-responses) (main.go, file size)
  └─ Used in: None

<a id="claim-003"></a>
[CLAIM-003] "Open Responses supports Docker Compose V1 and V2 compatibility" → [SRC-007](https://github.com/open-responses/open-responses) (CLAUDE.md, Docker Compose section)
  └─ Used in: None

### Codebase Study: Codex ([SRC-008](https://github.com/openai/codex))

<a id="claim-004"></a>
[CLAIM-004] "Codex has 128 Rust crates in its workspace" → [SRC-008](https://github.com/openai/codex) (codex-rs/ directory listing, verified: 128 `Cargo.toml` files on 2026-06-23)
  └─ Used in: None

<a id="claim-005"></a>
[CLAIM-005] "Codex enforces no history rewrite, bounded items, and 10K token cap per context item" → [SRC-008](https://github.com/openai/codex) (AGENTS.md, lines 96-100)
  └─ Used in: None

<a id="claim-006"></a>
[CLAIM-006] "Codex prefers modules under 500 LoC, 800 max" → [SRC-008](https://github.com/openai/codex) (AGENTS.md, lines 50-54)
  └─ Used in: None

<a id="claim-007"></a>
[CLAIM-007] "Codex uses cross-platform sandboxing: Seatbelt (macOS), Bubblewrap/Landlock (Linux), restricted tokens (Windows)" → [SRC-008](https://github.com/openai/codex) (codex-rs/core/README.md)
  └─ Used in: 15_frontend_react_vite_agent_stack/complete_frontend_architecture.md

<a id="claim-008"></a>
[CLAIM-008] "Codex explicitly warns against adding code to codex-core due to bloat" → [SRC-008](https://github.com/openai/codex) (AGENTS.md, lines 73-84)
  └─ Used in: None

### Codebase Study: LiteLLM ([SRC-009](https://github.com/BerriAI/litellm))

<a id="claim-009"></a>
[CLAIM-009] "LiteLLM supports 100+ LLM providers in OpenAI format" → [SRC-009](https://github.com/BerriAI/litellm) (README.md, line 7)
  └─ Used in: None

<a id="claim-010"></a>
[CLAIM-010] "LiteLLM provider translation uses BaseConfig with transform_request() and transform_response()" → [SRC-009](https://github.com/BerriAI/litellm) (ARCHITECTURE.md, lines 355-366)
  └─ Used in: None

<a id="claim-011"></a>
[CLAIM-011] "LiteLLM's main.py is 342KB, router.py is 512KB, utils.py is 403KB" → [SRC-009](https://github.com/BerriAI/litellm) (file sizes in litellm/ directory, verified 2026-06-23)
  └─ Used in: None

<a id="claim-012"></a>
[CLAIM-012] "LiteLLM achieves 8ms P95 latency at 1K RPS" → [SRC-009](https://github.com/BerriAI/litellm) (README.md, line 62)
  └─ Used in: None

<a id="claim-013"></a>
[CLAIM-013] "LiteLLM is used by Stripe, Netflix, Google ADK, OpenAI Agents SDK" → [SRC-009](https://github.com/BerriAI/litellm) (README.md, lines 66-76)
  └─ Used in: None

<a id="claim-014"></a>
[CLAIM-014] "LiteLLM uses Prisma with PostgreSQL and Redis for persistence/caching" → [SRC-009](https://github.com/BerriAI/litellm) (ARCHITECTURE.md, lines 186-206)
  └─ Used in: None

### Codebase Study: OpenRouter SDK ([SRC-010](https://github.com/OpenRouterTeam/typescript-sdk))

<a id="claim-015"></a>
[CLAIM-015] "OpenRouter SDK provides access to 400+ language models through a unified API" → [SRC-010](https://github.com/OpenRouterTeam/typescript-sdk) (OVERVIEW.md, line 3)
  └─ Used in: None

<a id="claim-016"></a>
[CLAIM-016] "OpenRouter SDK is auto-generated from OpenAPI specs via Speakeasy" → [SRC-010](https://github.com/OpenRouterTeam/typescript-sdk) (CLAUDE.md, line 7)
  └─ Used in: None

<a id="claim-017"></a>
[CLAIM-017] "OpenRouter SDK has three tool types: regular, generator, and manual" → [SRC-010](https://github.com/OpenRouterTeam/typescript-sdk) (CLAUDE.md, lines 130-134)
  └─ Used in: None

<a id="claim-018"></a>
[CLAIM-018] "OpenRouter SDK supports async parameter resolution where any parameter can be a function" → [SRC-010](https://github.com/OpenRouterTeam/typescript-sdk) (CLAUDE.md, lines 137-141)
  └─ Used in: None

### Model Landscape Research (OpenRouter model pages, 2026-06-23)

<a id="claim-019"></a>
[CLAIM-019] "Grok 4.3 pricing is $1.25 input / $2.50 output per 1M tokens with 1M context window" → [OpenRouter](https://openrouter.ai/x-ai/grok-4.3) (og:description meta tag)
  └─ Used in: None

<a id="claim-020"></a>
[CLAIM-020] "GLM 5.2 pricing is $0.98 input / $3.08 output per 1M tokens with 1M context, 20 providers" → [OpenRouter](https://openrouter.ai/z-ai/glm-5.2) (og:description meta tag)
  └─ Used in: 19_final_reports/harness_architecture_specification_report.md

<a id="claim-021"></a>
[CLAIM-021] "Claude Fable 5 pricing is $10 input / $50 output per 1M tokens, Mythos-class, 128K max output" → [OpenRouter](https://openrouter.ai/anthropic/claude-fable-5) (og:description meta tag)
  └─ Used in: None

<a id="claim-022"></a>
[CLAIM-022] "Nemotron 3 Ultra has 55B active / 550B total params (MoE), $0.50 input / $2.20 output, 1M context" → [OpenRouter](https://openrouter.ai/nvidia/nemotron-3-ultra-550b-a55b) (og:description meta tag)
  └─ Used in: 19_final_reports/harness_architecture_specification_report.md

<a id="claim-023"></a>
[CLAIM-023] "Kimi K2.7 Code activates 32B parameters out of ~1T total, $0.68 input / $3.41 output, 262K context" → [OpenRouter](https://openrouter.ai/moonshotai/kimi-k2.7-code) (og:description meta tag + model description)
  └─ Used in: 19_final_reports/harness_architecture_specification_report.md

<a id="claim-024"></a>
[CLAIM-024] "20x pricing spread exists between cheapest ($0.50 Nemotron) and most expensive ($10 Claude) frontier input pricing" → Calculated from CLAIM-019 through CLAIM-022
  └─ Used in: None

<a id="claim-025"></a>
[CLAIM-025] "5 of 8 frontier reasoning models support 1M token context windows" → Aggregated from [OpenRouter](https://openrouter.ai/rankings) model pages
  └─ Used in: None

### Context Management & Evolution ([SRC-002](https://github.com/NousResearch/hermes-agent): Hermes, [SRC-008](https://github.com/openai/codex): Codex)

<a id="claim-026"></a>
[CLAIM-026] "Hermes context_compressor.py is 2,650 lines implementing a 5-phase compression pipeline" → [SRC-002](https://github.com/NousResearch/hermes-agent) (agent/context_compressor.py, full file)
  └─ Used in: None

<a id="claim-027"></a>
[CLAIM-027] "Hermes uses a 13-section structured summary template for compaction" → [SRC-002](https://github.com/NousResearch/hermes-agent) (agent/context_compressor.py, lines 1527–1600)
  └─ Used in: 19_final_reports/harness_architecture_specification_report.md

<a id="claim-028"></a>
[CLAIM-028] "Hermes implements in-place compaction (PR #38763) as alternative to session rotation" → [SRC-002](https://github.com/NousResearch/hermes-agent) (agent/conversation_compression.py, lines 527–556)
  └─ Used in: None

<a id="claim-029"></a>
[CLAIM-029] "Hermes uses a DB-backed compression lock to prevent concurrent session forks" → [SRC-002](https://github.com/NousResearch/hermes-agent) (agent/conversation_compression.py, lines 349–444)
  └─ Used in: None

<a id="claim-030"></a>
[CLAIM-030] "Hermes iterative summarization stores _previous_summary and updates it instead of regenerating" → [SRC-002](https://github.com/NousResearch/hermes-agent) (agent/context_compressor.py, lines 867–868, 1602–1616, 1684–1685)
  └─ Used in: None

<a id="claim-031"></a>
[CLAIM-031] "Hermes tail protection uses a token-budgeted backward walk (~20K tokens default)" → [SRC-002](https://github.com/NousResearch/hermes-agent) (agent/context_compressor.py, lines 2231–2333)
  └─ Used in: 19_final_reports/harness_architecture_specification_report.md

<a id="claim-032"></a>
[CLAIM-032] "Hermes anti-thrashing skips compression after 2 consecutive passes saving <10%" → [SRC-002](https://github.com/NousResearch/hermes-agent) (agent/context_compressor.py, lines 967–976)
  └─ Used in: 19_final_reports/harness_architecture_specification_report.md

<a id="claim-033"></a>
[CLAIM-033] "Hermes tool output pruning has 3 passes: dedup (MD5 hash), summarize, and truncate arguments" → [SRC-002](https://github.com/NousResearch/hermes-agent) (agent/context_compressor.py, lines 982–1142)
  └─ Used in: None

<a id="claim-034"></a>
[CLAIM-034] "Hermes MemoryManager allows exactly one built-in and one external memory provider" → [SRC-002](https://github.com/NousResearch/hermes-agent) (agent/memory_manager.py, lines 314–398)
  └─ Used in: None

<a id="claim-035"></a>
[CLAIM-035] "Hermes session_search uses FTS5 with 4 calling shapes: discovery, scroll, read, browse" → [SRC-002](https://github.com/NousResearch/hermes-agent) (tools/session_search_tool.py, lines 1–30, 495–616)
  └─ Used in: None

<a id="claim-036"></a>
[CLAIM-036] "Hermes session rotation rolls back to parent session ID if child creation fails" → [SRC-002](https://github.com/NousResearch/hermes-agent) (agent/conversation_compression.py, lines 603–640)
  └─ Used in: None

<a id="claim-037"></a>
[CLAIM-037] "Hermes summary failure fallback chain: aux model → main model → deterministic fallback → abort" → [SRC-002](https://github.com/NousResearch/hermes-agent) (agent/context_compressor.py, lines 1691–1828)
  └─ Used in: None

<a id="claim-038"></a>
[CLAIM-038] "Hermes redacts credentials before summarization and again after to catch LLM echo" → [SRC-002](https://github.com/NousResearch/hermes-agent) (agent/context_compressor.py, lines 1176–1182, 1683)
  └─ Used in: None

<a id="claim-039"></a>
[CLAIM-039] "Codex uses server-side Responses API compaction with per-tool TruncationPolicy" → [SRC-008](https://github.com/openai/codex) (codex-rs/core/src/unified_exec/process.rs, line 304; core/src/tools/spec_plan.rs, line 711)
  └─ Used in: 14_backend_agent_stack_engineering/prompt_context_instruction_engineering.md

<a id="claim-040"></a>
[CLAIM-040] "Hermes memory sync runs on a single-worker background ThreadPoolExecutor to avoid blocking turns" → [SRC-002](https://github.com/NousResearch/hermes-agent) (agent/memory_manager.py, lines 516–572)
  └─ Used in: None

### Prompt, Context & Instruction Engineering ([SRC-002](https://github.com/NousResearch/hermes-agent): Hermes, [SRC-008](https://github.com/openai/codex): Codex, [SRC-003](https://github.com/badlogic/pi-mono): Pi)

<a id="claim-041"></a>
[CLAIM-041] "Hermes system prompt uses three tiers: stable (identity, tools, skills), context (AGENTS.md, .cursorrules), volatile (memory, timestamp)" → [SRC-002](https://github.com/NousResearch/hermes-agent) (agent/system_prompt.py, lines 10–19)
  └─ Used in: None

<a id="claim-042"></a>
[CLAIM-042] "Hermes context file discovery uses a first-match-wins priority cascade: .hermes.md → AGENTS.md → CLAUDE.md → .cursorrules" → [SRC-002](https://github.com/NousResearch/hermes-agent) (agent/prompt_builder.py, lines 1841–1876)
  └─ Used in: None

<a id="claim-043"></a>
[CLAIM-043] "Hermes dynamic context file truncation uses 6% of context window with 20K floor and 500K ceiling" → [SRC-002](https://github.com/NousResearch/hermes-agent) (agent/prompt_builder.py, lines 1104–1116)
  └─ Used in: None

<a id="claim-044"></a>
[CLAIM-044] "Hermes truncation preserves 70% head and 20% tail with a recovery marker in the middle" → [SRC-002](https://github.com/NousResearch/hermes-agent) (agent/prompt_builder.py, lines 1700–1710)
  └─ Used in: None

<a id="claim-045"></a>
[CLAIM-045] "Hermes uses date-only timestamps (strftime '%A, %B %d, %Y') to preserve prefix cache" → [SRC-002](https://github.com/NousResearch/hermes-agent) (agent/system_prompt.py, lines 448–453)
  └─ Used in: 14_backend_agent_stack_engineering/prompt_context_instruction_engineering.md

<a id="claim-046"></a>
[CLAIM-046] "Hermes edit-format steering maps GPT/Codex to V4A patch mode and Claude/Gemini/open-weight to replace mode" → [SRC-002](https://github.com/NousResearch/hermes-agent) (agent/coding_context.py, lines 116–132)
  └─ Used in: None

<a id="claim-047"></a>
[CLAIM-047] "Codex AGENTS.md discovery walks from project root to cwd, concatenating all files along the path" → [SRC-008](https://github.com/openai/codex) (codex-rs/core/src/agents_md.rs, lines 1–16, 155–241)
  └─ Used in: 19_final_reports/harness_architecture_specification_report.md

<a id="claim-048"></a>
[CLAIM-048] "Codex supports AGENTS.override.md as a local override that takes precedence over AGENTS.md" → [SRC-008](https://github.com/openai/codex) (codex-rs/core/src/agents_md.rs, lines 37–38, 246–247)
  └─ Used in: None

<a id="claim-049"></a>
[CLAIM-049] "Hermes SubdirectoryHintTracker injects context discovered mid-session into tool results, not system prompt" → [SRC-002](https://github.com/NousResearch/hermes-agent) (agent/subdirectory_hints.py, lines 57–98)
  └─ Used in: None

<a id="claim-050"></a>
[CLAIM-050] "Hermes subdirectory hints are limited to 8,000 chars and contained to the working directory tree" → [SRC-002](https://github.com/NousResearch/hermes-agent) (agent/subdirectory_hints.py, lines 36, 169–196)
  └─ Used in: None

<a id="claim-051"></a>
[CLAIM-051] "Hermes coding posture supports 4 modes: auto (default), focus (lean toolset), on (forced), off (disabled)" → [SRC-002](https://github.com/NousResearch/hermes-agent) (agent/coding_context.py, lines 39–49, 281–298)
  └─ Used in: None

<a id="claim-052"></a>
[CLAIM-052] "Hermes tool-use enforcement is model-family gated to GPT, Codex, Gemini, Gemma, Grok, GLM, Qwen, DeepSeek" → [SRC-002](https://github.com/NousResearch/hermes-agent) (agent/prompt_builder.py, line 292)
  └─ Used in: None

<a id="claim-053"></a>
[CLAIM-053] "Hermes workspace snapshot includes git branch, upstream, ahead/behind, dirty state, recent 3 commits, manifests, and verify commands" → [SRC-002](https://github.com/NousResearch/hermes-agent) (agent/coding_context.py, lines 738–789)
  └─ Used in: None

<a id="claim-054"></a>
[CLAIM-054] "Hermes project root detection uses 18+ marker files and 3+ lockfile patterns for package manager inference" → [SRC-002](https://github.com/NousResearch/hermes-agent) (agent/coding_context.py, lines 74–91)
  └─ Used in: None

<a id="claim-055"></a>
[CLAIM-055] "Hermes DEVELOPER_ROLE_MODELS swaps system to developer role for GPT-5+/Codex at the API boundary" → [SRC-002](https://github.com/NousResearch/hermes-agent) (agent/prompt_builder.py, line 612)
  └─ Used in: None

<a id="claim-056"></a>
[CLAIM-056] "Pi uses XML tags (<project_context>, <project_instructions>) for structural boundaries in system prompt" → [SRC-003](https://github.com/badlogic/pi-mono) (packages/coding-agent/src/core/system-prompt.ts, lines 62–67, 155–160)
  └─ Used in: None

<a id="claim-057"></a>
[CLAIM-057] "Hermes skills index uses a two-layer cache: in-process LRU (max 8) + disk snapshot validated by mtime/size manifest" → [SRC-002](https://github.com/NousResearch/hermes-agent) (agent/prompt_builder.py, lines 1334–1391)
  └─ Used in: None

<a id="claim-058"></a>
[CLAIM-058] "Hermes compact/focus mode demotes non-coding skill categories to names-only but never hides them" → [SRC-002](https://github.com/NousResearch/hermes-agent) (agent/coding_context.py, lines 449–469)
  └─ Used in: None

<a id="claim-059"></a>
[CLAIM-059] "Hermes defines 14+ platform-specific communication instructions covering WhatsApp, Telegram, Discord, Slack, CLI, WebUI, and others" → [SRC-002](https://github.com/NousResearch/hermes-agent) (agent/prompt_builder.py, lines 614–818)
  └─ Used in: None

<a id="claim-060"></a>
[CLAIM-060] "Codex uses provenance tracking per instruction entry: source_path, environment_id, cwd" → [SRC-008](https://github.com/openai/codex) (codex-rs/core/src/agents_md.rs, lines 472–484)
  └─ Used in: None

### Tool Systems ([SRC-002](https://github.com/NousResearch/hermes-agent): Hermes, [SRC-003](https://github.com/badlogic/pi-mono): Pi, [SRC-008](https://github.com/openai/codex): Codex)

<a id="claim-061"></a>
[CLAIM-061] "Hermes ToolRegistry uses module-level auto-discovery via ast.parse to identify files containing registry.register calls before importing them" → [SRC-002](https://github.com/NousResearch/hermes-agent) (tools/registry.py, lines 29–74)
  └─ Used in: 07_tools/built_in_local_tools.md

<a id="claim-062"></a>
[CLAIM-062] "Hermes TTL caches check_fn results for 30 seconds to prevent redundant environment probing (like Docker/Modal status checks)" → [SRC-002](https://github.com/NousResearch/hermes-agent) (tools/registry.py, lines 121–141)
  └─ Used in: 07_tools/built_in_local_tools.md

<a id="claim-063"></a>
[CLAIM-063] "Hermes ToolRegistry supports override=True plugin registration to replace built-in tools (such as swapping Playwright with a headed Chrome CDP backend)" → [SRC-002](https://github.com/NousResearch/hermes-agent) (tools/registry.py, lines 247–280)
  └─ Used in: 07_tools/built_in_local_tools.md

<a id="claim-064"></a>
[CLAIM-064] "Codex traits CoreToolRuntime and ToolExecutor define the interface for native tools, supporting hooks, telemetry tags, and dynamic argument diff streaming" → [SRC-008](https://github.com/openai/codex) (codex-rs/core/src/tools/registry.rs, lines 41–145)
  └─ Used in: 07_tools/built_in_local_tools.md

<a id="claim-065"></a>
[CLAIM-065] "Pi separates its default tool collections into coding-focused tools (read, bash, edit, write) and read-only tools (read, grep, find, ls)" → [SRC-003](https://github.com/badlogic/pi-mono) (packages/coding-agent/src/core/tools/index.ts, lines 138–154)
  └─ Used in: 07_tools/built_in_local_tools.md

<a id="claim-066"></a>
[CLAIM-066] "Pi uses a pluggable BashOperations interface allowing the bash tool executor to delegate commands to remote shells like SSH" → [SRC-003](https://github.com/badlogic/pi-mono) (packages/coding-agent/src/core/tools/bash.ts, lines 40–58)
  └─ Used in: 07_tools/built_in_local_tools.md

<a id="claim-067"></a>
[CLAIM-067] "Hermes centralizes tool output truncation limits behind get_tool_output_limits in config.yaml, defaulting to 50KB for bytes, 2000 lines for pagination, and 2000 characters for line length" → [SRC-002](https://github.com/NousResearch/hermes-agent) (tools/tool_output_limits.py, lines 39–41, 59–89)
  └─ Used in: 07_tools/built_in_local_tools.md

<a id="claim-068"></a>
[CLAIM-068] "Hermes file path resolution uses absolute, sentinel-free workspace roots (rejecting sentinels like '.', 'auto', 'cwd') to prevent worktree directory misrouting" → [SRC-002](https://github.com/NousResearch/hermes-agent) (tools/file_tools.py, lines 111–137, 246–257)
  └─ Used in: 07_tools/built_in_local_tools.md

<a id="claim-069"></a>
[CLAIM-069] "Hermes rejects writing to sensitive paths (/etc/, /boot/, /usr/lib/systemd/, ~/.ssh/, netrc, pgpass, npmrc, pypirc, and ~/.hermes/config.yaml) to prevent security escalations" → [SRC-002](https://github.com/NousResearch/hermes-agent) (tools/file_tools.py, lines 368–375, 397–424)
  └─ Used in: 07_tools/built_in_local_tools.md, 19_final_reports/harness_architecture_specification_report.md

<a id="claim-070"></a>
[CLAIM-070] "Hermes checks if the write payload contains line numbers (consecutive digits followed by |) or internal status messages and blocks them to prevent file corruption" → [SRC-002](https://github.com/NousResearch/hermes-agent) (tools/file_tools.py, lines 597–601, 655–726)
  └─ Used in: 07_tools/built_in_local_tools.md, 19_final_reports/harness_architecture_specification_report.md

<a id="claim-071"></a>
[CLAIM-071] "Hermes defines HARDLINE_PATTERNS (recursive deletes of root/home, mkfs, dd to raw devices, fork bombs, telinit, shutdown) that cannot be bypassed by YOLO modes" → [SRC-002](https://github.com/NousResearch/hermes-agent) (tools/approval.py, lines 262–284, 333–343)
  └─ Used in: 07_tools/built_in_local_tools.md, 19_final_reports/harness_architecture_specification_report.md

<a id="claim-072"></a>
[CLAIM-072] "Hermes normalizes terminal command strings by stripping ANSI escapes, null bytes, shell backslash-escapes, and empty-string literals to resist obfuscation bypasses" → [SRC-002](https://github.com/NousResearch/hermes-agent) (tools/approval.py, lines 559–591)
  └─ Used in: 07_tools/built_in_local_tools.md, 19_final_reports/harness_architecture_specification_report.md

<a id="claim-073"></a>
[CLAIM-073] "Hermes terminal tool transforms sudo invocations to sudo -S -p '' and pipes cached or user-provided passwords to stdin to execute elevated commands on TTY-less terminals" → [SRC-002](https://github.com/NousResearch/hermes-agent) (tools/terminal_tool.py, lines 445–558, 752–800)
  └─ Used in: 07_tools/built_in_local_tools.md

<a id="claim-074"></a>
[CLAIM-074] "Hermes terminal tool brace-groups backgrounded compound statements (A && { B & }) to prevent hanging stdout pipes and waiting on long-running processes" → [SRC-002](https://github.com/NousResearch/hermes-agent) (tools/terminal_tool.py, lines 587–749)
  └─ Used in: 07_tools/built_in_local_tools.md

<a id="claim-075"></a>
[CLAIM-075] "Hermes Session Search tool provides query-based discovery with first/last 3 message bookends and message drill-down centered on specific anchor message IDs" → [SRC-002](https://github.com/NousResearch/hermes-agent) (tools/session_search_tool.py, lines 5–30)
  └─ Used in: 07_tools/built_in_local_tools.md

<a id="claim-076"></a>
[CLAIM-076] "Hermes delegate_task blocks child agents from executing clarify, memory, execute_code, send_message, or delegate_task to prevent recursive loops and side effects" → [SRC-002](https://github.com/NousResearch/hermes-agent) (tools/delegate_tool.py, lines 44–53)
  └─ Used in: 06_subagents/multi_model_deliberation_and_swarms.md, 07_tools/built_in_local_tools.md

<a id="claim-077"></a>
[CLAIM-077] "Hermes subagent execution handles TUI deadlock by installing non-interactive auto-deny or auto-approve callbacks into worker threads since they do not inherit the parent's TTY" → [SRC-002](https://github.com/NousResearch/hermes-agent) (tools/delegate_tool.py, lines 57–112)
  └─ Used in: None

<a id="claim-078"></a>
[CLAIM-078] "Hermes cronjob creator scans user prompts strictly for exfiltration patterns and invisible Unicode characters, while sanitizing and stripping invisible Unicode from pre-vetted skill content" → [SRC-002](https://github.com/NousResearch/hermes-agent) (tools/cronjob_tools.py, lines 225–278)
  └─ Used in: 07_tools/built_in_local_tools.md

<a id="claim-079"></a>
[CLAIM-079] "Hermes todo tool maintains session todo items on the agent instance, injecting only active (pending/in_progress) tasks up to a capped count (256) and description length (4000) after compaction" → [SRC-002](https://github.com/NousResearch/hermes-agent) (tools/todo_tool.py, lines 24–33, 106–138)
  └─ Used in: 07_tools/built_in_local_tools.md

<a id="claim-080"></a>
[CLAIM-080] "Hermes progressive disclosure skills system lists names and descriptions first, deferredly loading full instructions and linked files on-demand" → [SRC-002](https://github.com/NousResearch/hermes-agent) (tools/skills_tool.py, lines 9–13, 52–67)
  └─ Used in: 07_tools/built_in_local_tools.md, 19_final_reports/harness_architecture_specification_report.md

### Agent Execution Loops ([SRC-001](https://github.com/openclaw/openclaw), [SRC-002](https://github.com/NousResearch/hermes-agent), [SRC-003](https://github.com/badlogic/pi-mono), [SRC-004](https://github.com/langchain-ai/langgraph), [SRC-005](https://github.com/langchain-ai/langchain), [SRC-008](https://github.com/openai/codex))

<a id="claim-081"></a>
[CLAIM-081] "Hermes conversation loop implements dual-limit budgeting (max_iterations and IterationBudget remaining check) combined with a single-turn _budget_grace_call fallback turn" → [SRC-002](https://github.com/NousResearch/hermes-agent) (agent/conversation_loop.py, lines 589–614)
  └─ Used in: 19_final_reports/harness_architecture_specification_report.md

<a id="claim-082"></a>
[CLAIM-082] "Hermes conversation loop drains pending user steering input (_drain_pending_steer) before the model call on each iteration, injecting the steer content into the last tool message to keep message sequence roles valid" → [SRC-002](https://github.com/NousResearch/hermes-agent) (agent/conversation_loop.py, lines 662–700)
  └─ Used in: 19_final_reports/harness_architecture_specification_report.md

<a id="claim-083"></a>
[CLAIM-083] "Hermes executes defensive role-alternation repairs (repair_message_sequence_with_cursor) and sanitizes malformed tool call JSON payloads (_repair_tool_call_arguments) before every LLM request" → [SRC-002](https://github.com/NousResearch/hermes-agent) (agent/conversation_loop.py, lines 707–737)
  └─ Used in: None

<a id="claim-084"></a>
[CLAIM-084] "Hermes conversation loop features eager provider failovers, switching to fallback providers on network timeouts, invalid responses, rate limits, or safety refusals, with jittered exponential backoffs up to 120s between attempts" → [SRC-002](https://github.com/NousResearch/hermes-agent) (agent/conversation_loop.py, lines 1280–1417)
  └─ Used in: 14_backend_agent_stack_engineering/context_management_and_evolution.md

<a id="claim-085"></a>
[CLAIM-085] "Pi and OpenClaw agent loops utilize a nested dual while-loop structure: an outer loop that handles follow-up/queued messages, and an inner loop that processes tool execution and steering messages" → [SRC-003](https://github.com/badlogic/pi-mono) (packages/agent/src/agent-loop.ts, lines 170–266) and [SRC-001](https://github.com/openclaw/openclaw) (packages/agent-core/src/agent-loop.ts, lines 297–429)
  └─ Used in: None

<a id="claim-086"></a>
[CLAIM-086] "Pi and OpenClaw agent loops resolve sequential vs. parallel tool execution modes by scanning the batch of requested tool calls and executing them sequentially if any tool requires sequential execution mode" → [SRC-003](https://github.com/badlogic/pi-mono) (packages/agent/src/agent-loop.ts, lines 380–388) and [SRC-001](https://github.com/openclaw/openclaw) (packages/agent-core/src/agent-loop.ts, lines 547–589)
  └─ Used in: None

<a id="claim-087"></a>
[CLAIM-087] "Pi and OpenClaw agent loops expose beforeToolCall and afterToolCall lifecycle hooks that can block tool execution or rewrite tool results dynamically" → [SRC-003](https://github.com/badlogic/pi-mono) (packages/agent/src/agent-loop.ts, lines 581–605, 682–702) and [SRC-001](https://github.com/openclaw/openclaw) (packages/agent-core/src/agent-loop.ts, lines 581–605, 682–707)
  └─ Used in: None

<a id="claim-088"></a>
[CLAIM-088] "Codex drives a turn loop (run_turn) that intercepts pending user inputs (get_pending_input) mid-run and triggers pre-turn and mid-turn auto-compaction when context tokens exceed limits" → [SRC-008](https://github.com/openai/codex) (codex-rs/core/src/session/turn.rs, lines 215–223, 287–380)
  └─ Used in: None

<a id="claim-089"></a>
[CLAIM-089] "Codex resolves explicitly enabled plugin and skill references in user input to inject turn-scoped instructions (build_skills_and_plugins) before generating prompts" → [SRC-008](https://github.com/openai/codex) (codex-rs/core/src/session/turn.rs, lines 170–175, 521–684)
  └─ Used in: None

<a id="claim-090"></a>
[CLAIM-090] "LangGraph drives loop ticks (tick and after_tick in PregelLoop) using a Pregel state channel model that evaluates triggers, spawns concurrent task executions, saves checkpoints, and handles node-level error handlers" → [SRC-004](https://github.com/langchain-ai/langgraph) (libs/langgraph/langgraph/pregel/_loop.py, lines 592–674, 676–715)
  └─ Used in: None

<a id="claim-091"></a>
[CLAIM-091] "LangGraph supports human-in-the-loop capabilities by raising a GraphInterrupt before or after node execution when matching configured interrupt criteria" → [SRC-004](https://github.com/langchain-ai/langgraph) (libs/langgraph/langgraph/pregel/_loop.py, lines 659–664, 707–712)
  └─ Used in: 04_agent_loops/human_in_the_loop_steering.md

<a id="claim-092"></a>
[CLAIM-092] "LangChain's classic AgentExecutor implements a while-loop (_call) bounded by iteration caps and wall-clock execution time limits" → [SRC-005](https://github.com/langchain-ai/langchain) (libs/langchain/langchain_classic/agents/agent.py, lines 1235–1239, 1585–1600)
  └─ Used in: None

<a id="claim-093"></a>
[CLAIM-093] "LangChain AgentExecutor routes output parser errors back to the model as observations by executing a virtual _Exception tool, allowing the agent to self-correct" → [SRC-005](https://github.com/langchain-ai/langchain) (libs/langchain/langchain_classic/agents/agent.py, lines 1322–1361)
  └─ Used in: None

<a id="claim-094"></a>
[CLAIM-094] "LangChain early stopping methods include force (returns static limit message) and generate (sends a final completion request to the model prompting it to synthesize an answer from the intermediate steps)" → [SRC-005](https://github.com/langchain-ai/langchain) (libs/langchain/langchain_classic/agents/agent.py, lines 940–968)
  └─ Used in: None

<a id="claim-095"></a>
[CLAIM-095] "LiteLLM utilizes tenacity declarative retry loops (tenacity.Retrying and tenacity.AsyncRetrying) in completion_with_retries and acompletion_with_retries to recover from transient API timeouts, 429s, or model outages." → [SRC-009](https://github.com/BerriAI/litellm) (litellm/main.py, lines 5840-5899)
  └─ Used in: None

<a id="claim-096"></a>
[CLAIM-096] "OpenRouter SDK implements an asynchronous while(true) retry loop (retryBackoff in retries.ts) that manages connection error recovery, exponential backoffs, random jitter, and HTTP Retry-After header parsing." → [SRC-010](https://github.com/OpenRouterTeam/typescript-sdk) (src/lib/retries.ts, lines 153-195)
  └─ Used in: None

<a id="claim-097"></a>
[CLAIM-097] "assistant-ui implements a reconnecting SSE stream parser (openPiEventStream in eventSource.ts) with a nested outer reconnection while loop, an inner stream reader while loop, and a chunk framing loop." → [SRC-006](https://github.com/assistant-ui/assistant-ui) (packages/react-pi/src/client/eventSource.ts, lines 144-192)
  └─ Used in: None

<a id="claim-098"></a>
[CLAIM-098] "Open Responses' CLI tool (main.go) uses Go iteration loops inside Cobra command runners to check service health, tail docker logs, and parse configurations." → [SRC-007](https://github.com/open-responses/open-responses) (main.go, lines 1805-1851)
  └─ Used in: None

<a id="claim-099"></a>
[CLAIM-099] "Hermes's Docker environment (docker.py) runs tini or catatonit as PID 1 to prevent zombie processes, and runs an asynchronous orphan container reaper to clean up exited containers." → [SRC-002](https://github.com/NousResearch/hermes-agent) (tools/environments/docker.py, lines 138-237, 858-870)
  └─ Used in: 07_tools/built_in_local_tools.md

<a id="claim-100"></a>
[CLAIM-100] "Hermes's Daytona environment (daytona.py) supports persistent sandboxes and implements file sync batching via sandbox.fs.upload_files() multipart uploads to bypass per-file TLS/HTTP handshake overhead." → [SRC-002](https://github.com/NousResearch/hermes-agent) (tools/environments/daytona.py, lines 89-130, 160-180)
  └─ Used in: None

<a id="claim-101"></a>
[CLAIM-101] "Docker and Podman provide open-source container isolation; Firecracker implements KVM-based microVMs with sub-10ms boot times; gVisor intercepts system calls via a userspace Sentry kernel." → [SRC-002](https://github.com/NousResearch/hermes-agent) (tools/environments/docker.py) and [Firecracker](https://github.com/firecracker-microvm/firecracker)
  └─ Used in: 19_final_reports/harness_architecture_specification_report.md

<a id="claim-102"></a>
[CLAIM-102] "Building container sandboxes from scratch requires system primitives including Linux namespaces (MNT, PID, NET, USER, IPC, UTS), cgroups v2 resource limits, chroot or pivot_root mount isolation, and seccomp filters." → [Linux kernel docs](https://man7.org/linux/man-pages/man7/namespaces.7.html)
  └─ Used in: 19_final_reports/harness_architecture_specification_report.md

<a id="claim-103"></a>
[CLAIM-103] "Building Firecracker microVMs from scratch requires a compiled minimal vmlinux kernel, an ext4 rootfs disk image, resources configuration, and JSON REST API socket commands." → [Firecracker](https://github.com/firecracker-microvm/firecracker/blob/main/docs/getting-started.md)
  └─ Used in: 19_final_reports/harness_architecture_specification_report.md

<a id="claim-104"></a>
[CLAIM-104] "Chrome Extension Bridges connect active browser tabs to local agent runtimes via WebSockets, allowing DOM manipulation, credential inheritance, and bot-detection bypass." → [Chrome DevTools Protocol](https://chromedevtools.github.io/devtools-protocol/)
  └─ Used in: 19_final_reports/harness_architecture_specification_report.md

### Conversation Completions, Anthropic Shapes, and Reranking ([SRC-001](https://github.com/openclaw/openclaw), [SRC-002](https://github.com/NousResearch/hermes-agent))

<a id="claim-105"></a>
[CLAIM-105] "Hermes's Anthropic adapter extracts system messages and passes them as a top-level system parameter." → [SRC-002](https://github.com/NousResearch/hermes-agent) (agent/anthropic_adapter.py, lines 2267–2281)
  └─ Used in: 19_final_reports/harness_architecture_specification_report.md

<a id="claim-106"></a>
[CLAIM-106] "Hermes's Anthropic adapter enforces role alternation by merging consecutive same-role messages." → [SRC-002](https://github.com/NousResearch/hermes-agent) (agent/anthropic_adapter.py, lines 2045–2095)
  └─ Used in: 14_backend_agent_stack_engineering/context_management_and_evolution.md, 19_final_reports/harness_architecture_specification_report.md

<a id="claim-107"></a>
[CLAIM-107] "Hermes's Anthropic adapter converts tool messages to tool_result content blocks inside a user message, merging consecutive tool results." → [SRC-002](https://github.com/NousResearch/hermes-agent) (agent/anthropic_adapter.py, lines 1909–1968)
  └─ Used in: 19_final_reports/harness_architecture_specification_report.md

<a id="claim-108"></a>
[CLAIM-108] "Hermes's Anthropic adapter strips orphaned tool_use and tool_result blocks, demoting thinking blocks to text if their signatures are invalidated." → [SRC-002](https://github.com/NousResearch/hermes-agent) (agent/anthropic_adapter.py, lines 1988–2044)
  └─ Used in: 14_backend_agent_stack_engineering/context_management_and_evolution.md, 19_final_reports/harness_architecture_specification_report.md

<a id="claim-109"></a>
[CLAIM-109] "Hermes's Anthropic adapter strips thinking block signatures for third-party endpoints, keeps unsigned thinking for Kimi/DeepSeek, and downgrades unsigned thinking to text for direct Anthropic." → [SRC-002](https://github.com/NousResearch/hermes-agent) (agent/anthropic_adapter.py, lines 2097–2202)
  └─ Used in: 19_final_reports/harness_architecture_specification_report.md

<a id="claim-110"></a>
[CLAIM-110] "Hermes's Anthropic adapter evicts older multimodal screenshots to save context, keeping only the 3 most recent images." → [SRC-002](https://github.com/NousResearch/hermes-agent) (agent/anthropic_adapter.py, lines 2203–2237)
  └─ Used in: 19_final_reports/harness_architecture_specification_report.md

<a id="claim-111"></a>
[CLAIM-111] "Hermes's Anthropic adapter sanitizes responses-only keys like instructions and store to prevent SDK type errors." → [SRC-002](https://github.com/NousResearch/hermes-agent) (agent/anthropic_adapter.py, lines 2554–2583)
  └─ Used in: None

<a id="claim-112"></a>
[CLAIM-112] "Hermes's Anthropic adapter normalizes tool names under OAuth to double-underscore mcp__ prefix to bypass subscription billing filters." → [SRC-002](https://github.com/NousResearch/hermes-agent) (agent/anthropic_adapter.py, lines 2406–2422)
  └─ Used in: 19_final_reports/harness_architecture_specification_report.md

<a id="claim-113"></a>
[CLAIM-113] "The qmd hybrid retrieval engine uses embeddinggemma-300M-Q8_0 for vector embeddings, qwen3-reranker-0.6b-q8_0 for reranking, and qmd-query-expansion-1.7B for query expansion." → [SRC-002](https://github.com/NousResearch/hermes-agent) (optional-skills/research/qmd/SKILL.md, lines 65–73)
  └─ Used in: 19_final_reports/harness_architecture_specification_report.md

<a id="claim-114"></a>
[CLAIM-114] "The qmd search engine merges sparse and dense queries via Reciprocal Rank Fusion (RRF) with top-rank weight boosts." → [SRC-002](https://github.com/NousResearch/hermes-agent) (optional-skills/research/qmd/SKILL.md, lines 375–380)
  └─ Used in: 19_final_reports/harness_architecture_specification_report.md

<a id="claim-115"></a>
[CLAIM-115] "The qmd search engine blends retrieval and reranking scores dynamically based on candidate rank range, trusting the reranker more for the long tail." → [SRC-002](https://github.com/NousResearch/hermes-agent) (optional-skills/research/qmd/SKILL.md, lines 381–384)
  └─ Used in: 19_final_reports/harness_architecture_specification_report.md

<a id="claim-116"></a>
[CLAIM-116] "Gateways like OpenCode or Hermes support Claude Code integration by loading and refreshing first-party OAuth credentials from macOS Keychain entries ('Claude Code-credentials') and local JSON records." → [SRC-002](https://github.com/NousResearch/hermes-agent) (agent/anthropic_adapter.py, lines 859–954)
  └─ Used in: 19_final_reports/harness_architecture_specification_report.md

<a id="claim-117"></a>
[CLAIM-117] "Gateways spoof Claude Code user-agent details (claude-cli/2.1.74) and inject specific OAuth beta headers to allow third-party tools to route through Anthropic plan billing." → [SRC-002](https://github.com/NousResearch/hermes-agent) (agent/anthropic_adapter.py, lines 804–813, 2376–2422)
  └─ Used in: 19_final_reports/harness_architecture_specification_report.md

<a id="claim-118"></a>
[CLAIM-118] "Open Responses provides a self-hosted drop-in alternative for OpenAI's stateful Responses API, allowing client SDKs to query local models via a unified thread-runner spec." → [SRC-007](https://github.com/open-responses/open-responses) (open-responses/README.md, lines 17–22)
  └─ Used in: 08_mcps/mcp_apps_and_ui.md, 15_frontend_react_vite_agent_stack/complete_frontend_architecture.md, 15_frontend_react_vite_agent_stack/frontend_architecture_and_ux.md, 19_final_reports/harness_architecture_specification_report.md

<a id="claim-119"></a>
[CLAIM-119] "LiteLLM manages local model execution by automatically spawning background 'ollama serve' subprocesses to host offline models." → [SRC-009](https://github.com/BerriAI/litellm) (litellm/tests/test_litellm/proxy/proxy_server/test_lifecycle.py, lines 442–457)
  └─ Used in: 19_final_reports/harness_architecture_specification_report.md

<a id="claim-120"></a>
[CLAIM-120] "Coding agent systems are bootstrapped CLI-first to validate the core ReAct loops and tools in a bare-metal shell environment before abstracting them into SDK classes or editor frontends." → Developer agent bootstrapping analysis
  └─ Used in: None

<a id="claim-121"></a>
[CLAIM-121] "Transitioning code-executing agents to multi-tenant architectures requires compute isolation (running untrusted code in resource-constrained sandboxes or container microVMs) to prevent tenant file access and exfiltration." → [Firecracker](https://github.com/firecracker-microvm/firecracker), [gVisor](https://gvisor.dev/)
  └─ Used in: None

<a id="claim-122"></a>
[CLAIM-122] "Multi-tenant database architectures isolate concurrent session state by provisioning workspace-scoped SQLite files to prevent SQLite database lock contention." → [SRC-002](https://github.com/NousResearch/hermes-agent) (hermes_state.py)
  └─ Used in: 14_backend_agent_stack_engineering/context_management_and_evolution.md

<a id="claim-123"></a>
[CLAIM-123] "Gateway proxies intercept outbound request streams, verifying tenant JWT auth tokens to track model costs and enforce organizational rate-limiting quotas." → [SRC-009](https://github.com/BerriAI/litellm) (litellm/proxy/)
  └─ Used in: None

### Channel Connectors & Secure Device-Pairing Protocols ([SRC-001](https://github.com/openclaw/openclaw))

<a id="claim-124"></a>
[CLAIM-124] "The gateway generates a short-lived SetupPayload structure containing the gateway public URL, a single-use bootstrap token, and expiration timestamp." → [SRC-001](https://github.com/openclaw/openclaw) (extensions/device-pair/index.ts, lines 51-55, 600-610)
  └─ Used in: 12_open_source_voice_integration/channel_connectors_and_pairing.md, 19_final_reports/harness_architecture_specification_report.md

<a id="claim-125"></a>
[CLAIM-125] "The setup code is serialized and normalized into a URL-safe Base64 string." → [SRC-001](https://github.com/openclaw/openclaw) (extensions/device-pair/index.ts, lines 462-466)
  └─ Used in: 12_open_source_voice_integration/channel_connectors_and_pairing.md, 14_backend_agent_stack_engineering/prompt_context_instruction_engineering.md, 19_final_reports/harness_architecture_specification_report.md

<a id="claim-126"></a>
[CLAIM-126] "The URL-safe setup code is converted to a QR PNG image using a temporary file system pipeline." → [SRC-001](https://github.com/openclaw/openclaw) (extensions/device-pair/index.ts, lines 790-800)
  └─ Used in: 12_open_source_voice_integration/channel_connectors_and_pairing.md

<a id="claim-127"></a>
[CLAIM-127] "The setup QR is dispatched as media over platform-specific channel-specific senders." → [SRC-001](https://github.com/openclaw/openclaw) (extensions/device-pair/index.ts, lines 613-643, 801-817)
  └─ Used in: 12_open_source_voice_integration/channel_connectors_and_pairing.md

<a id="claim-128"></a>
[CLAIM-128] "Pairing network policies block cleartext ws:// connections unless loopback or private LAN ranges, otherwise forcing wss://." → [SRC-001](https://github.com/openclaw/openclaw) (extensions/device-pair/index.ts, lines 260-307)
  └─ Used in: 12_open_source_voice_integration/channel_connectors_and_pairing.md, 19_final_reports/harness_architecture_specification_report.md

<a id="claim-129"></a>
[CLAIM-129] "Handshake client verification holds requests in a pending queue until approved via `/pair approve` command." → [SRC-001](https://github.com/openclaw/openclaw) (extensions/device-pair/index.ts, lines 715-736)
  └─ Used in: 12_open_source_voice_integration/channel_connectors_and_pairing.md, 19_final_reports/harness_architecture_specification_report.md

<a id="claim-130"></a>
[CLAIM-130] "Twilio SMS dispatches REST POST requests to Twilio Messages API using Basic authentication." → [SRC-001](https://github.com/openclaw/openclaw) (extensions/sms/src/twilio.ts, lines 521-567)
  └─ Used in: 12_open_source_voice_integration/channel_connectors_and_pairing.md, 19_final_reports/harness_architecture_specification_report.md

<a id="claim-131"></a>
[CLAIM-131] "SMS webhook security verifies signatures using timing-safe comparisons of computed SHA-1 HMAC hashes." → [SRC-001](https://github.com/openclaw/openclaw) (extensions/sms/src/twilio.ts, lines 201-218)
  └─ Used in: 12_open_source_voice_integration/channel_connectors_and_pairing.md, 19_final_reports/harness_architecture_specification_report.md

<a id="claim-132"></a>
[CLAIM-132] "Slack channel connector verifies HMAC-SHA256 signatures, formats rich blocks, and binds thread_ts conversation keys." → [SRC-001](https://github.com/openclaw/openclaw) (extensions/slack/src/channel.ts, lines 247-269, 524-590)
  └─ Used in: 12_open_source_voice_integration/channel_connectors_and_pairing.md, 19_final_reports/harness_architecture_specification_report.md

<a id="claim-133"></a>
[CLAIM-133] "Telegram ingress spools incoming updates asynchronously to handle spike traffic without timeouts." → [SRC-001](https://github.com/openclaw/openclaw) (extensions/telegram/src/telegram-ingress-spool.ts, lines 1-100)
  └─ Used in: 12_open_source_voice_integration/channel_connectors_and_pairing.md, 19_final_reports/harness_architecture_specification_report.md

<a id="claim-134"></a>
[CLAIM-134] "Telegram forum topic binding creates canonical session threads mapped as chatId:topicId to isolate sub-chats." → [SRC-001](https://github.com/openclaw/openclaw) (extensions/telegram/src/channel.ts, lines 524-596)
  └─ Used in: 12_open_source_voice_integration/channel_connectors_and_pairing.md, 19_final_reports/harness_architecture_specification_report.md

<a id="claim-135"></a>
[CLAIM-135] "WhatsApp connector connects using emulated socket loops, captures QR codes, and caches authenticated session keys." → [SRC-001](https://github.com/openclaw/openclaw) (extensions/whatsapp/src/login-qr.ts, lines 191-244, 313-500)
  └─ Used in: 12_open_source_voice_integration/channel_connectors_and_pairing.md, 19_final_reports/harness_architecture_specification_report.md

### Gotchas, Caching, Tracing & Regex Constraints ([SRC-002](https://github.com/NousResearch/hermes-agent), [SRC-005](https://github.com/langchain-ai/langchain), [SRC-001](https://github.com/openclaw/openclaw))

<a id="claim-136"></a>
[CLAIM-136] "Prompt caching requires stable prefixes and placing volatile parameters (like time and dynamic chat histories) at the absolute tail of the message array to avoid invalidating cache partitions." → [SRC-002](https://github.com/NousResearch/hermes-agent) (agent/system_prompt.py, lines 448-453)
  └─ Used in: 19_final_reports/harness_architecture_specification_report.md

<a id="claim-137"></a>
[CLAIM-137] "Regex-based parsing of JSON tool payloads is fragile and presents ReDoS backtracking risks, making programmatic parsing (JSON5, AST) or structured LLM schemas preferred." → [SRC-002](https://github.com/NousResearch/hermes-agent) (agent/conversation_loop.py, lines 707-737; agent/message_sanitization.py, lines 185-279)
  └─ Used in: 06_subagents/multi_model_deliberation_and_swarms.md, 19_final_reports/harness_architecture_specification_report.md

<a id="claim-138"></a>
[CLAIM-138] "SQLite database concurrency is throttled by write locks in WAL mode, requiring randomized retry jitter (e.g. 15 retries, 20-150ms backoff) or dedicated single-tenant database files." → [SRC-002](https://github.com/NousResearch/hermes-agent) (agent/conversation_compression.py, lines 349–444; hermes_state.py, lines 929-977)
  └─ Used in: 19_final_reports/harness_architecture_specification_report.md

<a id="claim-139"></a>
[CLAIM-139] "Docker sandbox runtimes require a PID 1 init process like tini or catatonit to reap zombie subprocesses and prevent file descriptor leakage." → [SRC-002](https://github.com/NousResearch/hermes-agent) (tools/environments/docker.py, lines 138-237, 858-870)
  └─ Used in: 19_final_reports/harness_architecture_specification_report.md

<a id="claim-140"></a>
[CLAIM-140] "Tool path validators must resolve paths absolute-only, ignoring sentinel-based prefixes like '.' or 'cwd' to prevent accidental escape of target git worktrees." → [SRC-002](https://github.com/NousResearch/hermes-agent) (tools/file_tools.py, lines 111–137)
  └─ Used in: 19_final_reports/harness_architecture_specification_report.md

<a id="claim-141"></a>
[CLAIM-141] "To prevent shell execution hangs in TTY-less environments, interactive sudo commands must use standard redirect flags (sudo -S -p '') and background processes must be brace-grouped." → [SRC-002](https://github.com/NousResearch/hermes-agent) (tools/terminal_tool.py, lines 587-749)
  └─ Used in: 19_final_reports/harness_architecture_specification_report.md

<a id="claim-142"></a>
[CLAIM-142] "Self-healing loops use virtual tools (like LangChain's _Exception tool) to pass parsing/validation failures back to the LLM for correction, bounded by small loop limits to prevent cost spirals." → [SRC-005](https://github.com/langchain-ai/langchain) (libs/langchain/langchain_classic/agents/agent.py, lines 1322-1361)
  └─ Used in: 19_final_reports/harness_architecture_specification_report.md

<a id="claim-143"></a>
[CLAIM-143] "Twilio webhook verification is highly sensitive to reverse proxies terminating SSL or rewriting requested URLs, requiring explicit header parsing to reconstruct absolute origin endpoints." → [SRC-001](https://github.com/openclaw/openclaw) (extensions/sms/src/twilio.ts, lines 201-218)
  └─ Used in: 19_final_reports/harness_architecture_specification_report.md

<a id="claim-144"></a>
[CLAIM-144] "WebSocket-based personal WhatsApp client emulators are prone to session file corruption upon sudden connection drops, requiring transaction-safe double-buffered credentials updates." → [SRC-001](https://github.com/openclaw/openclaw) (extensions/whatsapp/src/login-qr.ts, lines 191-244)
  └─ Used in: 19_final_reports/harness_architecture_specification_report.md

---

### Multi-Model Deliberation & Fusion Patterns ([SRC-011](https://openrouter.ai/docs/guides/features/plugins/fusion), [SRC-012](https://docs.crewai.com/concepts/processes), [SRC-013](https://langchain-ai.github.io/langgraph/), [SRC-014](https://arxiv.org/abs/2406.04692), [SRC-015](https://openrouter.ai/rankings), [SRC-016](https://github.com/karpathy/llm-council), [SRC-017](https://github.com/danielrosehill/Awesome-LLM-Council-Projects), [SRC-018](https://github.com/togethercomputer/MoA))

<a id="claim-145"></a>
[CLAIM-145] "OpenRouter Fusion dispatches prompts to a panel of 2–8 models in parallel with web search enabled; a judge model produces structured JSON analysis (consensus, contradictions, blind spots, unique insights) without merging; the primary model uses the analysis to write the final answer." → [SRC-011](https://openrouter.ai/docs/guides/features/plugins/fusion) (Plugin Configuration section)
  └─ Used in: 06_subagents/README.md, 06_subagents/multi_model_deliberation_and_swarms.md, 18_architecture_recommendations/README.md, 19_final_reports/harness_architecture_specification_report.md

<a id="claim-146"></a>
[CLAIM-146] "OpenRouter Fusion uses x-openrouter-fusion-depth headers to prevent recursive fusion invocations; panel and judge models cannot invoke fusion a second time, bounding deliberation to a single level." → [SRC-011](https://openrouter.ai/docs/guides/features/plugins/fusion) (Recursion protection section)
  └─ Used in: 06_subagents/multi_model_deliberation_and_swarms.md, 18_architecture_recommendations/README.md, 19_final_reports/harness_architecture_specification_report.md

<a id="claim-147"></a>
[CLAIM-147] "The Mixture-of-Agents paper (Wang et al., ICLR 2025) demonstrated that an open-source-only MoA using Llama, Qwen, and similar models achieved state-of-the-art results on AlpacaEval 2.0, outperforming GPT-4 as a standalone model, by leveraging the collaborativeness property where LLMs produce better outputs when referencing prior responses." → [SRC-014](https://arxiv.org/abs/2406.04692)
  └─ Used in: 06_subagents/multi_model_deliberation_and_swarms.md, 19_final_reports/harness_architecture_specification_report.md

<a id="claim-148"></a>
[CLAIM-148] "Together AI provides a minimal ~50-line Python reference implementation of the Mixture-of-Agents architecture using the together Python SDK to orchestrate proposer and aggregator models." → [SRC-018](https://github.com/togethercomputer/MoA)
  └─ Used in: 06_subagents/multi_model_deliberation_and_swarms.md

<a id="claim-149"></a>
[CLAIM-149] "Karpathy's llm-council implements a 3-stage council workflow: (1) independent opinions sent to multiple LLMs simultaneously, (2) anonymized peer review where models rank and critique each other, (3) chairman synthesis compiling the final answer from all opinions and critiques." → [SRC-016](https://github.com/karpathy/llm-council)
  └─ Used in: 06_subagents/multi_model_deliberation_and_swarms.md

<a id="claim-150"></a>
[CLAIM-150] "Council/debate implementations require anonymizing model identifiers to prevent lab-bias (GPT judges favoring GPT outputs), rotating challengers to counteract sycophancy, and anti-capitulation prompts to prevent models from changing answers without genuine reasoning." → [SRC-016](https://github.com/karpathy/llm-council), [SRC-017](https://github.com/danielrosehill/Awesome-LLM-Council-Projects) (Consilium)
  └─ Used in: 06_subagents/README.md, 06_subagents/multi_model_deliberation_and_swarms.md, 18_architecture_recommendations/README.md, 19_final_reports/harness_architecture_specification_report.md

<a id="claim-151"></a>
[CLAIM-151] "Research demonstrates a ~35.9% reduction in hallucination rates via multi-agent consensus compared to single-model setups, as models independently arriving at the same factual claim provide higher confidence than any single assertion." → [SRC-014](https://arxiv.org/abs/2406.04692), [SRC-015](https://openrouter.ai/rankings) (DRACO benchmark research)
  └─ Used in: 06_subagents/multi_model_deliberation_and_swarms.md, 19_final_reports/harness_architecture_specification_report.md

<a id="claim-152"></a>
[CLAIM-152] "CrewAI implements the Supervisor-Worker swarm pattern via Process.hierarchical configuration, automatically creating a manager agent that delegates sub-tasks to role-specialized worker agents with A2A protocols, built-in memory, and checkpointing." → [SRC-012](https://docs.crewai.com/concepts/processes)
  └─ Used in: 06_subagents/multi_model_deliberation_and_swarms.md

<a id="claim-153"></a>
[CLAIM-153] "LangGraph StateGraph implements multi-model deliberation as directed graphs with conditional edges for confidence-based routing, reducers to merge parallel branch state, cycles for iterative debate loops, and first-class human-in-the-loop governance gates." → [SRC-013](https://langchain-ai.github.io/langgraph/)
  └─ Used in: 06_subagents/multi_model_deliberation_and_swarms.md

<a id="claim-154"></a>
[CLAIM-154] "The danielrosehill/Awesome-LLM-Council-Projects repository curates an ecosystem of council-derived projects including Consilium (anti-sycophancy CLI), PolyCouncil (local model councils), llm-deliberate (social choice voting), and the judges library (Jury aggregation objects)." → [SRC-017](https://github.com/danielrosehill/Awesome-LLM-Council-Projects)
  └─ Used in: 06_subagents/multi_model_deliberation_and_swarms.md

<a id="claim-155"></a>
[CLAIM-155] "Microsoft Agent Framework (MAF) succeeded AutoGen and Semantic Kernel, shifting from unbounded conversational debate ('conversational chaos') to explicit graph-based workflows with strict type safety, durable state, enterprise telemetry, and checkpointing. The community fork AG2 preserves the original AutoGen conversational debate style." → [Microsoft](https://devblogs.microsoft.com/semantic-kernel/), [AG2](https://github.com/ag2ai/ag2)
  └─ Used in: 06_subagents/multi_model_deliberation_and_swarms.md

<a id="claim-156"></a>
[CLAIM-156] "OpenAI Agents SDK (March 2025) succeeded the experimental Swarm framework, adding built-in tracing, guardrails, session management, and observability for production-grade agent-to-agent handoffs." → [OpenAI Agents SDK](https://github.com/openai/openai-agents-python)
  └─ Used in: 06_subagents/multi_model_deliberation_and_swarms.md

<a id="claim-157"></a>
[CLAIM-157] "DRACO benchmark testing shows budget fusion panels (e.g., Gemini 3 Flash + Kimi K2.6 + DeepSeek V4 Pro with a frontier judge) outperform standalone frontier models at ~50% cost, and even self-synthesis (pairing a model with itself) produces measurably better outputs than a single run." → [SRC-015](https://openrouter.ai/rankings), [SRC-011](https://openrouter.ai/docs/guides/features/plugins/fusion) (DRACO benchmark, OpenRouter Fusion documentation)
  └─ Used in: 06_subagents/README.md, 06_subagents/multi_model_deliberation_and_swarms.md, 18_architecture_recommendations/README.md, 19_final_reports/harness_architecture_specification_report.md

### Case Studies: Codex Desktop, VS Code Copilot Chat, Cursor, and Google Antigravity ([SRC-019](https://openai.com/codex-desktop-app), [SRC-020](https://code.visualstudio.com/docs/copilot/agent-mode), [SRC-021](https://cursor.com/docs/agent/overview), [SRC-022](https://antigravity.google/docs))

<a id="claim-158"></a>
[CLAIM-158] "OpenAI Codex Desktop App is designed as a centralized command center supporting parallel multi-threaded project control and dedicated Plan Mode (interviewing/task breakdown) and Goal Mode (long-running autonomous execution)." → [SRC-019]
  └─ Used in: 15_frontend_react_vite_agent_stack/README.md, 15_frontend_react_vite_agent_stack/complete_frontend_architecture.md, 15_frontend_react_vite_agent_stack/frontend_architecture_and_ux.md

<a id="claim-159"></a>
[CLAIM-159] "Codex Desktop App features automated Computer Use with secure local sandboxing (Windows/macOS) and interactive DOM/screenshot annotations allowing agents to perform design-loop visual adjustments." → [SRC-019]
  └─ Used in: 15_frontend_react_vite_agent_stack/complete_frontend_architecture.md, 15_frontend_react_vite_agent_stack/frontend_architecture_and_ux.md

<a id="claim-160"></a>
[CLAIM-160] "Codex Desktop App integrates git worktrees to support parallel development tracks, routing commands through JSON-RPC over local WebSocket/Unix sockets via codex app-server." → [SRC-019], [SRC-008]
  └─ Used in: 15_frontend_react_vite_agent_stack/complete_frontend_architecture.md, 15_frontend_react_vite_agent_stack/frontend_architecture_and_ux.md

<a id="claim-161"></a>
[CLAIM-161] "GitHub Copilot Agent Mode in VS Code divides workspace orchestration between the code-first Chat View panel and a dedicated Agents Window designed for multi-project/repository workflows." → [SRC-020]
  └─ Used in: 15_frontend_react_vite_agent_stack/README.md, 15_frontend_react_vite_agent_stack/complete_frontend_architecture.md, 15_frontend_react_vite_agent_stack/frontend_architecture_and_ux.md

<a id="claim-162"></a>
[CLAIM-162] "VS Code Agent Mode executes terminal commands autonomously (such as npm run dev or testing loops), gating executions behind security approval prompts that the user can authorize or configure." → [SRC-020]
  └─ Used in: 15_frontend_react_vite_agent_stack/complete_frontend_architecture.md, 15_frontend_react_vite_agent_stack/frontend_architecture_and_ux.md

<a id="claim-163"></a>
[CLAIM-163] "VS Code Agent Mode leverages custom tool configurations and Model Context Protocol (MCP) server inputs, requiring Rich Shell Integration to parse terminal outputs accurately." → [SRC-020]
  └─ Used in: 15_frontend_react_vite_agent_stack/complete_frontend_architecture.md, 15_frontend_react_vite_agent_stack/frontend_architecture_and_ux.md

<a id="claim-164"></a>
[CLAIM-164] "Cursor Composer provides a multi-file edit workspace supporting concurrent inline editor diff previews (red/green highlight annotations) and programmatic change rejection/acceptance." → [SRC-021](https://cursor.com/docs/agent/overview)
  └─ Used in: 15_frontend_react_vite_agent_stack/README.md, 15_frontend_react_vite_agent_stack/complete_frontend_architecture.md, 15_frontend_react_vite_agent_stack/frontend_architecture_and_ux.md

<a id="claim-165"></a>
[CLAIM-165] "Cursor Composer Agent Mode controls execution safety through settings (Ask Every Time, Run in Sandbox, Run Everything) and allow/deny lists defined in project-level .cursor/cli.json configuration files." → [SRC-021](https://cursor.com/docs/agent/security)
  └─ Used in: 15_frontend_react_vite_agent_stack/README.md, 15_frontend_react_vite_agent_stack/complete_frontend_architecture.md, 15_frontend_react_vite_agent_stack/frontend_architecture_and_ux.md

<a id="claim-166"></a>
[CLAIM-166] "Google Antigravity environment uses an agent-first standalone app and custom IDE fork, offering a dedicated Manager Surface to track parallel asynchronous agent execution." → [SRC-022]
  └─ Used in: 15_frontend_react_vite_agent_stack/README.md, 15_frontend_react_vite_agent_stack/complete_frontend_architecture.md, 15_frontend_react_vite_agent_stack/frontend_architecture_and_ux.md

<a id="claim-167"></a>
[CLAIM-167] "Google Antigravity enforces a strict planning artifact lifecycle, generating and updating implementation_plan.md, task.md, and walkthrough.md files to verify coding steps." → [SRC-022]
  └─ Used in: 15_frontend_react_vite_agent_stack/README.md, 15_frontend_react_vite_agent_stack/complete_frontend_architecture.md, 15_frontend_react_vite_agent_stack/frontend_architecture_and_ux.md

<a id="claim-168"></a>
[CLAIM-168] "Google Antigravity implements interactive browser subagent tools, capturing WebP recordings in the background to demonstrate UI changes." → [SRC-022]
  └─ Used in: 15_frontend_react_vite_agent_stack/complete_frontend_architecture.md, 15_frontend_react_vite_agent_stack/frontend_architecture_and_ux.md

<a id="claim-169"></a>
[CLAIM-169] "Google Antigravity utilizes granular tool approvals for run_command execution, write_to_file path access, and supports slash commands like /goal, /schedule, and /grill-me." → [SRC-022]
  └─ Used in: 15_frontend_react_vite_agent_stack/README.md, 15_frontend_react_vite_agent_stack/complete_frontend_architecture.md, 15_frontend_react_vite_agent_stack/frontend_architecture_and_ux.md

### Generative UI in Responses, MCP Apps, and MCP UI ([SRC-023](https://github.com/modelcontextprotocol/specification), [SRC-024](https://github.com/copilotkit/copilotkit), [SRC-025](https://sdk.vercel.ai/docs/ai-sdk-ui), [SRC-026](https://github.com/mastra-ai/mastra))

<a id="claim-170"></a>
[CLAIM-170] "Generative UI (GenUI) is a front-end design where the model constructs interface layouts on the fly, dynamically updating the frontend based on user intent and conversational context." → [SRC-024], [SRC-025]
  └─ Used in: 08_mcps/mcp_apps_and_ui.md, 15_frontend_react_vite_agent_stack/README.md, 15_frontend_react_vite_agent_stack/complete_frontend_architecture.md, 15_frontend_react_vite_agent_stack/frontend_architecture_and_ux.md, 19_final_reports/harness_architecture_specification_report.md

<a id="claim-171"></a>
[CLAIM-171] "OpenAI Responses API and other structured interfaces support Generative UI by enforcing JSON schemas (response_format structures) that outline components and props for client-side rendering." → [SRC-025]
  └─ Used in: 08_mcps/README.md, 08_mcps/mcp_apps_and_ui.md, 15_frontend_react_vite_agent_stack/README.md, 15_frontend_react_vite_agent_stack/complete_frontend_architecture.md, 15_frontend_react_vite_agent_stack/frontend_architecture_and_ux.md, 18_architecture_recommendations/README.md, 19_final_reports/harness_architecture_specification_report.md

<a id="claim-172"></a>
[CLAIM-172] "Vercel AI SDK provides standard React hook patterns (AI SDK UI) to handle LLM streams, structured outputs, and progressive component streaming." → [SRC-025]
  └─ Used in: 08_mcps/mcp_apps_and_ui.md, 15_frontend_react_vite_agent_stack/README.md, 15_frontend_react_vite_agent_stack/complete_frontend_architecture.md, 15_frontend_react_vite_agent_stack/frontend_architecture_and_ux.md, 18_architecture_recommendations/README.md, 19_final_reports/harness_architecture_specification_report.md

<a id="claim-173"></a>
[CLAIM-173] "CopilotKit provides an open-source agentic application framework that coordinates client-side React components with agent pipelines using the AG-UI protocol." → [SRC-024]
  └─ Used in: 08_mcps/mcp_apps_and_ui.md, 15_frontend_react_vite_agent_stack/README.md, 15_frontend_react_vite_agent_stack/complete_frontend_architecture.md, 15_frontend_react_vite_agent_stack/frontend_architecture_and_ux.md, 18_architecture_recommendations/README.md

<a id="claim-174"></a>
[CLAIM-174] "Model Context Protocol (MCP) Apps, standardized via SEP-1865, allow remote MCP servers to serve interactive visual widgets and application frames directly to compatible hosts." → [SRC-023]
  └─ Used in: 08_mcps/README.md, 08_mcps/mcp_apps_and_ui.md, 15_frontend_react_vite_agent_stack/README.md, 15_frontend_react_vite_agent_stack/complete_frontend_architecture.md, 15_frontend_react_vite_agent_stack/frontend_architecture_and_ux.md, 18_architecture_recommendations/README.md, 19_final_reports/harness_architecture_specification_report.md

<a id="claim-175"></a>
[CLAIM-175] "MCP Apps ensure client security by executing generated HTML, CSS, and JavaScript inside sandboxed, isolated iframes rather than directly in the host application's DOM." → [SRC-023]
  └─ Used in: 08_mcps/README.md, 08_mcps/mcp_apps_and_ui.md, 15_frontend_react_vite_agent_stack/README.md, 15_frontend_react_vite_agent_stack/complete_frontend_architecture.md, 15_frontend_react_vite_agent_stack/frontend_architecture_and_ux.md, 18_architecture_recommendations/README.md, 19_final_reports/harness_architecture_specification_report.md

<a id="claim-176"></a>
[CLAIM-176] "Mastra AI and mcp-use offer TypeScript SDK interfaces to author and expose MCP tool servers containing rich UI widget assets alongside standard data endpoints." → [SRC-026]
  └─ Used in: 08_mcps/mcp_apps_and_ui.md, 15_frontend_react_vite_agent_stack/README.md, 15_frontend_react_vite_agent_stack/complete_frontend_architecture.md, 15_frontend_react_vite_agent_stack/frontend_architecture_and_ux.md, 18_architecture_recommendations/README.md

<a id="claim-177"></a>
[CLAIM-177] "The Model Context Protocol specification introduced a stateless Core in mid-2026, shifting context management to dedicated Extensions like the Tasks framework." → [SRC-023]
  └─ Used in: 08_mcps/README.md, 08_mcps/mcp_apps_and_ui.md, 15_frontend_react_vite_agent_stack/complete_frontend_architecture.md, 15_frontend_react_vite_agent_stack/frontend_architecture_and_ux.md, 18_architecture_recommendations/README.md, 19_final_reports/harness_architecture_specification_report.md

<a id="claim-178"></a>
[CLAIM-178] "The Tasks Extension in MCP models long-running asynchronous background executions as durable state machines driven by the client to prevent context bloating." → [SRC-023]
  └─ Used in: 08_mcps/README.md, 08_mcps/mcp_apps_and_ui.md, 15_frontend_react_vite_agent_stack/README.md, 15_frontend_react_vite_agent_stack/complete_frontend_architecture.md, 15_frontend_react_vite_agent_stack/frontend_architecture_and_ux.md, 18_architecture_recommendations/README.md, 19_final_reports/harness_architecture_specification_report.md

### LibreChat & LibreChat Agents SDK Reference Integration ([SRC-027](https://github.com/danny-avila/LibreChat), [SRC-028](https://github.com/danny-avila/agents))

<a id="claim-179"></a>
[CLAIM-179] "LibreChat manages user-scoped Model Context Protocol (MCP) server connections dynamically via Redis flow state maps and CSRF-binding cookies during callback authentication." → [SRC-027](https://github.com/danny-avila/LibreChat) (api/server/routes/mcp.js, lines 104-220, 226-515)
  └─ Used in: 02_open_source_agent_frameworks/README.md, 08_mcps/README.md, 08_mcps/mcp_apps_and_ui.md, 19_final_reports/harness_architecture_specification_report.md

<a id="claim-180"></a>
[CLAIM-180] "LibreChat implements the Open Responses API standard, converting input lists to internal messages and streaming semantic events like `response.output_item.added` via Server-Sent Events (SSE)." → [SRC-027](https://github.com/danny-avila/LibreChat) (api/server/routes/agents/responses.js, lines 44-84; api/server/controllers/agents/responses.js, lines 284-336)
  └─ Used in: 15_frontend_react_vite_agent_stack/README.md, 19_final_reports/harness_architecture_specification_report.md

<a id="claim-181"></a>
[CLAIM-181] "LibreChat controllers utilize Breadth-First Search (BFS) discovery patterns to traverse connected sub-agents dynamically while verifying remote sharing permissions." → [SRC-027](https://github.com/danny-avila/LibreChat) (api/server/controllers/agents/responses.js, lines 488-565)
  └─ Used in: 19_final_reports/harness_architecture_specification_report.md

<a id="claim-182"></a>
[CLAIM-182] "LibreChat memory processors filter out skill-primed meta messages from the memory window to protect the agent's personalization engine from instruction injection." → [SRC-027](https://github.com/danny-avila/LibreChat) (api/server/controllers/agents/client.js, lines 776-800)
  └─ Used in: 05_agent_memory/README.md, 19_final_reports/harness_architecture_specification_report.md

<a id="claim-183"></a>
[CLAIM-183] "LibreChat Agents SDK defines a structured token calibration formula `calibrationRatio = cumulativeProviderReported / cumulativeRawSent` to align local tokenizer estimates with provider metrics." → [SRC-028](https://github.com/danny-avila/agents) (src/run.ts, lines 133-160, 502-510)
  └─ Used in: 01_open_source_agentic_sdks/README.md, 05_agent_memory/README.md, 18_architecture_recommendations/README.md, 19_final_reports/harness_architecture_specification_report.md

<a id="claim-184"></a>
[CLAIM-184] "LibreChat Agents SDK implements dynamic instruction overhead calibration using a 15% variance threshold (`CALIBRATION_VARIANCE_THRESHOLD`) to update the tool schema token ceiling." → [SRC-028](https://github.com/danny-avila/agents) (src/graphs/Graph.ts, lines 97, 1551; docs/summarization-behavior.md, line 47)
  └─ Used in: 01_open_source_agentic_sdks/README.md, 18_architecture_recommendations/README.md, 19_final_reports/harness_architecture_specification_report.md

<a id="claim-185"></a>
[CLAIM-185] "LibreChat Agents SDK processes multi-agent graph topologies via LangGraph Command structures (`Command.PARENT`), enabling conditional handoffs and sequential transfers." → [SRC-028](https://github.com/danny-avila/agents) (src/graphs/MultiAgentGraph.ts, lines 311-381, 401-512)
  └─ Used in: 02_open_source_agent_frameworks/README.md, 08_mcps/README.md, 18_architecture_recommendations/README.md, 19_final_reports/harness_architecture_specification_report.md

<a id="claim-186"></a>
[CLAIM-186] "Handoff reception in the LibreChat Agents SDK is handled by filtering out the transfer tool calls and preceding messages to give the destination agent a clean context window." → [SRC-028](https://github.com/danny-avila/agents) (src/graphs/MultiAgentGraph.ts, lines 558-717)
  └─ Used in: 02_open_source_agent_frameworks/README.md, 18_architecture_recommendations/README.md, 19_final_reports/harness_architecture_specification_report.md

<a id="claim-187"></a>
[CLAIM-187] "Observation masking in the Agents SDK replaces consumed `ToolMessage` payloads (which have subsequent substantive AI reasoning text) with character-limited previews (~300 characters) when context pressure reaches 80%." → [SRC-028](https://github.com/danny-avila/agents) (docs/summarization-behavior.md, lines 13-22, 152-162)
  └─ Used in: 01_open_source_agentic_sdks/README.md, 05_agent_memory/README.md, 18_architecture_recommendations/README.md, 19_final_reports/harness_architecture_specification_report.md

<a id="claim-188"></a>
[CLAIM-188] "Mid-run summaries in the Agents SDK are stored on the AgentContext and injected as a `HumanMessage` on clean state turns, allowing summaries to compete for message budget instead of lowering system instruction ceilings." → [SRC-028](https://github.com/danny-avila/agents) (docs/summarization-behavior.md, lines 74-90, 141-150)
  └─ Used in: 01_open_source_agentic_sdks/README.md, 05_agent_memory/README.md, 18_architecture_recommendations/README.md, 19_final_reports/harness_architecture_specification_report.md

<a id="claim-189"></a>
[CLAIM-189] "Conversation Steering allows injecting a HumanMessage dynamically into active execution loops without resetting history context, which requires resolving strict role alternation requirements." → [SRC-004](https://github.com/langchain-ai/langgraph) (libs/langgraph/langgraph/types.py, lines 810-934) and [SRC-002](https://github.com/NousResearch/hermes-agent) (agent/conversation_loop.py, lines 594, 1397, 2664)
  └─ Used in: 04_agent_loops/README.md, 04_agent_loops/human_in_the_loop_steering.md, 18_architecture_recommendations/README.md, 19_final_reports/harness_architecture_specification_report.md

<a id="claim-190"></a>
[CLAIM-190] "Execution loops monitor explicit interrupt flags (like `_interrupt_requested`) at superstep or turn boundaries to pause operations cleanly before starting subsequent API calls or tool invocations." → [SRC-002](https://github.com/NousResearch/hermes-agent) (run_agent.py, lines 2400-2446; agent/conversation_loop.py, lines 594, 3557) and [SRC-004](https://github.com/langchain-ai/langgraph) (libs/langgraph/langgraph/pregel/_loop.py, lines 659-664)
  └─ Used in: 04_agent_loops/README.md, 04_agent_loops/human_in_the_loop_steering.md, 19_final_reports/harness_architecture_specification_report.md

<a id="claim-191"></a>
[CLAIM-191] "Christian Vastveit's cascading retry fix in PR #6600 sets a request-local cancellation token during force-close, letting the HTTP generation worker trap transport errors and bubble up a clean InterruptedError instead of retrying." → [SRC-002](https://github.com/NousResearch/hermes-agent) (tests/agent/test_cascading_interrupt_6600.py, lines 9-23, 51-80)
  └─ Used in: 04_agent_loops/README.md, 04_agent_loops/human_in_the_loop_steering.md, 18_architecture_recommendations/README.md, 19_final_reports/harness_architecture_specification_report.md

<a id="claim-192"></a>
[CLAIM-192] "Interactive governance gates halt loops on security boundaries (e.g. executing terminal commands) and broker approvals over mobile APNS notifications, CLI prompts, or sandbox widgets." → [SRC-001](https://github.com/openclaw/openclaw) (packages/agent-core/src/exec-approval-ios-push.ts, lines 15-56) and [SRC-006](https://github.com/assistant-ui/assistant-ui) (README.md, lines 358-372)
  └─ Used in: 04_agent_loops/README.md, 04_agent_loops/human_in_the_loop_steering.md, 19_final_reports/harness_architecture_specification_report.md

<a id="claim-193"></a>
[CLAIM-193] "Session-level tool approvals, such as in Hermes's computer use module, temporary auto-approve subsequent UI actions like click or type for the remainder of the session once an initial permission is granted." → [SRC-002](https://github.com/NousResearch/hermes-agent) (tools/computer_use/tool.py, lines 143, 293-314)
  └─ Used in: 04_agent_loops/README.md

<a id="claim-194"></a>
[CLAIM-194] "Nous Hermes implements three distinct edit bypass policies (`ask`, `workspace_session`, and `session`) to decouple manual human checks from autonomous execution options." → [SRC-002](https://github.com/NousResearch/hermes-agent) (acp_adapter/edit_approval.py, lines 44-47, 148-180)
  └─ Used in: 04_agent_loops/README.md, 04_agent_loops/human_in_the_loop_steering.md, 18_architecture_recommendations/README.md, 19_final_reports/harness_architecture_specification_report.md

<a id="claim-195"></a>
[CLAIM-195] "Regardless of active auto-approve bypass settings, writes targeting sensitive files (such as `.env`, credentials, or SSH keys) are always hard-gated and must prompt the human for approval." → [SRC-002](https://github.com/NousResearch/hermes-agent) (acp_adapter/edit_approval.py, lines 44-45, 140-147)
  └─ Used in: 04_agent_loops/README.md, 04_agent_loops/human_in_the_loop_steering.md, 18_architecture_recommendations/README.md, 19_final_reports/harness_architecture_specification_report.md

<a id="claim-196"></a>
[CLAIM-196] "Swarm delegation parameters in Nous Hermes enforce default auto-deny policies for nested subagent tool calls when executing headlessly inside background jobs, unless overridden by explicit subagent auto-approve options." → [SRC-002](https://github.com/NousResearch/hermes-agent) (tools/delegate_tool.py, lines 67-81, 103-110, 1639)
  └─ Used in: 04_agent_loops/human_in_the_loop_steering.md, 18_architecture_recommendations/README.md, 19_final_reports/harness_architecture_specification_report.md

<a id="claim-197"></a>
[CLAIM-197] "Nous Hermes implements a session-level `todo` tool enabling agents to create, read, update, and merge checklists to manage multi-step subtasks." → [SRC-002](https://github.com/NousResearch/hermes-agent) (tools/todo_tool.py, lines 187-227, 240-294)
  └─ Used in: 05_agent_memory/agent_scratchpads_and_session_memory.md, 19_final_reports/harness_architecture_specification_report.md

<a id="claim-198"></a>
[CLAIM-198] "The Hermes TodoStore encapsulates an in-memory checklist bound to the AIAgent session, capping items at 256 and content lengths at 4000 characters to prevent context window inflation." → [SRC-002](https://github.com/NousResearch/hermes-agent) (tools/todo_tool.py, lines 24-34, 36-47, 91-96)
  └─ Used in: 05_agent_memory/agent_scratchpads_and_session_memory.md, 19_final_reports/harness_architecture_specification_report.md

<a id="claim-199"></a>
[CLAIM-199] "Upon context compaction, the Hermes session runtime re-injects the active task checklist list back into the conversation context as a system-like formatting block to preserve task focus." → [SRC-002](https://github.com/NousResearch/hermes-agent) (tools/todo_tool.py, lines 106-114, 133-138)
  └─ Used in: 05_agent_memory/README.md, 05_agent_memory/agent_scratchpads_and_session_memory.md, 18_architecture_recommendations/README.md, 19_final_reports/harness_architecture_specification_report.md

<a id="claim-200"></a>
[CLAIM-200] "To prevent the agent from repeating resolved actions post-compaction, the TodoStore re-injection logic filters out completed and cancelled checklist items, yielding only pending and in-progress tasks." → [SRC-002](https://github.com/NousResearch/hermes-agent) (tools/todo_tool.py, lines 124-132)
  └─ Used in: 05_agent_memory/agent_scratchpads_and_session_memory.md, 18_architecture_recommendations/README.md, 19_final_reports/harness_architecture_specification_report.md

<a id="claim-201"></a>
[CLAIM-201] "Autonomous agents create and maintain user-visible workspace check-lists (like `TODO.md` or `NOTES.md`) directly in the project directory to track session objectives across ephemeral runs." → [SRC-021](https://cursor.com/docs/agent/overview) (Cursor Composer task listings; Claude Code CLI notes usage)
  └─ Used in: 05_agent_memory/agent_scratchpads_and_session_memory.md

<a id="claim-202"></a>
[CLAIM-202] "Claude Code boots by checking a repository-level `CLAUDE.md` rule file or progressive sub-folder rules inside `.claude/rules/` to load coding guidelines and project-specific testing tools." → [SRC-020](https://code.visualstudio.com/docs/copilot/agent-mode) (Claude Code memory files setup rules; VS Code instructions search)
  └─ Used in: 05_agent_memory/agent_scratchpads_and_session_memory.md, 18_architecture_recommendations/README.md, 19_final_reports/harness_architecture_specification_report.md

<a id="claim-203"></a>
[CLAIM-203] "Google Antigravity restricts session-specific scratch files, temporary compilations, and experimental scripts to a conversation-locked app data directory (`<appDataDir>/brain/<conversation-id>/scratch/`) to avoid VCS code tree pollution." → [SRC-022](https://antigravity.google/docs) (Antigravity scratch space conventions; App data directory rules)
  └─ Used in: 05_agent_memory/README.md, 05_agent_memory/agent_scratchpads_and_session_memory.md, 18_architecture_recommendations/README.md, 19_final_reports/harness_architecture_specification_report.md

<a id="claim-204"></a>
[CLAIM-204] "Learned user corrections and styling preferences are cached to a local `.claude/memory.md` file using an auto-memory model, which allows developer auditability via /memory commands." → [SRC-020](https://code.visualstudio.com/docs/copilot/agent-mode) (Claude Code memory log storage and command schema)
  └─ Used in: 05_agent_memory/agent_scratchpads_and_session_memory.md, 09_skills_md/README.md, 09_skills_md/self_improving_agents_and_learning_loops.md, 18_architecture_recommendations/README.md, 19_final_reports/harness_architecture_specification_report.md

<a id="claim-205"></a>
[CLAIM-205] "Knowledge Graph memory layers (such as Mem0, Graphiti, or Cognee) extract conversational facts as structured subject-relation-object triplets to build semantic profile graphs." → [SRC-002](https://github.com/NousResearch/hermes-agent) (plugins/memory/supermemory/README.md, lines 71-72; evermind.ai / mem0.ai docs)
  └─ Used in: 05_agent_memory/agent_scratchpads_and_session_memory.md, 18_architecture_recommendations/README.md, 19_final_reports/harness_architecture_specification_report.md

<a id="claim-206"></a>
[CLAIM-206] "Knowledge Graph stores resolve contradictory facts by traversing timestamped edges and reduce context token consumption up to 90% by substituting raw transcript blocks with relation maps." → [evermind.ai / graphiti.ai docs](https://evermind.ai) (Zep Graphiti temporal graph edges and compaction data)
  └─ Used in: 05_agent_memory/agent_scratchpads_and_session_memory.md, 18_architecture_recommendations/README.md, 19_final_reports/harness_architecture_specification_report.md

<a id="claim-207"></a>
[CLAIM-207] "Nous Hermes supports local graph-based session recall via its Hindsight memory provider plugin, which executes multi-strategy semantic search and entity graph traversal queries." → [SRC-002](https://github.com/NousResearch/hermes-agent) (plugins/memory/hindsight/__init__.py, lines 3-4, 318, 622; README.md, lines 130-131)
  └─ Used in: 05_agent_memory/agent_scratchpads_and_session_memory.md, 19_final_reports/harness_architecture_specification_report.md

### Agent Self-Improvement & Curation Loops ([SRC-002](https://github.com/NousResearch/hermes-agent), [SRC-020](https://code.visualstudio.com/docs/copilot/agent-mode), [SRC-029](https://arxiv.org/abs/2407.18210), [SRC-030](https://arxiv.org/abs/2402.11210))

<a id="claim-208"></a>
[CLAIM-208] "Nous Hermes Curator uses an inactivity checker (defaulting to 7 days intervals and 2 hours idle time) rather than a cron daemon to execute background tasks on a separate prompt cache without mutating active sessions." → [SRC-002](https://github.com/NousResearch/hermes-agent) (agent/curator.py, lines 19-24, 146-160)
  └─ Used in: 09_skills_md/README.md, 09_skills_md/self_improving_agents_and_learning_loops.md, 18_architecture_recommendations/README.md, 19_final_reports/harness_architecture_specification_report.md

<a id="claim-209"></a>
[CLAIM-209] "Telemetry counts view, use, and patch triggers for agent skills, writing to a sidecar JSON file (.usage.json) rather than file frontmatter to keep user content clear of log chatter." → [SRC-002](https://github.com/NousResearch/hermes-agent) (tools/skill_usage.py, lines 1-17, 457-473)
  └─ Used in: 09_skills_md/README.md, 09_skills_md/self_improving_agents_and_learning_loops.md, 18_architecture_recommendations/README.md, 19_final_reports/harness_architecture_specification_report.md

<a id="claim-210"></a>
[CLAIM-210] "Skills created by background forks of the agent are marked with 'created_by': 'agent' or 'agent_created': true inside .usage.json, limiting Curator's scope strictly to agent-created code." → [SRC-002](https://github.com/NousResearch/hermes-agent) (agent/curator.py, lines 141-160)
  └─ Used in: 09_skills_md/self_improving_agents_and_learning_loops.md, 19_final_reports/harness_architecture_specification_report.md

<a id="claim-211"></a>
[CLAIM-211] "Unused agent-created skills transition deterministically from active to stale after stale_after_days (default 30) and are archived to ~/.hermes/skills/.archive/ after archive_after_days (default 90)." → [SRC-002](https://github.com/NousResearch/hermes-agent) (agent/curator.py, lines 32-34, 276-287)
  └─ Used in: 09_skills_md/README.md, 09_skills_md/self_improving_agents_and_learning_loops.md, 18_architecture_recommendations/README.md, 19_final_reports/harness_architecture_specification_report.md

<a id="claim-212"></a>
[CLAIM-212] "A skill pin protects it from auto-transitions and deletion tool calls (skill_manage(action='delete')), while still permitting updates/patches so the agent can fix coding errors without unpinning." → [SRC-002](https://github.com/NousResearch/hermes-agent) (tools/skill_manager_tool.py, lines 183-189, 211-235)
  └─ Used in: 09_skills_md/README.md, 09_skills_md/self_improving_agents_and_learning_loops.md, 19_final_reports/harness_architecture_specification_report.md

<a id="claim-213"></a>
[CLAIM-213] "Curation LLM consolidation maps candidate skills to cluster groups, merging overlaps into existing or new class-level umbrella skills (e.g. python-helpers), and demoting session bugfixes to subdirectory files like references/ or scripts/." → [SRC-002](https://github.com/NousResearch/hermes-agent) (agent/curator.py, lines 35-40, 365-433)
  └─ Used in: 09_skills_md/README.md, 09_skills_md/self_improving_agents_and_learning_loops.md, 18_architecture_recommendations/README.md, 19_final_reports/harness_architecture_specification_report.md

<a id="claim-214"></a>
[CLAIM-214] "Consolidation requires package integrity, ensuring that relative links, asset folders, and support files inside the source skill are either archived together or re-homed and rewritten inside the target umbrella." → [SRC-002](https://github.com/NousResearch/hermes-agent) (agent/curator.py, lines 35-40, 434-452)
  └─ Used in: 09_skills_md/README.md, 09_skills_md/self_improving_agents_and_learning_loops.md, 18_architecture_recommendations/README.md, 19_final_reports/harness_architecture_specification_report.md

<a id="claim-215"></a>
[CLAIM-215] "Before execution, agent-created skills are scanned using static AST analysis and vulnerability checkers, blocking executions when threat patterns are resolved." → [SRC-002](https://github.com/NousResearch/hermes-agent) (tools/skill_manager_tool.py, lines 50-56, 78-102)
  └─ Used in: 09_skills_md/README.md, 09_skills_md/self_improving_agents_and_learning_loops.md, 18_architecture_recommendations/README.md, 19_final_reports/harness_architecture_specification_report.md

<a id="claim-216"></a>
[CLAIM-216] "The curator takes tarball snapshots (skills.tar.gz) pre-run under .curator_backups/ alongside a manifest.json file, allowing developers to roll back unintended merges and prunings." → [SRC-002](https://github.com/NousResearch/hermes-agent) (agent/curator.py, lines 112-135)
  └─ Used in: 09_skills_md/README.md, 09_skills_md/self_improving_agents_and_learning_loops.md, 18_architecture_recommendations/README.md, 19_final_reports/harness_architecture_specification_report.md

<a id="claim-217"></a>
[CLAIM-217] "Test-Time Self-Improvement (TT-SI) and Recursive Introspection (RISE) utilize execution trace analysis and self-rewards to modify prompt routing and patch code logic on error." → [SRC-029](https://arxiv.org/abs/2407.18210), [SRC-030](https://arxiv.org/abs/2402.11210)
  └─ Used in: 09_skills_md/README.md, 09_skills_md/self_improving_agents_and_learning_loops.md

---
