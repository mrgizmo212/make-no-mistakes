# LangChain — Local Codebase Study

## Repository: `langchain-ai/langchain`
## Local Path: `C:\Users\Adam\Desktop\agent2\langchain\`
## Language: Python | License: MIT

## Overview

"The agent engineering platform." The foundational LLM application SDK with the largest integration ecosystem. Self-describes as a framework for building agents and LLM-powered applications.

## Architecture

### Directory Structure
```
langchain/
├── libs/           — Core library packages (langchain, langchain-core, etc.)
├── .mcp.json       — MCP server configuration
├── AGENTS.md       — Agent instructions (15KB)
├── CLAUDE.md       — Same content as AGENTS.md
└── README.md       — Project overview
```

### Core Concepts
1. **`init_chat_model()`** — Universal model initializer: `init_chat_model("openai:gpt-5.5")`
2. **Provider packages** — Separate packages per provider (langchain-openai, langchain-anthropic, etc.)
3. **Integrations** — 700+ third-party integrations
4. **LCEL** — LangChain Expression Language for declarative pipeline composition
5. **Deep Agents** — Higher-level package for planning, subagents, filesystem

### Ecosystem
- **LangGraph** — Agent orchestration framework
- **LangSmith** — Observability and debugging
- **LangSmith Deployment** — Production deployment

### Key Quickstart
```python
from langchain.chat_models import init_chat_model
model = init_chat_model("openai:gpt-5.5")
result = model.invoke("Hello, world!")
```

## Key Design Principles

1. **Model interoperability** — Swap models without code changes
2. **Composable components** — Chain together reusable pieces
3. **Flexible abstraction layers** — High-level chains to low-level components
4. **Provider:model URI** — `"openai:gpt-5.5"` format is the standard

## Relevance to Harness Research
- Reference implementation for: model abstraction, provider packages, integration ecosystem
- Key patterns to adopt: `provider:model` URI format, separate provider packages, `init_chat_model()` pattern
- The SDK layer of a new harness should follow LangChain's model abstraction approach
