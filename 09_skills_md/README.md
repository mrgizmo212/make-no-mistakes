# 09 — Skills (SKILL.md) & Self-Improvement Loops

## What Was Researched

The SKILL.md file format, agent skills systems, and background curation loops that enable agents to learn, store, refine, and reuse procedural knowledge. We analyzed how harnesses dynamically track skill usage, transition states to prevent token bloat, consolidate overlapping skills into broad umbrella classes, and log user styling preferences across sessions.

### Research Documents
*   **[self_improving_agents_and_learning_loops.md](09_skills_md/self_improving_agents_and_learning_loops.md)** — Detailed analysis of background curation loops, telemetry sidecars, and preference learning.

## Which Sources Were Used

| Source | Type | URL | Relevance |
|--------|------|-----|-----------|
| Hermes Agent (`hermes-agent/skills/`, `tools/skills_tool.py`, `tools/skill_manager_tool.py`, `agent/curator.py`, `tools/skill_usage.py`) | Local codebase | https://github.com/NousResearch/hermes-agent | CRITICAL |
| OpenClaw skills system | Local codebase | https://github.com/openclaw/openclaw | HIGH |
| Codex AGENTS.md | Local codebase | https://github.com/openai/codex | MEDIUM |
| agentskills.io standard | External reference | https://agentskills.io | HIGH |
| RISE & TT-SI Research Papers | Academic Literature | https://arxiv.org/abs/2407.18210 | MEDIUM |

## Key Findings

### SKILL.md Format
The emerging standard for agent skills. A SKILL.md file contains:
- **YAML frontmatter** — Name, description, metadata
- **Markdown body** — Detailed instructions the agent follows when the skill is activated

Both Hermes and OpenClaw use this format. The agentskills.io open standard formalizes it.

### Hermes Curation & Self-Improvement (Most Advanced)
Hermes implements an autonomous background self-improvement cycle:
*   **Curator Invocation**: Triggered during inactivity (default: 7 days since last run, 2 hours user idle) [CLAIM-208](../00_index/citation_map.md#claim-208). Spawns a background `AIAgent` fork on a cheaper auxiliary model (`auxiliary.curator`), running in its own prompt cache to inspect candidate skills [CLAIM-208](../00_index/citation_map.md#claim-208).
*   **Telemetry Sidecar**: Tracks views, uses, and patches in `~/.hermes/skills/.usage.json` rather than raw file frontmatter [CLAIM-209](../00_index/citation_map.md#claim-209).
*   **Deterministic Transitions**: Moves unused agent-created skills from `active` -> `stale` (30 days) -> `archived` (90 days, moved to `.archive/` directory) [CLAIM-211](../00_index/citation_map.md#claim-211).
*   **Consolidation (Umbrella Building)**: Merges narrow task-specific skills into broad class-level instruction files (e.g. `git-workflow`) [CLAIM-213](../00_index/citation_map.md#claim-213). Consolidates by patching existing umbrellas, creating new ones, or demoting micro-skills to subfiles (`references/`, `templates/`, `scripts/`) under the umbrella folder [CLAIM-213](../00_index/citation_map.md#claim-213), maintaining relative link and package path integrity [CLAIM-214](../00_index/citation_map.md#claim-214).
*   **Security & Protection**: Scans agent-created skills via AST analysis and static checks [CLAIM-215](../00_index/citation_map.md#claim-215). Pinned skills (`"pinned": true`) are exempt from archiving and deletes while permitting patches [CLAIM-212](../00_index/citation_map.md#claim-212).
*   **Backups**: Takes pre-run tarball snapshots (`skills.tar.gz`) under `.curator_backups/` for multi-tier rollbacks [CLAIM-216](../00_index/citation_map.md#claim-216).

### User Preference Learning (Claude Code)
*   **Preference Extraction**: Extracts user styling/tool preferences dynamically and logs them to a local `.claude/memory.md` file in the workspace [CLAIM-204](../00_index/citation_map.md#claim-204).
*   **Auditability**: Developers audit or edit preferences using `/memory` commands or direct file edits [CLAIM-204](../00_index/citation_map.md#claim-204).

### Academic Paradigms (RISE & TT-SI)
*   **Test-Time Self-Improvement (TT-SI)**: Fine-tunes model parameters dynamically using synthetic instruction pairs generated from compilation or runtime traces [CLAIM-217](../00_index/citation_map.md#claim-217).
*   **Recursive Introspection (RISE)**: Rewrites reasoning paths mid-turn based on internal evaluation rewards to bypass terminal errors [CLAIM-217](../00_index/citation_map.md#claim-217).

## How This Applies to Building a Model-Agnostic Agent Harness

1.  **Adopt the SKILL.md standard**: Use YAML frontmatter for description-based matching.
2.  **Isolate Telemetry**: Keep usage metrics in a JSON sidecar to preserve cache stability and avoid VCS pollution [CLAIM-209](../00_index/citation_map.md#claim-209).
3.  **Implement an Idle Curation Daemon**: Run background reviews during inactivity to merge duplicate/narrow guidelines into class-level umbrellas [CLAIM-208, CLAIM-213].
4.  **Enforce Safe Sandbox Scanning**: Scan skills with AST tools before execution [CLAIM-215](../00_index/citation_map.md#claim-215).
5.  **Enable Tarball Backups**: Auto-snapshot the skills directory before curation rollouts [CLAIM-216](../00_index/citation_map.md#claim-216).
6.  **Expose Pinned Exemptions**: Allow developers to pin load-bearing guidelines [CLAIM-212](../00_index/citation_map.md#claim-212).

