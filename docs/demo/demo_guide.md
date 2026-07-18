# Presenter Guide: Live Judge Demonstration - AIR-MCP

This guide provides a structured presentation plan and walkthrough script for demonstrating the AIR-MCP platform to judges or developers.

*   **Target Duration**: 5 to 7 minutes
*   **Target Audience**: Hackathon Judges / Engineers

---

## 1. Presentation Outline & Uptime Strategy

| Section | Duration | Key Message | UI/Action |
| :--- | :--- | :--- | :--- |
| **1. Intro & Problem** | 45 seconds | Datacenters are prone to severe thermodynamic and SLA risks during environmental anomalies. | Dashboard Main view. |
| **2. Architecture Overview** | 60 seconds | AIR-MCP integrates multi-agent systems and physics simulators via the Model Context Protocol. | Swagger docs / Architecture guide. |
| **3. Trigger Scenario** | 45 seconds | Injects a physical failure (Heatwave + Cooling Loop Failure). | UI: Click "Trigger Heatwave". |
| **4. Agent Coordination** | 90 seconds | 6 agents coordinate telemetry scans, SLA calculations, migrations, maintenance, and ordering. | UI: Step through the agent workflow timeline. |
| **5. MCP & Recovery Show** | 60 seconds | Showcases real-time JSON-RPC payload logs and final thermal restoration. | UI: Display tool execution audits and recovered temps. |
| **6. Business Impact & Q&A** | 60 seconds | Prevents SLA penalties, automates logistics, and improves device longevity. | Final Q&A. |

---

## 2. Walkthrough Script (Phase-by-Phase)

### Phase 1: Introduction & Problem (0:00 - 0:45)
*   **Verbal Cues**: "Hello everyone. Today we are presenting AIR-MCP: Adaptive Infrastructure Resilience MCP. Server rooms and smart grids are complex cyber-physical environments. When cooling systems fail, temperatures spike quickly. This can lead to hardware damage, system crashes, and expensive SLA violations. Operators often struggle to coordinate workload migrations, maintenance tickets, and procurement logistics in real-time, resulting in costly downtime."
*   **Visual Cues**: Show the Next.js Dashboard. Highlight the status cards showing "All Zones: Optimal" and the temperature graph showing standard operational baselines (22°C).

### Phase 2: Architecture Overview (0:45 - 1:45)
*   **Verbal Cues**: "AIR-MCP solves this by combining a stateful thermodynamic digital twin, a multi-agent orchestration engine, and a TypeScript MCP server. We chose the Model Context Protocol to decouple our physical simulation from the agent reasoning loops. The MCP server dynamically exposes 16 tools, 12 resources, and 10 prompts, allowing the agents to scan telemetry, reallocate workloads, and order replacement parts protocol-natively."
*   **Visual Cues**: Open the API interactive documentation (`/docs`) or show the architecture block diagram in [Architecture Guide](../../docs/architecture/guide.md).

### Phase 3: Trigger Demo Scenario (1:45 - 2:30)
*   **Verbal Cues**: "Let's trigger a failure. We will inject an external Heatwave and a Cooling Loop Degradation into Zone-A. The simulator immediately calculates the reduced heat dissipation, causing temperatures on affected racks to rise past safety limits."
*   **Visual Cues**: Click the "Trigger Heatwave" button on the UI (or run `python3 scripts/verify_demo.py`). Point to the live telemetry graph as the temperature curve of `Rack-A1` spikes past 35°C, turning the status card from green to critical red.

### Phase 4: Show Agent Coordination (2:30 - 4:00)
*   **Verbal Cues**: "With the system in a critical state, we run the Mission Orchestrator. 
    1. The **InfrastructureHealthAgent** scans telemetry and identifies the `Rack-A1` hotspot.
    2. The **InfrastructureRiskAgent** calculates that we have high-priority workloads on `Rack-A1` with an estimated SLA exposure of $15,000.
    3. The **CloudWorkloadAgent** queries the MCP server for cooling capacities and hot-migrates the workloads to cooler racks in Zone-B.
    4. The **MaintenancePlanningAgent** creates a repair ticket and schedules technician Sarah to repair the chiller loop.
    5. The **SupplierIntelligenceAgent** queries external vendor catalogues, selecting the best supplier for a replacement fan based on price and lead time.
    6. The **ProcurementAgent** submits the purchase order, logs the transaction, and triggers the repair."
*   **Visual Cues**: Point to the "Agent Logs Timeline" card on the UI as it scrolls through the active agent execution stages. Show the workload migrating from `Rack-A1` to `Rack-B2`.

### Phase 5: MCP Activity & Recovery (4:00 - 5:00)
*   **Verbal Cues**: "Behind the scenes, all operations are audited. In our Decision Log view, you can see the raw JSON-RPC payloads exchanged between the Python backend client and the TypeScript MCP server. Once the procurement order is confirmed, the repair is simulated, and the chiller efficiency returns to normal. The thermodynamic simulation calculates the restoration of cooling, and we can verify that all rack temperatures have dropped back below 25°C."
*   **Visual Cues**: Click on the "Decision Logs / Judge Mode" tab in the UI. Show the raw JSON-RPC inputs/outputs of tools like `migrate_workload` or `confirm_maintenance_repair`. Show the temperature graph of `Rack-A1` dropping back to green.

### Phase 6: Business Impact & Q&A (5:00 - 6:00)
*   **Verbal Cues**: "In a real datacenter, this automation saves thousands of dollars in SLA penalties, reduces manual diagnostic errors, and coordinates physical operations seamlessly. We are ready to take your questions."

---

## 3. Q&A Template (Anticipating Judge Questions)

*   **Q: Why use MCP instead of a standard REST API for the agents?**
    *   *Answer*: MCP allows the agents to dynamically discover tools and resources at runtime. This decouples agent code from physical sensor systems, meaning new sensors or tools can be added without redeploying the core agent orchestrator.
*   **Q: How does the system handle database offline situations?**
    *   *Answer*: AIR-MCP features a thread-safe, local in-memory fallback. If Supabase keys are missing, the system runs locally without any database dependencies, ensuring reliability during offline demo situations.
