# UX Implementation Specifications: AIR-MCP

This document provides developer-ready design specifications, styling variables, and structural component blueprints for implementing the approved AIR-MCP User Experience.

---

## 1. Global CSS & Tailwind v4 Customizations

The developers should integrate these tokens into `frontend/src/app/globals.css` within the `@theme inline` block or custom classes to ensure visual consistency.

### 1.1 Style Sheet Integration

```css
@import "tailwindcss";

:root {
  /* Brand Colors */
  --background: #09090b;       /* HSL 220 20% 8% */
  --foreground: #f4f4f5;       /* HSL 0 0% 98% */
  
  --bg-primary: #09090b;
  --bg-secondary: #0f1013;     /* HSL 220 16% 12% */
  --bg-tertiary: #191b22;      /* HSL 220 14% 18% */
  --border-subtle: #2b2e3a;    /* HSL 220 12% 22% */
  
  /* Status Colors */
  --status-ok: #10b981;        /* Emerald HSL 150 84% 42% */
  --status-warn: #f59e0b;      /* Amber HSL 38 92% 50% */
  --status-error: #ef4444;     /* Crimson HSL 0 84% 60% */
  --status-info: #3b82f6;      /* Cobalt HSL 210 100% 60% */
  --accent-ai: #8b5cf6;        /* Violet HSL 255 85% 65% */
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-bg-primary: var(--bg-primary);
  --color-bg-secondary: var(--bg-secondary);
  --color-bg-tertiary: var(--bg-tertiary);
  --color-border-subtle: var(--border-subtle);
  
  --color-status-ok: var(--status-ok);
  --color-status-warn: var(--status-warn);
  --color-status-error: var(--status-error);
  --color-status-info: var(--status-info);
  --color-accent-ai: var(--accent-ai);
  
  /* Font Override */
  --font-sans: 'Outfit', 'Inter', var(--font-geist-sans), sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', var(--font-geist-mono), monospace;

  /* Custom Animations */
  --animate-fade-in: fade-in 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  --animate-glow-emerald: glow-emerald 2s infinite ease-in-out;
  --animate-glow-red: glow-red 2s infinite ease-in-out;
  --animate-glow-amber: glow-amber 2s infinite ease-in-out;
  --animate-glow-violet: glow-violet 2.5s infinite ease-in-out;
  --animate-beacon: beacon 1.5s infinite cubic-bezier(0.4, 0, 0.6, 1);
  --animate-step-enter: step-enter 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  --animate-slide-up: slide-up 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;

  @keyframes fade-in {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  @keyframes glow-emerald {
    0%, 100% { box-shadow: 0 0 4px rgba(16, 185, 129, 0.15), inset 0 0 4px rgba(16, 185, 129, 0.05); border-color: rgba(16, 185, 129, 0.25); }
    50% { box-shadow: 0 0 12px rgba(16, 185, 129, 0.35), inset 0 0 8px rgba(16, 185, 129, 0.15); border-color: rgba(16, 185, 129, 0.5); }
  }
  @keyframes glow-red {
    0%, 100% { box-shadow: 0 0 4px rgba(239, 68, 68, 0.15), inset 0 0 4px rgba(239, 68, 68, 0.05); border-color: rgba(239, 68, 68, 0.25); }
    50% { box-shadow: 0 0 12px rgba(239, 68, 68, 0.35), inset 0 0 8px rgba(239, 68, 68, 0.15); border-color: rgba(239, 68, 68, 0.5); }
  }
  @keyframes glow-amber {
    0%, 100% { box-shadow: 0 0 4px rgba(245, 158, 11, 0.15), inset 0 0 4px rgba(245, 158, 11, 0.05); border-color: rgba(245, 158, 11, 0.25); }
    50% { box-shadow: 0 0 12px rgba(245, 158, 11, 0.35), inset 0 0 8px rgba(245, 158, 11, 0.15); border-color: rgba(245, 158, 11, 0.5); }
  }
  @keyframes glow-violet {
    0%, 100% { box-shadow: 0 0 4px rgba(139, 92, 246, 0.15), inset 0 0 4px rgba(139, 92, 246, 0.05); border-color: rgba(139, 92, 246, 0.25); }
    50% { box-shadow: 0 0 12px rgba(139, 92, 246, 0.35), inset 0 0 8px rgba(139, 92, 246, 0.15); border-color: rgba(139, 92, 246, 0.5); }
  }
  @keyframes beacon {
    0%, 100% { opacity: 0.5; transform: scale(1); }
    50% { opacity: 1; transform: scale(1.3); }
  }
  @keyframes step-enter {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes slide-up {
    from { transform: translateY(100%); }
    to { transform: translateY(0); }
  }
}

/* Glassmorphism Primitive overrides */
.glass-card {
  background-color: rgba(15, 16, 19, 0.65);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid var(--border-subtle);
  border-radius: 0.75rem;
}

.glass-card:hover {
  border-color: rgba(139, 92, 246, 0.3); /* Soft Violet glow on hover */
  box-shadow: 0 4px 20px -5px rgba(0, 0, 0, 0.4);
}
```

---

## 2. Component Blueprint Specifications

### 2.1 The Digital Twin Map Component (`src/features/digital-twin/DataCenterGrid.tsx`)

Developers should structure the topology as a logical layout representing the relationship between the physical layers (Power Substation, Cooling Water Loop, Server Racks).

```
+--------------------------------------------------------------+
| POWER SOURCE: Substation Alpha (OK)    LOAD: 4.8 MW          |
|                                                              |
|                     [⚡ Switchgear A]                        |
|                     /               \                        |
|             (Pulsing Link)      (Degraded Link)              |
|                   /                   \                      |
|         [❄️ Chiller Pump 1]       [❄️ Chiller Pump 2] (Error)  |
|                 |                             |              |
|                 |                     (Blast Radius Ring)    |
|                 v                             v              |
|         [🖥️ Server Rack Row A]     [🖥️ Server Rack Row B]     |
|         - Rack-01 (Nominal: 24°C)   - Rack-04 (CRITICAL: 56°C) |
|         - Rack-02 (Nominal: 26°C)   - Rack-05 (Degraded: 42°C) |
|         - Rack-03 (Nominal: 25°C)   - Rack-06 (Nominal: 28°C)  |
+--------------------------------------------------------------+
```

#### Blueprint Styling Class Rules:
- **Nominal Rack Card**: `bg-bg-secondary border-border-subtle text-zinc-300`
- **Degraded Rack Card**: `border-amber-500/30 bg-amber-500/5 text-amber-300 shadow-md animate-glow-amber`
- **Critical Rack Card**: `border-red-500/40 bg-red-500/5 text-red-300 shadow-md animate-glow-red`
- **Flow Links (SVG `<path>`)**:
  - Nominal: `stroke-status-ok stroke-[2] stroke-dasharray-[4]` with custom CSS animation moving the dash offset.
  - Critical/Severed: `stroke-status-error stroke-[2] stroke-dasharray-[2] animate-pulse`
  - Disabled/Bypassed: `stroke-zinc-800 stroke-[1]`

---

### 2.2 Signature Workflow Timeline Component (`src/features/dashboard/SystemTimeline.tsx`)

The workflow timeline acts as a conveyor belt illustrating active step execution.

```tsx
interface TimelineNodeProps {
  phase: 'trigger' | 'dispatch' | 'mcp' | 'decision' | 'recovery' | 'verified';
  status: 'idle' | 'running' | 'completed' | 'failed';
  title: string;
  timestamp?: string;
  metadata?: {
    agentName?: string;
    toolInvoked?: string;
    confidenceScore?: number;
    decisionMessage?: string;
  };
}
```

#### Blueprint UI Structure:
- Draw each step as a **card** with a left-aligned vertical colored indicator bar representing its state.
- **Node Connections**: Lines between timeline step boxes should use color-coded gradients (`from-emerald-500 to-amber-500` or `from-amber-500 to-zinc-800` depending on transition status).
- **Tool / Prompt Disclosure**: The detail drawer toggle `[🔍 Read Payload]` must present the exact MCP tool parameters in a styled dark code block (`bg-zinc-950 text-zinc-400 font-mono text-[10px] p-2.5 rounded-lg border border-zinc-900`).

---

### 2.3 Agent Activity Component (`src/features/orchestrator/AgentPanel.tsx`)

Developers should use the following layout format for each Specialist Agent rendering:

```tsx
export function AgentCard({ agent }) {
  return (
    <div className="glass-card p-5 flex flex-col gap-4 relative overflow-hidden">
      {/* Background Spark Grid indicator */}
      <div className="absolute top-2 right-2 flex items-center gap-1.5">
        <StatusBadge variant={agent.status} label={agent.statusLabel} showDot />
      </div>

      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400">
          <CpuIcon className="h-5 w-5" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-zinc-100">{agent.name}</h4>
          <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider">{agent.role}</span>
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="flex justify-between text-[11px] font-bold text-zinc-500 uppercase tracking-widest">
          <span>Decision Confidence</span>
          <span className="text-zinc-300">{agent.confidence}%</span>
        </div>
        <div className="h-1.5 bg-zinc-900 rounded-full overflow-hidden">
          <div 
            className="h-full bg-violet-500 rounded-full transition-all duration-500" 
            style={{ width: `${agent.confidence}%` }}
          />
        </div>
      </div>

      <div className="pt-2 border-t border-zinc-900/60 text-xs text-zinc-400 font-mono">
        <span className="text-zinc-500">Reasoning: </span>
        {agent.reasoningText}
      </div>
    </div>
  );
}
```

---

### 2.4 MCP Platform Layer Component (`src/features/orchestrator/McpToolPanel.tsx`)

Displaying the registered MCP tool calls transparently to emphasize the protocol level.

```
+------------------------------------------------------------+
| Connected MCP Servers: [✔] grid-api  [✔] thermal-ctrl      |
+------------------------------------------------------------+
| ACTIVE TOOL CALLS (LIVE)                                   |
| 10:01:25 | thermal-ctrl/get_telemetry | rack="rack-04" -> OK|
| 10:01:42 | grid-api/transfer_load     | switch="s-12"  -> OK|
+------------------------------------------------------------+
| PROMPT TEMPLATES LOADED                                    |
| > "Calculate optimal grid diversion path based on telemetry|
|    load limits of downstream switches..."                  |
+------------------------------------------------------------+
```

#### CSS & Classes:
- Container uses `bg-zinc-950 border border-zinc-900 font-mono text-[11px] rounded-xl overflow-hidden`.
- Tool calls entries should slide down with the `animate-step-enter` animation.

---

## 3. Judge Presentation Overlay (`src/features/judge/JudgeModeOverlay.tsx`)

The narrative presentation overlay is toggleable via the header button.

### 3.1 Overlay Navigation Interaction Flow
1. **Scenario Selection**: Presenter clicks `[Trigger Scenario: Heatwave]`.
2. **Auto-Advance Hook**: The overlay listens to changes in the database step history. As the backend completes steps (`step_history`), the slide index advances to center the current state of execution.
3. **Keyboard Handler**: Let the presenter override and manually advance/step back using the keyboard arrow keys:
   - `ArrowRight` -> `goNext()`
   - `ArrowLeft` -> `goPrev()`
   - `Escape` -> `close()`

### 3.2 Narrative Template Data Map
The narrator box must display the following curated texts matching the active step:

| Step ID | Section Title | Narrative Focus Description |
| :--- | :--- | :--- |
| `overview` | System Nominal | "AIR-MCP monitors active data center clusters. Currently, all telemetry signals are healthy." |
| `trigger` | Incident Injected | "We inject a severe thermal incident. Hotspots are immediately registered across the cluster." |
| `telemetry` | Blast Radius | "SCADA telemetry signals feed directly into the digital twin topology loop, mapping dependent failures." |
| `agents` | Agent Activation | "Specialist AI agents are spawned. They operate autonomously to verify alarms and run risk projections." |
| `mcp` | MCP Tool Calls | "Agents invoke tools on MCP servers (`grid-control/switch`) to rebalance load and initiate repairs." |
| `decision` | Optimization Path | "The platform calculates cost/benefit metrics of alternative actions to select the optimal path." |
| `recovery` | System Recovered | "Successful execution of the recovery directive restores system temperature limits to nominal status." |
| `audit` | Transparent Audit | "An immutable audit trail records all prompt contexts, agent thoughts, and tool latency metrics." |

---

## 4. Accessibility Specs

- **Focus Indication**: Interactive buttons must render a clear outline on keyboard focus: `focus-visible:outline-2 focus-visible:outline-violet-500 focus-visible:outline-offset-2`
- **Contrast Check**: The background values (`#09090b` and `#0f1013`) paired with high-contrast text (`#f4f4f5` or emerald text) must always maintain a ratio over **4.5:1** for body text and **3.0:1** for headers.
- **Aria Roles**:
  - Digital Twin grid: `role="grid"` with descriptive labels for state.
  - Incident drawers: `role="dialog" aria-modal="true"`.
