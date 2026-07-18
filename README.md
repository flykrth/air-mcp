# Adaptive Infrastructure Resilience MCP (AIR-MCP)

Adaptive Infrastructure Resilience MCP (**AIR-MCP**) is a production-inspired, autonomous platform designed to manage and mitigate critical incidents in smart datacenters and grids. Using a multi-agent orchestration engine, it actively monitors telemetry, assesses operational risks, migrates workloads, schedules technicians, and procures replacement parts to restore cooling loops and protect service level agreements (SLAs).

---

## Architecture Overview

AIR-MCP is designed with a clean separation of concerns across multiple service layers:

```
[ Next.js Frontend (Dashboard) ] :3000
             ↓
[ FastAPI Backend Gateway (Orchestrator) ] :8000
             ↓
[ Embedded TypeScript MCP Server (StdIO Subprocess) ] OR [ Standalone MCP (HTTP/SSE) ] :3000
             ↓
[ Database Layer: Supabase (REST API) / Thread-Safe In-Memory Fallback ]
```

1. **Next.js Frontend**: A modern React dashboard that visualizes datacenter telemetry, active incidents, automated audit logs, and technician dispatches.
2. **FastAPI Backend Gateway**: Serves as the API broker. It runs the Simulator Engine thread (the digital twin) and hosts the Mission Orchestrator which manages multi-agent workflows.
3. **TypeScript MCP Server**: Exposes structured tools (e.g., thermal analysis, workload migrations, technician scheduling, part procurement) and telemetry resources.
4. **Database Layer (Supabase)**: Enforces schema validation and indexes. If Supabase keys are omitted, the backend dynamically falls back to an in-memory database configuration, allowing zero-dependency local setups.

---

## Quick Start (One-Command Management)

For the live demo and local development, we provide helper scripts that automate pre-flight validation, Docker Compose bootstrapping, and health check validation.

### 1. Prerequisites
Ensure you have the following installed on your machine:
* **Docker** & **Docker Compose**
* **Bash shell** (standard on Linux/macOS)

### 2. Startup
Run the startup orchestrator from the project root:
```bash
./scripts/up.sh
```
This script will:
* Check for `.env` files (and create one from `.env.example` if missing).
* Verify that ports `3000` and `8000` are free.
* Build and start the containerized services in the background.
* Poll health endpoints until the services are fully online.
* Output the operational URLs for the dashboard and API gateway.

### 3. Teardown
To cleanly stop all containers, clear docker networks, and purge volumes:
```bash
./scripts/down.sh
```

---

## Health & Observability Endpoints

Once running, you can probe the health of all systems using the custom endpoints:

* **Backend Health Check**: [http://localhost:8000/api/v1/health](http://localhost:8000/api/v1/health)
  * Returns JSON status on gateway uptime, database connectivity type, digital twin simulator execution, and Node.js MCP server compiler readiness.
* **Frontend Health Check**: [http://localhost:3000/api/health](http://localhost:3000/api/health)
  * Returns JSON status verifying the Next.js server is online and confirming API connectivity to the backend gateway.
* **OpenAPI Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)
  * Interactive Swagger page for manual API calls.

---

## Operational Documentation Directory

For deep dives into deployment, platform configuration, and recovery runs, consult:

* 📄 **[Deployment Guide](file:///home/flykrth/Downloads/air-mcp/docs/deployment.md)**: Cloud hosting, container registry setup, and Supabase integration.
* 📄 **[Operational Runbook](file:///home/flykrth/Downloads/air-mcp/docs/runbook.md)**: Step-by-step guides for configuration changes, backup runs, and recovery procedures.
* 📄 **[Troubleshooting Guide](file:///home/flykrth/Downloads/air-mcp/docs/troubleshooting.md)**: Diagnostic checks and remediation for common failure states (database lockout, engine hangs, port collisions).
* 📄 **[CI/CD Documentation](file:///home/flykrth/Downloads/air-mcp/.github/workflows/ci-cd.yml)**: Continuous integration workflows, lint constraints, and typecheck parameters.
