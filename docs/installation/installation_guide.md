# Installation Guide - AIR-MCP

This guide provides step-by-step instructions for installing and running the AIR-MCP platform locally.

---

## 1. Prerequisites

Ensure your host machine has the following tools installed and active:

*   **Docker**: Version 20.10+
*   **Docker Compose**: Version 2.10+
*   **Bash Shell**: (Linux/macOS or Git Bash/WSL on Windows)
*   **Node.js v20+** & **Python 3.11** (required only if running services outside Docker)

### Ports Configuration
The platform binds to the following local ports. Make sure they are not occupied by other services before starting:
*   `3000`: Next.js Frontend Dashboard
*   `8000`: FastAPI Backend Gateway
*   `5432`: Local PostgreSQL (if running Docker database containers)

---

## 2. One-Command Automated Installation

We provide an automated shell script that handles env generation, port verification, building containers, and probing health checks.

### Step A: Run the Startup Script
From the root of the repository, execute:
```bash
./scripts/up.sh
```

### What `up.sh` Does:
1.  **Environment Check**: Looks for a `.env` file in the root. If missing, it creates one from `.env.example`.
2.  **Port Verification**: Scans ports `3000` and `8000` to verify they are free.
3.  **Docker Build**: Builds the local Docker images for `backend`, `frontend`, and `mcp-server` services.
4.  **Compose Bootstrap**: Spins up the container services in the background.
5.  **Health Check Polling**: Polls the API gateway health check `/api/v1/health` and the frontend health check `/api/health` until they return `200 OK`.
6.  **Summary Display**: Outputs the dashboard URL and Swagger interactive documentation link.

---

## 3. Configuration & Environment Variables

All configuration is managed by the root `.env` file. Key environment variables include:

| Environment Variable | Default Value | Description |
| :--- | :--- | :--- |
| `SUPABASE_URL` | *(Empty)* | URL of the Supabase project. If empty, platform falls back to an offline in-memory database. |
| `SUPABASE_KEY` | *(Empty)* | Supabase service_role secret key for administrative database bypass. |
| `MCP_SERVER_DIR` | `/app/mcp-server` | Path to the TypeScript MCP server within the container context. |
| `NODE_ENV` | `production` | Environment mode for the Nitrostack MCP server. |
| `PROJECT_NAME` | `AIR-MCP` | The name of the project displayed in log files and Swagger. |

---

## 4. Verifying the Installation

Once the startup script finishes successfully, verify the installation by checking:

1.  **Dashboard**: Open [https://air-mcp.vercel.app](https://air-mcp.vercel.app) in your browser. You should see the system dashboard, active incident logs, and the status indicators set to "Online".
2.  **Interactive API Docs**: Open [https://air-mcp-production.up.railway.app/docs](https://air-mcp-production.up.railway.app/docs) to view the Swagger interactive OpenAPI reference.
3.  **Backend Health Endpoint**: Probing the endpoint should return a successful JSON payload:
    ```bash
    curl -i https://air-mcp-production.up.railway.app/api/v1/health
    ```
    Expected output:
    ```json
    {
      "status": "online",
      "database": {
        "status": "online",
        "type": "in-memory" (or "supabase")
      },
      "simulator": {
        "status": "active"
      }
    }
    ```

---

## 5. Teardown

To stop the containers, clear the docker networks, and wipe volumes:
```bash
./scripts/down.sh
```
This ensures a clean slate for subsequent demonstration runs or updates.
