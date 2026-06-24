# 11 — Heartbeat / Automation Workflows

## What Was Researched

Scheduled, recurring, and event-driven automation patterns in AI agents — cron jobs, background tasks, webhooks, and unattended operation.

## Which Sources Were Used

| Source | Type | URL | Relevance |
|--------|------|-----|-----------|
| Hermes Agent (`hermes-agent/cron/`, `tools/cronjob_tools.py`) | Local codebase | https://github.com/NousResearch/hermes-agent | CRITICAL |
| OpenClaw automation docs | Local codebase | https://github.com/openclaw/openclaw | HIGH |

## Key Findings

### Hermes Cron System

- **`cron/` directory** — `jobs.py` + `scheduler.py` for scheduled task management
- **`tools/cronjob_tools.py`** (47KB) — Agent-accessible cron tool
- **Natural language scheduling** — "Every Monday at 9am, send me a weekly summary"
- **Platform delivery** — Cron results delivered to any connected platform (Telegram, Slack, etc.)
- **Unattended operation** — Runs while user is away
- **Gateway integration** — Cron jobs run through the messaging gateway for platform delivery

### OpenClaw Automation

- **Cron jobs** — Scheduled tasks documented as a core feature
- **Webhooks** — `automation/webhook` endpoint for event-driven triggers
- **Gmail Pub/Sub** — Email-driven automation via Google Pub/Sub
- **Gateway-managed** — All automation runs through the gateway control plane

### Hermes Batch Processing

- **`batch_runner.py`** (59KB) — Parallel batch processing for multiple tasks
- **Trajectory generation** — Automated generation of agent interaction trajectories for training data
- **`trajectory_compressor.py`** (70KB) — Compresses trajectories for model training

### Automation Patterns

| Pattern | Hermes | OpenClaw | Description |
|---------|--------|----------|-------------|
| Cron scheduling | ✅ | ✅ | Time-based recurring tasks |
| Webhook triggers | ❌ | ✅ | Event-driven via HTTP |
| Gmail Pub/Sub | ❌ | ✅ | Email-triggered |
| Batch processing | ✅ | ❌ | Parallel multi-task |
| Trajectory gen | ✅ | ❌ | Training data pipeline |
| Platform delivery | ✅ | ✅ | Results to messaging |

## What Is Confirmed

1. **Cron scheduling is the baseline** — both Hermes and OpenClaw implement it
2. **Platform delivery** is essential — results must reach the user wherever they are
3. **Natural language scheduling** improves UX dramatically
4. **Webhook/event-driven** automation enables integration with external systems
5. **Batch processing** is valuable for research and data-processing workflows

## What Is Uncertain

- Optimal scheduling persistence (database vs. filesystem)
- How to handle cron job failures (retry, alert, or skip)
- Whether to support event-driven triggers beyond webhooks

## How This Applies to Building a Modern Model-Agnostic Agent Harness

1. **Implement cron scheduling** — time-based recurring tasks
2. **Support platform delivery** — route results to any connected channel
3. **Natural language scheduling** — let the agent parse "every Monday at 9am"
4. **Consider webhook support** — enables external system integration
5. **Implement batch processing** — useful for parallel task execution
