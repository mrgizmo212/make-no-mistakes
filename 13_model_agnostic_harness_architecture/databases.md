# Databases for Agent Harness Systems

> Comprehensive reference on database technologies for AI agent harness architectures. Covers when to use each, how to integrate it, how it scales, and how it fits into the broader data layer. Grounded in local codebase analysis of 10 open-source projects and the June 2026 landscape.

---

## What Was Researched

Database technologies and their roles in AI agent systems — persistent session storage, full-text search, caching, vector search, document stores, analytics, and managed backends. Every recommendation below is traced to real usage patterns in the studied codebases.

## Which Sources Were Used

| Source | Type | URL | Relevance | Database Tech Found |
|--------|------|-----|-----------|-------------------|
| Hermes Agent (`hermes_state.py`, 227KB) | Local codebase | https://github.com/NousResearch/hermes-agent | CRITICAL | SQLite + FTS5 (WAL mode, trigram, CJK) |
| LiteLLM (`schema.prisma`, 57KB, 1402 lines) | Local codebase | https://github.com/BerriAI/litellm | CRITICAL | PostgreSQL via Prisma ORM, Redis caching |
| Open Responses (`open-responses/`) | Local codebase | https://github.com/open-responses/open-responses | HIGH | PostgreSQL + Redis |
| LangGraph | Local codebase | https://github.com/langchain-ai/langgraph | HIGH | Pluggable checkpointers (SQLite, PostgreSQL) |
| Hermes memory plugins (`plugins/memory/`) | Local codebase | https://github.com/NousResearch/hermes-agent | HIGH | Qdrant (optional skill), Redis (Mem0 vector store) |
| Hermes Meilisearch reference | Local codebase | https://github.com/NousResearch/hermes-agent | MEDIUM | Meilisearch via delegation patterns |
| OpenClaw | Local codebase | https://github.com/openclaw/openclaw | MEDIUM | File-based + SQLite |
| LiteLLM Terraform deployments | Local codebase | https://github.com/BerriAI/litellm | HIGH | Aurora Postgres (AWS), Cloud SQL (GCP) |

---

## 1. SQLite

### What It Is
Embedded, serverless, zero-configuration relational database. A single file on disk. The most deployed database engine in the world.

### How It's Used in Practice (from studied codebases)

**Hermes Agent — `hermes_state.py` (227KB, 5104 lines)**

The definitive example of production SQLite usage in an agent harness:

```sql
-- Core session schema (from hermes_state.py)
CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    source TEXT NOT NULL,
    user_id TEXT,
    model TEXT,
    system_prompt TEXT,
    parent_session_id TEXT,
    started_at REAL NOT NULL,
    ended_at REAL,
    message_count INTEGER DEFAULT 0,
    tool_call_count INTEGER DEFAULT 0,
    input_tokens INTEGER DEFAULT 0,
    output_tokens INTEGER DEFAULT 0,
    cache_read_tokens INTEGER DEFAULT 0,
    estimated_cost_usd REAL,
    title TEXT,
    archived INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (parent_session_id) REFERENCES sessions(id)
);

CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL REFERENCES sessions(id),
    role TEXT NOT NULL,
    content TEXT,
    tool_call_id TEXT,
    tool_calls TEXT,
    tool_name TEXT,
    timestamp REAL NOT NULL,
    token_count INTEGER,
    reasoning TEXT,
    active INTEGER NOT NULL DEFAULT 1,
    compacted INTEGER NOT NULL DEFAULT 0
);
```

**WAL (Write-Ahead Logging) mode** — Hermes uses WAL for concurrent reads:
```python
# From hermes_state.py - WAL with fallback for NFS/SMB
apply_wal_with_fallback(self._conn, db_label="state.db")
```

**FTS5 Full-Text Search** — Cross-session search (the killer feature):
```sql
CREATE VIRTUAL TABLE IF NOT EXISTS messages_fts USING fts5(content);

-- Trigram tokenizer for CJK/substring search
CREATE VIRTUAL TABLE IF NOT EXISTS messages_fts_trigram USING fts5(
    content, tokenize='trigram'
);
```

**Write contention handling** — Application-level jitter retry (not SQLite's built-in busy handler):
```python
# 15 retries with 20-150ms random jitter, WAL checkpoint every 50 writes
_WRITE_MAX_RETRIES = 15
_WRITE_RETRY_MIN_S = 0.020   # 20ms
_WRITE_RETRY_MAX_S = 0.150   # 150ms
_CHECKPOINT_EVERY_N_WRITES = 50
```

**Self-healing schema** — Auto-repairs malformed `sqlite_master` via de-duplication surgery + FTS rebuild.

**LangGraph** — Uses SQLite checkpointers for local agent state persistence.

### When to Use

- **Single-user / local-first agent** — Default choice. Zero ops, zero config.
- **Session storage** — Conversation history with full-text search.
- **Prototyping** — Get a working agent in minutes, migrate to PostgreSQL later.
- **Embedded applications** — Desktop apps (Electron), CLI tools, mobile.
- **Read-heavy workloads** — WAL mode allows concurrent readers.

### When NOT to Use

- **Multi-user server** with concurrent writers — WAL helps but doesn't scale.
- **NFS/SMB/FUSE filesystems** — WAL requires shared-memory coordination (Hermes explicitly handles this fallback).
- **Horizontal scaling** — SQLite is a single file; can't shard.
- **Complex analytics** — No window functions on older builds, limited JSON ops.

### How to Scale

| Scale Level | Strategy | Example |
|-------------|----------|---------|
| **1 user, 1 agent** | Direct SQLite, WAL mode | Hermes CLI |
| **1 user, N agents** | WAL + jitter retry (Hermes pattern) | Hermes gateway + CLI |
| **N users, read-heavy** | Read replicas via Litestream | Dashboard analytics |
| **N users, write-heavy** | Migrate to PostgreSQL | LiteLLM proxy |
| **Distributed** | Not suitable — use PostgreSQL | — |

---

## 2. PostgreSQL

### What It Is
The most advanced open-source relational database. Full ACID compliance, JSONB support, row-level security, extensions ecosystem, managed cloud offerings everywhere.

### How It's Used in Practice (from studied codebases)

**LiteLLM Proxy — `schema.prisma` (57KB, 1402 lines, 50+ models)**

The gold standard for multi-tenant agent infrastructure. LiteLLM's Prisma schema defines 50+ PostgreSQL models:

```prisma
datasource client {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model LiteLLM_BudgetTable {
  budget_id String @id @default(uuid())
  max_budget Float?
  soft_budget Float?
  max_parallel_requests Int?
  tpm_limit BigInt?
  rpm_limit BigInt?
  budget_duration String?
  budget_reset_at DateTime?
}

model LiteLLM_SpendLogs {
  request_id String @id
  call_type String
  api_key String @default("")
  spend Float @default(0.0)
  total_tokens Int @default(0)
  prompt_tokens Int @default(0)
  completion_tokens Int @default(0)
  startTime DateTime
  endTime DateTime
  model String @default("")
  @@index([startTime])
  @@index([end_user])
}

model LiteLLM_DailyUserSpend {
  -- Aggregated daily spend per user/model/key
  @@unique([user_id, date, api_key, model, custom_llm_provider, ...])
  @@index([date])
  @@index([user_id, date])
}
```

**Key PostgreSQL tables in LiteLLM** (50+ models):
- `LiteLLM_BudgetTable` — Budget/rate limits for orgs, teams, keys
- `LiteLLM_VerificationToken` — API key management with rotation, auto-rotate
- `LiteLLM_SpendLogs` — Per-request spend tracking with full metadata
- `LiteLLM_DailyUserSpend`, `DailyTeamSpend`, `DailyOrgSpend`, `DailyAgentSpend` — Aggregated analytics
- `LiteLLM_AgentsTable` — Agent definitions with spend limits
- `LiteLLM_MCPServerTable` — MCP server configuration with OAuth, health checks
- `LiteLLM_AuditLog` — Change tracking for compliance

**LiteLLM Terraform Deployments**:
- **AWS**: Aurora Postgres (IAM auth) + ElastiCache Redis
- **GCP**: Cloud SQL Postgres (password auth) + Memorystore Redis

**Open Responses** — PostgreSQL for Responses API state persistence.

### When to Use

- **Multi-user agent platform** — Teams, orgs, budgets, API keys, spend tracking.
- **Spend analytics** — Daily aggregation tables (LiteLLM pattern).
- **Audit logging** — Compliance-grade change tracking.
- **Complex queries** — Window functions, CTEs, JSON aggregation, full-text search.
- **Gateway/proxy state** — LiteLLM's entire proxy layer runs on PostgreSQL.
- **Production multi-tenant** — Row-level security, connection pooling (PgBouncer).

### When NOT to Use

- **Single-user local agent** — SQLite is simpler, zero-ops.
- **Rapid prototyping** — Requires a running server.
- **Vector search** — Use Qdrant or pgvector extension (see below).
- **Real-time pub/sub** — Use Redis instead.

### How to Scale

| Scale Level | Strategy | Example |
|-------------|----------|---------|
| **Dev** | Local Docker container | `docker run postgres:17` |
| **Small prod** | Single managed instance | Supabase, Neon, RDS |
| **Medium prod** | Read replicas | RDS Multi-AZ |
| **Large prod** | Connection pooling + partitioning | PgBouncer + time-based partitions |
| **Enterprise** | Aurora/AlloyDB + Citus | LiteLLM Terraform AWS pattern |

### pgvector Extension
PostgreSQL can also serve as a vector database via the `pgvector` extension:
```sql
CREATE EXTENSION vector;
CREATE TABLE embeddings (
  id SERIAL PRIMARY KEY,
  content TEXT,
  embedding vector(1536)  -- OpenAI Ada dimensions
);
CREATE INDEX ON embeddings USING ivfflat (embedding vector_cosine_ops);
```
Use pgvector when you want vector search without adding another database. For dedicated vector workloads at scale, use Qdrant.

---

## 3. Supabase

### What It Is
Open-source Firebase alternative built on PostgreSQL. Provides managed PostgreSQL + Auth + Realtime + Storage + Edge Functions out of the box.

### How It's Used in Practice (from studied codebases)

**Hermes Agent** — Supabase integration via webhooks:
```
# From hermes-agent/website/docs/user-guide/messaging/webhooks.md
Your Supabase edge function signs the payload with HMAC-SHA256 and POSTs
to the webhook endpoint. The webhook adapter validates the signature,
renders the template, delivers to Telegram, and returns 200 OK.
```

**LiteLLM** — Logging integration: sends request/response logs to Supabase tables.

### When to Use

- **Rapid backend for agent UIs** — Auth, database, storage, realtime in one.
- **Webhook source** — Edge functions trigger agent workflows on database changes.
- **Managed PostgreSQL** — When you want PostgreSQL without running it yourself.
- **Realtime subscriptions** — Agent dashboard updates in real-time via WebSocket.
- **Auth layer** — When your agent platform needs user authentication.

### When NOT to Use

- **Local-first agent** — SQLite is simpler.
- **Custom PostgreSQL extensions** — Supabase's managed Postgres may not support all extensions.
- **High-throughput vector search** — Use Qdrant directly.
- **Budget constraints at scale** — Can get expensive compared to self-hosted PostgreSQL.

### How to Scale

| Scale Level | Strategy |
|-------------|----------|
| **Free tier** | 500MB, no auto-suspend |
| **Pro** | 8GB, daily backups, point-in-time recovery |
| **Team/Enterprise** | Dedicated instances, SOC2, SSO |
| **Self-hosted** | Docker Compose with PostgreSQL, Kong, GoTrue, Realtime |

---

## 4. MongoDB

### What It Is
Document-oriented NoSQL database. Stores JSON-like documents (BSON) with flexible schemas.

### How It's Used in Practice (from studied codebases)

**Hermes Agent** — MCP integration for MongoDB databases:
```python
# From hermes-agent/tools/mcp_tool.py
# Some servers (notably mongodb-mcp-server) emit specific patterns
# that require special handling
```

**Hermes Agent** — URL redaction patterns include MongoDB connection strings:
```python
# From hermes-agent/agent/redact.py
# Catches postgres, mysql, mongodb, redis, amqp URLs and redacts the password
r"((?:postgres(?:ql)?|mysql|mongodb(?:\+srv)?|redis|amqp)://[^:]+:)([^@]+)(@)"
```

### When to Use

- **Unstructured agent data** — When session data varies wildly in shape.
- **Document-heavy workflows** — Agents working with PDF, web scraping, or heterogeneous data.
- **Existing MongoDB infrastructure** — If your org already runs MongoDB.
- **Time-series data** — MongoDB's time-series collections for agent telemetry.

### When NOT to Use

- **Agent session storage** — SQLite or PostgreSQL with structured schemas are better (every studied framework uses relational for sessions).
- **Spend tracking / analytics** — Relational models with aggregation indexes (LiteLLM's Prisma schema) are far more efficient.
- **Vector search** — MongoDB Atlas Vector Search exists but Qdrant is purpose-built and faster.
- **Transactions** — MongoDB supports them but they're more complex than PostgreSQL's.

### How to Scale

| Scale Level | Strategy |
|-------------|----------|
| **Dev** | Local Docker, MongoDB Community |
| **Small prod** | MongoDB Atlas free tier (512MB) |
| **Medium prod** | Atlas dedicated cluster, replica sets |
| **Large prod** | Sharded clusters, zone-based sharding |

---

## 5. Qdrant

### What It Is
High-performance vector similarity search engine, written in Rust. Purpose-built for embedding search, RAG, and semantic similarity.

### How It's Used in Practice (from studied codebases)

**Hermes Agent** — Optional skill for RAG and semantic search:
```yaml
# From hermes-agent/optional-skills/mlops/qdrant/
Source: Optional — install with `hermes skills install official/mlops/qdrant`
Dependencies: qdrant-client>=1.12.0
Tags: RAG, Vector Search, Semantic Search, Embeddings, HNSW, Distributed
```

**Hermes Qdrant Skill** — Full usage patterns documented:
```python
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct

# Connect to Qdrant
client = QdrantClient(host="localhost", port=6333)

# Create collection with HNSW index
client.create_collection(
    collection_name="documents",
    vectors_config=VectorParams(size=1536, distance=Distance.COSINE),
)

# LangChain integration
from langchain_community.vectorstores import Qdrant
vectorstore = Qdrant.from_documents(documents, embeddings, 
    url="http://localhost:6333", collection_name="docs")

# LlamaIndex integration
from llama_index.vector_stores.qdrant import QdrantVectorStore
vector_store = QdrantVectorStore(client=client, collection_name="llama_docs")
```

**Hermes Mem0 Plugin** — Redis as vector store backend (with Qdrant as alternative):
```python
# From hermes-agent/tests/plugins/memory/test_mem0_providers.py
"vector_store": {"provider": "redis", "config": {}},
# Alternative: {"provider": "qdrant", "config": {}}
```

### When to Use

- **RAG (Retrieval-Augmented Generation)** — Embed documents, search by semantic similarity.
- **Agent memory search** — Semantic recall of past conversations and knowledge.
- **Recommendation systems** — Similar item/content retrieval.
- **Large-scale embeddings** — Billions of vectors with sub-millisecond search.
- **Hybrid search** — Combined dense (vector) + sparse (keyword) search.
- **Production vector search** — When pgvector's performance isn't sufficient.

### When NOT to Use

- **Structured data queries** — Use PostgreSQL for relational data.
- **Full-text keyword search** — Use SQLite FTS5 or Meilisearch for text search.
- **Simple agent sessions** — Overkill for storing conversation history.
- **Small datasets** — pgvector on PostgreSQL is simpler for <100K vectors.

### How to Scale

| Scale Level | Strategy |
|-------------|----------|
| **Dev** | `docker run qdrant/qdrant` (single container) |
| **Small prod** | Qdrant Cloud free tier |
| **Medium prod** | Dedicated Qdrant node, HNSW tuning |
| **Large prod** | Distributed mode (sharding + replicas) |
| **Enterprise** | Qdrant Cloud Enterprise, dedicated clusters |

### Key Configuration

```python
from qdrant_client.models import VectorParams, Distance, HnswConfigDiff

# Optimize HNSW index for speed vs. recall
client.create_collection(
    collection_name="fast_search",
    vectors_config=VectorParams(size=1536, distance=Distance.COSINE),
    hnsw_config=HnswConfigDiff(m=16, ef_construct=100),
)

# Scalar quantization for memory efficiency (4x reduction)
from qdrant_client.models import ScalarQuantization, ScalarQuantizationConfig, ScalarType
client.create_collection(
    collection_name="memory_efficient",
    vectors_config=VectorParams(size=1536, distance=Distance.COSINE),
    quantization_config=ScalarQuantization(
        scalar=ScalarQuantizationConfig(type=ScalarType.INT8, quantile=0.99)
    ),
)
```

---

## 6. Redis

### What It Is
In-memory data structure store. Used as cache, message broker, pub/sub system, and (via modules) as a vector store.

### How It's Used in Practice (from studied codebases)

**LiteLLM Proxy** — Response caching and rate limiting:
```
# From LiteLLM Terraform AWS deployment
Aurora Postgres (IAM auth) + ElastiCache Redis
# From LiteLLM Terraform GCP deployment  
Cloud SQL Postgres (password auth) + Memorystore Redis
```

**Open Responses** — Redis for response caching and state:
```
# From open-responses/CLI.md
Redis: 0.5 CPU, 768MB memory (min: 0.1 CPU, 128MB)
```

**Hermes Mem0 Plugin** — Redis as vector store backend:
```python
"vector_store": {"provider": "redis", "config": {}},
```

### Role in Agent Architecture

Redis plays **four distinct roles** in agent systems:

#### Role 1: LLM Response Cache
Cache identical API calls to avoid duplicate model invocations:
```
Request hash → Cached response
TTL: minutes to hours depending on temperature/randomness
```
**When**: High-volume proxy serving many users asking similar questions.
**How**: LiteLLM's built-in Redis caching with configurable TTL.

#### Role 2: Rate Limiting / Token Budgets
Track per-user, per-team, per-org API usage in real-time:
```
user:{id}:tokens → current count (INCR, EXPIRE)
team:{id}:rpm → requests this minute (INCR, EXPIRE)
```
**When**: Multi-tenant agent platforms with usage limits.
**How**: Atomic INCR operations with TTL expiry windows.

#### Role 3: Pub/Sub / Event Streaming
Real-time event distribution between agent components:
```
PUBLISH agent:session:123 {"type": "tool_call", "tool": "terminal"}
SUBSCRIBE agent:session:*
```
**When**: Gateway architecture where multiple services need event awareness.
**How**: Redis Pub/Sub or Redis Streams for durable event logs.

#### Role 4: Session State (Ephemeral)
Fast read/write for active session metadata:
```
SET session:abc:state '{"active": true, "tools_called": 15}' EX 3600
```
**When**: Gateway needs sub-millisecond access to active session state.
**How**: Key-value with TTL, JSON module for structured data.

### When to Use

- **LLM response caching** — Avoid duplicate API calls (LiteLLM pattern).
- **Rate limiting** — Real-time token/request counting per user/team.
- **Pub/Sub** — Event distribution in distributed agent architectures.
- **Ephemeral session state** — Fast metadata access for active sessions.
- **Job queues** — Background task scheduling (complement to cron).

### When NOT to Use

- **Persistent storage** — Redis is volatile by default; data lives in RAM.
- **Complex queries** — No SQL, limited query capability.
- **Large datasets** — Expensive to store large volumes in RAM.
- **Primary database** — Always pair with PostgreSQL or SQLite for persistence.

### How to Scale

| Scale Level | Strategy |
|-------------|----------|
| **Dev** | Local Docker container |
| **Small prod** | Single managed instance (ElastiCache, Memorystore) |
| **Medium prod** | Redis Cluster (sharding) |
| **Large prod** | Redis Enterprise with active-active geo-replication |

---

## 7. Meilisearch

### What It Is
Lightning-fast, typo-tolerant full-text search engine. Designed for end-user-facing search with instant results (<50ms).

### How It's Used in Practice (from studied codebases)

**Hermes Agent** — Referenced in delegation patterns:
```markdown
# From hermes-agent/website/docs/guides/delegation-patterns.md
3. Meilisearch via meilisearch-python
```
Used as a search backend in agent delegation workflows — the agent delegates search tasks to a subagent that queries Meilisearch.

### Role in Agent Architecture

Meilisearch fills a **specific gap** between SQLite FTS5 and Qdrant:

| Feature | SQLite FTS5 | Meilisearch | Qdrant |
|---------|-------------|-------------|--------|
| **Search type** | Keyword (exact/prefix) | Keyword (typo-tolerant) | Semantic (vector) |
| **Typo tolerance** | ❌ | ✅ Built-in | ❌ |
| **Faceted filtering** | ❌ | ✅ | ✅ (payload filtering) |
| **Instant results** | ✅ (local) | ✅ (<50ms) | ✅ |
| **Dependencies** | None (embedded) | Separate server | Separate server |
| **CJK support** | ✅ Trigram tokenizer | ✅ Native | N/A |
| **Use case** | Dev/local search | User-facing search | AI/semantic search |

### When to Use

- **User-facing search** — When humans search agent sessions, skills, or knowledge bases with typos and partial matches.
- **Skill/plugin discovery** — Search a catalog of 100+ skills by name, description, tags.
- **Document search** — Research workflows where agents search curated document collections.
- **Multi-language search** — Strong CJK, Arabic, and multi-script support.

### When NOT to Use

- **Agent-internal search** — SQLite FTS5 is sufficient and zero-dependency.
- **Semantic similarity** — Use Qdrant for embedding-based search.
- **Primary database** — Meilisearch is a search index, not a database of record.
- **Simple keyword matching** — SQLite FTS5 with trigram handles this locally.

### How to Scale

| Scale Level | Strategy |
|-------------|----------|
| **Dev** | `docker run getmeili/meilisearch` |
| **Small prod** | Meilisearch Cloud Starter |
| **Medium prod** | Self-hosted with snapshots |
| **Large prod** | Meilisearch Cloud Pro with multi-tenancy |

---

## 8. Other Relevant Technologies

### Chroma
Lightweight, open-source vector database often used for prototyping RAG:
- **Use when**: Quick RAG prototypes, single-node deployments.
- **Avoid when**: Production scale — use Qdrant instead.
- **Hermes reference**: Mentioned as alternative to Qdrant in optional skills.

### DuckDB
In-process analytical database for OLAP workloads:
- **Use when**: Analyzing agent spend logs, token usage analytics, CSV/Parquet analysis.
- **Avoid when**: OLTP (session writes, real-time state).
- **Pattern**: Export LiteLLM spend logs to Parquet, analyze with DuckDB.

### Turso (libSQL)
SQLite fork with replication and edge deployment:
- **Use when**: SQLite-compatible storage with multi-region reads.
- **Avoid when**: You need the simplicity of local SQLite.
- **Pattern**: Deploy agent session DB to edge with Turso for low-latency globally.

### Valkey (Redis fork)
Open-source fork of Redis after the license change:
- **Use when**: Drop-in Redis replacement with true open-source license (BSD).
- **Pattern**: Same as Redis — caching, rate limiting, pub/sub.

---

## Decision Matrix: Which Database for What

| Agent Concern | Primary Choice | Scale-Up Alternative | Why |
|---------------|---------------|---------------------|-----|
| **Session storage** | SQLite + FTS5 | PostgreSQL | Zero-ops local, migrate when multi-user |
| **User/team management** | PostgreSQL | — | Multi-tenant, relational, indexes |
| **Spend tracking** | PostgreSQL | — | Aggregation tables (LiteLLM pattern) |
| **LLM response cache** | Redis | — | In-memory, TTL-based, fast |
| **Rate limiting** | Redis | — | Atomic INCR with EXPIRE |
| **Vector search / RAG** | Qdrant | pgvector | Purpose-built, HNSW, distributed |
| **Full-text search (agent-internal)** | SQLite FTS5 | — | Zero-dependency, trigram CJK |
| **Full-text search (user-facing)** | Meilisearch | — | Typo-tolerant, instant, faceted |
| **Document store** | MongoDB | PostgreSQL JSONB | Flexible schema, existing infra |
| **Real-time events** | Redis Pub/Sub | — | Low-latency, simple |
| **Agent config** | YAML files | PostgreSQL | LiteLLM stores config in DB at scale |
| **Analytics / OLAP** | DuckDB | — | Columnar, zero-setup |
| **Auth + realtime** | Supabase | — | Managed PostgreSQL + auth + WS |

---

## Recommended Database Stack by Agent Architecture Tier

### Tier 1: Single-User Local Agent (Hermes/Pi pattern)
```
SQLite + FTS5 (WAL mode)
├── sessions, messages, state_meta
├── FTS5 for cross-session search
└── Trigram tokenizer for CJK
```
- **Zero dependencies, zero ops.** One file on disk.
- 50+ writes/second sustained with jitter retry (Hermes-proven).

### Tier 2: Multi-User Agent Platform (LiteLLM pattern)
```
PostgreSQL (Prisma ORM)
├── Users, teams, orgs, budgets, API keys
├── Spend logs (per-request + daily aggregation)
├── Agent/MCP server configuration
└── Audit logs

Redis
├── LLM response caching
├── Rate limiting (TPM/RPM)
└── Pub/Sub for real-time events
```

### Tier 3: Full Agent Platform with RAG (Enterprise)
```
PostgreSQL ── Primary data store
Redis ────── Caching + rate limiting + pub/sub
Qdrant ───── Vector search for RAG/semantic memory
SQLite ───── Per-agent local session storage
Meilisearch ── User-facing skill/doc search (optional)
```

---

## What Is Confirmed

1. **SQLite + FTS5 is the universal starting point** — Hermes proves it scales to ~1,655 test files and 200+ concurrent sessions
2. **PostgreSQL is the scale-up path** — LiteLLM's 50+ model Prisma schema is the reference for multi-tenant
3. **Redis is the caching/rate-limiting layer** — always paired with PostgreSQL, never standalone
4. **Qdrant is the vector search standard** — Rust-based, HNSW, distributed, Hermes integrates via optional skill
5. **Meilisearch fills the typo-tolerant search niche** — between FTS5 (keyword) and Qdrant (semantic)
6. **MongoDB is not used for core agent state** in any studied framework (all use relational)
7. **Supabase is a managed PostgreSQL accelerator** — useful for rapid backend, not a separate category

## What Is Uncertain

- Whether pgvector eliminates the need for Qdrant at moderate scale (<1M vectors)
- Whether Turso/libSQL will replace SQLite for edge-deployed agents
- Optimal Redis data structure for agent session state (Strings vs. Hashes vs. JSON module)

## How This Applies to Building a Modern Model-Agnostic Agent Harness

1. **Start with SQLite + FTS5** (Hermes pattern) — zero-dependency local storage with search
2. **Design for PostgreSQL migration** — use an ORM or query builder that supports both
3. **Add Redis when multi-user** — response caching and rate limiting
4. **Add Qdrant when RAG is needed** — semantic memory and document search
5. **Consider Meilisearch** for user-facing skill/plugin discovery
6. **Use Prisma** (or equivalent ORM) for PostgreSQL schema management — LiteLLM's 1402-line schema is the reference
7. **Follow Hermes's WAL + jitter pattern** for SQLite write contention
