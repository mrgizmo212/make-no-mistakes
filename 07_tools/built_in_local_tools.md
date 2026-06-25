# Built-In and Local Tool Systems in Agent Harnesses

In a production-grade agent harness, tool systems form the execution layer that enables model reasoning to translate into concrete actions. While external capability integration is increasingly standardizing on the Model Context Protocol (MCP), a harness must still provide a robust set of core **built-in tools** (also referred to as **local tools**, **native tools**, or **runtime tools**) executed in the agent's host environment or container.

This document researches the architecture, registration patterns, execution models, security controls, and output optimizations of local tool systems in state-of-the-art frameworks, anchored in the implementations found in **Hermes Agent**, **Codex**, and **Pi** as of **June 2026**.

---

## 1. Taxonomic Definitions and Trade-Offs

Production architectures distinguish tool terms depending on their integration footprint, execution context, and safety boundaries:

| Term | Operational Meaning | System Boundary |
| :--- | :--- | :--- |
| **Local Tools** | Tools executed in the same workspace, VM, or container as the agent process. | Host/Container boundary (e.g. read file, local bash). |
| **Built-in / Native Tools** | Tools shipped directly as part of the core harness distribution rather than loaded dynamically. | Harness core codebase. |
| **Runtime Tools** | Context-dependent capabilities exposed by the active environment (e.g. active DB connectors). | Session state/virtualization layer. |
| **External / MCP Tools** | Capabilities discovered and executed via a separate Model Context Protocol server. | Network/IPC socket bridge. |

### The Core-Tool Footprint Ladder
Every built-in tool added to the core harness incurs a **token cost** because its schema, parameters, and behavioral guidelines are appended to the system prompt or tool-choice structure of every LLM API call. To prevent context bloat, modern harnesses enforce a strict priority hierarchy (such as the **Hermes Footprint Ladder** [CLAIM-067](../00_index/citation_map.md#claim-067)) when adding capabilities, choosing the highest rung (least footprint) possible:

1. **Extend Existing Code**: Add parameters to an existing tool rather than creating a new schema.
2. **CLI Command / Skill**: Expose the capability as a shell script or custom `SKILL.md` doc without changing the LLM tool registry.
3. **Service-Gated Tool**: Register the tool conditionally so that it only enters the LLM tool list if its API keys or environment variables are configured.
4. **Plugin**: Expose the tool as a loadable extension that users must explicitly enable.
5. **MCP Server**: Build the capability as an external server, keeping the harness core minimal.
6. **New Core Tool**: Add a native tool to the core package—used only as a last resort for universal primitives.

---

## 2. Tool Registry Patterns

Harnesses implement different registration mechanisms depending on their programming language, modularity requirements, and performance constraints.

### A. Python Auto-Discovery: Hermes Agent
Hermes Agent implements a centralized registry in [tools/registry.py](https://github.com/NousResearch/hermes-agent/tools/registry.py) that allows individual tool modules to self-register.
* **Auto-Discovery**: To avoid circular imports and cold-boot import delays, the registry reads the Abstract Syntax Tree (AST) of modules in the `tools/` directory. It looks for top-level `registry.register(...)` expressions using `ast.parse` and only imports modules containing them [CLAIM-061](../00_index/citation_map.md#claim-061).
* **Registration Interface**: Tools register schemas, handlers, toolset memberships, and environment requirements:
  ```python
  registry.register(
      name="write_file",
      toolset="file",
      schema=WRITE_FILE_SCHEMA,
      handler=write_file_handler,
      check_fn=check_write_requirements,
      requires_env=["WORKSPACE_ROOT"]
  )
  ```
* **Environment Verification**: The `check_fn` probes external state (e.g. Playwright binary, Docker daemon, or credentials). To prevent performance degradation during frequent schema generations, Hermes caches `check_fn` results in a TTL-cached map for **30 seconds** [CLAIM-062](../00_index/citation_map.md#claim-062).
* **Plugin Overrides**: The registry supports an `override=True` flag [CLAIM-063](../00_index/citation_map.md#claim-063). This allows plugins to shadow and replace built-in tools (e.g., swapping the default Playwright browser tool with a headed Chrome CDP backend) in an auditable way.

### B. Rust Trait Contracts: Codex
Codex prioritizes type safety, compile-time validation, and pipeline hooks using a trait-based registry in [codex-rs/core/src/tools/registry.rs](https://github.com/openai/codex/codex-rs/core/src/tools/registry.rs).
* **Interface Contract**: Local tools implement the `CoreToolRuntime` trait [CLAIM-064](../00_index/citation_map.md#claim-064), which extends `ToolExecutor<ToolInvocation>`:
  ```rust
  pub(crate) trait CoreToolRuntime: ToolExecutor<ToolInvocation> {
      fn matches_kind(&self, payload: &ToolPayload) -> bool;
      fn waits_for_runtime_cancellation(&self) -> bool { false }
      fn telemetry_tags<'a>(&'a self, _invocation: &'a ToolInvocation) -> BoxFuture<'a, ToolTelemetryTags>;
      fn pre_tool_use_payload(&self, invocation: &ToolInvocation) -> Option<PreToolUsePayload>;
      fn post_tool_use_payload(&self, invocation: &ToolInvocation, result: &dyn ToolOutput) -> Option<PostToolUsePayload>;
      fn with_updated_hook_input(&self, invocation: ToolInvocation, updated_input: Value) -> Result<ToolInvocation, FunctionCallError>;
      fn create_diff_consumer(&self) -> Option<Box<dyn ToolArgumentDiffConsumer>>;
  }
  ```
* **Dynamic Modifiers**: The trait architecture enables real-time argument diff consumers and input-rewriting hooks.

### C. TypeScript Functional Mappings: Pi
Pi uses a lightweight, direct mapping pattern in [packages/coding-agent/src/core/tools/index.ts](https://github.com/badlogic/pi-mono/packages/coding-agent/src/core/tools/index.ts).
* **Explicit Composition**: Rather than dynamic scanning, Pi explicitly defines and exports tools using functional factory methods (`createTool`, `createToolDefinition`).
* **Tool Partitioning**: Pi categorizes tools into distinct arrays depending on safety modes:
  * `createCodingToolDefinitions`: Returns write-capable tools (`read`, `bash`, `edit`, `write`) [CLAIM-065](../00_index/citation_map.md#claim-065).
  * `createReadOnlyToolDefinitions`: Returns read-only operations (`read`, `grep`, `find`, `ls`) [CLAIM-065](../00_index/citation_map.md#claim-065).

---

## 3. Execution Lifecycle and Hook Systems

A robust local tool system wraps tool execution with hooks that enforce safety policies, log diagnostics, and sanitize data before returning results to the model.

```
       [Model Tool Call]
               │
               ▼
   [pre_tool_use_hooks / Pre-Use] ── (e.g. rewrite arguments or block call)
               │
               ▼
       [Tool execution]
               │
               ▼
  [post_tool_use_hooks / Post-Use] ── (e.g. audit results, add external context)
               │
               ▼
     [Output Sanitization]
               │
               ▼
       [Model Response]
```

### Pre-Use and Post-Use Hooks
Codex integrates hooks directly into its tool execution loop:
* **Pre-Use Hooks**: Allow the system to inspect the arguments of a tool call before execution. Hook handlers can block the execution (e.g., waiting for permission) or rewrite the arguments dynamically [CLAIM-064](../00_index/citation_map.md#claim-064).
* **Post-Use Hooks**: Let the system audit the output, emit telemetry tags, or append additional developer context back into the conversation state.
* **Argument Streaming**: In [codex-rs/core/src/tools/registry.rs](https://github.com/openai/codex/codex-rs/core/src/tools/registry.rs), tools can expose a `ToolArgumentDiffConsumer` [CLAIM-064](../00_index/citation_map.md#claim-064) to parse partial JSON arguments as they stream from the LLM, triggering UI events or pre-fetching resources before the model finishes typing.

### Operations Abstraction
Pi abstracts the execution logic from the tool interface via pluggable operations. For example, [core/tools/bash.ts](https://github.com/badlogic/pi-mono/packages/coding-agent/src/core/tools/bash.ts) defines a `BashOperations` interface [CLAIM-066](../00_index/citation_map.md#claim-066). This allows host-level command execution to be swapped with a custom backend (e.g., executing commands inside a remote container or over an SSH connection) without modifying the main bash tool logic.

---

## 4. Sandboxing, Safety, and Permission Systems

Executing arbitrary code and accessing file systems presents severe security risks. Harnesses implement layered defenses to restrict tool operations.

### A. Environment Virtualization
To protect the host system, the terminal and file tools execute within isolated environments:
* **Local Mode**: Runs directly on the developer's machine—restricted by standard user permissions.
* **Docker/Singularity**: Containers isolate runtime changes, mounting only the targeted workspace directory.
* **Cloud Sandboxes (Daytona/Modal)**: Spawn short-lived remote virtual machines for execution, providing complete isolation from the host network.

### B. Safe Path Resolution and Workspace Containment
In-process file tools must resolve paths relative to the active workspace directory, not the process's main launcher directory. This is critical for git worktrees, where the model works in multiple checkouts concurrently.
* **Sentinel Rejection**: In [tools/file_tools.py](https://github.com/NousResearch/hermes-agent/tools/file_tools.py), Hermes rejects sentinel CWD paths such as `"."`, `"auto"`, or `"cwd"` [CLAIM-068](../00_index/citation_map.md#claim-068). Allowing these paths would let relative paths resolve against the agent process's directory instead of the active worktree root, corrupting files in the wrong checkout.
* **Workspace Warnings**: Hermes runs a `_path_resolution_warning` check at runtime. If a relative path resolves to an absolute path that lies outside the active workspace directory root, it issues a warning to the model [CLAIM-068](../00_index/citation_map.md#claim-068).

### C. Sensitive Path Blocklists
File manipulation tools block direct edits to critical host files to prevent credential leakage or security policy modification:
* **Blocked Prefixes**: Hermes blocks writes targeting `/etc/`, `/boot/`, `/usr/lib/systemd/`, or their macOS `/private/...` symlink equivalents [CLAIM-069](../00_index/citation_map.md#claim-069).
* **Configuration Protection**: Hermes explicitly blocks writes to its own config files (e.g., `~/.hermes/config.yaml` or `.env`) [CLAIM-069](../00_index/citation_map.md#claim-069) to prevent prompt-injected models from disabling execution approvals.

### D. Writing Safeguards and Verification
To prevent models from corrupting source code with tool output artifacts, Hermes sanitizes file writes:
* **Line Number Guard**: If an agent reads a file with line numbers (e.g. ` 1| code`), it might accidentally write that formatted output back. Hermes detects if a write payload consists mostly of line-numbered blocks (lines starting with digits and `|`) and rejects the write [CLAIM-070](../00_index/citation_map.md#claim-070).
* **Status Message Guard**: Hermes rejects writes containing internal status messages (e.g. `"File unchanged since last read..."`) [CLAIM-070](../00_index/citation_map.md#claim-070) to prevent the model from writing system logs directly into source code.

### E. Terminal Validation: Hardline vs. Dangerous Commands
Harnesses categorize shell commands to balance automation with safety:
* **Hardline Blocklist**: High-risk commands (e.g., recursive root deletes `rm -rf /`, formatting `mkfs`, raw device writes `dd of=/dev/sda`, fork bombs, system shutdown) are blocked unconditionally [CLAIM-071](../00_index/citation_map.md#claim-071). They cannot be bypassed, even with `--yolo` flags.
* **Dangerous Patterns**: Destructive operations (e.g., force pushing to git, stopping system services, installing packages, modifying ssh keys) trigger a blocking approval request.
* **Regex Obfuscation Bypasses**: Malicious inputs could use shell backslashes (`r\m`) or quotes (`r''m`) to hide commands. Hermes strips escape sequences, Unicode normalizes character widths (NFKC), and flattens empty literals before scanning commands [CLAIM-072](../00_index/citation_map.md#claim-072).

### F. Privilege Management: Sudo and Background Processes
* **Sudo Rewriting**: Bare `sudo` commands hang TTY-less terminals waiting for password input. Hermes rewrites bare `sudo` commands to `sudo -S -p ''` [CLAIM-073](../00_index/citation_map.md#claim-073), reading the password from standard input. If `SUDO_PASSWORD` is configured in the environment or cached during interactive setup, it is prepended to the command's stdin stream.
* **Background Zombie Prevention**: Compound background commands like `A && B &` wait for `B` to complete if run in a subshell, causing the terminal tool to hang. Hermes rewrites these commands to `A && { B & }` [CLAIM-074](../00_index/citation_map.md#claim-074). This brace-groups the background task, executing B in the background while exiting the parent shell immediately.

### 4.G Sandbox Gotchas and Process Management

Operating containerized or virtualized execution sandboxes introduces several low-level gotchas:

*   **Orphaned Zombie Processes (PID 1 Reaper)**: When the agent spawns background execution processes (e.g., starting a database, a dev server, or a test runner) within a Docker sandbox container, these processes can become orphaned when their immediate parent exits. In standard Linux environments, the system init process (PID 1) reaps these zombie processes. However, inside minimal Docker containers, the agent wrapper or bash command runs as PID 1, which does not handle process reaping. This leaks file descriptors and eventually exhausts the process table, freezing the container.
    *   *Mitigation*: Sandbox containers must be booted with a lightweight init system like **tini** or **catatonit** registered as PID 1 to capture and reap zombie children automatically [CLAIM-099](../00_index/citation_map.md#claim-099).
*   **Terminal Hanging on Stdout/Stderr**: Background tasks that continuously write to stdout or stderr (like `npm run dev`) can fill the OS pipe buffers if the agent harness is not actively consuming them, causing the background process to block and freeze.
    *   *Mitigation*: The terminal tool executor should redirect stdout and stderr of background jobs to local logs (`A > /tmp/A.log 2>&1 &`) and provide separate commands (`TaskOutput`) to tail or read these files on demand.
*   **Relative Path Sentinel Misrouting**: If path resolution is evaluated relative to the active process's current working directory (CWD) without anchoring, launching the agent from a parent directory will cause relative file writes (e.g. `./src/index.js`) to resolve inside the launcher directory, corrupting files outside the project workspace.
    *   *Mitigation*: The file tool executor must resolve all path arguments against a strictly defined absolute project root variable (`WORKSPACE_ROOT`), rejecting sentinels like `.` or `"cwd"` to prevent escape [CLAIM-068](../00_index/citation_map.md#claim-068).


---

## 5. Output Management and Token Budgeting

Large terminal logs or directory listings can easily exhaust context windows and inflate API costs. Tool systems enforce output caps and page data dynamically.

### Truncation and Backup Storage
Harnesses limit tool response sizes using configurable boundaries:
* **Default Limits**: Hermes sets a default maximum tool response size of **50KB** (or characters) for terminal output and **2000 lines** for file pagination [CLAIM-067](../00_index/citation_map.md#claim-067).
* **Temp-File Backups**: Pi streams execution output through an `OutputAccumulator` [CLAIM-075](../00_index/citation_map.md#claim-075). If the output exceeds these limits, Pi truncates the response, returns the last few lines to the model, and writes the complete log to a temporary file, providing the model with the path to the full file.

### Preventing Reread Loops
In-context models sometimes get stuck in loops where they repeatedly read the same file or re-search the same directory.
* **De-duplication Cache**: Hermes tracks consecutive read parameters (`path`, `offset`, `limit`) per session. If the target file has not been modified on disk, Hermes returns a compact status message:
  `"File unchanged since last read. The content from the earlier read_file result in this conversation is still current..."` [CLAIM-070](../00_index/citation_map.md#claim-070)
  This prevents redundant token expenditure and forces the model to proceed.

---

## 6. Taxonomic Mapping of 46 Core Tool Capabilities

Using the user's provided taxonomy of **46 local tools**, the table below maps each capability to its structural system domain and details how it is implemented within the reference codebases:

| Core Tool Capability | System Domain | Implementation & Source References |
| :--- | :--- | :--- |
| `Agent` | **Delegation** | Spawns a child agent with isolated context, a fresh conversation, and its own task ID. Blocks parent-interactive tools (`clarify`, `memory`, `send_message`) [CLAIM-076](../00_index/citation_map.md#claim-076). Implemented in [tools/delegate_tool.py](https://github.com/NousResearch/hermes-agent/tools/delegate_tool.py). |
| `SendMessage` | **Delegation** | Sends notifications across messaging platforms or agent threads. Restricted in subagents to prevent side effects [CLAIM-076](../00_index/citation_map.md#claim-076). Implemented in [tools/send_message_tool.py](https://github.com/NousResearch/hermes-agent/tools/send_message_tool.py). |
| `TeamCreate` | **Delegation** | Creates or revives a swarm team of collaborating subagents. Managed via the process registry. |
| `TeamDelete` | **Delegation** | Disbands a subagent swarm team and cleans up child container processes. |
| `TeamGet` | **Delegation** | Inspects active statuses and execution paths for one swarm team. |
| `TeamList` | **Delegation** | Lists active and idle swarm teams in the session process registry. |
| `Read` | **File System** | Reads file contents. Pi implements this in `read.ts` [CLAIM-065](../00_index/citation_map.md#claim-065) with line-based truncation. Hermes uses [tools/file_tools.py](https://github.com/NousResearch/hermes-agent/tools/file_tools.py) with character caps [CLAIM-068](../00_index/citation_map.md#claim-068) and de-duplication. |
| `Bash` | **Terminal** | Executes shell commands in a bash shell. Pi implements local execution in `bash.ts` [CLAIM-066](../00_index/citation_map.md#claim-066); Codex implements it in `shell.rs` [CLAIM-075](../00_index/citation_map.md#claim-075); Hermes uses [tools/terminal_tool.py](https://github.com/NousResearch/hermes-agent/tools/terminal_tool.py). |
| `PowerShell` | **Terminal** | Windows-specific execution fallback. Integrated within the terminal executors when running on Windows hosts. |
| `TaskOutput` | **Terminal** | Reads stdout/stderr streams from active background processes. Handled via the process registry. |
| `TaskStop` | **Terminal** | Terminates background jobs using process trees (`killProcessTree` in Pi [CLAIM-066](../00_index/citation_map.md#claim-066)). |
| `TaskCreate` | **Task State** | Creates a persisted todo item. Corresponds to `agent_jobs.rs` in Codex and `todo_tool.py` in Hermes. |
| `TaskGet` | **Task State** | Returns execution status and metadata for a specific task. |
| `TaskList` | **Task State** | Lists all tasks recorded in the active workspace database. |
| `TaskUpdate` | **Task State** | Modifies statuses, owners, blockers, or metadata for a task. |
| `Glob` | **File System** | Lists directory files matching a pattern. Pi implements this in `ls.ts`/`find.ts` [CLAIM-065](../00_index/citation_map.md#claim-065); Hermes uses `search_files` in `file_tools.py`. |
| `Grep` | **File System** | Searches files using regular expressions. Pi uses `grep.ts` [CLAIM-065](../00_index/citation_map.md#claim-065); Hermes implements FTS5 searches in `file_tools.py`. |
| `Edit` | **File System** | Modifies files via line replacement or diff patching. Pi uses `edit.ts` [CLAIM-065](../00_index/citation_map.md#claim-065); Codex uses `apply_patch.rs` [CLAIM-075](../00_index/citation_map.md#claim-075); Hermes uses `patch` in `file_tools.py`. |
| `Write` | **File System** | Writes content to a file. Pi implements this in `write.ts` [CLAIM-065](../00_index/citation_map.md#claim-065); Hermes implements this in `file_tools.py` with line number checks [CLAIM-070](../00_index/citation_map.md#claim-070). |
| `WebFetch` | **Web Web Fetch** | Fetches page content and converts HTML to clean Markdown. Implemented in [tools/web_tools.py](https://github.com/NousResearch/hermes-agent/tools/web_tools.py) via `web_extract`. |
| `WebSearch` | **Web Web Fetch** | Performs web searches via search engine endpoints. Implemented in `web_tools.py` via `web_search`. |
| `TodoWrite` | **Task State** | Manages session-level task checklists. In Hermes, this is implemented in [tools/todo_tool.py](https://github.com/NousResearch/hermes-agent/tools/todo_tool.py) [CLAIM-079](../00_index/citation_map.md#claim-079). |
| `EnterPlanMode` | **Harness State** | Switches the agent to planning mode, displaying developer-instructions. Mapped to Codex's `plan.rs`. |
| `ExitPlanMode` | **Harness State** | Exits planning mode, resuming task execution. Mapped to Codex's `plan.rs`. |
| `EnterWorktree` | **Harness State** | Creates a temporary git worktree checkout for code modifications, mapping it to a separate task ID. |
| `ExitWorktree` | **Harness State** | Deletes the git worktree and restores the primary branch checkout. |
| `CronCreate` | **System Schedule**| Schedules recurring tasks. Implemented in [tools/cronjob_tools.py](https://github.com/NousResearch/hermes-agent/tools/cronjob_tools.py) with injection scanning [CLAIM-078](../00_index/citation_map.md#claim-078). |
| `CronDelete` | **System Schedule**| Removes scheduled cron jobs from the database. |
| `CronList` | **System Schedule**| Lists scheduled cron jobs. |
| `CronTemplateList`| **System Schedule**| Returns templates for common scheduled tasks (e.g. PR review, codebase indexing). |
| `CronTemplateDescribe`| **System Schedule**| Describes schemas and arguments for a cron template. |
| `NotebookEdit` | **File System** | Specialized tool for modifying cells within Jupyter notebook files. |
| `Skill` | **Skills** | Loads instruction prompt sets. In Hermes, [tools/skills_tool.py](https://github.com/NousResearch/hermes-agent/tools/skills_tool.py) implements progressive disclosure of skills [CLAIM-080](../00_index/citation_map.md#claim-080). |
| `AskUserQuestion`| **Interactions** | Prompts the user with structured multiple-choice questions. Mapped to `clarify_tool.py` in Hermes and `request_user_input.rs` in Codex. |
| `ToolSearch` | **Harness State** | Searches for registered tools by name or keyword. Implemented in `tool_search.py` in Hermes and `tool_search.rs` in Codex. |
| `StructuredOutput`| **Format Guard** | Enforces schemas on final LLM outputs. Mapped to [tools/schema_sanitizer.py](https://github.com/NousResearch/hermes-agent/tools/schema_sanitizer.py). |
| `ListMcpResourcesTool`| **MCP Bridge** | Queries resources exposed by connected Model Context Protocol servers. Mapped to Codex's `mcp_resource.rs` [CLAIM-075](../00_index/citation_map.md#claim-075). |
| `ReadMcpResourceTool`| **MCP Bridge** | Reads contents of a specific MCP resource. Mapped to Codex's `mcp_resource.rs` [CLAIM-075](../00_index/citation_map.md#claim-075). |
| `SessionSearch` | **Recall** | Searches past session transcripts using FTS5 databases [CLAIM-075](../00_index/citation_map.md#claim-075). Implemented in [tools/session_search_tool.py](https://github.com/NousResearch/hermes-agent/tools/session_search_tool.py). |
| `SessionRead` | **Recall** | Loads full session transcripts. Implemented in `session_search_tool.py`. |
| `AppList` | **Harness State** | Lists all available app workspaces and project paths. |
| `AppGet` | **Harness State** | Returns workspace directories and environment overrides for a project. |
| `AppCreate` | **Harness State** | Registers a new workspace workspace directory in the harness database. |
| `AppSetCurrent` | **Harness State** | Sets the default workspace anchor for relative file resolutions. |
| `AppArchive` | **Harness State** | Archives a project, hiding it from default lists. |
| `AppDelete` | **Harness State** | Deletes project configurations from the database. |

---

## 7. Conclusions for Harness Design

A modern, model-agnostic agent harness must balance tool richness with system safety and token budgets:
1. **Prefer Registries with Availability Checks**: Auto-discover tools at import time, but gate execution behind TTL-cached availability checks (`check_fn` in Hermes [CLAIM-061](../00_index/citation_map.md#claim-061)) to prevent executing slow environment checks on every turn.
2. **Abstract Environments**: Decouple tool logic from execution backends (e.g. Pi's `BashOperations` [CLAIM-066](../00_index/citation_map.md#claim-066)) to make sandboxing (Docker/Modal/Singularity) pluggable.
3. **Budget Context Heavily**: Truncate large tool outputs, page files dynamically, and cache consecutive reads to block model reread loops [CLAIM-070](../00_index/citation_map.md#claim-070).
4. **Implement Obstruction-Resistant Security**: Normalize shell commands (ANSI strip, NFKC, quotes/escapes flattening [CLAIM-072](../00_index/citation_map.md#claim-072)) before matching against Hardline blocklists to prevent injection bypasses.
