# Open Questions

> Tracks unresolved questions, uncertainties, and items requiring follow-up or user input.

## Format

```
[Q-XXX] <question>
  Status: OPEN | RESOLVED | DEFERRED
  Context: <where this came up>
  Resolution: <answer, if resolved>
```

---

## Questions

### Scope & Priority

[Q-001] What is the target deployment environment for the agent harness (local-first, cloud, hybrid)?
  Status: OPEN
  Context: Impacts architecture decisions across all research areas
  Resolution: Research recommends a hybrid approach — local-first (SQLite) with cloud scaling path (PostgreSQL + Redis). See `18_architecture_recommendations/README.md`.

[Q-002] What is the priority ordering of research topics? Should all 19 areas be researched in parallel or sequentially?
  Status: RESOLVED
  Context: Project initialization
  Resolution: All 19 areas were researched comprehensively. Sequential deep-dives proved most effective for cross-referencing.

[Q-003] What LLM providers must be supported for "model-agnostic" to be satisfied (OpenAI, Anthropic, Google, local/Ollama, etc.)?
  Status: RESOLVED
  Context: Impacts `13_model_agnostic_harness_architecture`
  Resolution: 25 models across 11 providers profiled. LiteLLM's BaseConfig pattern supports 100+ providers. See `13_model_agnostic_harness_architecture/model_landscape_june_2026.md`.

[Q-004] Is there a preferred programming language/runtime for the harness backend (Python, TypeScript/Node, Rust, etc.)?
  Status: OPEN
  Context: Impacts `14_backend_agent_stack_engineering`
  Resolution: Research recommends Python for agent core + TypeScript for gateway/frontend. See `18_architecture_recommendations/README.md`.

[Q-005] What is the intended end-user profile — developers building agents, or end-users interacting with agents?
  Status: OPEN
  Context: Impacts `15_frontend_react_vite_agent_stack`

---
