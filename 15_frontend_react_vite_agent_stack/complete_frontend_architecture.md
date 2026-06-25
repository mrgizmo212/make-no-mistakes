# Complete Frontend Architecture for AI Agent Apps — React + Vite — June 2026

## What Was Researched

Exhaustive architecture guide for building production-grade AI agent interfaces using **React + Vite (SPA)**. Covers the full spectrum: 3-column layouts (history | chat | artifacts), resizable panels, settings & admin dashboards (single-tenant and multi-tenant), animation systems, landing/empty states, SPA state hydration, race condition management, and mobile-first responsive design. Based on deep codebase analysis of assistant-ui ([SRC-019](https://github.com/assistant-ui/assistant-ui)), OpenClaw ([SRC-004](https://github.com/openclaw/openclaw)), and 2026 web research.

**Stack assumption throughout this document**: React 19 + Vite 6 + TypeScript + Tailwind CSS + shadcn/ui + Radix primitives. No Next.js, no SSR unless stated.

---

## Table of Contents

1. [3-Column Layout Architecture](#1-three-column-layout-architecture)
2. [Settings & Admin Dashboards](#2-settings--admin-dashboards)
3. [Animation System](#3-animation-system)
4. [Landing Page & Empty States](#4-landing-page--empty-states)
5. [State Hydration (SPA-Specific)](#5-state-hydration-spa-specific)
6. [Race Condition Management](#6-race-condition-management)
7. [Mobile-Ready Architecture](#7-mobile-ready-architecture)
8. [Project Structure](#8-project-structure)
9. [Performance Optimization](#9-performance-optimization)
10. [Gotchas & Anti-Patterns](#10-gotchas--anti-patterns)
11. [Comparative Case Studies: Codex, VS Code, Cursor, & Google Antigravity](#11-comparative-case-studies-codex-vs-code-cursor--google-antigravity)
12. [Generative UI in Responses, MCP Apps, & MCP UI](#12-generative-ui-in-responses-mcp-apps--mcp-ui)

---

## 1. Three-Column Layout Architecture

### The "Workbench" Pattern

The dominant layout for AI agent apps in June 2026 is the **3-column workbench**, modeled after Claude Artifacts, Cursor, and Windsurf:

```
┌──────────────────────────────────────────────────────────────┐
│ Left Sidebar (16rem)  │  Center Chat (flex-1)  │  Right Panel (var)  │
│ ───────────────────── │ ────────────────────── │ ─────────────────── │
│ Thread History        │  Thread Viewport       │  Artifact Preview   │
│ ├─ Recent sessions    │  ├─ Welcome / Msgs     │  ├─ Source / Tabs   │
│ ├─ Search             │  ├─ Reasoning/Tools    │  ├─ Live Preview    │
│ ├─ Filters            │  ├─ Streaming content  │  ├─ Diff Viewer     │
│ └─ Archive            │  └─ Composer (sticky)  │  └─ Actions         │
│                       │                        │                     │
│ [Collapse rail ←]     │                        │ [→ Collapse rail]   │
│ User / Settings       │  [Scroll-to-bottom]    │                     │
└──────────────────────────────────────────────────────────────┘
```

### Implementation: react-resizable-panels

The production standard is `react-resizable-panels` (Bryan Vaughn, ex-React core team). assistant-ui wraps it as `ResizablePanel`, `ResizableHandle`, `ResizablePanelGroup`:

**Source**: [resizable.tsx](https://github.com/assistant-ui/assistant-ui) — assistant-ui wraps `react-resizable-panels`

```tsx
// 3-column layout with persist + collapse
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";

function WorkbenchLayout() {
  const isMobile = useIsMobile();

  if (isMobile) return <MobileLayout />;

  return (
    <ResizablePanelGroup
      direction="horizontal"
      autoSaveId="workbench-layout"  // Persists panel sizes to localStorage
    >
      {/* LEFT: Thread History Sidebar */}
      <ResizablePanel
        defaultSize={20}
        minSize={15}
        maxSize={30}
        collapsible
        collapsedSize={0}
        onCollapse={() => setLeftCollapsed(true)}
        onExpand={() => setLeftCollapsed(false)}
      >
        <ThreadListSidebar />
      </ResizablePanel>

      <ResizableHandle withHandle />

      {/* CENTER: Chat Thread */}
      <ResizablePanel defaultSize={50} minSize={30}>
        <Thread />
      </ResizablePanel>

      <ResizableHandle withHandle />

      {/* RIGHT: Artifacts / Preview */}
      <ResizablePanel
        defaultSize={30}
        minSize={20}
        collapsible
        collapsedSize={0}
        onCollapse={() => setRightCollapsed(true)}
        onExpand={() => setRightCollapsed(false)}
      >
        <ArtifactsPanel />
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
```

### Key Props

| Prop | Purpose | Verified Source |
|------|---------|-----------------|
| `autoSaveId` | Persists panel sizes to `localStorage` across page reloads | [react-resizable-panels docs](https://www.npmjs.com/package/react-resizable-panels) |
| `collapsible` | Enables panel to collapse to `collapsedSize` | [react-resizable-panels docs](https://www.npmjs.com/package/react-resizable-panels) |
| `collapsedSize={0}` | Panel fully disappears when collapsed | [react-resizable-panels docs](https://www.npmjs.com/package/react-resizable-panels) |
| `onCollapse` / `onExpand` | Callbacks for tracking collapse state (update header icons, etc.) | [react-resizable-panels docs](https://www.npmjs.com/package/react-resizable-panels) |
| `withHandle` | Renders a visible grip icon on the drag handle | assistant-ui [resizable.tsx](https://github.com/assistant-ui/assistant-ui) |

### Programmatic Panel Control

```tsx
// Use imperative API to control panels from buttons
const panelRef = useRef<ImperativePanelHandle>(null);

// Toggle sidebar from keyboard shortcut (Ctrl+B)
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "b") {
      e.preventDefault();
      const panel = panelRef.current;
      panel?.isCollapsed() ? panel.expand() : panel.collapse();
    }
  };
  window.addEventListener("keydown", handleKeyDown);
  return () => window.removeEventListener("keydown", handleKeyDown);
}, []);
```

**Source**: assistant-ui sidebar uses `Ctrl+B` keyboard shortcut — [sidebar.tsx L95-109](https://github.com/assistant-ui/assistant-ui)

### Sidebar State Persistence via Cookie

assistant-ui persists sidebar open/closed state via a **cookie** (not localStorage) so that SSR frameworks can read it during initial render. For a Vite SPA, localStorage is sufficient:

```typescript
// assistant-ui pattern (cookie for SSR compat)
const SIDEBAR_COOKIE_NAME = "sidebar_state";
const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days
document.cookie = `${SIDEBAR_COOKIE_NAME}=${openState}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`;

// Vite SPA pattern (localStorage is fine — no SSR)
localStorage.setItem("sidebar_state", JSON.stringify(open));
```

**Source**: assistant-ui [sidebar.tsx L28-85](https://github.com/assistant-ui/assistant-ui)

### Sidebar Collapse Variants

assistant-ui supports **3 collapse modes**:

| Variant | Behavior | Use Case |
|---------|----------|----------|
| `offcanvas` | Sidebar slides off-screen, content fills space | Default for thread history |
| `icon` | Sidebar collapses to icon-only width (3rem) | IDE-style compact mode |
| `none` | Sidebar never collapses | Settings sidebar |

```tsx
<Sidebar
  side="left"           // "left" | "right"
  variant="sidebar"     // "sidebar" | "floating" | "inset"
  collapsible="offcanvas" // "offcanvas" | "icon" | "none"
>
```

**Source**: assistant-ui [sidebar.tsx L153-163](https://github.com/assistant-ui/assistant-ui)

### Artifacts Panel Architecture

The artifact panel is **state-driven** — it appears when an artifact exists, disappears when none:

```tsx
// assistant-ui with-artifacts example pattern
function ArtifactsView() {
  const [tab, setTab] = useState<"source" | "preview">("source");

  // Select last tool call of type "render_html" from the reactive state tree
  const lastToolCall = useAuiState((s) => {
    const messages = s.thread.messages;
    return messages
      .flatMap((m) =>
        m.content.filter(
          (c): c is ToolCallMessagePart =>
            c.type === "tool-call" && c.toolName === "render_html",
        ),
      )
      .at(-1);
  });

  const code = lastToolCall?.args.code as string | undefined;
  const isComplete = lastToolCall?.result !== undefined;

  if (!code) return null; // No artifact → no panel

  return (
    <div className="flex flex-grow basis-full p-3">
      <div className="flex h-full w-full flex-col overflow-hidden rounded-lg border">
        {/* Tab bar: Source | Preview */}
        <div className="flex border-b">
          <button onClick={() => setTab("source")} /* ... */}>Source Code</button>
          <button onClick={() => isComplete && setTab("preview")} disabled={!isComplete}>
            Preview {/* Pessimistic: preview disabled until tool completes */}
          </button>
        </div>
        {/* Content: source code or iframe preview */}
        {tab === "source" || !isComplete ? (
          <div className="font-mono text-sm whitespace-pre-line">{code}</div>
        ) : (
          <iframe title="Artifact Preview" srcDoc={code} className="h-full w-full" />
        )}
      </div>
    </div>
  );
}
```

**Source**: assistant-ui [with-artifacts/app/page.tsx](https://github.com/assistant-ui/assistant-ui/tree/main/examples/with-artifacts)

### 3-Column Top-Level Layout

```tsx
// Root layout composition
export default function Home() {
  const runtime = useChatRuntime();

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <main className="flex h-full justify-stretch">
        <div className="flex-grow basis-full">
          <Thread />
        </div>
        <ArtifactsView /> {/* Conditionally renders right panel */}
      </main>
    </AssistantRuntimeProvider>
  );
}
```

**Source**: assistant-ui [with-artifacts/app/page.tsx L112-128](https://github.com/assistant-ui/assistant-ui/tree/main/examples/with-artifacts)

---

## 2. Settings & Admin Dashboards

### Single-Tenant Settings Architecture

OpenClaw provides the most comprehensive reference for agent settings UI. Its config system has **6 categories** with **38 settings sections** (organized into 10 navigation tabs):

| Category | Sections |
|----------|----------|
| **Core** | Environment, Authentication, Updates, Meta, Logging, Diagnostics, CLI, Secrets |
| **AI & Agents** | Agents, Models, Skills, Tools, Memory, Session |
| **Communication** | Channels, Messages, Broadcast, Notifications, Talk, Audio |
| **Automation** | Commands, Hooks, Bindings, Cron, Approvals, Plugins |
| **Infrastructure** | Gateway, Web, Browser, NodeHost, CanvasHost, Discovery, Media, ACP, MCP |
| **Appearance** | Theme, UI, Setup Wizard |

**Source**: OpenClaw [config.ts L411-486](https://github.com/openclaw/openclaw)

### Settings Layout Modes

OpenClaw supports **two layout modes** for settings:

```typescript
// Two modes: tabbed (flat scroll) vs accordion (grouped collapsible)
settingsLayout?: "tabs" | "accordion";
```

**Tabbed Layout**: Sidebar nav with section links → scrolls to section in main area
**Accordion Layout**: Collapsible groups with back-to-quick-settings nav

**Source**: OpenClaw [config.ts L112-115](https://github.com/openclaw/openclaw)

### Settings Sidebar Navigation Pattern

```tsx
// OpenClaw settings navigation renders category groups with section items
function SettingsSectionNav({ activeTab, onTabChange }) {
  const SECTION_CATEGORIES = [
    { id: "core", label: "Core", sections: [
      { key: "env", label: "Environment", icon: <GearIcon /> },
      { key: "auth", label: "Authentication", icon: <LockIcon /> },
      // ...
    ]},
    { id: "ai", label: "AI & Agents", sections: [
      { key: "agents", label: "Agents", icon: <BotIcon /> },
      { key: "models", label: "Models", icon: <CubeIcon /> },
      // ...
    ]},
    // ... 4 more categories
  ];

  return (
    <nav className="settings-section-nav" aria-label="Settings sections">
      {SECTION_CATEGORIES.map(category => (
        <div key={category.id}>
          <h3 className="settings-category-label">{category.label}</h3>
          {category.sections.map(section => (
            <a
              key={section.key}
              className={cn("settings-nav-item", activeTab === section.key && "active")}
              onClick={(e) => { e.preventDefault(); onTabChange(section.key); }}
            >
              <span className="settings-nav-icon">{section.icon}</span>
              <span className="settings-nav-label">{section.label}</span>
            </a>
          ))}
        </div>
      ))}
    </nav>
  );
}
```

**Source**: OpenClaw [config.ts L442-486](https://github.com/openclaw/openclaw)

### Config Form: Schema-Driven Rendering

OpenClaw uses a **JSON Schema-driven config form** that auto-generates UI from the schema definition:

```typescript
// Config system core types
type ConfigProps = {
  raw: string;                           // Raw JSON5 text
  originalRaw: string;                   // Original for diff comparison
  valid: boolean | null;                 // Validation state
  issues: unknown[];                     // Validation errors
  schema: unknown;                       // JSON Schema definition
  formValue: Record<string, unknown>;    // Parsed form values
  originalValue: Record<string, unknown>; // Original for diff
  formMode: "form" | "raw";             // Toggle: visual form vs raw JSON
  searchQuery: string;                   // Filter settings by search

  // Callbacks
  onFormPatch: (path: Array<string | number>, value: unknown) => void;
  onSave: () => void;
  onApply: () => void;   // Apply without restart
  onReload: () => void;  // Reload from disk
  onReset: () => void;   // Discard changes
};
```

**Source**: OpenClaw [config.ts L50-121](https://github.com/openclaw/openclaw)

### Config Diffing System

OpenClaw computes diffs between original and current config to show what changed:

```typescript
// Bounded depth/node limits prevent stack overflow on adversarial input
const MAX_CONFIG_DIFF_DEPTH = 64;
const MAX_CONFIG_DIFF_NODES = 20_000;
const MAX_CONFIG_DIFF_CHANGES = 1_000;
const MAX_CONFIG_DIFF_ARRAY_COMPARE_ITEMS = 2_000;

// Cache prevents re-computation on every render
let rawDiffCache: { original: string; current: string; diff: ConfigDiffEntry[] } | undefined;
```

**Source**: OpenClaw [config.ts L541-711](https://github.com/openclaw/openclaw)

### Sensitive Value Handling

```typescript
// Redaction system for API keys, secrets, passwords
const REDACTED_PLACEHOLDER = "••••••••";

function isSensitiveConfigPath(path: string): boolean {
  // Checks against known sensitive patterns
}

function renderDiffValue(path, value, uiHints): string {
  if (isSensitiveConfigPath(formatConfigDiffPath(path)) && value != null) {
    return REDACTED_PLACEHOLDER;
  }
  return truncateValue(value);
}
```

**Source**: OpenClaw [config.ts L730-738](https://github.com/openclaw/openclaw)

### Multi-Tenant Dashboard Architecture

For multi-tenant (B2B SaaS) admin dashboards:

| Layer | Pattern | Recommended Tool |
|-------|---------|-----------------|
| **Auth & Org Management** | Organization/Member primitives with RBAC | [Clerk](https://clerk.com/) or [PropelAuth](https://www.propelauth.com/) |
| **Routing** | Path-based: `/org/{orgId}/dashboard` (easier local dev) | [TanStack Router](https://tanstack.com/router) |
| **Data Isolation** | Every API request includes `tenant_id` header or path param | Backend middleware |
| **Tenant Context** | React Context wrapping the entire tenant-scoped subtree | `TenantProvider` |
| **Config Storage** | Dedicated settings table per tenant (theme, features, API keys) | Database table |
| **White-labeling** | CSS custom properties injected from tenant config | `TenantThemeProvider` |

**Sources**: [Clerk multi-tenancy docs](https://clerk.com/), [PropelAuth B2B auth](https://www.propelauth.com/)

```tsx
// TenantProvider pattern for multi-tenant SPA
const TenantContext = createContext<TenantConfig | null>(null);

function TenantProvider({ children }: { children: ReactNode }) {
  const { orgId } = useOrganization(); // From Clerk/PropelAuth
  const { data: config } = useQuery({
    queryKey: ["tenant-config", orgId],
    queryFn: () => fetchTenantConfig(orgId),
  });

  if (!config) return <LoadingState />;

  return (
    <TenantContext.Provider value={config}>
      {/* Inject tenant theme as CSS variables */}
      <div style={{
        "--brand-primary": config.theme.primaryColor,
        "--brand-logo": `url(${config.theme.logoUrl})`,
      } as React.CSSProperties}>
        {children}
      </div>
    </TenantContext.Provider>
  );
}
```

### Settings Page Structure (React + Vite)

```tsx
// Settings layout with sidebar nav
function SettingsPage() {
  const [section, setSection] = useState("general");

  return (
    <div className="flex h-full">
      {/* Settings sidebar — fixed */}
      <nav className="w-60 border-r flex flex-col gap-1 p-4">
        {SETTINGS_SECTIONS.map(s => (
          <button
            key={s.key}
            onClick={() => setSection(s.key)}
            className={cn(
              "flex items-center gap-2 rounded-md px-3 py-2 text-sm",
              section === s.key
                ? "bg-accent text-accent-foreground font-medium"
                : "text-muted-foreground hover:bg-muted"
            )}
          >
            {s.icon}
            {s.label}
          </button>
        ))}
      </nav>

      {/* Settings content — scrollable */}
      <div className="flex-1 overflow-y-auto p-6">
        {section === "general" && <GeneralSettings />}
        {section === "models" && <ModelSettings />}
        {section === "agents" && <AgentSettings />}
        {section === "appearance" && <AppearanceSettings />}
        {/* ... */}
      </div>
    </div>
  );
}
```

### Appearance Settings Pattern (from OpenClaw)

OpenClaw's appearance settings include:

| Setting | Type | Implementation |
|---------|------|---------------|
| **Theme** | Selection (Claw, Knot, Dash + custom import) | Radio group with previews |
| **Theme Mode** | Light / Dark / System | Toggle group |
| **Border Radius** | 5 stops (None → Full) | Slider with labels |
| **Text Scale** | 5 stops (90% → 140%) | Slider with labels |
| **Custom Theme Import** | URL input | Fetches CSS from URL, validates, applies |

```typescript
// Border radius stops
const BORDER_RADIUS_LABELS: Record<BorderRadiusStop, string> = {
  0: "None", 25: "Slight", 50: "Default", 75: "Round", 100: "Full",
};

// Text scale stops
const TEXT_SCALE_LABELS: Record<TextScaleStop, string> = {
  90: "Small", 100: "Default", 110: "Large", 125: "XL", 140: "XXL",
};
```

**Source**: OpenClaw [config.ts L27-41](https://github.com/openclaw/openclaw)

---

## 3. Animation System

### Philosophy: CSS-First, No JS Animation Libraries

In June 2026, production AI chat UIs use **CSS transitions and @keyframes exclusively**. No Framer Motion. No GSAP. No react-spring. The reasons:

1. **CSS animations don't block the main thread** — they run on the compositor
2. **No bundle size cost** — CSS is free
3. **No React render overhead** — animations bypass the reconciler
4. **Motion-reduce is trivial** — `motion-reduce:animate-none`

**Source**: assistant-ui uses zero JS animation libraries across 36 components and 605 TSX files

### Animation Catalog (Full Reference)

#### A. Message Entrance

```css
/* Every message fades in and slides up */
.assistant-message {
  animation: fade-in 150ms ease, slide-in-from-bottom-1 150ms ease;
}
.user-message {
  animation: fade-in 150ms ease, slide-in-from-bottom-1 150ms ease;
}
/* Welcome text — slightly longer for emphasis */
.welcome-text {
  animation: fade-in 200ms ease, slide-in-from-bottom-1 200ms ease;
  animation-fill-mode: both;
}
```

#### B. Collapsible Open/Close (Reasoning, Tool Details)

```css
/* Organic cubic-bezier easing */
[data-state="open"] {
  animation: collapsible-down 200ms cubic-bezier(0.32, 0.72, 0, 1);
}
[data-state="open"] > .content {
  animation: fade-in 200ms, slide-in-from-top-4 200ms, blur-in-2px 200ms;
}
[data-state="closed"] {
  animation: collapsible-up 200ms cubic-bezier(0.32, 0.72, 0, 1);
  pointer-events: none;
  animation-fill-mode: forwards;
}
[data-state="closed"] > .content {
  animation: fade-out 200ms, slide-out-to-top-4 200ms, blur-out-2px 200ms;
}
```

#### C. Shimmer Effect (Active Tool Indicator)

```css
.shimmer {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
  background-size: 200%;
  animation: shimmer 2s infinite;
}
@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

#### D. Copy → Check Feedback

```css
.check-icon-enter {
  animation: zoom-in-50 200ms ease-out, fade-in 200ms;
}
.copy-icon-enter {
  animation: zoom-in-75 150ms, fade-in 150ms;
}
```

#### E. Scroll-to-Bottom Button

```css
.scroll-to-bottom {
  position: absolute;
  top: -3rem;
  z-index: 10;
  align-self: center;
  border-radius: 9999px;
  transition: opacity 150ms;
}
.scroll-to-bottom:disabled {
  visibility: hidden;
}
```

#### F. Dot Matrix Status (20 States)

Each state has unique animation parameters:

```typescript
const DOT_MATRIX_STATES = {
  idle:        { animation: "none", base: 0.3 },
  loading:     { pattern: "twinkle", duration: "0.9-1.6s", delay: "random" },
  thinking:    { pattern: "wave", duration: "1.2s", delay: "(row+col)*0.09" },
  streaming:   { pattern: "sweep-rows", duration: "0.9s", delay: "row*0.12" },
  searching:   { pattern: "sweep-cols", duration: "1.1s", delay: "col*0.12" },
  syncing:     { pattern: "radial-rotation", duration: "1.3s", delay: "atan2 based" },
  connecting:  { pattern: "diamond-expansion", duration: "1.4s", delay: "Chebyshev dist" },
  waiting:     { glyph: "ELLIPSIS", duration: "1.2s", delay: "col*0.09" },
  uploading:   { pattern: "sweep-up", duration: "1s", delay: "row based reverse" },
  downloading: { pattern: "sweep-down", duration: "1s", delay: "row*0.12" },
  listening:   { pattern: "radial-pulse", duration: "0.7-1.2s" },
  speaking:    { pattern: "wave-fast", duration: "0.4-0.75s" },
  recording:   { color: "red-500", glyph: "RECORD", duration: "1.4s" },
  success:     { glyph: "CHECK", color: "emerald-500" },
  error:       { glyph: "CROSS", color: "red-500", duration: "1.1s" },
  warning:     { glyph: "BANG", color: "amber-500", duration: "1.6s" },
  info:        { glyph: "INFO", color: "blue-500" },
  paused:      { glyph: "PAUSE", color: "muted-foreground" },
  stopped:     { glyph: "STOP", color: "muted-foreground" },
  offline:     { base: 0.15, color: "muted-foreground" },
};
```

**Source**: assistant-ui [dot-matrix.tsx](https://github.com/assistant-ui/assistant-ui)

#### G. Number Roll (CSS Houdini)

```css
/* Register custom property for animation */
@property --aui-number-roll-pos {
  syntax: "<number>";
  inherits: true;
  initial-value: 0;
}

.number-roll-digit {
  --duration: 500ms;
  --ease: cubic-bezier(0.23, 1, 0.32, 1);
  transition: --aui-number-roll-pos var(--duration) var(--ease);
  /* Digits translate based on CSS mod() */
  transform: translateY(
    clamp(-1lh, calc((mod(mod(CELL - var(--pos), 10) + 5, 10) - 5) * 1lh), 1lh)
  );
}
```

**Source**: assistant-ui [number-roll.tsx](https://github.com/assistant-ui/assistant-ui)

#### H. Voice Orb (WebGL2 Shader)

- Full fragment shader with 3D simplex noise
- Volume-reactive amplitude
- State interpolation via `lerp(current, target, 0.045)` per frame
- Explicit GPU context cleanup: `gl.getExtension("WEBGL_lose_context")?.loseContext()`

**Source**: assistant-ui [voice.tsx](https://github.com/assistant-ui/assistant-ui)

### Duration Standards

| Animation | Duration | Easing |
|-----------|----------|--------|
| Message entrance | 150ms | ease |
| Welcome text | 200ms | ease, fill-mode: both |
| Collapsible open/close | 200ms | cubic-bezier(0.32, 0.72, 0, 1) |
| Copy feedback | 200ms | ease-out |
| Shimmer cycle | 2000ms | linear |
| Number roll | 500ms | cubic-bezier(0.23, 1, 0.32, 1) |
| Dot matrix blink | 400ms-1600ms | varies by state (see dot-matrix.tsx for exact per-state values) |
| Voice orb lerp | ~750ms (0.045/frame at 60fps) | linear interp |
| Sidebar collapse | 200ms | linear |
| Popover appear | 150ms | ease (zoom-in-95 + fade-in) |

### Accessibility: Motion Reduction

**Every single animation** must have a reduced-motion counterpart:

```css
@media (prefers-reduced-motion: reduce) {
  .message { animation: none; }
  .shimmer { animation: none; }
  .dot-matrix-dot { animation: none; }
  .number-roll-digit { transition: none; }
  .collapsible { animation: none; }
}

/* Tailwind pattern used by assistant-ui */
className="motion-reduce:animate-none"
className="motion-reduce:transition-none"
```

**Source**: assistant-ui applies `motion-reduce:` variants consistently across all animated components

---

## 4. Landing Page & Empty States

### The "Welcome State" Pattern

assistant-ui distinguishes between **empty chat** (no messages) and **active chat** (has messages) using a state check:

```tsx
const isEmpty = useAuiState(isNewChatView);

<div className={cn(
  "mx-auto flex w-full max-w-(--thread-max-width) flex-col px-4 pt-4",
  isEmpty && "justify-center",  // Centers welcome vertically
)}>
  {isEmpty ? <WelcomeScreen /> : <MessageList />}
</div>
```

**Source**: assistant-ui [thread.tsx](https://github.com/assistant-ui/assistant-ui)

### Welcome Screen Components

```tsx
function WelcomeScreen() {
  return (
    <ThreadPrimitive.Empty>
      <div className="flex w-full max-w-2xl flex-grow flex-col justify-center px-4">
        {/* Greeting */}
        <h2 className="fade-in slide-in-from-bottom-1 animate-in fill-mode-both
                        text-2xl font-semibold duration-200">
          How can I help you?
        </h2>

        {/* Suggestion chips (3-4 max — progressive disclosure) */}
        <div className="mt-6 flex flex-wrap gap-2">
          <SuggestionChip
            title="Build a landing page"
            label="with modern styling"
            prompt="Build a beautiful landing page for a coffee shop."
          />
          <SuggestionChip
            title="Create a calculator"
            label="with HTML and JavaScript"
            prompt="Create a calculator app with HTML, CSS, and JavaScript."
          />
        </div>
      </div>
    </ThreadPrimitive.Empty>
  );
}
```

**Source**: assistant-ui [with-artifacts/app/page.tsx L88-110](https://github.com/assistant-ui/assistant-ui/tree/main/examples/with-artifacts)

### Suggestion Chips

```tsx
// Suggestion API from assistant-ui
const aui = useAui({
  suggestions: Suggestions([
    {
      title: "Build a landing page",    // Main text
      label: "with modern styling",     // Subtitle
      prompt: "Build a beautiful landing page for a coffee shop with modern CSS.",
    },
    // ... 2-3 more
  ]),
});
```

**Source**: assistant-ui `Suggestions` API

### Empty State Hierarchy

| State | What to Show | UX Goal |
|-------|-------------|---------|
| **First visit ever** | Welcome greeting + 3-4 suggestion chips + capability description | Minimize time-to-aha |
| **Returning user, new chat** | Shorter greeting + recently-used prompt templates | Speed up repeat usage |
| **Thread list empty** | "No conversations yet" + "Start your first chat" CTA | Guide to first action |
| **Search with no results** | "No results for [query]" + clear search button | Prevent dead-end |
| **Error / Disconnected** | Connection status dot + retry button + last-known state | Build trust through transparency |

### Composer State Transitions

The composer changes behavior based on chat state:

```tsx
// Composer position shifts based on empty vs active chat
<div className={cn(
  "bg-background flex flex-col gap-4 overflow-visible pb-4 md:pb-6",
  !isEmpty && "sticky bottom-0 mt-auto rounded-t-(--composer-radius)",
  // Centered when empty → sticky to bottom when active
)}>
  <ComposerPrimitive.Root>
    <ComposerPrimitive.Input placeholder="Send a message..." />
    <AuiIf condition={(s) => s.thread.isRunning}>
      <ComposerPrimitive.Cancel /> {/* Stop button while streaming */}
    </AuiIf>
    <AuiIf condition={(s) => !s.thread.isRunning}>
      <ComposerPrimitive.Send />
    </AuiIf>
  </ComposerPrimitive.Root>
</div>
```

**Source**: assistant-ui [thread.tsx](https://github.com/assistant-ui/assistant-ui)

---

## 5. State Hydration (SPA-Specific)

### React + Vite = No SSR Hydration Issues (But Other Issues Exist)

In a Vite SPA, there is **no server-rendered HTML mismatch problem** because there is no server render. However, you face analogous issues:

| Problem | Cause | Solution |
|---------|-------|----------|
| **Flash of default state** | localStorage read is async in first render | Initialize state from localStorage synchronously in useState initializer |
| **Flash of empty content** | Data fetching starts after mount | Use `Suspense` + preload on route transition |
| **Theme flash (FOUC)** | Theme class applied after JS loads | Inject theme class in `index.html` `<script>` before React mounts |
| **Auth flash** | Auth check is async | Use `<AuthProvider>` with loading state before rendering app tree |
| **Stale cache** | TanStack Query shows stale data during revalidation | Use `staleTime` + `placeholderData` for instant perceived load |

### Synchronous State Initialization

```tsx
// ✅ Correct: synchronous read in initializer — no flash
const [theme, setTheme] = useState(() => {
  return localStorage.getItem("theme") || "dark";
});

// ❌ Wrong: async read in useEffect — causes flash
const [theme, setTheme] = useState("dark");
useEffect(() => {
  const saved = localStorage.getItem("theme");
  if (saved) setTheme(saved);
}, []);
```

### Theme Flash Prevention (index.html)

```html
<!-- In index.html, BEFORE React loads -->
<script>
  (function() {
    const theme = localStorage.getItem('theme') || 'dark';
    document.documentElement.classList.add(theme);
    // Also set CSS custom properties for instant theming
    if (theme === 'dark') {
      document.documentElement.style.setProperty('color-scheme', 'dark');
    }
  })();
</script>
```

### Auth Guard Pattern

```tsx
function AuthGuard({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return <SplashScreen />; // Full-screen branded loading
  }

  if (!isSignedIn) {
    return <LoginPage />;
  }

  return children;
}
```

### Suspense Boundaries for Data Loading

```tsx
function ChatRoute() {
  return (
    <Suspense fallback={<ThreadSkeleton />}>
      <ThreadLoader />
    </Suspense>
  );
}

function ThreadLoader() {
  // This suspends until data is ready
  const { data: messages } = useSuspenseQuery({
    queryKey: ["messages", threadId],
    queryFn: () => fetchMessages(threadId),
  });

  return <Thread messages={messages} />;
}
```

### Skeleton States (assistant-ui Pattern)

```tsx
// Sidebar skeleton with randomized widths for natural look
function SidebarMenuSkeleton({ showIcon = false }) {
  const width = useMemo(() => `${Math.floor(Math.random() * 40) + 50}%`, []);

  return (
    <div className="flex h-8 items-center gap-2 rounded-md px-2">
      {showIcon && <Skeleton className="size-4 rounded-md" />}
      <Skeleton className="h-4 flex-1" style={{ maxWidth: width }} />
    </div>
  );
}
```

**Source**: assistant-ui [sidebar.tsx L601-636](https://github.com/assistant-ui/assistant-ui)

---

## 6. Race Condition Management

### The 5 Race Conditions in AI Chat Apps

| Race Condition | Scenario | Solution |
|----------------|----------|----------|
| **Stale closure** | `useEffect` callback references stale state | Use `useRef` for mutable state; AbortController for cleanup |
| **Overlapping streams** | User sends new message before previous completes | AbortController cancels previous stream; ID-based message targeting |
| **Double-send** | User clicks send twice rapidly | Disable button + local `submitted` state + debounce |
| **Out-of-order responses** | Multiple API calls return in wrong order | Request ID matching; only apply response if ID matches latest |
| **Zombie updates** | Component unmounts while stream is active | AbortController in cleanup function; check `abortSignal.aborted` before setState |

### AbortController Pattern (The Foundation)

```tsx
function useStreamingChat() {
  const abortRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(async (text: string) => {
    // Cancel any in-flight request
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        body: JSON.stringify({ message: text }),
        signal: controller.signal,
      });

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done || controller.signal.aborted) break;

        const chunk = decoder.decode(value, { stream: true });
        // Only update state if this is still the current request
        if (!controller.signal.aborted) {
          appendToCurrentMessage(chunk);
        }
      }
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") {
        return; // Expected cancellation — not an error
      }
      throw e;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  return { sendMessage };
}
```

### Index-Based Message Updates (Not Array Push)

```tsx
// ❌ Anti-pattern: array push creates race between overlapping streams
setMessages(prev => [...prev, { text: chunk }]);

// ✅ Correct: ID-based targeting — each message has unique ID
const messageId = useRef(0);

function startMessage() {
  const id = ++messageId.current;
  setMessages(prev => [...prev, { id, text: "", status: "streaming" }]);
  return id;
}

function appendToMessage(id: number, chunk: string) {
  setMessages(prev =>
    prev.map(msg =>
      msg.id === id ? { ...msg, text: msg.text + chunk } : msg
    )
  );
}
```

### Double-Send Prevention

```tsx
// assistant-ui pattern: local submitted state + disable
function ToolApprovalButton({ onApprove }) {
  const [submitted, setSubmitted] = useState(false);

  return (
    <button
      disabled={submitted}
      onClick={() => {
        setSubmitted(true); // Immediately disable — optimistic
        onApprove();
      }}
    >
      {submitted ? "Approved..." : "Approve"}
    </button>
  );
}
```

**Source**: assistant-ui [tool-fallback.tsx](https://github.com/assistant-ui/assistant-ui) — approval buttons use local `submitted` state

### TanStack Query: Built-In Race Protection

```tsx
// TanStack Query handles stale-while-revalidate and request deduplication
const { data: threads } = useQuery({
  queryKey: ["threads", userId],
  queryFn: () => fetchThreads(userId),
  staleTime: 30_000,           // Don't refetch for 30s
  gcTime: 5 * 60 * 1000,      // Keep in cache for 5 min
  placeholderData: keepPreviousData, // Show old data while fetching new
});
```

### Scroll Lock During Content Changes

```tsx
// Prevent scroll jumps when collapsible content opens/closes
function useScrollLock(ref: RefObject<HTMLElement>, duration: number) {
  const lock = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const scrollTop = el.scrollTop;
    el.style.overflow = "hidden";
    el.scrollTop = scrollTop;
    setTimeout(() => {
      el.style.overflow = "";
    }, duration);
  }, [ref, duration]);
  return lock;
}
```

**Source**: assistant-ui uses `useScrollLock` with `ANIMATION_DURATION` to prevent scroll jumps during collapsible transitions

### Stream Reconnection Pattern

```tsx
// SSE (Server-Sent Events) with automatic reconnection
function useSSEStream(url: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const retryCount = useRef(0);
  const maxRetries = 5;

  useEffect(() => {
    let eventSource: EventSource | null = null;

    function connect() {
      eventSource = new EventSource(url);

      eventSource.onmessage = (event) => {
        retryCount.current = 0; // Reset on success
        const data = JSON.parse(event.data);
        setMessages(prev => [...prev, data]);
      };

      eventSource.onerror = () => {
        eventSource?.close();
        if (retryCount.current < maxRetries) {
          retryCount.current++;
          // Exponential backoff: 1s, 2s, 4s, 8s, 16s
          const delay = Math.min(1000 * 2 ** retryCount.current, 16000);
          setTimeout(connect, delay);
        }
      };
    }

    connect();
    return () => eventSource?.close();
  }, [url]);

  return messages;
}
```

---

## 7. Mobile-Ready Architecture

### Mobile Detection Hook (from assistant-ui)

```typescript
const MOBILE_BREAKPOINT = 768;

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState<boolean | undefined>(undefined);

  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    mql.addEventListener("change", onChange);
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return !!isMobile;
}
```

**Source**: assistant-ui [use-mobile.ts](https://github.com/assistant-ui/assistant-ui)

### Mobile Sidebar → Sheet Drawer

assistant-ui automatically converts the sidebar into a **Sheet (drawer)** on mobile:

```tsx
function Sidebar({ side = "left", collapsible = "offcanvas", children }) {
  const { isMobile, openMobile, setOpenMobile } = useSidebar();

  // MOBILE: Sheet drawer (swipeable)
  if (isMobile) {
    return (
      <Sheet open={openMobile} onOpenChange={setOpenMobile}>
        <SheetContent
          data-mobile="true"
          side={side}
          className="w-(--sidebar-width) p-0"
          style={{ "--sidebar-width": "18rem" } as CSSProperties}
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Sidebar</SheetTitle>
            <SheetDescription>Displays the mobile sidebar.</SheetDescription>
          </SheetHeader>
          <div className="flex h-full w-full flex-col">{children}</div>
        </SheetContent>
      </Sheet>
    );
  }

  // DESKTOP: Fixed sidebar with gap
  return (
    <div
      className="group peer text-sidebar-foreground hidden md:block"
      data-state={state}
      data-collapsible={state === "collapsed" ? collapsible : ""}
    >
      {/* Gap element handles sidebar space reservation */}
      <div className="relative w-(--sidebar-width) transition-[width] duration-200 ease-linear" />
      {/* Fixed sidebar container */}
      <div className="fixed inset-y-0 z-10 h-svh w-(--sidebar-width)">
        {children}
      </div>
    </div>
  );
}
```

**Source**: assistant-ui [sidebar.tsx L153-252](https://github.com/assistant-ui/assistant-ui)

### Mobile Layout Strategy: 3-Column → Tabbed/Drawer

```
DESKTOP (≥768px)                    MOBILE (<768px)
┌─────┬──────────┬──────┐          ┌──────────────┐
│ Hx  │  Chat    │ Art  │          │   Chat       │
│     │          │      │    →     │              │
│     │          │      │          │              │
│     │          │      │          ├──────────────┤
│     │ Composer │      │          │  Composer    │
└─────┴──────────┴──────┘          ├──────────────┤
                                   │ ☰ │ 💬 │ 📄 │
                                   └──────────────┘
                                     ↑ Bottom tabs
```

### Mobile Layout Implementation

```tsx
function MobileLayout() {
  const [activeTab, setActiveTab] = useState<"chat" | "history" | "artifacts">("chat");

  return (
    <div className="flex h-dvh flex-col">
      {/* Main content area */}
      <div className="flex-1 overflow-hidden">
        {activeTab === "chat" && <Thread />}
        {activeTab === "history" && <ThreadList />}
        {activeTab === "artifacts" && <ArtifactsPanel />}
      </div>

      {/* Bottom tab bar — thumb-friendly zone */}
      <nav className="flex border-t bg-background safe-area-inset-bottom">
        <TabButton
          icon={<MessageIcon />}
          label="Chat"
          active={activeTab === "chat"}
          onClick={() => setActiveTab("chat")}
        />
        <TabButton
          icon={<HistoryIcon />}
          label="History"
          active={activeTab === "history"}
          onClick={() => setActiveTab("history")}
        />
        <TabButton
          icon={<CodeIcon />}
          label="Artifacts"
          active={activeTab === "artifacts"}
          onClick={() => setActiveTab("artifacts")}
          // Badge shows when artifact is available
          badge={hasArtifact ? "1" : undefined}
        />
      </nav>
    </div>
  );
}
```

### Mobile Bottom Sheet for Artifacts

Instead of a tab, artifacts can slide up as a **bottom sheet**:

```tsx
function MobileArtifactSheet({ artifact, onClose }) {
  const [dragY, setDragY] = useState(0);
  const sheetRef = useRef<HTMLDivElement>(null);

  // Dismiss on swipe-down
  const handleTouchMove = (e: TouchEvent) => {
    const touch = e.touches[0];
    const dy = touch.clientY - startY;
    if (dy > 0) setDragY(dy);
    if (dy > 150) onClose(); // Threshold to dismiss
  };

  if (!artifact) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />

      {/* Sheet */}
      <div
        ref={sheetRef}
        className="fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl bg-background
                   max-h-[85dvh] overflow-hidden shadow-2xl
                   transition-transform duration-200"
        style={{ transform: `translateY(${dragY}px)` }}
        onTouchMove={handleTouchMove}
      >
        {/* Drag handle */}
        <div className="flex justify-center py-3">
          <div className="h-1.5 w-12 rounded-full bg-muted-foreground/20" />
        </div>

        <div className="overflow-y-auto px-4 pb-safe">
          <ArtifactsView artifact={artifact} />
        </div>
      </div>
    </>
  );
}
```

### Mobile-Specific CSS Patterns

```css
/* Safe area insets for notched devices */
.safe-area-inset-bottom {
  padding-bottom: env(safe-area-inset-bottom, 0px);
}

/* Dynamic viewport height (accounts for mobile browser chrome) */
.h-dvh {
  height: 100dvh; /* Not 100vh — dvh adjusts for mobile URL bar */
}

/* Larger touch targets */
.mobile-touch-target {
  min-height: 44px;     /* Apple HIG minimum */
  min-width: 44px;
}

/* Prevent iOS zoom on input focus */
input, textarea, select {
  font-size: 16px;      /* Prevents iOS auto-zoom below 16px */
}

/* Hide sidebar on mobile — show via Sheet */
@media (max-width: 767px) {
  [data-slot="sidebar"] { display: none; }
}
```

### Mobile Hit Area Enhancement (from assistant-ui)

```tsx
// Sidebar menu actions get expanded hit areas on mobile
className={cn(
  "absolute end-1 top-1.5 flex aspect-square w-5 items-center justify-center",
  // Increases the hit area of the button on mobile
  "after:absolute after:-inset-2 md:after:hidden",
)}
```

**Source**: assistant-ui [sidebar.tsx L563-565](https://github.com/assistant-ui/assistant-ui)

---

## 8. Project Structure

### Recommended Directory Layout (React + Vite)

```
src/
├── components/
│   ├── chat/                    # Chat-specific components
│   │   ├── thread.tsx           # Main chat thread
│   │   ├── message.tsx          # Message rendering
│   │   ├── composer.tsx         # Input/send area
│   │   ├── reasoning.tsx        # Chain-of-thought display
│   │   ├── tool-fallback.tsx    # Tool call display + approval
│   │   ├── suggestion-chips.tsx # Welcome screen suggestions
│   │   └── action-bar.tsx       # Copy, edit, reload actions
│   │
│   ├── artifacts/               # Artifact panel components
│   │   ├── artifacts-panel.tsx  # Container with tabs
│   │   ├── source-view.tsx      # Code viewer
│   │   ├── preview-view.tsx     # iframe/sandboxed preview
│   │   └── diff-viewer.tsx      # Code diff display
│   │
│   ├── layout/                  # Layout components
│   │   ├── workbench.tsx        # 3-column layout root
│   │   ├── sidebar.tsx          # Left sidebar (thread list)
│   │   ├── mobile-layout.tsx    # Bottom-tab mobile layout
│   │   ├── mobile-sheet.tsx     # Bottom sheet for mobile artifacts
│   │   └── settings-layout.tsx  # Settings page with sidebar nav
│   │
│   ├── settings/                # Settings page sections
│   │   ├── general.tsx
│   │   ├── models.tsx
│   │   ├── agents.tsx
│   │   ├── appearance.tsx
│   │   └── api-keys.tsx
│   │
│   └── ui/                      # shadcn/ui primitives
│       ├── button.tsx
│       ├── resizable.tsx        # react-resizable-panels wrapper
│       ├── sheet.tsx            # Mobile drawer
│       ├── skeleton.tsx
│       └── tooltip.tsx
│
├── hooks/
│   ├── use-mobile.ts            # Mobile detection
│   ├── use-sidebar.ts           # Sidebar state
│   ├── use-scroll-lock.ts       # Scroll lock during animations
│   ├── use-streaming-chat.ts    # SSE/fetch streaming with AbortController
│   └── use-theme.ts             # Theme state with localStorage sync
│
├── stores/
│   ├── chat-store.ts            # Zustand: chat-specific client state
│   ├── layout-store.ts          # Zustand: panel sizes, sidebar state
│   └── settings-store.ts        # Zustand: user preferences
│
├── lib/
│   ├── api.ts                   # API client (fetch wrapper with auth)
│   ├── stream.ts                # SSE/streaming utilities
│   ├── cn.ts                    # clsx + tailwind-merge utility
│   └── constants.ts             # Breakpoints, durations, design tokens
│
├── routes/                      # TanStack Router or React Router
│   ├── __root.tsx
│   ├── index.tsx                # Chat page (workbench)
│   ├── settings.tsx             # Settings page
│   └── thread.$threadId.tsx     # Specific thread
│
├── styles/
│   ├── globals.css              # CSS custom properties, base styles
│   ├── animations.css           # @keyframes, animation utilities
│   └── themes.css               # Theme variants (dark, light, custom)
│
├── App.tsx
├── main.tsx
└── vite-env.d.ts
```

---

## 9. Performance Optimization

### Content Visibility (Not Virtual Scrolling)

```tsx
// Each message uses content-visibility for "free" virtualization
<div className="[content-visibility:auto] [contain-intrinsic-size:auto_24px]">
  <Message {...message} />
</div>
```

This tells the browser to skip rendering off-screen messages entirely. Unlike virtual scrolling libraries:
- No JavaScript measurement needed
- Works with native scroll
- Progressive enhancement (degrades gracefully)
- No height estimation errors
- No "scroll jump" bugs

**Source**: assistant-ui applies `[content-visibility:auto]` to every message container

### GPU-Accelerated Transforms

```css
.transform-gpu {
  transform: translateZ(0); /* Forces GPU compositing layer */
}
```

### Memoization Patterns

```tsx
// All message part components are memo'd to prevent re-render cascading
const Reasoning = memo(ReasoningImpl);
const ToolFallback = memo(ToolFallbackImpl);
const Image = memo(ImageImpl);

// Intl.NumberFormat instances are cached (construction is expensive)
const formatterCache = new Map<string, Intl.NumberFormat>();
function getFormatter(locale: string, options: Intl.NumberFormatOptions) {
  const key = `${locale}:${JSON.stringify(options)}`;
  let fmt = formatterCache.get(key);
  if (!fmt) {
    fmt = new Intl.NumberFormat(locale, options);
    formatterCache.set(key, fmt);
  }
  return fmt;
}
```

**Source**: assistant-ui [number-roll.tsx](https://github.com/assistant-ui/assistant-ui) — caches Intl.NumberFormat

### WebGL Cleanup

```tsx
// Voice orb properly cleans up GPU resources on unmount
useEffect(() => {
  // ... setup WebGL context ...
  return () => {
    cancelAnimationFrame(animRef.current);
    const ext = ctx.gl.getExtension("WEBGL_lose_context");
    ext?.loseContext(); // Explicitly release GPU context
  };
}, []);
```

**Source**: assistant-ui [voice.tsx](https://github.com/assistant-ui/assistant-ui)

### Lazy Loading for Settings/Admin Views

OpenClaw lazy-loads all non-critical views to keep the initial bundle small:

```typescript
// Lazy-loaded view modules — deferred so initial bundle stays small
const lazyAgents = createLazyView(() => import("./views/agents.ts"), notifyChanged);
const lazyActivity = createLazyView(() => import("./views/activity.ts"), notifyChanged);
const lazyCron = createLazyView(() => import("./views/cron.ts"), notifyChanged);
const lazyDebug = createLazyView(() => import("./views/debug.ts"), notifyChanged);
const lazySessions = createLazyView(() => import("./views/sessions.ts"), notifyChanged);
const lazySkills = createLazyView(() => import("./views/skills.ts"), notifyChanged);
const lazyUsage = createLazyView(() => import("./views/usage.ts"), notifyChanged);
// ... 6 more lazy views
```

**Source**: OpenClaw [app-render.ts L671-688](https://github.com/openclaw/openclaw)

### React Compiler (2026)

With React Compiler (now stable in React 19), manual `useMemo` and `useCallback` are **largely unnecessary**. The compiler automatically memoizes:
- Component bodies
- Hook dependencies
- Inline object/array creation
- Event handler closures

Focus on **architectural patterns** (state localization, selector-based subscriptions) rather than manual memoization.

---

## 10. Gotchas & Anti-Patterns

### Layout Gotchas

| Gotcha | Problem | Fix |
|--------|---------|-----|
| `100vh` on mobile | Doesn't account for mobile browser chrome (URL bar) | Use `100dvh` (dynamic viewport height) |
| Sidebar gap on collapse | Content doesn't fill space when sidebar collapses | Use `transition-[width]` on gap element (assistant-ui pattern) |
| Scroll position jump on expand | Opening collapsible content shifts scroll | Use `useScrollLock` during `ANIMATION_DURATION` |
| iOS input zoom | Inputs smaller than 16px trigger iOS auto-zoom | Set `font-size: 16px` minimum on all inputs |
| Safe area overlap | Content hidden behind notch/home indicator | Use `env(safe-area-inset-bottom)` padding |

### State Management Gotchas

| Gotcha | Problem | Fix |
|--------|---------|-----|
| Entire state subscription | Subscribing to whole store triggers every render | Use selector: `useAuiState((s) => s.thread.isRunning)` |
| Inline selector objects | `(s) => ({ a: s.a, b: s.b })` creates new reference every render | Use multiple selectors or Zustand's `shallow` comparator |
| localStorage during render | Can cause FOUC or hydration-like mismatch | Read synchronously in `useState` initializer, never in render body |
| useEffect for state sync | Creates 1-frame flicker of wrong state | Use `useSyncExternalStore` for external store subscription |

### Streaming Gotchas

| Gotcha | Problem | Fix |
|--------|---------|-----|
| No AbortController cleanup | Zombie streams update unmounted components | Always abort in useEffect cleanup and on new request |
| Array push for messages | Race condition between overlapping streams | Use ID-based message targeting |
| Missing `message-finish` check | UI shows incomplete content as final | Check for explicit `message-finish` or `stop` status |
| SSE reconnection flood | Auto-reconnect hammers server after disconnect | Exponential backoff: `min(1000 * 2^n, 16000)` |
| `text/event-stream` CORS | SSE blocked by CORS if backend doesn't set headers | Backend must set `Content-Type: text/event-stream` + CORS headers |

### Animation Gotchas

| Gotcha | Problem | Fix |
|--------|---------|-----|
| JS animation libraries | Framer Motion causes layout thrashing during streaming | Use CSS-only animations (transforms, opacity, filters) |
| No motion-reduce | Users with vestibular disorders get nausea/seizures | Add `motion-reduce:animate-none` to EVERY animated element |
| animation-fill-mode missing | Element snaps back to pre-animation state | Add `animation-fill-mode: both` for welcome animations |
| collapsible pointer events | Collapsed content is still clickable during close animation | Add `pointer-events: none` to `[data-state="closed"]` |

### Mobile Gotchas

| Gotcha | Problem | Fix |
|--------|---------|-----|
| Touch target too small | Users can't tap buttons | Minimum 44×44px (Apple HIG); use `after:absolute after:-inset-2` for invisible expansion |
| Bottom sheet over keyboard | Mobile keyboard pushes sheet up, breaking layout | Use `visualViewport` API to adjust sheet position |
| Horizontal scroll on thread | Long code blocks cause horizontal page scroll | Add `overflow-x: hidden` on thread container; use `overflow-x: auto` only on code blocks |
| Sheet accessibility | Screen readers can't detect drawer | Add `SheetTitle` and `SheetDescription` (even if `sr-only`) |

---

## 11. Comparative Case Studies: Codex, VS Code, Cursor, & Google Antigravity

In this section, we analyze four leading AI developer environments across five primary criteria: Layout Model, Multi-file edits, Terminal integration, Approval mechanism, and Orchestration surface.

### UI/UX Comparison Matrix

| Criteria | OpenAI Codex Desktop App [SRC-019] | VS Code Copilot Chat (Agent Mode) [SRC-020] | Cursor Composer (Agent Mode) [SRC-021] | Google Antigravity IDE & Standalone App [SRC-022] |
|:---|:---|:---|:---|:---|
| **Layout Model** | Centered 3-column project-based control center [CLAIM-158](../00_index/citation_map.md#claim-158) | Split side panel (Chat) or dedicated Agents Window [CLAIM-161](../00_index/citation_map.md#claim-161) | In-editor chat sidebar + Composer panel overlay [CLAIM-164](../00_index/citation_map.md#claim-164) | Standalone companion app + custom IDE fork [CLAIM-166](../00_index/citation_map.md#claim-166) |
| **Multi-file Edits** | Interactive tree view + diff inspect panel [CLAIM-159](../00_index/citation_map.md#claim-159) | Inline editor annotations / target edits | High-context side-by-side workspace edits [CLAIM-164](../00_index/citation_map.md#claim-164) | Planning-stage file checklist + diff review [CLAIM-167](../00_index/citation_map.md#claim-167) |
| **Terminal Integration** | Stdio/WebSocket jsonrpc via codex app-server [CLAIM-160](../00_index/citation_map.md#claim-160) | Integrated terminal with Rich Shell Integration [CLAIM-163](../00_index/citation_map.md#claim-163) | Integrated terminal with settings auto-run toggles [CLAIM-165](../00_index/citation_map.md#claim-165) | Proposed execution logs + bg task tracking [CLAIM-169](../00_index/citation_map.md#claim-169) |
| **Approval Mechanism** | Local sandboxing + manual approval prompts [CLAIM-159](../00_index/citation_map.md#claim-159) | Security-gated execution prompts in chat [CLAIM-162](../00_index/citation_map.md#claim-162) | Auto-run levels (Ask Every Time, Sandbox, YOLO) [CLAIM-165](../00_index/citation_map.md#claim-165) | Strict programmatic tool approval gates [CLAIM-169](../00_index/citation_map.md#claim-169) |
| **Orchestration Surface** | Threaded workspace threads running in parallel [CLAIM-158](../00_index/citation_map.md#claim-158) | Task/Agent manager window + Copilot CLI [CLAIM-161](../00_index/citation_map.md#claim-161) | In-pane task lists + .cursorrules formatting [CLAIM-164](../00_index/citation_map.md#claim-164) | Dedicated Manager Surface + artifact pipeline [CLAIM-166, CLAIM-167] |

### Key UI/UX Implementations & Takeaways

#### A. OpenAI Codex Desktop App (standalone) [SRC-019]
- **Multi-Threaded Layout**: Relies on a card-based multi-threaded control center interface to allow parallel agent project sessions [CLAIM-158](../00_index/citation_map.md#claim-158).
- **Computer Use & Visual Previews**: Uses a Visual Design Loop where the agent can run Chrome browser subagents or Playwright tests, capture screenshots, and allow the user to draw annotations/feedback directly in the UI for real-time UI/UX fixes [CLAIM-159](../00_index/citation_map.md#claim-159).
- **Local Sandbox Execution**: Binds all commands and tool calls to local secure sandboxes (Bubblewrap/Landlock for Linux, Seatbelt for macOS, restricted tokens on Windows) and routes them through a local WebSocket/Unix socket using `codex app-server` [CLAIM-160, CLAIM-007].

#### B. VS Code Copilot Chat (Agent Mode) [SRC-020]
- **Chat vs Agents Surface**: Splitting the UX into a code-first Chat view for focused file editing and a dedicated *Agents Window* for executing broader, cross-project tasks [CLAIM-161](../00_index/citation_map.md#claim-161).
- **Dynamic Tool Pickers**: Renders an interactive Tool Picker inside the composer input, letting the user toggle permission profiles or custom MCP tools for each turn [CLAIM-163](../00_index/citation_map.md#claim-163).
- **Rich Shell Integration**: Reads and analyzes terminal outputs (using VS Code's rich terminal capabilities) to feed errors/warnings back into the agent loop for self-healing runs [CLAIM-162](../00_index/citation_map.md#claim-162).

#### C. Cursor Composer (Agent Mode) [SRC-021]
- **Composer Panel Layout**: High-context multi-file editor panel overlaying the workspace. Edits are applied as red/green inline diffs inside the editor so the user can verify changes side-by-side [CLAIM-164](../00_index/citation_map.md#claim-164).
- **Granular Settings**: Exposes `Auto-Run Mode` to control shell execution safety: `Ask Every Time` (requires click), `Run in Sandbox` (restricted scopes), and `Run Everything` (YOLO mode) [CLAIM-165](../00_index/citation_map.md#claim-165).
- **CLI Policy Control**: Supports project-level rules (like `.cursor/cli.json`) to white-list or black-list specific terminal tools and CLI utilities [CLAIM-165](../00_index/citation_map.md#claim-165).

#### D. Google Antigravity [SRC-022]
- **Dedicated Manager Surface**: A visual workspace monitor tracking active agent execution states, background tasks, directory scopes, and subagent lifecycles [CLAIM-166](../00_index/citation_map.md#claim-166).
- **Lifecycle Artifacts**: Standardizes plan-to-walkthrough workflows by generating and updating `implementation_plan.md`, `task.md`, and `walkthrough.md` files in the user's workspace [CLAIM-167](../00_index/citation_map.md#claim-167).
- **WebGL/WebP Visual logs**: Automatically captures and records browser subagent visual testing logs as WebP animation loops [CLAIM-168](../00_index/citation_map.md#claim-168).
- **Interactivity & Approvals**: Gates shell commands and filesystem edits behind granular approval prompts, accepting keyboard shortcuts and slash commands like `/goal`, `/schedule`, and `/grill-me` [CLAIM-169](../00_index/citation_map.md#claim-169).

---

## 12. Generative UI in Responses, MCP Apps, & MCP UI

In June 2026, the AI frontend ecosystem has shifted from static, passive text chats to **Intent-Based Generative User Interfaces (GenUI)** and **Model Context Protocol (MCP) Apps** [CLAIM-170, CLAIM-174].

### A. Open Source Ecosystem & Tools (June 2026)

Several frameworks form the standard stack for authoring and rendering agentic UIs:
- **Vercel AI SDK (AI SDK UI)**: The dominant React/TypeScript toolkit for handling token streaming, structured outputs, and rendering dynamic UI cards on the fly [CLAIM-172](../00_index/citation_map.md#claim-172).
- **CopilotKit**: An open-source agentic application framework designed specifically for React. It uses the **AG-UI protocol** to allow autonomous backend agents to invoke, modify, and synchronize frontend React components dynamically [CLAIM-173](../00_index/citation_map.md#claim-173).
- **Mastra AI & `mcp-use`**: High-performance TypeScript frameworks for building agents and workflows. They provide native primitives for authoring MCP servers that expose rich interactive UI components as visual tools alongside traditional data endpoints [CLAIM-176](../00_index/citation_map.md#claim-176).

### B. Generative UI in the Responses API

Rather than letting models output raw unstructured text, applications leverage stateful completions (like the OpenAI Responses API or the self-hosted Open Responses) to generate interactive layouts [CLAIM-170, CLAIM-118].
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

```
┌──────────────────────────────┐                   ┌──────────────────────────────┐
│       Host Client (IDE)      │                   │      Remote MCP Server       │
│                              │                   │                              │
│  ┌────────────────────────┐  │                   │  ┌────────────────────────┐  │
│  │ Sandboxed iframe       │  │                   │  │ Tool / Widget Schema   │  │
│  │                        │  │  Get UI Widget    │  │                        │  │
│  │ <html>                 │  │ ────────────────> │  │ html: "<div>...</div>" │  │
│  │   <button id="submit"> │  │ <──────────────── │  │ css:  ".btn { ... }"   │  │
│  │ </html>                │  │  Iframe Payload   │  │ js:   "submit.onclick" │  │
│  └────────────────────────┘  │                   │  └────────────────────────┘  │
│               │              │                   │                              │
│               └──────────────┼─── JSON-RPC IPC ──┼───────────────> Tool Action  │
└──────────────────────────────┘                   └──────────────────────────────┘
```

1. **Security Isolation (Sandboxed Iframe)**: To prevent malicious code execution, the host never renders raw HTML/JS from the server directly into the main DOM. Instead, MCP Apps enforce rendering within an isolated `<iframe>` container with strict sandbox permissions (e.g. `sandbox="allow-scripts"`, blocking top-level navigation and credential cookies) [CLAIM-175](../00_index/citation_map.md#claim-175).
2. **Bi-directional State Synchronization**: The iframe communicates with the parent host application via JSON-RPC messages routed over window postMessage. Button clicks or form changes in the MCP UI emit notifications that update the agent state or trigger subsequent tool calls [CLAIM-174](../00_index/citation_map.md#claim-174).
3. **Stateless Core and the Tasks Extension**: With MCP's transition to a stateless protocol core in 2026, the **Tasks Extension** was introduced to model long-running, asynchronous agent processes [CLAIM-177](../00_index/citation_map.md#claim-177). Instead of holding connection sockets open (which bloats server memory), tasks are modeled as client-driven durable state machines, updating the MCP UI progress step-by-step [CLAIM-178](../00_index/citation_map.md#claim-178).

---

## What Is Confirmed

- `react-resizable-panels` is the standard for resizable 3-column layouts (used by assistant-ui, shadcn/ui)
- assistant-ui converts sidebar → Sheet drawer on mobile via `useIsMobile()` hook at 768px breakpoint
- Panel sizes persist via `autoSaveId` to `localStorage`
- Sidebar state persists via cookie (SSR) or localStorage (SPA)
- OpenClaw has 38 settings sections across 6 categories with schema-driven form rendering
- Content-visibility is preferred over virtual scrolling for message lists
- CSS-only animations are the production standard — zero JS animation libraries
- All animations require `motion-reduce:` counterparts
- AbortController is mandatory for every streaming request
- `100dvh` replaces `100vh` for mobile viewport height
- Synchronous `localStorage` read in `useState` initializer prevents FOUC
- React Compiler (2026) largely eliminates need for manual memoization
- **Two-tier workspace orchestration surfaces** (chat panel for immediate editing + multi-threaded planning surface/manager window for background tasks) is the UX benchmark [CLAIM-158, CLAIM-161, CLAIM-166].
- **Generative UI pipelines must be allowlist-driven or declarative** (JSON schema parsing) to prevent code injection vulnerabilities [CLAIM-170, CLAIM-171, CLAIM-175].
- **MCP Apps (SEP-1865) represent the modern standard** for modular UI extensibility in agent hosts [CLAIM-174](../00_index/citation_map.md#claim-174).
- **MCP Tasks modeling is key** to avoiding context bloat during long-running loops [CLAIM-178](../00_index/citation_map.md#claim-178).

## What Is Uncertain

- Exact performance characteristics of `content-visibility:auto` with 10,000+ messages (may need true virtual scrolling at that scale)
- Whether `react-resizable-panels` animation transitions are smooth enough without custom CSS (the library prioritizes performance over animation)
- Best practice for syncing panel sizes across tabs/windows (currently per-tab via localStorage)
- Whether React Native Web can replace the mobile-specific layout entirely
- Best default auto-run permission thresholds for CLI commands (Ask vs Sandbox vs YOLO) [CLAIM-165, CLAIM-169].

## Applicability to Harness

| Pattern | Priority | Implementation |
|---------|----------|---------------|
| 3-column workbench layout | **P0** | `react-resizable-panels` with `autoSaveId` |
| Mobile Sheet drawer | **P0** | `useIsMobile()` + Radix Sheet |
| AbortController streaming | **P0** | Every fetch/SSE call |
| CSS-only animations | **P0** | No JS animation dependencies |
| Selector-based state | **P0** | `useAuiState((s) => s.field)` pattern |
| Settings sidebar nav | **P1** | Category → Section nav with icon + label |
| Theme flash prevention | **P1** | `index.html` inline script |
| Content-visibility messages | **P1** | `[content-visibility:auto]` on message containers |
| Lazy-loaded admin views | **P1** | `React.lazy()` + Suspense for settings pages |
| Side-by-side diff previews & task settings | **P1** | Multi-file diff viewer with Ask/Sandbox/YOLO auto-run toggles [CLAIM-164, CLAIM-165] |
| Plan/Task/Walkthrough check loop | **P1** | Integrated artifact planning lifecycle and state tracker [CLAIM-167](../00_index/citation_map.md#claim-167) |
| Structured outputs & Sandboxed UI Widgets | **P1** | Structured JSON schema mapping + sandboxed iframe components (MCP Apps style) [CLAIM-172, CLAIM-175] |
| MCP Tasks runtime support | **P1** | Long-running asynchronous execution state machines via MCP Tasks [CLAIM-178](../00_index/citation_map.md#claim-178) |
| Skeleton loading states | **P2** | Randomized-width skeletons for natural look |
| Dot matrix status | **P2** | 20-state CSS animation system |
| Number roll animation | **P3** | CSS Houdini `@property` with feature detection |
| Voice orb WebGL | **P3** | Fragment shader with GPU cleanup |