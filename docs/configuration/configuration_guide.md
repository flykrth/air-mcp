# Configuration Guide - AIR-MCP

This document explains how to configure and tune the settings of the **AIR-MCP Backend Gateway**, the **TypeScript MCP Server**, and the **Thermodynamic Simulator**.

---

## 1. Gateway & Agent Configuration (`/backend`)

The backend gateway uses Pydantic Settings to validate environment variables. Key config parameters (defined in [config.py](../../backend/app/core/config.py)) include:

*   **`SUPABASE_URL`**:
    *   *Type*: String (optional)
    *   *Description*: The endpoint of your Supabase project (e.g. `https://yourproj.supabase.co`). If blank, the gateway starts up in offline in-memory mode.
*   **`SUPABASE_KEY`**:
    *   *Type*: String (optional)
    *   *Description*: The service_role secret key for database connectivity. Anonymous keys cannot bypass RLS to record decision logs.
*   **`MCP_SERVER_DIR`**:
    *   *Type*: String
    *   *Description*: The directory path containing the TypeScript MCP server within the container environment.
*   **`AGENTS_LLM_TIMEOUT`**:
    *   *Type*: Integer (seconds)
    *   *Description*: The maximum timeout allotted for agent reasoning steps before raising an exception.

---

## 2. Tuning Thermodynamic Simulator Physics

You can adjust the coefficients of the thermodynamic digital twin simulation by modifying environment variables or updating [engine.py](../../backend/app/features/simulator/engine.py):

*   **`SIM_TEMP_HEATING_COEFF`** (default: `0.08`):
    *   Determines how rapidly a rack's core temperature rises per kW of active workload power draw.
*   **`SIM_TEMP_COOLING_COEFF`** (default: `0.12`):
    *   Determines how effectively chiller water flow rate cools the rack core.
*   **`SIM_AMBIENT_DISSIPATION`** (default: `0.02`):
    *   The passive heat dissipation rate of a rack core to the ambient air temperature.
*   **`SIM_BASELINE_AMBIENT_TEMP`** (default: `24.0`):
    *   The standard room ambient temperature in Celsius.
*   **`SIM_TICK_RATE_SECONDS`** (default: `5.0`):
    *   The execution interval of the background simulation thread loop.

---

## 3. TypeScript MCP Server Config (`/mcp-server`)

The MCP server uses standard dotenv environment files. Important variables include:

*   **`NODE_ENV`**:
    *   `development`: Restricts transport to STDIO subprocesses.
    *   `production`: Enables dual-transport (STDIO and HTTP SSE Server).
*   **`PORT`** (default: `3000`):
    *   The port the server listens on when running in SSE mode.
*   **`LOG_LEVEL`** (default: `info`):
    *   Logging verbosity (`info`, `debug`, `error`).
