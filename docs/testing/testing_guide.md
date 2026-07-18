# Testing & Validation Guide - AIR-MCP

This document explains how to execute tests and validate the AIR-MCP platform during development, staging, or before live presentations.

---

## 1. Running Unit & Integration Tests (Backend)

The Python backend contains a pytest suite that tests endpoint routing, database connection wrappers, thermodynamics simulator ticks, and agent decision branches.

### Prerequisites
Make sure you are in the `/backend` folder with your virtual environment activated:
```bash
cd backend
source venv/bin/activate
```

### Run All Tests
```bash
pytest
```

### Test Files Breakdown
*   **`tests/test_endpoints.py`**: Validates router configurations (e.g. GET `/racks`, GET `/workloads`, GET `/telemetry`).
*   **`tests/test_simulator.py`**: Verifies thermodynamic heating/cooling equations, workload power draws, and incident injections.
*   **`tests/test_workflow.py`**: Verifies step-by-step orchestrator advancement.
*   **`tests/test_advanced_orchestrator.py`**: Exercises the 6 agents with mocked and live MCP server connections.

---

## 2. Pre-flight Presentation Verification Script

We provide a specialized validation utility in `/scripts/verify_demo.py` that verifies platform health and runs the orchestrator end-to-end. This utility is designed to run prior to live hackathon presentations.

### Run Pre-flight Checks
Ensure the Docker containers are running (via `./scripts/up.sh`), then execute:
```bash
python3 scripts/verify_demo.py --check-all
```

### What `verify_demo.py` Validates:
1.  **Endpoints Health Check**: Verifies that the gateway `/health` and Next.js `/api/health` are reachable.
2.  **Telemetry Sync Verification**: Verifies that active telemetry logs are populated in the database.
3.  **End-to-End Run Verification**: Triggers the `OrchestratorEngine` step-by-step (`HEATWAVE_TRIGGERED` → `THERMAL_ANALYSIS` → `RISK_ASSESSMENT` → `PROCUREMENT_AND_RECOVERY`) and verifies the state transition outputs.
4.  **Recovery Verification**: Confirms that rack temperatures successfully drop back below 25°C post-run.

---

## 3. Capacity & Performance Testing

We provide a performance profiling script in `/scripts/run_perf_tests.py` that measures telemetry update rates and API endpoint latency.

### Run Performance Profiler
```bash
python3 scripts/run_perf_tests.py --requests 100 --concurrency 5
```
This script returns average request latency, maximum throughput (requests per second), and data persistence timings, which are useful for identifying performance bottlenecks.

---

## 4. Known Limitations

*   **Mock MCP fallback**: If Node.js is not present locally, backend tests use a mock MCP class. Ensure Node.js v20+ is active to test physical subprocess execution.
*   **Simulator Tick Granularity**: The SimulatorEngine background thread runs on a fixed 5-second tick interval. Spawning multiple high-frequency HTTP request loops may cause brief database sync delays.
*   **Memory database fallback**: The in-memory mock database does not enforce Row-Level Security (RLS). Real security testing requires connecting to a live Supabase instance.
