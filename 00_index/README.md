# 00_index — Research Index & Metadata

## Purpose

This directory serves as the central index for all research conducted across the `agent_harness_research` project. It provides traceability, source management, and an ongoing log of research activity.

## Contents

| File | Purpose |
|------|---------|
| `research_log.md` | Chronological log of all research activities, findings, and decisions |
| `source_registry.md` | Master registry of all sources consulted (repos, docs, papers, articles) |
| `citation_map.md` | Maps every factual claim in final documents back to a registered source |
| `open_questions.md` | Tracks unresolved questions, uncertainties, and items needing follow-up |

## Which Sources Were Used

All sources are tracked in `source_registry.md`. This index directory aggregates metadata from all 19 topic areas. **30 sources** are registered (SRC-001 through SRC-030) covering 12 local codebases, 6 online documentation sites, 4 academic papers, and 8 other GitHub repositories.

## What Was Researched

This index tracks research across 19 topic areas covering open-source agentic SDKs, agent frameworks, coding agents, agent loops, memory systems, subagent architectures, tools, MCPs, skills systems, instructions, automation workflows, voice integration, model-agnostic harness design, backend/frontend agent stacks, local codebase studies, comparisons, and final architecture recommendations.

## Key Findings

- **217 claims** registered and verified across all topic areas (CLAIM-001 through CLAIM-217)
- **30 sources** registered and validated (SRC-001 through SRC-030)
- **55 markdown files** across 20 directories constitute the complete research corpus
- **12 reference codebases** analyzed (Hermes, Codex, Pi, LangGraph, LangChain, OpenClaw, LiteLLM, OpenRouter SDK, Open Responses, assistant-ui, LibreChat, LibreChat Agents SDK)
- All claims and sources verified via automated `verify_citations.py` with zero errors

## What Is Confirmed

- All 19 topic directories fully researched and populated
- All index files (research_log, source_registry, citation_map, open_questions) synchronized
- Source tracking and citation traceability fully operational
- All quantitative claims verified against the local filesystem
- Master specification report compiled in `19_final_reports/`

## What Is Uncertain

- Deployment timeline and target platform infrastructure details (user-dependent)
- Some model pricing may shift with provider updates post-June 2026

## How This Applies to Building a Modern Model-Agnostic Agent Harness

This index ensures that every architectural recommendation is traceable to concrete evidence, every source is registered, and no claims are made without supporting research.
