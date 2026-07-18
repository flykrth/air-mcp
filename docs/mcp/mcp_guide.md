# Model Context Protocol (MCP) Guide - AIR-MCP

This document provides a detailed specification of the tools, resources, and prompt templates exposed by the **AIR-MCP TypeScript Server** (implemented using the Nitrostack framework under [mcp-server](../../mcp-server)).

---

## 1. Exposing Capabilities: Tools (16 registered)

Tools enable agents to query telemetry, assess risk, make migrations, schedule tasks, and confirm repairs. Each tool uses strict Zod schema validation.

### Core Orchestration Tools

#### 1. `analyze_infrastructure_health`
*   **Description**: Analyzes real-time temperature, power load, and anomalies of data center racks.
*   **Input Schema**:
    ```json
    {
      "rack_id": "string (optional) - UUID of the rack",
      "all": "boolean (optional) - defaults to true"
    }
    ```
*   **Example Response**:
    ```json
    {
      "status": "success",
      "health_metrics": [
        {
          "rack_id": "e4b9bbd0-ec47-4977-bf35-f12b1263d91c",
          "name": "Rack-A1",
          "health_score": 95,
          "status": "OPTIMAL",
          "temperature": 24.5,
          "power_draw_kw": 4.3,
          "cpu_utilization": 15,
          "memory_utilization": 12,
          "anomalies": []
        }
      ]
    }
    ```

#### 2. `predict_failure`
*   **Description**: Calculates Mean Time to Failure (MTTF) and degradation scores based on thermal history.
*   **Input Schema**:
    ```json
    {
      "rack_id": "string (optional)",
      "all": "boolean (optional, default true)"
    }
    ```

#### 3. `assess_operational_risk`
*   **Description**: Compiles workloads affected by thermal anomalies and calculates SLA breach financial exposure in USD.
*   **Input Schema**: `{}`

#### 4. `plan_maintenance`
*   **Description**: Opens a maintenance ticket and lists required replacement parts and tech certification levels.
*   **Input Schema**:
    ```json
    {
      "target_rack_id": "string (UUID)",
      "issue_type": "string (e.g. FAN_FAILURE, SENSOR_FAULT, UPS_DEGRADED)",
      "description": "string"
    }
    ```

#### 5. `schedule_technician`
*   **Description**: Assigns a technician to an open maintenance ticket.
*   **Input Schema**:
    ```json
    {
      "ticket_id": "string (UUID)",
      "technician_id": "string (UUID)",
      "scheduled_time": "string (ISO datetime)"
    }
    ```

#### 6. `estimate_maintenance_cost`
*   **Description**: Calculates parts cost and labor estimates based on assigned technician skill sets.
*   **Input Schema**:
    ```json
    {
      "ticket_id": "string (UUID)"
    }
    ```

#### 7. `recommend_workload_migration`
*   **Description**: Scans cooling distributions and recommends target racks for migrations.
*   **Input Schema**:
    ```json
    {
      "source_rack_id": "string (UUID)"
    }
    ```

#### 8. `estimate_capacity`
*   **Description**: Audits available CPU core, RAM, and power slots on a server rack.
*   **Input Schema**:
    ```json
    {
      "rack_id": "string (UUID)"
    }
    ```

#### 9. `check_inventory`
*   **Description**: Returns active stock volume and unit prices for spare parts.
*   **Input Schema**:
    ```json
    {
      "part_name": "string (e.g. chiller_fan_v2)"
    }
    ```

#### 10. `evaluate_suppliers`
*   **Description**: Lists suppliers carrying a specific part SKU, pre-sorted by rating and lead time.
*   **Input Schema**:
    ```json
    {
      "part_name": "string",
      "quantity": "number"
    }
    ```

#### 11. `generate_procurement_plan`
*   **Description**: Submits purchase orders and generates estimated delivery timestamps.
*   **Input Schema**:
    ```json
    {
      "ticket_id": "string",
      "supplier_id": "string",
      "parts": "object (key: SKU name, value: integer quantity)"
    }
    ```

#### 12. `notify_stakeholders`
*   **Description**: Records operational alerts in the notification log history.
*   **Input Schema**:
    ```json
    {
      "channel": "string (e.g., Slack, Email)",
      "message": "string",
      "severity": "string"
    }
    ```

#### 13. `trigger_simulation_event`
*   **Description**: Injects anomalies into the physical state engine.
*   **Input Schema**:
    ```json
    {
      "event_type": "string (e.g. HEATWAVE, COOLING_DEGRADATION)"
    }
    ```

#### 14. `migrate_workload`
*   **Description**: Executes hot migration of workloads between server racks.
*   **Input Schema**:
    ```json
    {
      "workload_id": "string",
      "target_rack_id": "string"
    }
    ```

#### 15. `confirm_maintenance_repair`
*   **Description**: Confirms technician repair completion, restoring cooling loop health status.
*   **Input Schema**:
    ```json
    {
      "ticket_id": "string"
    }
    ```

#### 16. `validate_thermal_recovery`
*   **Description**: Validates that all server rack temperatures have dropped below the critical 25°C limit.
*   **Input Schema**: `{}`

---

## 2. Exposing State: Resources (12 registered)

Resources act as protocol-native endpoints representing data feeds. Agents read resources via URIs:

1.  **`datacenter://telemetry/feed`**: Live thermal, power, and capacity metrics feed.
2.  **`datacenter://assets/registry`**: Active inventory of chiller pumps, backup generators, and switches.
3.  **`datacenter://infrastructure/topology`**: Physical placement coordinates of server rows and zones.
4.  **`maintenance://tickets/history`**: Records of closed and in-progress hardware maintenance work orders.
5.  **`incidents://history`**: Chronological log of incident levels and resolution durations.
6.  **`supplychain://inventory/catalog`**: Warehouse stocks of power distribution units, cables, and chiller fans.
7.  **`supplychain://suppliers/directory`**: Registered vendor contact data, lead times, and ratings.
8.  **`maintenance://technicians/registry`**: Technician certifications, skillset arrays, and active tickets.
9.  **`workloads://registry`**: Live mapping of hosted VM workloads, priority tiers, and SLA conditions.
10. **`slas://policies`**: Financial penalties and temperature safety parameters per workload priority tier.
11. **`datacenter://decisions/log`**: Historical log tracking tool invocations and orchestrator decisions.
12. **`datacenter://procedures/sops`**: Standard Operating Procedures (SOPs) for datacenter failures.

---

## 3. Explaining Context: Prompt Templates (10 registered)

Prompt templates guide the LLM on structuring its reasoning for specific incident scenarios:

1.  **`emergency_cooling_response`**: Directs response paths during cooling chiller faults.
2.  **`thermal_hotspot_investigation`**: Diagnoses rack hotspot temperatures (compares sensor locations).
3.  **`power_instability_assessment`**: Recommends response paths during grid brownouts or generator failures.
4.  **`maintenance_planning`**: Details technician work instructions.
5.  **`workload_migration_strategy`**: Details how to prioritize migrations.
6.  **`supplier_selection`**: Outlines criteria for choosing suppliers (evaluates ratings vs delivery costs).
7.  **`procurement_recommendation`**: Drafts justifications for purchase orders.
8.  **`technician_dispatch`**: Drafts technician dispatch logs.
9.  **`incident_recovery`**: Details procedures for checking device stability.
10. **`executive_incident_summary`**: Summarizes downtime and SLA breaches for stakeholders.

---

## 4. Protocol-Native Error Handling

The MCP server uses JSON-RPC 2.0 error specifications:
*   **`-32602 (Invalid Params)`**: Returned if Zod schema validation fails (e.g. invalid UUID format or missing fields).
*   **`-32603 (Internal Error)`**: Returned if simulator connection fails or database operations encounter timeouts.
*   **`Custom Errors`**: Handled via standard JSON-RPC exception structures.
