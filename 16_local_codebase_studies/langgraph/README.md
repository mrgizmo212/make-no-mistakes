# LangGraph — Local Codebase Study

## Repository: `langchain-ai/langgraph`
## Local Path: `C:\Users\Adam\Desktop\agent2\langgraph\`
## Language: Python | License: MIT

## Overview

Low-level orchestration framework for building stateful agents. The dominant graph-based agent framework as of June 2026. Used by Klarna, Replit, Elastic, and more.

## Architecture

### Directory Structure
```
langgraph/
├── docs/           — Documentation
├── examples/       — Example implementations
├── libs/           — Core library packages
├── AGENTS.md       — Agent instructions (also CLAUDE.md)
└── Makefile        — Build targets
```

### Core Concepts
1. **Graph-based execution** — Agents defined as directed graphs (nodes = functions, edges = transitions)
2. **Durable execution** — Agents persist through failures, resume from exactly where they left off
3. **Human-in-the-loop** — First-class interrupts at any point in execution
4. **Comprehensive memory** — Short-term working memory + long-term persistent memory
5. **Subgraphs** — Composable graph nesting for multi-agent architectures

### Ecosystem Integration
- **Deep Agents** — Higher-level package for planning, subagents, filesystem use
- **LangChain** — Composable components and model integrations
- **LangSmith** — Debugging, evaluation, observability
- **LangSmith Deployment** — Production deployment platform

### Inspirations
- Google's Pregel (graph processing)
- Apache Beam (data pipeline)
- NetworkX (public API)

## Key Design Principles

1. **State is first-class** — Every node receives and returns state
2. **Explicit transitions** — No implicit state changes
3. **Checkpoint everything** — Automatic persistence at every node
4. **Composable** — Graphs can contain other graphs

## Relevance to Harness Research
- Reference implementation for: graph-based state management, durable execution, human-in-the-loop interrupts
- Key patterns to adopt: checkpointing at state transitions, composable agent graphs
- Important caveat: Graph-based may be over-engineered for simple agent loops — consider as a v2 feature
