# Codebase Study: assistant-ui (assistant-ui/assistant-ui)

## What Was Researched

Architecture and implementation of assistant-ui — an open-source TypeScript/React component library for building production-grade AI chat experiences. Y Combinator-backed. Used in production by Mastra, LangChain, Athena Intelligence, Browser Use, Stack AI, Helicone, and others. 45-package monorepo with 3,636 total files (verified 2026-06-23).

**Source**: [SRC-019](https://github.com/assistant-ui/assistant-ui) | [Docs](https://www.assistant-ui.com/docs) | [NPM](https://www.npmjs.com/package/@assistant-ui/react)

---

## Key Metrics (Verified 2026-06-23)

| Metric | Value |
|--------|-------|
| Total files | 3,636 |
| Packages | 45 |
| TSX files (packages/) | 605 |
| TS files (packages/) | 1,095 |
| CSS files (packages/) | 5 (minimal — CSS-in-class via Tailwind) |
| Core package | 261 files, 967KB |
| UI components | 102 files, 470KB (36 components) |
| Tap reactive system | 68 files, 257KB |
| Stream package | 74 files, 369KB |
| React distribution | 309 files, 716KB |
| License | MIT (with optional paid cloud) |
| Build | Turbo monorepo + pnpm workspaces |
| Lint | oxlint + oxfmt (not ESLint) |

---

## Architecture Overview

### Layer Stack

```
┌────────────────────────────────────────┐
│        Distribution Packages           │ ← @assistant-ui/react, /react-native, /react-ink
│        (Platform-specific)             │
├────────────────────────────────────────┤
│        @assistant-ui/core              │ ← Shared primitives, types, runtime API
│        (Platform-agnostic)             │
├────────────────────────────────────────┤
│        @assistant-ui/store             │ ← Bridges tap → React (useAui, useAuiState, AuiIf)
├────────────────────────────────────────┤
│        @assistant-ui/tap               │ ← Reactive primitives (resource, createTapRoot)
├────────────────────────────────────────┤
│        assistant-stream                │ ← Normalized streaming protocol
└────────────────────────────────────────┘
```

### Package Categories

**1. Core Architecture (4 packages)**
- `@assistant-ui/tap` — Custom reactive primitive system. Resources, subscriptions, imperative roots
- `@assistant-ui/store` — React bridge layer. `useAuiState()`, `AuiIf`, `useAui()`, `Derived()`
- `@assistant-ui/core` — Shared types, primitives, runtime API, model context, hooks
- `assistant-stream` — Normalized streaming protocol with accumulators and converters

**2. Distribution Packages (3 platforms)**
- `@assistant-ui/react` — Web (re-exports core + Radix primitives)
- `@assistant-ui/react-native` — React Native (93 files, 127KB)
- `@assistant-ui/react-ink` — Terminal/Ink distribution

**3. Backend Adapters (9 packages)**
- `react-ai-sdk` — Vercel AI SDK (31 files, 139KB)
- `react-langgraph` — LangGraph integration (23 files, 229KB)
- `react-langchain` — LangChain integration
- `react-data-stream` — Custom data-stream backends (4 files, 9KB)
- `react-a2a` — Agent-to-Agent protocol (11 files, 110KB)
- `react-ag-ui` — AG-UI protocol (11 files, 105KB)
- `react-google-adk` — Google ADK
- `react-opencode` — OpenCode integration
- `react-pi` — Pi agent integration

**4. UI & Styling (6 packages)**
- `@assistant-ui/ui` — shadcn-style components (36 components, gets copied into user projects)
- `tw-glass` — Glassmorphism Tailwind utilities
- `tw-shimmer` — Shimmer animation Tailwind plugin
- `react-markdown` — Markdown rendering
- `react-streamdown` — Streaming markdown
- `react-syntax-highlighter` — Code highlighting

**5. Specialized Features (7 packages)**
- `react-generative-ui` — LLM-generated UI rendering with component allowlist
- `react-mcp` — MCP integration
- `react-devtools` — Developer tools
- `react-hook-form` — Form integration
- `react-lexical` — Rich text editing
- `react-o11y` — Observability/telemetry
- `safe-content-frame` — Sandboxed content rendering

**6. Infrastructure (6 packages)**
- `cli` — CLI scaffolding tool
- `cloud` / `cloud-ai-sdk` — Assistant Cloud managed services
- `vite` — Vite plugin
- `next` — Next.js integration
- `metro` — React Native Metro bundler support

---

## Reactive System: Tap

The `@assistant-ui/tap` package is a **custom reactive primitive system** inspired by React hooks but operating outside the React render cycle:

```typescript
// Core primitive: resource() wraps a hook-like function
export function resource<R, A extends readonly unknown[]>(
  hook: (...args: A) => R,
): Resource<R, A> {
  return (...args: A): ResourceElement<R, A> => ({ hook, args });
}

// Key exports:
resource()           // Declare reactive resources
withKey()            // Key-based resource identity
createTapRoot()      // Imperative root (non-React)
flushTapSync()       // Synchronous flush for testing
useResource()        // Consume a resource in React
useResources()       // Consume multiple resources
useTapRoot()         // React-side root
useTapHost()         // Host context
```

**Why this exists**: React's `useSyncExternalStore` has limitations for fine-grained reactive state. Tap provides:
- Reactive state updates that bypass React's render cycle
- Resources that compose like hooks but schedule like signals
- Fine-grained subscriptions (only re-render when your selected slice changes)
- Platform-agnostic (works in React, React Native, Ink terminal)

---

## State Management: Store Layer

The `@assistant-ui/store` package bridges Tap with React via `useAuiState()`:

```typescript
// Selector-based state subscription — prevents full-tree re-renders
export const useAuiState = <T>(selector: (state: AssistantState) => T): T => {
  const aui = useAui();
  const proxiedState = getProxiedAssistantState(aui);
  const slice = useSyncExternalStore(
    aui.subscribe,
    () => selector(proxiedState),
    () => selector(proxiedState),
  );
  // Throws if you return the entire state object — forces granular selection
  if (slice === proxiedState) {
    throw new Error("You tried to return the entire AssistantState...");
  }
  return slice;
};
```

**Key pattern**: `useAuiState((s) => s.thread.isRunning)` — fine-grained selector. The state tree is a **proxy** that tracks access patterns.

**Anti-pattern enforcement**: Returning the entire state throws at runtime. This forces components to select specific fields, preventing re-render cascading.

---

## Streaming Protocol: assistant-stream

The normalized streaming protocol defines **12 chunk types**:

| Chunk Type | Purpose |
|-----------|---------|
| `part-start` | Opens a new content part (text, reasoning, tool-call, source, file, data) |
| `part-finish` | Closes the current part |
| `text-delta` | Appends text to text/reasoning/tool-call args |
| `tool-call-args-text-finish` | Marks tool args as complete |
| `result` | Tool call result with artifact and modelContent |
| `step-start` | Starts a model generation step with messageId |
| `step-finish` | Finishes a step with usage stats and finish reason |
| `message-finish` | Final message with usage and finish reason |
| `annotations` | Provider or application annotations |
| `data` | Application data chunks |
| `update-state` | Object-stream operations for state patches |
| `error` | Stream-level error |

**Path-based addressing**: Every chunk carries a `path: readonly number[]` that identifies its position in the message tree. This enables **nested tool calls** and **sub-agent message threading**.

---

## Component System: 36 UI Components

### Core Chat Components
| Component | Size | Description |
|-----------|------|-------------|
| `thread.tsx` | 21KB | Main chat thread — messages, composer, welcome, suggestions |
| `tool-fallback.tsx` | 17KB | Tool call display with approval UI (allow/deny/always) |
| `model-selector.tsx` | 18KB | Model picker dropdown |
| `voice.tsx` | 14KB | WebGL2 voice orb + mute/connect/disconnect controls |
| `diff-viewer.tsx` | 14KB | Code diff viewer |
| `image.tsx` | 12KB | Image display with zoom lightbox, download, copy |
| `number-roll.tsx` | 11KB | Animated odometer-style number display |
| `reasoning.tsx` | 11KB | Collapsible reasoning/thinking display |
| `mermaid-diagram.tsx` | 11KB | Mermaid diagram renderer |
| `context-display.tsx` | 11KB | Context/file display |

### Visualization Components
| Component | Description |
|-----------|-------------|
| `dot-matrix.tsx` | 5×5 animated status indicator (20 states: loading, thinking, streaming, etc.) |
| `flow.tsx` / `flow-canvas.tsx` / `flow-expand.tsx` | Agent workflow visualization |
| `heat-graph.tsx` | Heat map visualization |
| `sources.tsx` | Source citation display |
| `quote.tsx` | Quote/citation rendering |

### Layout & Navigation
| Component | Description |
|-----------|-------------|
| `thread-list.tsx` | Thread list sidebar |
| `threadlist-sidebar.tsx` | Sidebar layout |
| `assistant-modal.tsx` | Modal chat overlay |
| `assistant-sidebar.tsx` | Sidebar chat panel |
| `tabs.tsx` | Tab navigation |
| `accordion.tsx` | Collapsible sections |

---

## Optimistic vs. Pessimistic UI Patterns

### Optimistic Patterns (Found in Codebase)

1. **Optimistic Message Placeholders**: Messages have `metadata.isOptimistic` flag:
   ```typescript
   readonly isOptimistic?: boolean;
   // "Marks a client-side optimistic placeholder. Such messages are evicted
   //  once off the head branch and are never persisted."
   ```

2. **Instant Composer Clear**: The composer clears immediately on send, not after server acknowledgment. `useComposerSend` dispatches and returns immediately.

3. **Optimistic Branch Navigation**: Branch picking updates the UI immediately while the branch loads.

4. **Tool Approval**: The approval buttons disable after click (`submitted` state) rather than waiting for server confirmation — preventing double-submit.

### Pessimistic Patterns (Found in Codebase)

1. **Thread Loading State**: The thread checks `s.threads.isLoading` to determine if the thread list is still loading vs. actually empty.

2. **Stream Completion**: Components wait for `message-finish` chunks before marking messages as complete.

3. **Tool Results**: Tool results only display after the `result` chunk arrives — no optimistic tool completion.

4. **Content Visibility Gating**: `[content-visibility:auto]` CSS property with `[contain-intrinsic-size:auto_24px]` prevents layout shifts during streaming.

---

## Animation & Micro-Interaction Patterns

### 1. Entrance Animations (Every Message)
```tsx
// Assistant messages
className="fade-in slide-in-from-bottom-1 animate-in relative duration-150"

// User messages  
className="fade-in slide-in-from-bottom-1 animate-in ... duration-150"

// Welcome text
className="fade-in slide-in-from-bottom-1 animate-in fill-mode-both text-2xl font-semibold duration-200"
```

### 2. Collapsible Animations (Reasoning, Tools)
```tsx
// Cubic bezier easing for organic feel
"ease-[cubic-bezier(0.32,0.72,0,1)]"

// Open/close with blur transition
"data-[state=open]:animate-collapsible-down"
"data-[state=closed]:animate-collapsible-up"
"data-[state=open]:fade-in-0 slide-in-from-top-4 blur-in-[2px]"
"data-[state=closed]:fade-out-0 slide-out-to-top-4 blur-out-[2px]"
```

### 3. Shimmer Effect (Active Tool/Reasoning)
```tsx
// Active tool indicator — shimmer overlay on label text
{isRunning && (
  <span className="shimmer pointer-events-none absolute inset-0" />
)}
```

### 4. Number Roll Animation (Odometer Effect)
- Uses CSS `mod()` and `clamp()` with CSS Houdini `@property` registration
- Feature-detects `CSS.supports("transform", "translateY(clamp(-1lh, ...))")` 
- Falls back to plain text on unsupported browsers
- Digits roll up/down based on trend direction
- New digits slide in, old ones slide out with opacity transition

### 5. Dot Matrix Status (WebGL-Level Detail in CSS)
- 5×5 grid of SVG circles, each with independent animation
- 20 distinct states: idle, loading, thinking, streaming, searching, syncing, connecting, waiting, uploading, downloading, listening, speaking, recording, success, error, warning, info, paused, stopped, offline
- Each state has unique animation parameters: duration, delay, lo opacity, pattern (twinkle, wave, ripple, sweep)
- Uses CSS `@property` for transition-safe custom properties
- `motion-reduce:animate-none` for accessibility

### 6. Voice Orb (WebGL2 Shader)
- Full WebGL2 fragment shader with simplex noise for organic surface
- Per-frame animation at 60fps via `requestAnimationFrame`
- State-driven parameter interpolation: speed, amplitude, glow, brightness, pulse, saturation
- Volume-reactive: amplitude responds to microphone input
- 4 color variants: default, blue, violet, emerald
- Smooth state transitions via linear interpolation (`lerp` at factor 0.045)

### 7. Action Bar Animations
```tsx
// Copy button — zoom-in bounce on state change
<CheckIcon className="animate-in zoom-in-50 fade-in duration-200 ease-out" />
<CopyIcon className="animate-in zoom-in-75 fade-in duration-150" />

// More menu — backdrop blur glass effect
className="bg-popover/95 backdrop-blur-sm ... zoom-in-95 animate-in"
```

### 8. Scroll Lock During Animations
```typescript
const lockScroll = useScrollLock(collapsibleRef, ANIMATION_DURATION);
// Prevents scroll jumps when collapsible content opens/closes
```

### 9. Content Visibility Optimization
```tsx
// Prevents off-screen messages from being rendered
className="[contain-intrinsic-size:auto_24px] [content-visibility:auto]"
```

---

## Generative UI System

The `react-generative-ui` package enables **LLM-generated React UIs** with security:

### Architecture
1. **Model emits JSON spec**: `{ $type: "ComponentName", ...props, children: [...] }`
2. **Allowlist registry**: Consumer defines allowed components via `GenerativeUILibrary`
3. **Incremental rendering**: Partially-streamed specs render progressively via `getPartialJsonObjectMeta()`
4. **Security boundary**: Unknown component names produce errors, never render
5. **Depth-bounded**: MAX_DEPTH = 64 prevents stack overflow from adversarial input
6. **Per-node fibers**: Each component mounts on its own React fiber for independent hook state

```typescript
// Components opt into prop streaming
entry.streamProperties  // if false, waits for complete props before rendering
// Framework props injected last — model can never override
props.$status = context.status;  // "streaming" | "done"
```

### Key Safety Pattern
```typescript
function reportUnknownComponent(type: string, available: string[]) {
  console.error(`Unknown component "${type}". Available: ${available.join(", ")}`);
}
// Unknown components return null, never execute — allowlist is the security boundary
```

---

## Human-in-the-Loop (HITL) Tool Approval

The tool approval system is sophisticated:

### Approval Options
```typescript
type ToolApprovalOptionKind =
  | "allow-once"     // One-time permission
  | "allow-always"   // Persistent permission
  | "reject-once"    // One-time denial
  | "reject-always"; // Persistent denial

type ToolApprovalOption = {
  id: string;
  kind: ToolApprovalOptionKind | (string & {});  // Open union for custom kinds
  label?: string;
  description?: string;
  grants?: readonly string[];     // Patterns this option would persist
  confirm?: boolean | { title?: string; description?: string };  // Confirmation step
};
```

### Resolution States
- `approved: boolean` — Simple allow/deny
- `optionId: string` — Specific option chosen
- `resolution: "cancelled" | "expired"` — Terminal non-decision states

### Custom Kinds
`_`-prefixed custom kinds are never auto-resolved — the host must handle them explicitly. This prevents the default UI from making decisions it shouldn't.

---

## Message Type System

### Part Types (9 distinct types)
| Part Type | Content | Notes |
|-----------|---------|-------|
| `text` | String text | Basic message text |
| `reasoning` | String text | Chain-of-thought / thinking |
| `tool-call` | Tool invocation with args, result, approval, timing | Can contain nested `messages` |
| `source` | URL or document citation | With providerMetadata |
| `image` | Base64 or URL image | With filename |
| `file` | Binary file with MIME type | |
| `audio` | Audio data (mp3/wav) | Unstable API |
| `data` | Arbitrary typed data | For custom renderers |
| `generative-ui` | JSON UI spec | Rendered via allowlist |

### Message Status Machine
```
running → requires-action (tool-calls | interrupt)
       → complete (stop | unknown)
       → incomplete (cancelled | tool-calls | length | content-filter | other | error)
```

### Timing Metadata
```typescript
type MessageTiming = {
  streamStartTime: number;
  firstTokenTime?: number;
  totalStreamTime?: number;
  tokenCount?: number;
  tokensPerSecond?: number;
  totalChunks: number;
  toolCallCount: number;
};
```

---

## Styling Architecture

### Design Token System
- Uses **CSS custom properties** for theming: `--thread-max-width`, `--composer-bg`, `--composer-radius`, `--composer-padding`
- Color mixing: `color-mix(in oklab, var(--color-muted) 30%, var(--color-background))`
- Dark mode via class variants and `dark:` prefixes
- Shadow system: elevation levels from `shadow-[0_4px_16px_-8px_rgba(0,0,0,0.08)]` to `shadow-lg`

### Component Naming Convention
- All components prefixed with `aui-` data-slot attributes: `data-slot="aui_thread-viewport"`
- CSS class names use `aui-` prefix: `aui-composer-root`, `aui-thread-welcome-root`
- Enables external CSS targeting without fragile DOM structure coupling

### Variant System (class-variance-authority)
```typescript
const reasoningVariants = cva("aui-reasoning-root mb-4 w-full", {
  variants: {
    variant: {
      outline: "rounded-lg border px-3 py-2",
      ghost: "",
      muted: "bg-muted/50 rounded-lg px-3 py-2",
    },
  },
});
```

### Radix Composition Pattern
Components are composable primitives, not monoliths:
```tsx
// Compose your own tool display:
<ToolFallback.Root>
  <ToolFallback.Trigger toolName="search" status={status} />
  <ToolFallback.Content>
    <ToolFallback.Args argsText={argsText} />
    <ToolFallback.Approval {...approvalProps} />
    <ToolFallback.Result result={result} />
  </ToolFallback.Content>
</ToolFallback.Root>
```

---

## Cross-Platform Support

| Platform | Package | Size | Notes |
|----------|---------|------|-------|
| Web (React) | `@assistant-ui/react` | 716KB | Full Radix primitive support |
| React Native | `@assistant-ui/react-native` | 127KB | Native primitives |
| Terminal (Ink) | `@assistant-ui/react-ink` | — | CLI chat interfaces |

All three share `@assistant-ui/core` — the runtime, types, and primitive hooks are platform-agnostic. Only the rendering primitives differ.

---

## What Is Confirmed

- Repository cloned successfully (3,636 files)
- 45 packages in monorepo verified
- 36 UI components in `@assistant-ui/ui`
- 9 backend adapter packages (AI SDK, LangGraph, LangChain, A2A, AG-UI, Google ADK, etc.)
- Custom reactive system (Tap) — not Zustand, not Jotai
- WebGL2 voice orb with shader-based animation
- Generative UI with component allowlist security model
- Tool approval with 4 option kinds + custom kinds
- `content-visibility: auto` for virtualized message rendering
- Normalized streaming protocol with 12 chunk types
- Optimistic message placeholders with `isOptimistic` flag
- AGENTS.md (6.7KB) — comprehensive contributor guide

---

## What Is Uncertain

- Performance benchmarks under large message counts (1000+ messages)
- How the Tap reactive system compares to signals/proxies in benchmarks
- Whether `content-visibility: auto` is sufficient for virtual scrolling at scale
- The maturity of React Native and Ink distributions
- How the "ongoing migration from legacy runtime to tap-only architecture" affects API stability
- Production deployment count beyond the listed companies

---

## Applicability to Harness

### Direct Patterns to Adopt

1. **Composable Primitives**: The Radix-style composition (Root → Trigger → Content → Result) is the gold standard for customizable AI chat UIs. Adopt this for the harness frontend
2. **Fine-Grained State Selectors**: `useAuiState((s) => s.thread.isRunning)` prevents re-render cascading. The runtime error for selecting entire state is a brilliant guardrail
3. **Normalized Streaming Protocol**: The 12-chunk `AssistantStreamChunk` type is a clean abstraction over provider-specific streaming formats. Adopt directly
4. **Generative UI with Allowlist**: Security-first approach to LLM-generated UI — the allowlist is the security boundary, not sanitization
5. **Tool Approval System**: The 4-kind approval option system (allow-once/always, reject-once/always) with confirmation gates is production-ready
6. **Data-Slot Naming**: `data-slot="aui_thread-viewport"` enables CSS targeting without coupling to DOM structure
7. **Animation Pattern Library**: The consistent use of entrance animations, collapsible blur transitions, and shimmer effects creates a premium feel. Copy the exact easing curves
8. **Content Visibility**: `[content-visibility:auto] [contain-intrinsic-size:auto_24px]` is the correct approach for long message lists — not virtual scrolling
9. **Adapter Architecture**: The `use<Name>Runtime()` pattern for framework adapters is the right abstraction level
10. **Voice Integration**: WebGL2 voice orb with volume-reactive animation shows the bar for voice UX in agents

### Anti-Patterns Identified

1. **CSS-only animations over JS**: assistant-ui uses CSS transitions and `@keyframes` everywhere — no JS animation libraries (Framer Motion, GSAP). This is correct for performance
2. **No regex in UI logic**: No parsing, validation, or routing uses regex — all state-driven via typed selectors
3. **No manual DOM manipulation**: All state flows through the reactive system — no `document.getElementById` patterns

### Package Size Concern

The full `@assistant-ui/core` at 967KB is substantial for a component library. However, tree-shaking should eliminate unused parts. The harness should import specific primitives, not the entire package.
