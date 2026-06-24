# Human-in-the-Loop (HITL) & Conversation Steering

## 1. Introduction & Taxonomy

Human-in-the-Loop (HITL) is the capability of an agent system to pause autonomous execution, surface state or requests to a human controller, accept external adjustments, and safely resume. 

In model-agnostic agent harnesses, HITL is categorized into four distinct operations:
1. **Conversation Steering (Mid-Turn Inputs)**: Injecting state updates or user directions into the agent's context window without resetting the execution history.
2. **Clean Cancellation & Interrupts**: Terminating or pausing execution immediately, safely aborting pending LLM calls and background worker tasks without inducing memory leaks or thread starvation.
3. **Interactive Governance Gates (Approvals)**: Pausing execution on high-risk boundaries (e.g., executing dangerous commands, writing files, or spending tokens) and waiting for explicit user permission.
4. **Bypass Policies & Configs**: Decoupling the approval behavior into session-level and global security postures (e.g., YOLO vs. Ask modes, credential gating, subagent default auto-denial).

---

## 2. Conversation Steering & State Updates

Steering allows developers and users to direct an agent mid-flight. There are two primary architectural patterns for steering:

### Graph State Patching (LangGraph)
LangGraph manages state via checkpoints in state channels. Conversation steering is achieved by injecting a Pydantic `Command` containing a state update [CLAIM-189].
When a node executes the `interrupt()` function [CLAIM-091]:
1. The execution raises a `GraphInterrupt` exception and bubbles up to the Pregel runner.
2. The current thread state is serialized and persisted in a Checkpointer (e.g., `InMemorySaver`).
3. To resume, the client sends a `Command(resume="value")`.
4. The graph re-enters the node, re-executes its code, and matches the incoming `Command.resume` values to the `interrupt()` call by invocation index (tracked via `scratchpad.interrupt_counter()`) [CLAIM-189].

```python
# langgraph/libs/langgraph/langgraph/types.py lines 810-850
def interrupt(value: Any) -> Any:
    # Conf contains CONFIG_KEY_SCRATCHPAD tracking the turn counter
    conf = get_config()["configurable"]
    scratchpad = conf[CONFIG_KEY_SCRATCHPAD]
    idx = scratchpad.interrupt_counter()
    
    if scratchpad.resume:
        if idx < len(scratchpad.resume):
            # Return the cached resume value on node re-execution
            conf[CONFIG_KEY_SEND]([(RESUME, scratchpad.resume)])
            return scratchpad.resume[idx]
    
    v = scratchpad.get_null_resume(True)
    if v is not None:
        scratchpad.resume.append(v)
        conf[CONFIG_KEY_SEND]([(RESUME, scratchpad.resume)])
        return v
        
    # On first execution, raise GraphInterrupt to stop the Pregel loop
    raise GraphInterrupt((Interrupt.from_ns(value=value, ns=conf[CONFIG_KEY_CHECKPOINT_NS]),))
```

### Context Message Steering (Hermes)
In a linear while-loop (e.g., Nous Hermes `run_conversation()`), steering is implemented by appending user messages mid-turn:
1. Between tool executions, the loop polls the user input queue.
2. If a user steers the agent (e.g., "stop searching and focus on X"), the loop inserts a `HumanMessage` immediately after the last `ToolMessage`.
3. The prompt builder checks strict role alternation constraints, combining consecutive user turns or adjusting system metadata to prevent API errors.

---

## 3. Clean Cancellation & The Cascading Retry Hang

Interrupting an active LLM generation is notoriously bug-prone. If the connection is closed abruptly without correct exception categorization, loops can hang indefinitely.

### The Cascading Hang Vulnerability (PR #6600)
In Nous Hermes [SRC-002], Christian Vastveit (@kristianvast) resolved a critical cascading hang (PR #6600) [CLAIM-191]:
*   **The Bug**: When a user cancels a run, the poll loop force-closes the HTTP connection (`httpx.Client`). This raises a transport-level error (like `RemoteProtocolError`) on the generation worker thread.
*   **The Failure Cascade**: The connection retry engine (using `tenacity` or custom wrappers) misclassified `RemoteProtocolError` as a transient network dropped connection and attempted to retry up to 5 times, stalling for the full 300-second stream-stale timeout.
*   **The Fix**: A request-local `_request_cancelled` cancellation token.

```python
# chat_completion_helpers.py - Simplified cascading interrupt fix (PR #6600)
def interruptible_api_call(agent, api_params):
    # Establish request-local token
    request_cancelled = False
    
    try:
        # Long-polling call to provider API
        response = agent.client.chat.completions.create(**api_params)
        return response
    except httpx.RemoteProtocolError as exc:
        # Check if the agent flag was explicitly flipped to True by the controller
        if agent._interrupt_requested:
            # Reclassify as clean cancellation instead of transient failure
            raise InterruptedError("Generation cancelled by user.")
        raise exc # Otherwise, propagate real network drop
```

### Best Practices for Cancellation Loops
1.  **Check flags at loop boundaries**: Verify `agent._interrupt_requested` before every API call and tool execution node [CLAIM-190].
2.  **Thread safety**: Run generation and execution loops on separate threads or async tasks from the API request receiver.
3.  **Signal Propagation**: Cascading cancels down to nested processes (e.g., terminating active child terminal sessions spawned by a bash tool using process group signals like `os.killpg(os.getpgid(p.pid), signal.SIGINT)`).

---

## 4. Interactive Governance Gates (Tool Approvals)

Governance gates force the agent to yield control back to the user before executing actions with significant real-world impact.

```
                  [Tool Execution Proposed]
                             │
                  Is Tool Dangerous? (e.g. bash, write_file)
                   /                   \
                 Yes                    No ────> [Execute Immediately]
                 /
          Is Bypass Active?
           /             \
         Yes              No
         /                 \
[Auto-Execute]     [Halt Loop & Cache State]
                            │
                 [Publish Approval Request] (SSE, WS, or APNS Push)
                            │
                 [Wait for User Interaction] (Approve / Deny / Edit)
                            │
                      [Resume Loop]
```

### Notification & Callback Bridges
*   **Apple Push Notifications (APNS) (OpenClaw)**: OpenClaw [SRC-001] maps tool executions directly to mobile push notifications (`exec-approval-ios-push.ts`) [CLAIM-192]. When an agent attempts a terminal call, the runner stalls, publishes a push token transaction, and awaits a web socket resolution payload signed by the developer's mobile device [CLAIM-192].
*   **Web Sandbox Dialogs (assistant-ui)**: The assistant-ui library [SRC-006] provides React components (e.g., `ToolApproval`) that render dynamic confirmation panels [CLAIM-192]. The loops yield state over Server-Sent Events (SSE), streaming a `tool_call_pending` event and waiting for a client response before calling the execution backend.

---

## 5. Bypass Policies & Safety Gates

A practical agent harness cannot require human prompts for every single action. Modern agent suites implement layered security gates.

### Auto-Approval Policies (Hermes)
In `acp_adapter/edit_approval.py`, Hermes defines three distinct policies [CLAIM-194]:
1.  `AUTO_APPROVE_ASK` ("ask"): Never auto-approve. Prompt the user for every edit.
2.  `AUTO_APPROVE_WORKSPACE` ("workspace_session"): Automatically approve file operations if they occur within the workspace tree and do not target sensitive folders.
3.  `AUTO_APPROVE_SESSION` ("session"): Allow all edits within the current active thread lifecycle.

### Sensitive File Exclusions (Allowlists & Blocklists)
Regardless of auto-approve settings, certain paths must be hard-gated. In Hermes, the `edit_approval.py` script enforces a strict blocklist [CLAIM-195]:
```python
# acp_adapter/edit_approval.py lines 44-45
SENSITIVE_AUTO_APPROVE_NAMES = {
    ".env", 
    ".env.local", 
    ".env.production", 
    "id_rsa", 
    "id_ed25519", 
    ".git/config"
}

def should_auto_approve_edit(proposal: EditProposal, policy: str) -> bool:
    # Path sensitivity check
    filename = Path(proposal.filepath).name.lower()
    if filename in SENSITIVE_AUTO_APPROVE_NAMES:
        return False  # Force interactive confirmation
        
    if policy == "session":
        return True
    return False
```

### Delegation Safety & Subagent Gating
When orchestrating multi-agent hierarchical swarms, top-level agents delegate work to nested child agents. 
*   **Subagent Auto-Deny**: In Hermes `tools/delegate_tool.py` [CLAIM-196], if a subagent triggers a dangerous prompt (such as executing shell commands or database deletes) but is executing headlessly (e.g., inside a cron job/webhook worker loop), the loop defaults to auto-denying the action to prevent runaway loops [CLAIM-196].
*   **Auto-Approve Opt-In**: The policy is configurable via `delegation.subagent_auto_approve: true` [CLAIM-196] to allow fully autonomous swarms under controlled sandboxes.

---

## 6. Comparison Table: HITL Implementations

| Metric / Mechanism | LangGraph `[SRC-004]` | Nous Hermes `[SRC-002]` | OpenClaw `[SRC-001]` | assistant-ui `[SRC-006]` |
| :--- | :--- | :--- | :--- | :--- |
| **Interrupt State Mechanism** | Exception-based `GraphInterrupt` | Loop-level flag `_interrupt_requested` | Connection-level socket lock | SSE State-machine yield |
| **User Input Steering** | State channel patching (`Command`) | Inter-turn user message insertion | WebSocket thread injection | Client-side tap handler |
| **Approval Channel** | REST API (`/runs/{id}/resume`) | Interactive CLI / HTTP API | APNS lock-screen push notifications | Dynamic React UI primitives |
| **Bypass Rules** | None (manual graph design) | Configurable policies (`ask`/`session`) | Workspace boundaries validation | Configurable client callbacks |
| **Sensitive Exclusions** | None | File path name blocks (`.env`, keys) | None | Component schema allowlists |
| **Cascading Hang Protection** | Native pregel checkpoints | Request-local token check (PR #6600) | Thread abort pool | Client abort controllers |
