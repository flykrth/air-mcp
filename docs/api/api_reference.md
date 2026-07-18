# API Reference Guide - AIR-MCP

This document provides specifications for the REST endpoints exposed by the **AIR-MCP Backend Gateway**.

*   **Host**: `https://air-mcp-production.up.railway.app`
*   **Base URL**: `/api/v1`
*   **Content-Type**: `application/json`

---

## 1. Health Router (`/health`)

### GET `/health`
Returns the status of the backend API, the digital twin simulation loop, and database connectivity.
*   **Request URL**: `/api/v1/health`
*   **Response Payload (`200 OK`)**:
    ```json
    {
      "status": "online",
      "database": {
        "status": "online",
        "type": "in-memory"
      },
      "simulator": {
        "status": "active"
      },
      "mcp_server": {
        "status": "compiled"
      }
    }
    ```

---

## 2. Mission Orchestrator Router (`/orchestrator`)

### POST `/orchestrator/run`
Triggers an orchestration step or advances the multi-agent execution pipeline.
*   **Request URL**: `/api/v1/orchestrator/run`
*   **Request Payload**:
    ```json
    {
      "step_name": "HEATWAVE_TRIGGERED"
    }
    ```
    *Supported values for `step_name`: `HEATWAVE_TRIGGERED`, `THERMAL_ANALYSIS`, `RISK_ASSESSMENT`, `PROCUREMENT_AND_RECOVERY`.*
*   **Response Payload (`200 OK`)**:
    ```json
    {
      "status": "success",
      "current_step": "HEATWAVE_TRIGGERED",
      "history": ["HEATWAVE_TRIGGERED"],
      "agent_logs": [
        "[2026-07-18 11:00:00] [Orchestrator] Triggering Simulation: HEATWAVE and COOLING_DEGRADATION."
      ],
      "state": {
        "hotspots": [],
        "risk_exposure_usd": 0.0,
        "recovery_verified": false
      }
    }
    ```

### GET `/orchestrator/state`
Returns the current in-memory run state of the Mission Orchestrator.
*   **Request URL**: `/api/v1/orchestrator/state`
*   **Response Payload (`200 OK`)**:
    Same schema as `RunWorkflowResponse` (returned by `/run`).

### POST `/orchestrator/reset`
Resets the orchestrator state, purging agent logs and step histories.
*   **Request URL**: `/api/v1/orchestrator/reset`
*   **Response Payload (`200 OK`)**:
    ```json
    {
      "status": "reset",
      "message": "Orchestrator state has been purged."
    }
    ```

---

## 3. Racks Router (`/racks`)

### GET `/racks`
Fetches a list of all server racks in the data center.
*   **Request URL**: `/api/v1/racks/`
*   **Response Payload (`200 OK`)**:
    ```json
    [
      {
        "id": "e4b9bbd0-ec47-4977-bf35-f12b1263d91c",
        "zone_id": "a50c8227-2ad1-482a-a9a3-5c026d36e2f4",
        "name": "Rack-A1",
        "row_id": 1,
        "column_id": 1,
        "max_kw_capacity": 15.0,
        "cpu_capacity_cores": 128,
        "memory_capacity_gb": 512,
        "status": "OPTIMAL"
      }
    ]
    ```

### GET `/racks/{rack_id}`
Returns details for a specific rack by its UUID.
*   **Request URL**: `/api/v1/racks/e4b9bbd0-ec47-4977-bf35-f12b1263d91c`

### POST `/racks`
Creates a new server rack.
*   **Request URL**: `/api/v1/racks/`

### PUT `/racks/{rack_id}/status`
Updates a rack's status (e.g. `OPTIMAL`, `DEGRADED`, `CRITICAL`).
*   **Request URL**: `/api/v1/racks/e4b9bbd0-ec47-4977-bf35-f12b1263d91c/status`
*   **Request Body**:
    ```json
    {
      "status": "DEGRADED"
    }
    ```

---

## 4. Workloads Router (`/workloads`)

### GET `/workloads`
Lists all active cloud workloads.
*   **Request URL**: `/api/v1/workloads/`

### GET `/workloads/rack/{rack_id}`
Lists workloads currently hosted by a specific rack.
*   **Request URL**: `/api/v1/workloads/rack/e4b9bbd0-ec47-4977-bf35-f12b1263d91c`

### POST `/workloads/{workload_id}/migrate`
Triggers a hot workload migration to a target rack.
*   **Request URL**: `/api/v1/workloads/56ee93dc-88a4-4f27-be18-2ad192f126f4/migrate`
*   **Request Body**:
    ```json
    {
      "target_rack_id": "b9bbd0e4-ec47-4977-bf35-f12b1263d91c"
    }
    ```

---

## 5. Telemetry Router (`/telemetry`)

### GET `/telemetry/rack/{rack_id}`
Fetches telemetry history for a specific rack.
*   **Request URL**: `/api/v1/telemetry/rack/e4b9bbd0-ec47-4977-bf35-f12b1263d91c`

### GET `/telemetry/rack/{rack_id}/latest`
Retrieves the latest telemetry point recorded for a rack.
*   **Request URL**: `/api/v1/telemetry/rack/e4b9bbd0-ec47-4977-bf35-f12b1263d91c/latest`
*   **Response Payload (`200 OK`)**:
    ```json
    {
      "id": 1824,
      "rack_id": "e4b9bbd0-ec47-4977-bf35-f12b1263d91c",
      "temperature_celsius": 24.3,
      "power_draw_kw": 4.8,
      "cooling_flow_rate_lps": 4.2,
      "cpu_utilization_percent": 35,
      "memory_utilization_percent": 28,
      "recorded_at": "2026-07-18T11:00:15Z"
    }
    ```

---

## 6. Simulator Router (`/simulator`)

These endpoints manipulate the Digital Twin simulation state directly (useful for testing and presenter controls).

### GET `/simulator/state`
Returns the complete status of the simulation variables.
*   **Request URL**: `/api/v1/simulator/state`

### POST `/simulator/control`
Starts, pauses, or adjusts the speed of the background simulation thread.
*   **Request URL**: `/api/v1/simulator/control`
*   **Request Payload**:
    ```json
    {
      "running": true,
      "speed_factor": 2.0
    }
    ```

### POST `/simulator/tick`
Manually triggers a single simulation calculation tick.
*   **Request URL**: `/api/v1/simulator/tick`

### POST `/simulator/incident`
Injects a physical incident into the datacenter structure.
*   **Request URL**: `/api/v1/simulator/incident`
*   **Request Payload**:
    ```json
    {
      "incident_type": "COOLING_DEGRADATION",
      "rack_id": "e4b9bbd0-ec47-4977-bf35-f12b1263d91c"
    }
    ```
    *Values for `incident_type`: `HEATWAVE`, `COOLING_DEGRADATION`, `FAN_FAILURE`, `POWER_SURGE`, `GRID_UNSTABLE`.*

### POST `/simulator/reset`
Resets the simulation engine state back to the seeded baseline database.
*   **Request URL**: `/api/v1/simulator/reset`
