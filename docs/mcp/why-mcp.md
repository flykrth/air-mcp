# Architectural Analysis: Why Model Context Protocol?

This document outlines the design decisions and architectural benefits of selecting the **Model Context Protocol (MCP)** for the AIR-MCP platform, as opposed to conventional direct API integrations.

---

## 1. Why MCP Over Direct API Integration?

Integrating autonomous AI agents with infrastructure management systems traditionally relies on direct REST/gRPC API endpoints. However, this approach creates tight coupling and requires rebuilding agent clients whenever backend APIs change. Selecting MCP introduces a standardized, protocol-native mediation layer that addresses several challenges:

*   **Dynamic Discovery**: MCP servers expose their capabilities (Tools, Resources, and Prompts) dynamically. When the TypeScript MCP server adds a new capability, the Python backend agent automatically learns about it without requiring code updates or client rebuilds.
*   **Contextual Standardization**: Conventional APIs return raw data payloads that are difficult for an LLM to interpret without manual parsing. MCP encapsulates data as **Resources** (structured data feeds with metadata) and **Prompt Templates** (pre-structured context inputs), making telemetry immediately understandable to the agent's LLM context.
*   **Separation of Concerns**: The TypeScript MCP server acts as the authoritative manager of the physical simulation and database. The Python agents focus purely on reasoning and orchestration. This separation ensures that the physical datacenter logic is independent of the agent framework.

---

## 2. Improving Interoperability

By adhering to a standardized protocol, AIR-MCP supports seamless plug-and-play integrations:
*   **Client Agnostic**: Any LLM client that supports the Model Context Protocol (e.g. Cursor, Claude Desktop, or custom Python agents) can connect directly to the TypeScript MCP server.
*   **Transport Flexibility**: The server supports both `STDIO` transport (running as a local subprocess for development efficiency) and `SSE (Server-Sent Events) HTTP` transport (for distributed container environments).

---

## 3. Capability Mapping to Business Functions

The MCP capabilities map directly to core business objectives, ensuring the agent's actions align with operational requirements:

| MCP Construct | Category | Technical Implementation | Business Capability |
| :--- | :--- | :--- | :--- |
| **Tool** | Telemetry Scan | `analyze_infrastructure_health` | Maximizing cooling efficiency and detecting hotspots before physical damage occurs. |
| **Tool** | Cost Engineering | `estimate_maintenance_cost` | Controlling operations budgets by evaluating labor hours vs SLA penalties. |
| **Tool** | Migration | `migrate_workload` | Ensuring business continuity and avoiding SLA penalties by evacuating at-risk servers. |
| **Resource** | Telemetry Feed | `datacenter://telemetry/feed` | Historical analysis and auditing of thermal and power characteristics. |
| **Resource** | SOP Registry | `datacenter://procedures/sops` | Enforcing operational compliance by feeding official recovery procedures directly to the agent. |
| **Prompt** | Emergency Prompt | `emergency_cooling_response` | Guiding LLM reasoning to prevent rash decisions during cooling loop failures. |

---

## 4. Reusing the MCP Server

The `air-mcp-server` is designed to be fully reusable by other systems:
*   **Standalone Run**: The server can run as a standalone container using the SSE transport.
*   **Integration**: Another team (e.g., a power grid orchestrator or a capacity planning department) can hook their own custom agents into `air-mcp-server` without modifying its code.
*   **Zero Database Dependency**: The server dynamically checks DB credentials and adapts its response logic, allowing teams to test its endpoints offline using the local state file `/mcp-server/src/modules/datacenter/datacenter.state.ts`.

---

## 5. MCP-Specific vs. Application-Specific Boundaries

To ensure clean design, we draw a strict line between protocol-specific wrappers and core application logic:

*   **MCP-Specific**:
    *   Decorators like `@Tool`, `@Resource`, and `@Prompt` (from `@nitrostack/core`).
    *   JSON-RPC 2.0 protocol formatting, schema validations using Zod, and transport layer handshakes.
    *   Client connections via `StdioServerParameters` in the Python backend.
*   **Application-Specific**:
    *   The physics equations inside `SimulatorEngine` calculating thermal loads and cooling loop flow rates.
    *   The database schemas, indexes, and Row-Level Security policies on Supabase.
    *   The state machine logic inside the Python Mission Orchestrator and agent decision loops.
