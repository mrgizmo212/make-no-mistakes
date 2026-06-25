<p align="center">
  <img src="assets/logo.png" alt="Make No Mistakes" width="340"/>
</p>

<h1 align="center">Make No Mistakes</h1>

<p align="center">
  <strong>Notes toward a model-agnostic agent harness.</strong><br/>
  <sub>Started June 2026 · still being edited</sub>
</p>

<p align="center">
  <a href="https://mrgizmo212.github.io/make-no-mistakes/"><img src="https://img.shields.io/badge/Read_online-GitHub_Pages-58a6ff?style=for-the-badge&logo=github" alt="Read online"/></a>
  <a href="19_final_reports/harness_architecture_specification_report.md"><img src="https://img.shields.io/badge/The_spec-a371f7?style=for-the-badge" alt="The Spec"/></a>
  <a href="SUMMARY.md"><img src="https://img.shields.io/badge/Full_TOC-238636?style=for-the-badge" alt="Full TOC"/></a>
</p>

---

## What this is

Working notes on how to build a clean, model-agnostic **agent harness** — loops, memory, subagents, tools, MCPs, skills, voice — organized around a 5-tier architecture.

It pulls patterns from a dozen existing projects (Hermes, Codex, Pi, LangGraph, OpenClaw, LiteLLM, and others) and tries to say which layer each one is actually good at.

---

## It's a composite, not a merge

You are not supposed to fork Hermes, Codex, Pi, LangGraph, and OpenClaw into one giant monorepo. That's the mistake this whole thing is named after.

Instead, treat each project as a **pattern donor** for a specific layer, and wire them together through interfaces that already exist: OpenAI-compatible APIs, MCP, SSE, `SKILL.md`.

| The spec means | It does **not** mean |
|:---|:---|
| Tier 2 behaves *like* Hermes/Codex/Pi | Copy their codebases |
| Tier 5 talks to your model backend (Ollama, OpenRouter, …) | Vendor a proxy repo or require LiteLLM |
| Tier 4 borrows OpenClaw patterns | Fork OpenClaw as your base |

Narrow interfaces, opinionated layers.

→ [Full architecture recommendations](18_architecture_recommendations/README.md)

---

## Start here

| | |
|:---|:---|
| Live site | [mrgizmo212.github.io/make-no-mistakes](https://mrgizmo212.github.io/make-no-mistakes/) |
| The spec | [Harness Architecture Specification](19_final_reports/harness_architecture_specification_report.md) |
| Recommendations | [Architecture Recommendations](18_architecture_recommendations/README.md) |
| Full TOC | [SUMMARY.md](SUMMARY.md) |
| Where claims come from | [Sources](00_index/source_registry.md) · [Citations](00_index/citation_map.md) |

---

## The 5-tier stack

```mermaid
flowchart TB
  T5["Tier 5 · Model Gateway<br/>Ollama · OpenRouter · LiteLLM · direct APIs"]
  T4["Tier 4 · Canvas GUI<br/>OpenClaw"]
  T3["Tier 3 · IDE Extension<br/>Cursor · VS Code"]
  T2["Tier 2 · Cognitive Engine<br/>Hermes / Codex / Pi"]
  T1["Tier 1 · SDK / Hooks<br/>LangGraph / assistant-ui"]
  T5 --> T4 --> T3 --> T2 --> T1
```

Tier 3 leans on Cursor's agent model — see the [Cursor Agent docs](https://cursor.com/docs/agent/overview) and [SRC-021](https://github.com/mrgizmo212/make-no-mistakes/blob/main/00_index/source_registry.md).

---

## What's inside

| Part | Topics |
|:---|:---|
| I · Landscape | SDKs, frameworks, coding agents |
| II · Core systems | Loops, memory, subagents, tools, MCPs, skills, voice |
| III · Architecture | Model-agnostic harness, backend & frontend stacks |
| IV · Studies | Hermes, Codex, Pi, LangGraph, LangChain, OpenClaw, LiteLLM, … |
| V · Synthesis | Comparisons, recommendations, final spec |

---

## Read it offline

```bash
git clone https://github.com/mrgizmo212/make-no-mistakes.git
cd make-no-mistakes
# open SUMMARY.md, or jump to 19_final_reports/harness_architecture_specification_report.md
```

---

## About

Adam Heimann is the co-founder and CEO of True Trading Group, where he also leads AI strategy and product. He started out on the promotional side of penny stocks — he literally wrote [*The Penny Stock Gospel*](https://www.amazon.com/Penny-Stock-Gospel-Adam-Heimann-ebook/dp/B01J4CTWJE/), though not proud of it. Now he builds the tools he wishes those traders had had: multi-agent research workflows and practical AI that help traders and investors analyze markets faster, document plans, and manage risk.

He's blunt, allergic to hype, and doesn't think the customer is always right — he'll tell you when you're the problem, because he'd rather you actually get better than feel good and stay broke. It's a posture his members reward: under Adam's direction TTG launched M.A.R.I., an Agent-as-a-Model ecosystem — AI agents exposed as a single model — that powers the TTG AI trading platform, recognized at the 2024 Benzinga Fintech Awards. TTG has since scaled a global community of more than 10,000 members across 115 countries.

A bootstrapped founder since 2006, Adam has taken multiple companies from idea to product with no outside funding, generating more than $100 million in cumulative revenue. He was also an original co-founder of LibreChat LLC, acquired by ClickHouse in November 2025. His work focuses on making institutional-grade capabilities accessible to individuals while emphasizing process, compliance awareness, and human-in-the-loop decision making.

https://www.linkedin.com/in/adam-heimann-68789610/

https://x.com/adamheimann

---

<p align="center">
  <sub>© 2026 Adam Heimann · Licensed <a href="LICENSE">CC BY 4.0</a> — use it freely, just credit me · Upstream projects keep their own licenses</sub>
</p>
