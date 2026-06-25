# Frontend Architecture for AI Agent UX — June 2026

## What Was Researched

Comprehensive analysis of frontend UI/UX patterns for AI-powered agent interfaces as of June 2026. Covers component architecture, styling systems, layout patterns, optimistic vs pessimistic rendering, animation systems, streaming UX, human-in-the-loop (HITL) patterns, generative UI, voice interfaces, accessibility, and performance optimization. Based on deep analysis of the assistant-ui codebase ([SRC-006](https://github.com/assistant-ui/assistant-ui)), OpenClaw ([SRC-001](https://github.com/openclaw/openclaw)), Hermes ([SRC-002](https://github.com/NousResearch/hermes-agent)), and case studies of OpenAI Codex Desktop App ([SRC-019](https://openai.com/codex-desktop-app)), VS Code Copilot Chat Agent Mode ([SRC-020](https://code.visualstudio.com/docs/copilot/agent-mode)), Cursor Composer ([SRC-021](https://cursor.sh/docs/composer)), and Google Antigravity ([SRC-022](https://antigravity.google/docs)).

---

## 1. Component Architecture: Composable Primitives

### The 2026 Standard: Radix-Style Composition

The dominant pattern in June 2026 AI chat UIs is **composable primitives**, not monolithic components. This follows the Radix UI / Headless UI philosophy:

```tsx
// ❌ Monolithic (2023 pattern — dead)
<ChatWidget theme="dark" onMessage={handleMessage} />

// ✅ Composable (2026 standard — assistant-ui)
<ThreadPrimitive.Root>
  <ThreadPrimitive.Viewport turnAnchor="top">
    <ThreadPrimitive.Messages>
      {() => <ThreadMessage />}
    </ThreadPrimitive.Messages>
    <ThreadPrimitive.ViewportFooter>
      <ComposerPrimitive.Root>
        <ComposerPrimitive.Input placeholder="Send a message..." />
        <ComposerPrimitive.Send />
      </ComposerPrimitive.Root>
    </ThreadPrimitive.ViewportFooter>
  </ThreadPrimitive.Viewport>
</ThreadPrimitive.Root>
```

**Source**: assistant-ui `thread.tsx` — [SRC-019](https://github.com/assistant-ui/assistant-ui)

### Primitive Categories (from assistant-ui)

| Category | Primitives | Purpose |
|----------|-----------|---------|
| **Thread** | Root, Viewport, Messages, ViewportFooter, ScrollToBottom, Suggestions | Chat container & scrolling |
| **Message** | Root, Parts, GroupedParts, Error, Attachments, Quote, GenerativeUI | Message rendering |
| **Composer** | Root, Input, Send, Cancel, Dictate, StopDictation, AttachmentDropzone, Queue | Message composition |
| **ActionBar** | Root, Copy, Reload, Edit, ExportMarkdown, FeedbackPositive/Negative, Speak | Message actions |
| **BranchPicker** | Root, Previous, Next, Number, Count | Conversation branching |
| **ThreadList** | Items, ItemByIndex | Thread management |
| **ChainOfThought** | Parts | Reasoning display |

### Component Composition Pattern

Every visual component follows the `Root → Trigger → Content` pattern with compound component API:

```tsx
// Exported as compound component
const ToolFallback = Object.assign(ToolFallbackImpl, {
  Root: ToolFallbackRoot,
  Trigger: ToolFallbackTrigger,
  Content: ToolFallbackContent,
  Args: ToolFallbackArgs,
  Result: ToolFallbackResult,
  Error: ToolFallbackError,
  Approval: ToolFallbackApproval,
});
```

**Why this matters**: Users can override any sub-component without forking. The default composition is sensible; customization is surgical.

---

## 2. State Management: Fine-Grained Reactivity

### The 2026 Pattern: Selector-Based Subscriptions

The key innovation in 2026 AI chat state management is **selector-based fine-grained subscriptions** that prevent cascade re-renders:

```typescript
// ✅ Fine-grained — only re-renders when isRunning changes
const isRunning = useAuiState((s) => s.thread.isRunning);

// ✅ Multiple selectors over inline objects
const text = useAuiState((s) => s.composer.text);
const canSend = useAuiState((s) => s.composer.canSend);

// ❌ THROWS AT RUNTIME — prevents anti-pattern
const state = useAuiState((s) => s); // Error!

// ❌ Creates new reference every render — defeats memoization
const both = useAuiState((s) => ({ text: s.composer.text, canSend: s.composer.canSend }));
```

**Source**: assistant-ui `useAuiState.ts` — [SRC-019](https://github.com/assistant-ui/assistant-ui)

### Conditional Rendering via State Selectors

```tsx
// ✅ Declarative conditional rendering — no useEffect, no useState
<AuiIf condition={(s) => s.thread.isRunning}>
  <StopButton />
</AuiIf>
<AuiIf condition={(s) => !s.thread.isRunning}>
  <SendButton />
</AuiIf>

// ✅ Complex conditions
<AuiIf condition={(s) => isNewChatView(s) && s.composer.isEmpty}>
  <ThreadSuggestions />
</AuiIf>
```

### State Shape (AssistantState)

The state tree exposes:
- `s.thread.messages` — Message array
- `s.thread.isRunning` — Generation in progress
- `s.thread.isLoading` — Thread loading from persistence
- `s.thread.capabilities.dictation` — Feature availability
- `s.thread.capabilities.queue` — Queue-capable runtime
- `s.thread.voice` — Voice connection state
- `s.composer.text` — Current input text
- `s.composer.canSend` — Send readiness
- `s.composer.isEmpty` — Empty check
- `s.composer.dictation` — Active dictation session
- `s.message.role` — Current message role
- `s.message.status` — Message status machine
- `s.message.isCopied` — Copy feedback state
- `s.message.composer.isEditing` — Edit mode
- `s.message.parts` — Message content parts
- `s.threads.isLoading` — Thread list loading

---

## 3. Optimistic vs Pessimistic Rendering

### Optimistic Patterns (Preferred in 2026)

| Pattern | Implementation | Source |
|---------|---------------|--------|
| **Instant composer clear** | Composer empties on send, before server ack | assistant-ui `useComposerSend` |
| **Optimistic message placeholder** | `metadata.isOptimistic: true` — evicted if not on head branch | assistant-ui `message.ts` |
| **Instant button disable** | Approval buttons disable after click via local `submitted` state | assistant-ui `tool-fallback.tsx` |
| **Branch navigation** | UI updates immediately when switching branches | assistant-ui `BranchPicker` |
| **Copy feedback** | Check icon appears instantly, no server round-trip | assistant-ui `ActionBarCopy` |

### Pessimistic Patterns (Where Safety Requires It)

| Pattern | Implementation | Rationale |
|---------|---------------|-----------|
| **Stream completion** | Message stays `running` until `message-finish` chunk | Prevents showing incomplete content as final |
| **Tool results** | Only display after `result` chunk arrives | Tool execution may fail — don't show success prematurely |
| **Thread list loading** | Shows loading state until persistence loads | Prevents flash of empty state |
| **Content filter gating** | Image shows "could not be generated" only after confirmed filter | Don't assume filtering before server confirms |
| **Voice connection** | Shows "Connecting..." state, doesn't assume connected | WebRTC connections can fail |

### The Decision Rule

> **Use optimistic rendering for user-initiated actions** (send, copy, edit, branch switch).
> **Use pessimistic rendering for server-dependent state** (stream completion, tool results, thread loading).
> 
> The user should never wait for something they already know will happen.
> The UI should never show success for something that hasn't happened yet.

---

## 4. Animation & Micro-Interaction System

### Animation Philosophy (June 2026)

1. **CSS-first**: No JavaScript animation libraries. CSS transitions, `@keyframes`, and CSS Houdini
2. **Motion-reduce respect**: Every animation has `motion-reduce:animate-none` or `motion-reduce:transition-none`
3. **Organic easing**: `cubic-bezier(0.32,0.72,0,1)` for collapsibles, `cubic-bezier(0.23,1,0.32,1)` for number rolls
4. **Performance**: `transform-gpu` for GPU-accelerated transforms, `content-visibility:auto` for off-screen content

### Animation Catalog

#### A. Message Entrance
```css
/* Every message fades in and slides up */
.message { animation: fade-in 150ms, slide-in-from-bottom-1 150ms; }

/* Welcome text has longer duration for emphasis */
.welcome { animation: fade-in 200ms, slide-in-from-bottom-1 200ms; fill-mode: both; }
```

#### B. Collapsible Expand/Collapse (Reasoning, Tools)
```css
/* Custom animation with blur transition */
[data-state=open] {
  animation: collapsible-down var(--animation-duration) cubic-bezier(0.32,0.72,0,1);
  /* Sub-content: fade-in + blur-in + slide-in-from-top */
}
[data-state=closed] {
  animation: collapsible-up var(--animation-duration) cubic-bezier(0.32,0.72,0,1);
  pointer-events: none;
  fill-mode: forwards;
}
```

#### C. Shimmer Effect (Active Indicators)
```css
/* Text overlay with gradient mask animation */
.shimmer {
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
  background-size: 200%;
  animation: shimmer 2s infinite;
}
```

#### D. Dot Matrix Status (20 States)
- **Loading**: Random twinkle pattern (0.9-1.6s duration, random delays)
- **Thinking**: Diagonal wave pattern (row + col based delay)
- **Streaming**: Row sweep pattern (row-based delay)
- **Searching**: Column sweep pattern (col-based delay)
- **Syncing**: Radial rotation pattern (atan2-based delay)
- **Connecting**: Diamond expansion pattern (Chebyshev distance)
- **Recording**: Red record dot with pulse
- **Success**: Green checkmark glyph
- **Error**: Red cross glyph with pulse
- **Warning**: Amber exclamation glyph with slow pulse

#### E. Number Roll (Odometer Animation)
```css
/* CSS Houdini registered property for animatable custom property */
@property --aui-number-roll-pos {
  syntax: "<number>";
  inherits: true;
  initial-value: 0;
}

/* Digit translation using CSS mod() */
transform: translateY(clamp(-1lh, calc((mod(mod(CELL - var(--pos), 10) + 5, 10) - 5) * 1lh), 1lh));
```
- Feature-detects CSS `mod()` support
- Falls back to plain text on unsupported browsers
- Digits roll up or down based on trend direction
- Grid-template-columns transition for entering/exiting digits

#### F. Voice Orb (WebGL2 Shader)
- **Fragment shader**: 3D simplex noise for organic surface texture
- **Volume-reactive**: Amplitude increases with microphone input level
- **State interpolation**: Lerp factor 0.045 for smooth transitions between idle/listening/speaking
- **Per-state parameters**: speed, amplitude, glow, brightness, pulse, saturation
- **4 color variants**: default (gray), blue, violet, emerald

#### G. Action Feedback
```css
/* Copy icon → Check icon bounce */
.check-appear { animation: zoom-in-50 200ms ease-out, fade-in 200ms; }
.copy-appear  { animation: zoom-in-75 150ms, fade-in 150ms; }

/* Active button press feedback */
.pressable { transform: scale(0.98) on :active; }
```

### Animation Duration Standards
| Animation | Duration | Notes |
|-----------|----------|-------|
| Message entrance | 150ms | Fast enough to not feel sluggish |
| Collapsible open/close | 200ms | Balanced — perceivable but not slow |
| Copy feedback | 200ms | Fast confirmation |
| Shimmer cycle | 2000ms | Slow enough to not distract |
| Number roll | 500ms | Perceivable digit change |
| Dot matrix blink | 700-1600ms | Varies by state for visual distinction |
| Voice orb lerp | ~45 frames | ~750ms at 60fps |

---

## 5. Streaming UX Patterns

### Turn Anchoring
```tsx
<ThreadPrimitive.Viewport turnAnchor="top">
```
Auto-scrolls to keep the latest turn visible. Uses `scroll-smooth` CSS for native smooth scrolling.

### Scroll-to-Bottom Button
Appears when the user scrolls up, disappears when at bottom:
```tsx
<ThreadPrimitive.ScrollToBottom asChild>
  <Button className="absolute -top-12 z-10 self-center rounded-full disabled:invisible">
    <ArrowDownIcon />
  </Button>
</ThreadPrimitive.ScrollToBottom>
```

### Scroll Lock During Layout Changes
```typescript
const lockScroll = useScrollLock(collapsibleRef, ANIMATION_DURATION);
// Prevents scroll position jumps when content expands/collapses
```

### Progressive Tool Rendering
1. Tool starts → show spinner + shimmer label: `Used tool: **search**`
2. Args stream in → show partial args in collapsible
3. Tool completes → spinner → check icon, show result
4. Tool fails → spinner → X icon, show error
5. Tool cancelled → strikethrough label, faded args

### Indicator Dot (Typing Indicator)
```tsx
// Simple pulse animation for "assistant is working"
<span className="animate-pulse font-sans" aria-label="Assistant is working">●</span>
```

---

## 6. Layout Architecture

### Thread Layout System

```
┌─────────────────────────────────────────────┐
│ ThreadList Sidebar  │  Thread               │
│                     │  ┌───────────────────┐ │
│  [Thread 1]         │  │ Viewport          │ │
│  [Thread 2] ←active │  │  Welcome / Msgs   │ │
│  [Thread 3]         │  │                   │ │
│                     │  │                   │ │
│                     │  ├───────────────────┤ │
│                     │  │ ViewportFooter    │ │
│                     │  │  ScrollToBottom   │ │
│                     │  │  Composer         │ │
│                     │  │  Suggestions      │ │
│                     │  └───────────────────┘ │
└─────────────────────────────────────────────┘
```

### Content Width Constraint
```css
--thread-max-width: 44rem;  /* ~704px — optimal reading width */
```

### Empty State / Conversation State Toggle
```tsx
// Centered welcome when empty, docked composer when messages exist
const isEmpty = useAuiState(isNewChatView);
className={cn(
  "mx-auto flex w-full max-w-(--thread-max-width) flex-1 flex-col px-4 pt-4",
  isEmpty && "justify-center",  // Center welcome vertically
)}
```

### Sticky Composer
```tsx
// Composer sticks to bottom when messages exist
className={cn(
  "bg-background flex flex-col gap-4 overflow-visible pb-4 md:pb-6",
  !isEmpty && "sticky bottom-0 mt-auto rounded-t-(--composer-radius)",
)}
```

### Container Queries
```tsx
// Uses @container for responsive within the thread
className="@container flex h-full flex-col"
```

### Message Layout Patterns

**User messages**: Right-aligned with grid layout
```tsx
className="grid auto-rows-auto grid-cols-[minmax(72px,1fr)_auto] ... [&:where(>*)]:col-start-2"
```

**Assistant messages**: Full-width with action bar reservation
```tsx
// Reserves space for action bar to prevent layout shift
const ACTION_BAR_HEIGHT = "-mb-7.5 min-h-7.5 pt-1.5";
```

---

## 7. Styling System

### Design Tokens (CSS Custom Properties)

```css
--thread-max-width: 44rem;
--composer-bg: color-mix(in oklab, var(--color-muted) 30%, var(--color-background));
--composer-radius: 1.5rem;
--composer-padding: 8px;
--animation-duration: 200ms;
--aui-number-roll-duration: 500ms;
--aui-number-roll-ease: cubic-bezier(0.23, 1, 0.32, 1);
```

### Color System
- **OKLAB color mixing**: `color-mix(in oklab, ...)` for perceptually uniform blending
- **HSL-based theme tokens**: `--color-background`, `--color-muted`, `--color-accent`, `--color-destructive`
- **Opacity modifiers**: `bg-muted/50`, `bg-popover/95`, `text-foreground/90`
- **Dark mode**: `dark:` prefix variants throughout

### Shadow System
```css
/* Composer default */
shadow-[0_4px_16px_-8px_rgba(0,0,0,0.08),0_1px_2px_rgba(0,0,0,0.04)]

/* Composer focus */
shadow-[0_6px_24px_-8px_rgba(0,0,0,0.12),0_1px_2px_rgba(0,0,0,0.05)]

/* Dark mode */
dark:shadow-none  /* Shadows don't work well on dark backgrounds */
```

### Glassmorphism (Tailwind Plugin)
```tsx
// More menu uses glass effect
className="bg-popover/95 backdrop-blur-sm ... rounded-xl border shadow-lg"
```

### Naming Convention (Data-Slot)
```tsx
// Every component gets a data-slot for external CSS targeting
data-slot="aui_thread-viewport"
data-slot="aui_assistant-message-root"
data-slot="aui_composer-shell"
data-slot="aui_user-message-root"
```

This enables CSS targeting without coupling to internal DOM structure:
```css
/* Stable selector — survives internal refactors */
[data-slot="aui_thread-viewport"] { ... }

/* NOT this — breaks when class names change */
.aui-thread-viewport { ... }
```

---

## 8. Generative UI & LLM-Driven Interfaces

### The 2026 Frontier: Agent-Generated UIs

Three approaches exist in June 2026:

| Approach | Security | Streaming | Flexibility | Used By |
|----------|----------|-----------|-------------|---------|
| **Component Allowlist** | ✅ Strong | ✅ Progressive | Medium | assistant-ui |
| **Sandboxed iframe** | ✅ Strong | ❌ Full reload | High | OpenClaw (safe-content-frame) |
| **Tool-as-UI** | ⚠️ Varies | ✅ Per-tool | Low | Most frameworks |

### assistant-ui's Approach: Component Allowlist

```typescript
// 1. Define allowed components
const library: GenerativeUILibrary = {
  Button: {
    streamProperties: true,
    render: (props) => <Button {...props} />,
  },
  Card: {
    streamProperties: false,  // Wait for complete props
    render: (props) => <Card {...props} />,
  },
};

// 2. Model emits JSON spec
// { $type: "Card", title: "Results", children: [{ $type: "Button", label: "View" }] }

// 3. Library renders with security boundary
renderGenerativeUI(toolArgs, library, { status: "streaming" });
// Unknown $type → console.error + return null (never renders)
```

### Security Model
- **Allowlist is the security boundary** — not sanitization, not regex filtering
- Unknown component names produce typed errors, never render
- Framework props (`$status`) injected last — model cannot override
- `MAX_DEPTH = 64` prevents stack overflow from adversarial nesting
- Each component mounts on its own React fiber — isolated hook state

### Streaming Support
- `getPartialJsonObjectMeta()` tracks which JSON path is still mid-arrival
- Components with `streamProperties: true` render from partial props
- Components with `streamProperties: false` wait for complete parse

---

## 9. Voice Interface Patterns

### Voice State Machine
```
idle → connecting → listening → speaking → listening → ...
                               ↘ muted ↗
     ← ended ←────────────────────────────────────────┘
```

### Voice UI Components (assistant-ui)
| Component | Purpose |
|-----------|---------|
| `VoiceOrb` | WebGL2 animated sphere — reacts to volume, interpolates states |
| `VoiceControl` | Connection bar — status dot + connect/mute/disconnect buttons |
| `VoiceStatusDot` | Tiny colored dot indicating voice state |
| `VoiceConnectButton` | Initiates voice session |
| `VoiceMuteButton` | Toggles microphone mute |
| `VoiceDisconnectButton` | Ends voice session |

### Volume-Reactive Animation
```typescript
// Voice orb responds to real-time volume
gl.uniform1f(uniforms.u_speed, p.speed + vol * 0.4);
gl.uniform1f(uniforms.u_amplitude, p.amplitude + vol * 0.12);
gl.uniform1f(uniforms.u_glow, p.glow + vol * 0.2);
```

---

## 10. Accessibility & Inclusive Design

### Patterns Observed in assistant-ui

| Pattern | Implementation |
|---------|---------------|
| **aria-label** | Every interactive element: `aria-label="Send message"`, `aria-label="Stop generating"` |
| **aria-busy** | On reasoning content: `<ReasoningContent aria-busy={isReasoningStreaming}>` |
| **role="status"** | Dot matrix indicator: `<span role="status">` |
| **sr-only** | Screen-reader-only text for visual-only content: `<span className="sr-only">{formatted}</span>` |
| **motion-reduce** | Every animation: `motion-reduce:animate-none` or `motion-reduce:transition-none` |
| **keyboard nav** | Image zoom: `onKeyDown={(e) => e.key === "Enter" && handleOpen()}` |
| **Escape to close** | Image lightbox: `if (e.key === "Escape") setIsOpen(false)` |
| **autofocus** | Composer input: `autoFocus` on mount |
| **tabIndex** | Interactive non-button elements: `tabIndex={0}` |

---

## 11. Performance Optimization

### Content Visibility (Virtual Scrolling Alternative)
```tsx
// Each message uses content-visibility for free virtualization
className="[content-visibility:auto] [contain-intrinsic-size:auto_24px]"
```
This tells the browser to skip rendering off-screen messages entirely. Unlike virtual scrolling:
- No JavaScript measurement needed
- Works with native scroll
- Progressive enhancement (degrades gracefully)
- No height estimation errors

### GPU Acceleration
```tsx
className="transform-gpu ..."  // Forces GPU compositing for smooth transforms
```

### Memoization
```typescript
// All message part components are memo'd
const Reasoning = memo(ReasoningImpl);
const ToolFallback = memo(ToolFallbackImpl);
const Image = memo(ImageImpl);
```

### Lazy Formatting
```typescript
// NumberRoll caches Intl.NumberFormat instances
const formatterCache = new Map<string, Intl.NumberFormat>();
// "Intl.NumberFormat construction is expensive and inline format/locales props
//  change identity on every parent render"
```

### WebGL Cleanup
```typescript
// Voice orb properly cleans up GPU resources
return () => {
  cancelAnimationFrame(animRef.current);
  const ext = ctx.gl.getExtension("WEBGL_lose_context");
  ext?.loseContext();  // Explicitly release GPU context
};
```

---

## 12. Protocol Adapters

### Adapter Architecture Pattern

```typescript
// Every backend adapter follows this pattern:
// 1. Entry hook: use<Name>Runtime()
// 2. Accessor hooks: hooks.ts
// 3. Pure converters: convertMessages.ts (both directions)
// 4. Types: types.ts
// Optional:
// 5. Controller: <Name>ThreadController.ts (when adapter owns thread state)
// 6. Reducer: reduce<Name>ThreadState.ts
// 7. Server subpath: ./server or ./node
```

### Supported Protocols (June 2026)

| Protocol | Package | Pattern |
|----------|---------|---------|
| Vercel AI SDK | `react-ai-sdk` | External store + converter |
| LangGraph | `react-langgraph` | External store + converter |
| LangChain | `react-langchain` | External store + converter + `createRuntimeExtras` |
| AG-UI | `react-ag-ui` | Agent-to-UI protocol |
| A2A | `react-a2a` | Agent-to-Agent protocol |
| Google ADK | `react-google-adk` | Google Agent Development Kit |
| Data Stream | `react-data-stream` | Custom HTTP streaming |
| Pi | `react-pi` | Pi agent integration |
| OpenCode | `react-opencode` | OpenCode integration |

---

## 13. Case Studies: Codex, VS Code, Cursor, & Google Antigravity

To inform our model-agnostic harness UI design, we analyze four leading AI developer environments across five primary criteria: Layout Model, Multi-file edits, Terminal integration, Approval mechanism, and Orchestration surface.

### UI/UX Comparison Matrix

| Criteria | OpenAI Codex Desktop App [SRC-019] | VS Code Copilot Chat (Agent Mode) [SRC-020] | Cursor Composer (Agent Mode) [SRC-021] | Google Antigravity IDE & Standalone App [SRC-022] |
|:---|:---|:---|:---|:---|
| **Layout Model** | Centered 3-column project-based control center [CLAIM-158](../00_index/citation_map.md#claim-158) | Split side panel (Chat) or dedicated Agents Window [CLAIM-161](../00_index/citation_map.md#claim-161) | In-editor chat sidebar + Composer panel overlay [CLAIM-164](../00_index/citation_map.md#claim-164) | Standalone companion app + custom IDE fork [CLAIM-166](../00_index/citation_map.md#claim-166) |
| **Multi-file Edits** | Interactive tree view + diff inspect panel [CLAIM-159](../00_index/citation_map.md#claim-159) | Inline editor annotations / target edits | High-context side-by-side workspace edits [CLAIM-164](../00_index/citation_map.md#claim-164) | Planning-stage file checklist + diff review [CLAIM-167](../00_index/citation_map.md#claim-167) |
| **Terminal Integration** | Stdio/WebSocket jsonrpc via codex app-server [CLAIM-160](../00_index/citation_map.md#claim-160) | Integrated terminal with Rich Shell Integration [CLAIM-163](../00_index/citation_map.md#claim-163) | Integrated terminal with settings auto-run toggles [CLAIM-165](../00_index/citation_map.md#claim-165) | Proposed execution logs + bg task tracking [CLAIM-169](../00_index/citation_map.md#claim-169) |
| **Approval Mechanism** | Local sandboxing + manual approval prompts [CLAIM-159](../00_index/citation_map.md#claim-159) | Security-gated execution prompts in chat [CLAIM-162](../00_index/citation_map.md#claim-162) | Auto-run levels (Ask Every Time, Sandbox, YOLO) [CLAIM-165](../00_index/citation_map.md#claim-165) | Strict programmatic tool approval gates [CLAIM-169](../00_index/citation_map.md#claim-169) |
| **Orchestration Surface** | Threaded workspace threads running in parallel [CLAIM-158](../00_index/citation_map.md#claim-158) | Task/Agent manager window + Copilot CLI [CLAIM-161](../00_index/citation_map.md#claim-161) | In-pane task lists + .cursorrules formatting [CLAIM-164](../00_index/citation_map.md#claim-164) | Dedicated Manager Surface + artifact pipeline [CLAIM-166](../00_index/citation_map.md#claim-166), [CLAIM-167](../00_index/citation_map.md#claim-167) |

### Key UI/UX Implementations & Takeaways

#### OpenAI Codex Desktop App (standalone) [SRC-019]
- **Command Center Workspace**: Shuts down the "terminal tab soup" by organizing concurrent agents inside multi-threaded project cards [CLAIM-158](../00_index/citation_map.md#claim-158).
- **Visual Design Loop**: Leverages browser and app-shot capture with drawing/annotation capabilities so the user can visually edit/direct agent design revisions [CLAIM-159](../00_index/citation_map.md#claim-159).
- **Execution Architecture**: Communicates via local stdio or WebSocket HTTP/Unix streams, delegating processes into macOS/Linux/Windows secure local sandboxes [CLAIM-160](../00_index/citation_map.md#claim-160).

#### VS Code Copilot Chat (Agent Mode) [SRC-020]
- **Dual Orchestration Surfaces**: Focuses on inline chat for developer pair-programming but splits into the new *Agents Window* for cross-project background executions [CLAIM-161](../00_index/citation_map.md#claim-161).
- **Dynamic Tool Pickers**: Enables granular selection of active plugins (MCP) and terminal permissions directly inside the chat composer [CLAIM-163](../00_index/citation_map.md#claim-163).
- **Feedback Loops**: Auto-reads test and compile terminal scrollback using Rich Shell Integration, feeding build outputs back to the agent for self-correction [CLAIM-162](../00_index/citation_map.md#claim-162).

#### Cursor Composer (Agent Mode) [SRC-021]
- **Composer Panel**: High-context multi-file view overlaying the code editor. Edits compile in the background and show red/green side-by-side diff previews immediately inside the workspace [CLAIM-164](../00_index/citation_map.md#claim-164).
- **Auto-Run Policy Configuration**: Lets users switch between `Ask Every Time` (maximum friction), `Run in Sandbox` (restricted execution), or `Run Everything` (YOLO mode) [CLAIM-165](../00_index/citation_map.md#claim-165).
- **CLI Policy Control**: Grants permissions using JSON configurations (`.cursor/cli.json`) to white-list or black-list specific commands [CLAIM-165](../00_index/citation_map.md#claim-165).

#### Google Antigravity [SRC-022]
- **Manager Surface**: A dedicated visual monitor tracking background agent state, active directories, execution threads, and subagent lifecycles [CLAIM-166](../00_index/citation_map.md#claim-166).
- **Artifact Pipeline**: Uses markdown files (`implementation_plan.md`, `task.md`, `walkthrough.md`) generated and updated live in the user's workspace to establish structural checks [CLAIM-167](../00_index/citation_map.md#claim-167).
- **Browser Subagent WebP Recordings**: Launches sandboxed Chrome browser subagents to test UIs, auto-recording WebP frames to let the user review visual changes [CLAIM-168](../00_index/citation_map.md#claim-168).
- **Interactive Tool Approvals**: Proposes command executions and file operations directly to the user before running them, accepting slash shortcuts like `/goal`, `/schedule`, and `/grill-me` [CLAIM-169](../00_index/citation_map.md#claim-169).
---

## 14. Generative UI in Responses, MCP Apps, & MCP UI

In June 2026, the AI frontend ecosystem has shifted from static, passive text chats to **Intent-Based Generative User Interfaces (GenUI)** and **Model Context Protocol (MCP) Apps** [CLAIM-170](../00_index/citation_map.md#claim-170), [CLAIM-174](../00_index/citation_map.md#claim-174).

### A. Open Source Ecosystem & Tools (June 2026)

Several frameworks form the standard stack for authoring and rendering agentic UIs:
- **Vercel AI SDK (AI SDK UI)**: The dominant React/TypeScript toolkit for handling token streaming, structured outputs, and rendering dynamic UI cards on the fly [CLAIM-172](../00_index/citation_map.md#claim-172).
- **CopilotKit**: An open-source agentic application framework designed specifically for React. It uses the **AG-UI protocol** to allow autonomous backend agents to invoke, modify, and synchronize frontend React components dynamically [CLAIM-173](../00_index/citation_map.md#claim-173).
- **Mastra AI & `mcp-use`**: High-performance TypeScript frameworks for building agents and workflows. They provide native primitives for authoring MCP servers that expose rich interactive UI components as visual tools alongside traditional data endpoints [CLAIM-176](../00_index/citation_map.md#claim-176).

### B. Generative UI in the Responses API

Rather than letting models output raw unstructured text, applications leverage stateful completions (like the OpenAI Responses API or the self-hosted Open Responses) to generate interactive layouts [CLAIM-170](../00_index/citation_map.md#claim-170), [CLAIM-118](../00_index/citation_map.md#claim-118).
1. **Structured Outputs Gating**: The host client sends the user prompt along with a strict JSON Schema inside the `response_format` payload:
   ```json
   {
     "type": "json_object",
     "schema": {
       "type": "object",
       "properties": {
         "component": { "type": "string", "enum": ["WeatherCard", "StockChart", "InvoiceForm"] },
         "props": { "type": "object" }
       },
       "required": ["component", "props"]
     }
   }
   ```
2. **Client-Side Component Registry**: The React client hosts a type-safe registry mapping schema keys to concrete React components [CLAIM-171](../00_index/citation_map.md#claim-171):
   ```tsx
   const ComponentRegistry: Record<string, React.ComponentType<any>> = {
     WeatherCard: (props) => <WeatherCard {...props} />,
     StockChart: (props) => <StockChart {...props} />,
     InvoiceForm: (props) => <InvoiceForm {...props} />,
   };
   ```
3. **Progressive JSON Parsing**: The client streams the JSON output using Vercel AI SDK's parsing utility, rendering components optimistically as their JSON property nodes materialize [CLAIM-172](../00_index/citation_map.md#claim-172).

### C. MCP Apps and MCP UI (SEP-1865)

The Model Context Protocol (MCP) was upgraded in mid-2026 via **SEP-1865** to support **MCP Apps**—an extensible protocol standard for delivering rich, interactive UIs directly from remote MCP servers to compatible host environments [CLAIM-174](../00_index/citation_map.md#claim-174).

1. **Security Isolation (Sandboxed Iframe)**: To prevent malicious code execution, the host never renders raw HTML/JS from the server directly into the main DOM. Instead, MCP Apps enforce rendering within an isolated `<iframe>` container with strict sandbox permissions (e.g. `sandbox="allow-scripts"`, blocking top-level navigation and credential cookies) [CLAIM-175](../00_index/citation_map.md#claim-175).
2. **Bi-directional State Synchronization**: The iframe communicates with the parent host application via JSON-RPC messages routed over window postMessage. Button clicks or form changes in the MCP UI emit notifications that update the agent state or trigger subsequent tool calls [CLAIM-174](../00_index/citation_map.md#claim-174).
3. **Stateless Core and the Tasks Extension**: With MCP's transition to a stateless protocol core in 2026, the **Tasks Extension** was introduced to model long-running, asynchronous agent processes [CLAIM-177](../00_index/citation_map.md#claim-177). Instead of holding connection sockets open (which bloats server memory), tasks are modeled as client-driven durable state machines, updating the MCP UI progress step-by-step [CLAIM-178](../00_index/citation_map.md#claim-178).

---

## What Is Confirmed

- Composable primitives are the dominant pattern for AI chat UIs (assistant-ui, Vercel AI SDK)
- Fine-grained state selectors via `useSyncExternalStore` are the performance standard
- CSS-first animations outperform JS animation libraries for chat UIs
- `content-visibility: auto` is the correct approach for long message lists
- Generative UI security must be allowlist-based, not sanitization-based
- WebGL2 shaders are production-viable for voice interface visualization
- 20+ distinct loading/status states are expected in modern agent UIs
- Optimistic rendering for user actions, pessimistic for server state — no exceptions
- `data-slot` naming enables stable CSS targeting across refactors
- OKLAB color mixing is the 2026 standard for perceptually uniform color blending
- **Two-tier workspace orchestration surfaces** (chat panel for immediate editing + multi-threaded planning surface/manager window for background tasks) is the UX benchmark [CLAIM-158](../00_index/citation_map.md#claim-158), [CLAIM-161](../00_index/citation_map.md#claim-161), [CLAIM-166](../00_index/citation_map.md#claim-166).
- **Generative UI pipelines must be allowlist-driven or declarative** (JSON schema parsing) to prevent code injection vulnerabilities [CLAIM-170](../00_index/citation_map.md#claim-170), [CLAIM-171](../00_index/citation_map.md#claim-171), [CLAIM-175](../00_index/citation_map.md#claim-175).
- **MCP Apps (SEP-1865) represent the modern standard** for modular UI extensibility in agent hosts [CLAIM-174](../00_index/citation_map.md#claim-174).
- **MCP Tasks modeling is key** to avoiding context bloat during long-running loops [CLAIM-178](../00_index/citation_map.md#claim-178).

## Applicability to Harness

This research directly informs `15_frontend_react_vite_agent_stack/` and the harness specification:

1. **Adopt composable primitives** — Thread, Message, Composer, ActionBar as separate components
2. **Use selector-based state** — `useAuiState((s) => s.thread.isRunning)` pattern
3. **CSS-first animations** — No Framer Motion or GSAP dependency
4. **Content-visibility for messages** — Not virtual scrolling
5. **Data-slot naming** — `data-slot="harness-thread-viewport"` for stable selectors
6. **Generative UI allowlist** — Security boundary for agent-generated UIs
7. **Voice orb WebGL** — Production reference for voice agent interfaces
8. **Optimistic sends, pessimistic completions** — Decision rule for every state update
9. **Dot matrix status indicator** — 20 states cover all agent UX scenarios
10. **Number roll animation** — CSS Houdini for smooth metric displays
11. **Provide side-by-side diff previews and interactive tool execution / background task managers** with custom auto-run settings (Ask / Sandbox / YOLO) [CLAIM-164](../00_index/citation_map.md#claim-164), [CLAIM-165](../00_index/citation_map.md#claim-165), [CLAIM-169](../00_index/citation_map.md#claim-169).
12. **Implement an artifact-based planning and verification check loop** — modeled after Google Antigravity's lifecycle [CLAIM-167](../00_index/citation_map.md#claim-167).
13. **Implement structured output mapping and sandboxed iframe widgets** (MCP Apps style) for safe, dynamic UI rendering [CLAIM-172](../00_index/citation_map.md#claim-172), [CLAIM-175](../00_index/citation_map.md#claim-175).
14. **Support the MCP Tasks extension** for client-driven asynchronous agent execution [CLAIM-178](../00_index/citation_map.md#claim-178).
