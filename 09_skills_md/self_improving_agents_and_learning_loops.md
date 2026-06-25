# Agent Self-Improvement & Curation Loops

LLM-based coding agents must be capable of moving beyond static system prompts and rigid tool definitions. In long-running development workflows, agents encounter unique APIs, recurring workspace bugs, and specific developer preferences. To maintain peak performance, the harness must support **procedural learning loops** — enabling the agent to learn from execution traces, write custom instructions for itself (skills), and automatically consolidate these instructions over time to prevent token bloat and cache invalidation.

---

## 1. Curation Telemetry and Lifecycle States

To manage learning dynamically, the harness must track procedural knowledge usage. Hardcoding telemetry directly in the body of instructions or files causes version history pollution and merge conflicts. 

### A. The Telemetry Sidecar (`.usage.json`)
The system isolates execution metadata to an asynchronous, process-serialized sidecar file (`~/.hermes/skills/.usage.json`) [CLAIM-209](../00_index/citation_map.md#claim-209). The sidecar records view count, active use count, patch count, and ISO-8601 timestamps of last activity [CLAIM-209](../00_index/citation_map.md#claim-209):
*   `view_count`: Incremented when the model reads/inspects a skill [CLAIM-209](../00_index/citation_map.md#claim-209).
*   `use_count`: Incremented when the skill's instructions are loaded into the LLM context [CLAIM-209](../00_index/citation_map.md#claim-209).
*   `patch_count`: Incremented when the model edits or corrects the skill [CLAIM-209](../00_index/citation_map.md#claim-209).

### B. State Transitions
Using the sidecar's activity markers, the system runs deterministic state transitions to prune inactive procedural rules:
*   `active`: The default state on creation.
*   `stale`: Automatically marked when a skill goes unused for `stale_after_days` (default: 30) [CLAIM-211](../00_index/citation_map.md#claim-211).
*   `archived`: Moved from the active path to a hidden archive directory (`~/.hermes/skills/.archive/`) when unused for `archive_after_days` (default: 90) [CLAIM-211](../00_index/citation_map.md#claim-211).

These transitions keep the active directory clean, preserving token budgets and prefix cache stability.

---

## 2. Nous Hermes Curation Engine

The Nous Hermes Curation system represents the state-of-the-art in autonomous skill pruning and umbrella consolidation.

### A. Curation Invocation
 Curation is not run on a cron daemon, which would fail on offline or closed environments. Instead, the harness implements an **inactivity-triggered background review** [CLAIM-208](../00_index/citation_map.md#claim-208):
1.  On CLI session boot or periodically within gateway ticks, the system evaluates the curator state [CLAIM-208](../00_index/citation_map.md#claim-208).
2.  If the time since the last run exceeds `interval_hours` (default: 7 days) and the primary user interface has been idle for `min_idle_hours` (default: 2 hours), a run is triggered [CLAIM-208](../00_index/citation_map.md#claim-208).
3.  The runner spawns a background fork of the `AIAgent` executing on a cheaper auxiliary model slot (`auxiliary.curator`), running on a separate prompt cache to avoid disturbing live user chats [CLAIM-208](../00_index/citation_map.md#claim-208).

### B. Governance Boundaries: Pinned & Protected Built-ins
*   **Pin Safeguards**: Users or agents can declare a skill "pinned" (`"pinned": true` in `.usage.json`). Pins exempt the skill from auto-transitions and prevent the agent from executing deletion tool calls (`skill_manage(action="delete")`) [CLAIM-212](../00_index/citation_map.md#claim-212). Importantly, the agent is still permitted to *patch* pinned skills, letting it refine rule details without unpinning [CLAIM-212](../00_index/citation_map.md#claim-212).
*   **Protected Built-ins**: Core UI skills (such as `/plan` execution schemas) are hardcoded as protected built-ins, preventing them from ever being consolidated or archived [CLAIM-210](../00_index/citation_map.md#claim-210).
*   **Agent-Created Constraint**: Curation is restricted strictly to skills flagged `"created_by": "agent"` or `"agent_created": true` in `.usage.json` (meaning they were authored by the background review fork) [CLAIM-210](../00_index/citation_map.md#claim-210). User-authored or hand-copied skills are left untouched to prevent breaking manual configurations [CLAIM-210](../00_index/citation_map.md#claim-210).

### C. LLM Consolidation & Umbrella Building
When `curator.consolidate: true` is active, the background reviews agent evaluates candidate skills to combat catalog bloat:
1.  **Prefix Clustering**: The agent groups narrow skills sharing keyword domains (e.g., `git-rebase-bug`, `git-commit-hook`) [CLAIM-213](../00_index/citation_map.md#claim-213).
2.  **Umbrella Merger**: Overlapping micro-skills are absorbed into broad class-level instructions (e.g. `git-workflow`) [CLAIM-213](../00_index/citation_map.md#claim-213).
3.  **Demotion to Support Files**: Narrow scripts, templates, or references are detached from standalone status and placed in the umbrella skill's directory (`references/`, `templates/`, or `scripts/`) while the source skill is archived [CLAIM-213](../00_index/citation_map.md#claim-213).
4.  **Package Integrity Enforcement**: If a source skill contains relative links or assets, the curator must migrate these files and rewrite links inside the umbrella instructions to prevent broken references [CLAIM-214](../00_index/citation_map.md#claim-214).

### D. Security Audits & Backups
*   **Vulnerability Scanning**: Agent-created skills undergo AST audits and static security checks using a validation guard (`tools/skills_guard.py`) before registration to block shell injection or credential theft [CLAIM-215](../00_index/citation_map.md#claim-215).
*   **Tarball Snapshots**: Before modifying the skills directory, the curator takes a compressed tarball snapshot (`skills.tar.gz`) stored under `~/.hermes/skills/.curator_backups/` along with a `manifest.json` record [CLAIM-216](../00_index/citation_map.md#claim-216). This allows full multi-tier rollback in case of an LLM consolidation error [CLAIM-216](../00_index/citation_map.md#claim-216).

---

## 3. User Preference Caching (Claude Code Auto-Memory)

Autonomous improvement also extends to aligning with developer style preferences.
*   **Preference Extraction**: During turns, the model observes user feedback (e.g. "I prefer pnpm over npm", "use HSL color formats").
*   **Auto-Memory Logging**: The system updates a central `.claude/memory.md` file in the user's workspace containing learned preferences [CLAIM-204](../00_index/citation_map.md#claim-204).
*   **Developer Audits**: Users can view and edit this file using `/memory` commands, keeping the learning loop highly transparent and auditable [CLAIM-204](../00_index/citation_map.md#claim-204).

---

## 4. Advanced Academic & Research Paradigms

Academic frameworks expand self-improvement to model weights and inference paths:

*   **Test-Time Self-Improvement (TT-SI)**: The agent monitors its execution traces, identifies failure cases (e.g. compile errors), synthesizes correction pairs, and runs local fine-tuning loops to adapt its model parameters for the workspace [CLAIM-217](../00_index/citation_map.md#claim-217).
*   **Recursive Introspection (RISE)**: An inference-time approach where the agent evaluates its intermediate reasoning steps against self-reward metrics, iteratively rewriting its execution plans mid-turn to prevent errors before calling terminal commands [CLAIM-217](../00_index/citation_map.md#claim-217).

---

## 5. Traceability Map & Sources

The curation and self-improvement specifications are grounded in real-world implementations:

*   **Nous Hermes Curator Orchestrator**: Detailed in [curator.py](https://github.com/NousResearch/hermes-agent/agent/curator.py) [SRC-002].
*   **Nous Hermes Telemetry Sidecar**: Detailed in [skill_usage.py](https://github.com/NousResearch/hermes-agent/tools/skill_usage.py) [SRC-002].
*   **Nous Hermes Skills Creation Guard**: Detailed in [skill_manager_tool.py](https://github.com/NousResearch/hermes-agent/tools/skill_manager_tool.py) [SRC-002].
*   **VS Code Copilot & Claude Code Memory**: Documented in [GitHub Copilot Agent Mode](05_agent_memory/agent_scratchpads_and_session_memory.md) [SRC-020].
*   **RISE and TT-SI Research**: Documented in academic papers detailing recursive self-training loops [SRC-014].
