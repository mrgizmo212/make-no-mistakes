# Open-Source Sandbox Environments, Code Interpreters, and Browser Bridges

This document details the mechanics, design principles, and implementation patterns of fully open-source code execution sandboxes, interactive code interpreters, and browser control bridges. It covers both high-level integrations in existing codebases (like Nous Hermes and E2B) and the low-level system primitives required to construct these environments from scratch.

---

## 1. Open-Source Sandbox Environments

When executing untrusted agent-generated code or running browser drivers, isolation is critical to protect the host system. The following open-source container and virtualization systems form the baseline for modern agent harnesses:

### A. Docker & Podman (Container Isolation)
Docker and Podman are the most accessible container runtimes. Podman provides a daemonless, rootless alternative that enhances security by running containers without root privileges on the host.
*   **Hermes Reference ([docker.py](https://github.com/NousResearch/hermes-agent/tools/environments/docker.py)):** 
    Hermes implements a robust Docker execution environment wrapper that mounts specific workspace folders, maps user IDs, and executes scripts. 
    *   **Zombie Process Reaping (PID 1):** Inside containers, running raw subprocesses can create zombie children. Hermes runs `tini` or `catatonit` as PID 1 (`--init` mode or explicit entrypoints) to catch and reap zombie processes promptly.
    *   **Orphan Container Reaper:** To prevent resource leaks when agent sessions crash or are terminated abruptly, Hermes runs an asynchronous sweep (`reap_orphan_containers`) that searches for exited containers labeled with `hermes-agent=1` that finished execution more than a threshold time ago and prunes them from host memory.

### B. Daytona (Development Environment Manager)
Daytona is an open-source (Apache 2.0) development environment orchestrator that automates container workspace provisioning.
*   **Hermes Reference ([daytona.py](https://github.com/NousResearch/hermes-agent/tools/environments/daytona.py)):**
    Hermes uses Daytona's SDK to manage persistent sandboxes. When a session ends, the container is stopped (`sandbox.stop()`) to preserve state, and then resumed (`sandbox.start()`) on the next turn.
    *   **FileSync Handshake Optimization:** Syncing files between host and remote workspaces can be slow. Hermes utilizes Daytona's bulk upload endpoint (`sandbox.fs.upload_files()`) which packages all changed files into a single HTTP multipart POST. This bypasses the TCP/TLS handshake overhead of individual file requests, reducing sync time for ~580 files from 5 minutes to less than 2 seconds.

### C. AWS Firecracker (MicroVMs)
Firecracker is an open-source (Apache 2.0) minimalist hypervisor written in Rust, built on top of KVM (Kernel-based Virtual Machine).
*   **How it Works:** Unlike containers that share the host kernel, Firecracker boots a dedicated guest Linux kernel (`vmlinux`) and runs processes inside a secure virtual machine.
*   **Relevance to Agents (e.g. E2B):** E2B uses Firecracker microVMs to run agent sandboxes. Firecracker VMs boot in under 5 milliseconds and consume only ~5MB of memory, making it practical to scale thousands of ephemeral, fully-isolated VM environments per host.

### D. gVisor (Userspace Kernel Virtualization)
gVisor is an open-source (Apache 2.0) container sandbox runtime developed by Google.
*   **How it Works:** It intercepts all system calls made by containerized processes and handles them in a user-space kernel (called the "Sentry") written in Go.
*   **Why it's Used:** It prevents container escape vulnerabilities by completely decoupling the guest application from direct host kernel calls, without the memory overhead of a traditional hypervisor VM.

### E. Singularity / Apptainer (HPC Sandboxing)
Apptainer (formerly Singularity) is an open-source container system designed for high-performance computing (HPC) environments.
*   **Hermes Reference ([singularity.py](https://github.com/NousResearch/hermes-agent/tools/environments/singularity.py)):**
    Hermes includes a Singularity provider to run scripts inside HPC environments where Docker is banned due to security policies regarding host daemon access.

---

## 2. Building Sandboxes and MicroVMs from Scratch

When building a model-agnostic agent harness, third-party sandboxing platforms may not be viable due to licensing, air-gapped environments, or performance constraints. Here are the low-level primitives required to construct sandboxes and microVMs from scratch:

### A. Creating a Container Sandbox from Scratch (Linux Primitives)

A lightweight container sandbox can be built on any modern Linux kernel by orchestrating five core primitives:

```
┌────────────────────────────────────────────────────────┐
│               Host Operating System                    │
│  ┌──────────────────────────────────────────────────┐  │
│  │               UNSHARE NAMESPACES                 │  │
│  │   [MNT]   [PID]   [NET]   [USER]   [IPC]   [UTS]  │  │
│  │  ┌────────────────────────────────────────────┐  │  │
│  │  │                 cgroups v2                 │  │  │
│  │  │       [Max CPU]  [Max Memory]  [Max PIDs]  │  │  │
│  │  │  ┌──────────────────────────────────────┐  │  │  │
│  │  │  │         chroot / pivot_root          │  │  │  │
│  │  │  │  ┌────────────────────────────────┐  │  │  │  │
│  │  │  │  │         seccomp-bpf            │  │  │  │  │
│  │  │  │  │  (Restricts dangerous syscalls)│  │  │  │  │
│  │  │  │  │  ┌──────────────────────────┐  │  │  │  │  │
│  │  │  │  │  │      Agent Process       │  │  │  │  │  │
│  │  │  │  │  └──────────────────────────┘  │  │  │  │  │
│  │  │  │  └────────────────────────────────┘  │  │  │  │
│  │  │  └──────────────────────────────────────┘  │  │  │
│  │  └────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────┘
```

1.  **Linux Namespaces (`CLONE_` flags via `unshare` or `clone` Syscalls):**
    Provide kernel-level virtualization of system resources:
    *   `CLONE_NEWNS` (Mount): Gives the process a private file system mount tree.
    *   `CLONE_NEWPID` (Process ID): Hides all host processes; the sandboxed process becomes PID 1.
    *   `CLONE_NEWNET` (Network): Unbinds host network interfaces. To block internet access, do not bind a virtual ethernet pair (`veth`).
    *   `CLONE_NEWUSER` (User): Maps the user ID of the process (e.g. mapping host UID `1000` to UID `0` root inside the namespace), preventing host privilege escalation.
    *   `CLONE_NEWIPC` (Inter-process Communication): Prevents shared memory access with the host.
    *   `CLONE_NEWUTS` (Hostname): Allows setting an isolated hostname for the container.
2.  **Control Groups (`cgroups v2`):**
    Enforces resource quotas on the process group by writing parameters into `/sys/fs/cgroup/`:
    *   `memory.max`: Set memory limits (e.g., `256M`).
    *   `pids.max`: Set process limits (e.g., `50` processes) to prevent fork bombs.
    *   `cpu.max`: Set CPU scheduling slice quotas (e.g., cap utilization to `1` core).
3.  **`chroot` or `pivot_root`:**
    Changes the root directory of the calling process to a minimal rootfs folder (e.g., an unpacked Alpine Linux rootfs). `pivot_root` is preferred as it moves the old root mount out of the namespace entirely, preventing directory escape exploits.
4.  **`seccomp-bpf` Filters:**
    Restricts the Linux syscall table. Code interpreters should disallow dangerous syscalls:
    *   Block `reboot`, `sys_ptrace` (process sniffing), `mount`, and `kexec_load`.
5.  **Linux Capabilities (via `capsh`):**
    Strip execution privileges. Even if running as UID 0 (root) in a user namespace, capabilities like `CAP_SYS_ADMIN`, `CAP_NET_ADMIN`, `CAP_SYS_MODULE`, and `CAP_SYS_RAWIO` must be explicitly dropped to make root harmless.

### B. Creating a MicroVM Sandbox from Scratch (Firecracker & KVM)

To deploy microVMs programmatically without relying on cloud services:

1.  **Host KVM Support:** Ensure `/dev/kvm` exists and is read-write accessible by the host process.
2.  **Compile a Minimal Kernel (`vmlinux`):** Compile a custom, monolithic Linux kernel with unnecessary drivers (USB, sound, graphical display) disabled. Enable KVM guest support, serial console logging (`CONFIG_SERIAL_8250`), and virtio device drivers (`CONFIG_VIRTIO_BLOCK`, `CONFIG_VIRTIO_NET`). This reduces kernel image sizes to <5MB and ensures sub-10ms boot times.
3.  **Build a rootfs Ext4 Image:**
    Create a raw image file, format it as `ext4`, mount it locally, and bootstrap a minimal distribution (e.g., using `debootstrap` for Debian or Alpine's `apk` static tools). Install Python, Node.js, and any required execution utilities. Configure `/sbin/init` to launch a custom socket listener on start. Unmount the image.
4.  **Configure and Run Firecracker:**
    Start the Firecracker hypervisor pointing to a Unix socket:
    ```bash
    firecracker --api-sock /tmp/firecracker.socket
    ```
5.  **Control via JSON API:**
    Issue REST commands to the Unix socket (e.g., using `curl --unix-socket`) to configure KVM boots:
    *   Set boot source (path to kernel and console args: `console=ttyS0 reboot=k panic=1 pci=off`).
    *   Attach the block device (path to the `rootfs.ext4` image).
    *   Set resources (VCPUs and memory limits).
    *   Start the instance: `{"action_type": "InstanceStart"}`.
6.  **Socket Bridging:** Communicate with the microVM via virtio-vsock (a fast, socket-based channel crossing the VM boundary) to send code files and retrieve standard outputs.

---

## 3. Code Interpreters (Fully Open Source)

A code interpreter is the execution harness wrapping a runtime (like Python, Bash, or Node). Here are the primary open-source models:

### A. Open Interpreter (CLI execution)
Open Interpreter is an open-source (MIT) CLI tool that gives models code execution capabilities.
*   **Mechanics:** It dynamically writes LLM-generated code blocks into local scripts, executes them in a sub-process shell (Bash, Python, JS, R), streams output/errors back to the model, and updates local state.
*   **Sandboxing:** Supports a `--docker` flag to build a local container on start and route all generated commands to execute inside that container rather than on the host.

### B. Jupyter / IPython Kernels (WebSocket Stateful Runtimes)
Instead of executing script files (which discard local state, variables, and imports after completion), interactive runtimes utilize Jupyter kernels.
*   **When Used:** For data analysis, data science, and multi-step tasks where the agent needs to import libraries (e.g. `pandas`) or load data frames on turn 1, and write code referencing those variables on turn 5.
*   **Why Used:**
    *   **Stateful Namespaces:** Keeps variables and imports alive in the background process.
    *   **WebSocket Protocol:** Uses the Jupyter Message Protocol (ZeroMQ/WebSockets) to handle control commands (`execute_request`, `interrupt_request`) and output streams (`stdout`, `stderr`, and `display_data` for images, markdown, and charts).

### C. WebAssembly (Wasmtime) & Pyodide (In-Process Sandboxes)
WebAssembly provides native-speed execution without OS-level access.
*   **Wasmtime:** An open-source WebAssembly compiler. If an agent writes Rust, C, or compiled languages, they can be run in a lightweight Wasm virtual machine.
*   **Pyodide:** Python compiled to WebAssembly. Allows running Python scripts directly in a browser environment or in-process Node.js runtime.
*   **Why Used:** It requires zero container setup, has zero host disk footprint, starts in microseconds, and completely blocks host file system or network access at the instruction-compiler level.

---

## 4. AI Browser Control and Chrome Extension Bridges

To allow the AI to interact with web pages (like Manus or Claude Computer Use), two main open-source approaches exist:

### A. browser-use (Playwright-Based Library)
An open-source (MIT) library built in Python that wraps around Playwright to provide LLM-steered web browsing.
*   **How it Works:** It reads page HTML, generates a simplified DOM representation, maps elements to unique numeric tags, feeds this page state to the LLM, and translates agent actions (`click`, `scroll`, `input`) to Playwright execution.

### B. Chrome Extension Bridges (WebSocket CDP Bridge)

While Playwright and Puppeteer are great for testing, headless browser instances are easily flagged by Cloudflare, Akamai, CAPTCHAs, and anti-bot systems. Additionally, they start in fresh profiles with no credentials, requiring the agent to manually log in to every service.

To bypass this, production harnesses use a **Chrome Extension Bridge** that operates inside the user's active, headed browser session:

```
┌───────────────────────────────────────────────────────────┐
│                      User's Browser                       │
│  ┌─────────────────────────────────────────────────────┐  │
│  │                Active Tab (Headed)                  │  │
│  │  - User's Session Cookies, History, and Credentials │  │
│  │  - Realistic Human Fingerprint                      │  │
│  │  ┌───────────────────────────┐                      │  │
│  │  │      Content Script       │                      │  │
│  │  └─────────────┬─────────────┘                      │  │
│  └────────────────┼────────────────────────────────────┘  │
│                   │ (DOM Inject)                          │
│  ┌────────────────┼────────────────────────────────────┐  │
│  │            Chrome Extension Background Script       │  │
│  │  - Intercepts chrome.debugger API                    │  │
│  │  - Manages WebSocket Connection                     │  │
│  └────────────┬────────────────────────────────────────┘  │
└───────────────┼───────────────────────────────────────────┘
                │ (WS Connection: ws://localhost:8080)
┌───────────────▼───────────────────────────────────────────┐
│                     Agent Harness                         │
│  - Starts local WebSocket API server                      │
│  - Formats page actions to JSON commands                 │
│  - Evaluates DOM snapshots and captures screenshots        │
└───────────────────────────────────────────────────────────┘
```

#### Why it is Used:
1.  **Credential Inheritance:** Inherits the user’s logged-in cookies, active tokens, history, and preferences. The agent can immediately interact with the user's accounts (e.g., GitHub, AWS Console, Gmail) without credentials.
2.  **Anti-Bot Bypass:** Since execution occurs in a real headed browser with normal human mouse/keyboard events, it bypasses Cloudflare security and CAPTCHA shields that block standard automation drivers.

#### Mechanics of a Custom Extension Bridge:
1.  **Local WebSocket Server:** The agent harness boots a local WebSocket server (e.g. `ws://localhost:8080`).
2.  **Extension Connection:** A custom Chrome extension is loaded in the browser. Its background service worker connects to `ws://localhost:8080`.
3.  **Command Protocol:** The agent sends JSON commands to the socket:
    ```json
    {
      "command": "click",
      "selector": "#submit-btn",
      "coordinates": { "x": 142, "y": 482 }
    }
    ```
4.  **Content Script Execution:** The extension's content script receives the payload:
    *   It locates the element via query selectors.
    *   It generates synthetic human events (e.g., dispatching `mouseenter`, `mousedown`, `click`, `mouseup`).
    *   If using coordinates, it hooks into the `chrome.debugger` API to dispatch a low-level CDP input event (`Input.dispatchMouseEvent`).
5.  **Page Snapshot Extraction:** The extension returns page state back to the agent:
    *   Gets outerHTML or a minimized JSON representation of the DOM.
    *   Captures screenshots via `chrome.tabs.captureVisibleTab` and returns them as base64 images.

---

## 5. Architectural Recommendations for the Agent Harness

When building the tool execution layer for a model-agnostic harness, sandboxes and browser bridges must follow these architectural guidelines:

### Recommendation 1: Decouple Interface from Execution Backend
*   **Design Pattern:** Define an abstract `CodeSandbox` class with methods like `execute_code(script: str, lang: str)` and `upload_file(src: str, dest: str)`. Implement concrete backends for `Local`, `Docker`, `Daytona`, and `Firecracker`.
*   **Benefit:** This allows switching the agent’s execution environment from local developer testing to secure production hosting with a simple configuration toggle (`sandbox_backend: "firecracker"`), without modifying the tool calling logic.

### Recommendation 2: Maintain Stateful Kernels for Code Execution
*   **Design Pattern:** Avoid executing code via file sub-processes (`python script.py`). Instead, run a persistent IPython kernel within the sandbox container.
*   **Benefit:** This preserves variables, functions, and imports between tool calls, giving the model a fluid, stateful notebook execution experience.

### Recommendation 3: Enforce Idle Cleanup Policies (Reapers)
*   **Design Pattern:** Every sandbox container or VM must be tagged with a unique task ID and creation timestamp. Build an independent, host-level sweeper script (the orphan reaper) that routinely audits running containers, killing any sandbox whose parent agent process has exited or has been idle for more than 15 minutes.
*   **Benefit:** Prevents system resource exhaustion from abandoned docker containers and microVMs.

### Recommendation 4: Use CDP-Capable browser bridges
*   **Design Pattern:** Build the browser tool around the Chrome DevTools Protocol (CDP).
*   **Benefit:** By speaking CDP, the agent's browser tool can connect interchangeably to a headless cloud browser (Browserbase), a locally spawned Chromium instance via Playwright, or a user-headed Chrome browser via a Chrome Extension WebSocket bridge.
