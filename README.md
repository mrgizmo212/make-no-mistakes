<p align="center">
  <img src="assets/logo.png" alt="Make No Mistakes" width="340"/>
</p>

<h1 align="center">Make No Mistakes</h1>

<p align="center">
  <strong>An open research ebook for building a model-agnostic agent harness.</strong><br/>
  <sub>June 2026 · 217 verified claims · 30 sources · 12 codebases studied</sub>
</p>

<p align="center">
  <a href="https://mrgizmo212.github.io/make-no-mistakes/"><img src="https://img.shields.io/badge/📖_Read_Online-GitHub_Pages-58a6ff?style=for-the-badge&logo=github" alt="Read online"/></a>
  <a href="19_final_reports/harness_architecture_specification_report.md"><img src="https://img.shields.io/badge/⚡_The_Spec-a371f7?style=for-the-badge" alt="The Spec"/></a>
  <a href="SUMMARY.md"><img src="https://img.shields.io/badge/🗂️_Full_TOC-238636?style=for-the-badge" alt="Full TOC"/></a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Chapters-55-blue?style=flat-square" alt="Chapters"/>
  <img src="https://img.shields.io/badge/Claims-217-blueviolet?style=flat-square" alt="Claims"/>
  <img src="https://img.shields.io/badge/Sources-30-informational?style=flat-square" alt="Sources"/>
  <img src="https://img.shields.io/badge/Codebases-12-orange?style=flat-square" alt="Codebases"/>
</p>

---

## What is this?

A **GitHub-native research ebook** focused on building a clean, model-agnostic **agent harness** — loops, memory, subagents, tools, MCPs, skills, voice, and a practical 5-tier architecture.

> No messy submodules. No forking everything into one repo.  
> Just the best patterns, synthesized.

---

## Composite architecture — not a codebase merge

**You are not supposed to fork Hermes, Codex, Pi, LangGraph, OpenClaw and friends into one giant monorepo.**

This book treats them as **pattern donors** for different layers, connected through standard interfaces (OpenAI-compatible APIs, MCP, SSE, `SKILL.md`, etc.).

| What the spec *means* | What it does **not** mean |
|:---|:---|
| Tier 2 behaves *like* Hermes/Codex/Pi | Copy their entire codebases |
| Tier 5 talks to **your** model backend (Ollama, OpenRouter, etc.) | Require LiteLLM or vendor a proxy repo |
| Tier 4 draws from OpenClaw patterns | Fork OpenClaw as your base |

**Core principle:** *Narrow waist, rich edges.*

→ [Full Architecture Recommendations](18_architecture_recommendations/README.md)

---

## Start here

| | |
|:---|:---|
| **📖 Live Site** | [mrgizmo212.github.io/make-no-mistakes](https://mrgizmo212.github.io/make-no-mistakes/) |
| **⚡ The Spec** | [Harness Architecture Specification](19_final_reports/harness_architecture_specification_report.md) |
| **Recommendations** | [Architecture Recommendations](18_architecture_recommendations/README.md) |
| **Full TOC** | [SUMMARY.md](SUMMARY.md) |
| **Provenance** | [Sources](00_index/source_registry.md) · [Citations](00_index/citation_map.md) |

---

## 5-Tier Harness Stack

```mermaid
flowchart TB
  T5["Tier 5 · Model Gateway<br/>Ollama · OpenRouter · LiteLLM · direct APIs"]
  T4["Tier 4 · Canvas GUI<br/>OpenClaw"]
  T3["Tier 3 · IDE Extension<br/>Cursor / VS Code"]
  T2["Tier 2 · Cognitive Engine<br/>Hermes / Codex / Pi"]
  T1["Tier 1 · SDK / Hooks<br/>LangGraph / assistant-ui"]
  T5 --> T4 --> T3 --> T2 --> T1
```

---

## What's inside

| Part | Topics |
|:---|:---|
| **I · Landscape** | SDKs, frameworks, coding agents |
| **II · Core systems** | Loops, memory, subagents, tools, MCPs, skills, voice |
| **III · Architecture** | Model-agnostic harness, backend & frontend stacks |
| **IV · Studies** | Hermes, Codex, Pi, LangGraph, LangChain, OpenClaw, LiteLLM, … |
| **V · Synthesis** | Comparisons, recommendations, final spec |

---

## Clone & read offline

```bash
git clone https://github.com/mrgizmo212/make-no-mistakes.git
cd make-no-mistakes
# open SUMMARY.md or start at 19_final_reports/harness_architecture_specification_report.md
```

---

<p align="center">
  <sub>Research & synthesis © 2026 · Upstream projects retain their own licenses</sub>
</p>
