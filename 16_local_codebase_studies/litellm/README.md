# Local Codebase Study: LiteLLM

## What Was Researched

Architecture and implementation of LiteLLM (BerriAI/litellm) — the most widely-adopted open-source LLM API gateway. Provides a unified OpenAI-compatible interface to 100+ LLM providers, operating as both a Python SDK and a deployable AI Gateway (proxy server). Used by Stripe, Netflix, Google ADK, OpenAI Agents SDK, and many others.

## Which Sources Were Used

- Local clone: `c:\Users\Adam\Desktop\agent2\litellm`
- Files analyzed: `ARCHITECTURE.md`, `CLAUDE.md`, `README.md`, `CONTRIBUTING.md`, `litellm/__init__.py`, `litellm/main.py` (size), `litellm/router.py` (size), `litellm/utils.py` (size), directory structure of `litellm/`, `litellm/llms/`, `litellm/proxy/`, `schema.prisma`

## Key Findings

### Architecture: Two-Layer Design

LiteLLM has a clean two-layer architecture:

```
Client → AI Gateway (proxy/) → LiteLLM SDK (litellm/) → LLM Provider API
```

1. **SDK Layer** (`litellm/`): Core LLM calling, request/response transformation, streaming
2. **Gateway Layer** (`litellm/proxy/`): Auth, rate limiting, budgets, routing, management UI

### SDK Request Flow

```
litellm.completion() → main.py → utils.get_llm_provider() →
  BaseLLMHTTPHandler → ProviderConfig.transform_request() →
  HTTP Request → Provider → ProviderConfig.transform_response() →
  ModelResponse → Callbacks
```

### Provider Translation Layer (Key Pattern)

Each provider has an isolated translation file:
- `llms/{provider}/chat/transformation.py` containing a `Config` class
- Inherits from `BaseConfig` (base_llm/chat/transformation.py)
- Two core methods: `transform_request()` and `transform_response()`
- **Critical design**: translations are unit-testable without API calls
- Adding a new provider requires only: create transformation file, implement Config class, add tests

### Scale of the Codebase

- **7,690 files** (massive codebase)
- `main.py`: 342KB (!) — primary entry point
- `router.py`: 512KB (!!) — routing engine
- `utils.py`: 403KB (!!) — utility functions
- `cost_calculator.py`: 109KB
- These massive files are a known concern — contrast with Codex's strict 500-800 LoC module limits

### Router Architecture

The router (`router.py`, 512KB) provides:
- Load balancing across multiple deployments
- Fallback strategies (provider failover)
- Routing algorithms: lowest latency, simple shuffle, cost-optimized
- TPM/RPM tracking per deployment
- Deployment cooldowns (automatic unhealthy detection)
- Caching via DualCache (in-memory + Redis)

### AI Gateway Features

**Authentication**: API keys, JWT, OAuth2
**Rate Limiting**: Per-key, per-user, per-team via Redis
**Budget Management**: Spend tracking, budget limits, auto-reset
**Cost Attribution**: Calculates per-response cost, queues to Redis, batch-writes to PostgreSQL
**Hooks System**: Pluggable middleware (`CustomLogger` interface):
  - `max_budget_limiter` — enforce budgets
  - `parallel_request_limiter` — rate limiting
  - `cache_control_check` — cache validation
  - `skills_injection` — skills injection

### Data Access Layer

- **Prisma ORM** with PostgreSQL (`schema.prisma`, 55KB)
- Repository pattern: `BaseRepository[T]` provides generic CRUD
- Entity repositories: `VerificationTokenRepository`, `TeamRepository`, `UserRepository`
- Archive-then-delete pattern for soft deletes
- Atomic array operations where Prisma supports them

### Background Jobs (APScheduler)

| Job | Interval | Purpose |
|-----|----------|---------|
| `update_spend` | 60s | Batch write spend logs to PostgreSQL |
| `reset_budget` | 10-12min | Reset budgets for keys/users/teams |
| `add_deployment` | 10s | Sync new model deployments from DB |
| `cleanup_old_spend_logs` | cron | Delete old spend logs |
| `process_rotations` | 1hr | Auto-rotate API keys |
| `send_weekly_spend_report` | weekly | Slack spend alerts |

### Supported Endpoints

| Endpoint | Purpose |
|----------|---------|
| `/v1/chat/completions` | Chat completions (primary) |
| `/v1/messages` | Anthropic Messages API |
| `/v1/responses` | OpenAI Responses API |
| `/v1/embeddings` | Embeddings |
| `/v1/images` | Image generation |
| `/v1/audio` | Audio/speech/transcription |
| `/v1/batches` | Batch processing |
| `/v1/rerank` | Reranking |
| `/a2a` | Agent-to-Agent protocol |
| `/mcp/` | MCP gateway |
| Passthrough | Direct provider passthrough |

### Provider Coverage

- **129 provider directories** in `litellm/llms/` (OpenAI, Anthropic, Gemini, Bedrock, Azure, Groq, Deepseek, Ollama, etc.)
- Each provider gets `/chat/completions`, `/messages`, and `/responses` support
- Some providers have additional endpoints (embeddings, images, audio, batches)

### MCP Integration

- `litellm.experimental_mcp_client.load_mcp_tools()` — loads MCP tools in OpenAI format
- MCP gateway endpoint at `/mcp/`
- Compatible with Cursor IDE's MCP configuration
- Supports both SDK-level and gateway-level MCP

### A2A (Agent-to-Agent) Protocol Support

- Supports invoking A2A agents from LangGraph, Vertex AI, Azure AI Foundry, Bedrock, Pydantic AI
- Full A2A client in `litellm.a2a_protocol`
- Gateway endpoint at `/a2a/{agent-name}`

## What Is Confirmed

- Repository cloned successfully (7,690 files)
- 129 LLM provider directories verified
- Two-layer architecture (SDK + Gateway) verified
- Prisma + PostgreSQL for persistence
- Redis for caching and rate limiting
- Used by Stripe, Netflix, Google ADK, OpenAI Agents SDK
- Y Combinator W23 company (BerriAI)
- 8ms P95 latency at 1K RPS (per docs)

## What Is Uncertain

- How the 342KB `main.py` and 512KB `router.py` are maintained long-term (technical debt)
- Whether the `skills` system (`litellm/skills/`) is mature or experimental
- How stable the A2A protocol integration is
- Performance characteristics of the translation layer across providers
- Whether the Prisma-based data layer is a bottleneck at scale
- How the `experimental_mcp_client` differs from a full MCP implementation

## How This Applies to Building a Modern Model-Agnostic Agent Harness

LiteLLM is the **most directly applicable reference** for the model abstraction layer of the harness:

1. **Provider Translation Pattern**: The `BaseConfig` → `transform_request()`/`transform_response()` pattern is the gold standard for model-agnostic request transformation. The harness MUST adopt this pattern
2. **Router Architecture**: Load balancing, fallbacks, cooldowns, TPM/RPM tracking — the harness routing layer should mirror this
3. **Gateway as a Service**: The proxy server model (standalone service with auth, rate limiting, budgets) is directly applicable to enterprise harness deployments
4. **Cost Tracking**: Per-response cost calculation with Redis queuing and PostgreSQL batch writes is production-proven
5. **MCP Gateway**: Demonstrates how to bridge MCP tools to any LLM provider
6. **A2A Protocol**: Shows how inter-agent communication can be integrated at the gateway level
7. **Provider Coverage**: The sheer breadth (100+ providers) makes LiteLLM the strongest candidate for the harness's LLM abstraction layer — either as a dependency or as the pattern to replicate
8. **Anti-Patterns to Avoid**:
   - `main.py` at 342KB, `router.py` at 512KB — extreme file sizes that impede maintainability
   - The SDK should have enforced module size limits much earlier
9. **OpenAI Format as Lingua Franca**: LiteLLM proves that OpenAI's API format is the de facto standard — the harness should standardize on it
10. **Enterprise Readiness**: Virtual keys, spend tracking, guardrails, admin dashboard — these features define production readiness for agent infrastructure

### Relevance Score: CRITICAL — primary reference for model abstraction and routing
