# Deployment Guide - AIR-MCP Platform

This guide describes how to deploy the AIR-MCP platform to staging and production environments. It includes database provisioning, environment configurations, and container registries.

---

## 1. Environment Definitions

We define three logical deployment tiers for the AIR-MCP platform:

| Tier | Purpose | Database | Host Environment |
| :--- | :--- | :--- | :--- |
| **Development** | Local coding, rapid prototyping | Offline Fallback (In-memory) | Docker Compose on Localhost |
| **Staging** | Validation, CI builds, pre-demo checks | Dedicate Cloud Supabase project | Container runtime (e.g. AWS ECS / Render) |
| **Production** | Live demonstration, production simulation | Production Cloud Supabase project | Secure PaaS (e.g., AWS ECS / K8s / GCP Cloud Run) |

---

## 2. Database Provisioning (Supabase Cloud Setup)

The persistent database layer requires PostgreSQL running on Supabase. Follow these steps to provision:

### Step A: Create a Supabase Project
1. Log in to [Supabase Console](https://supabase.com).
2. Click **New Project** and select your Organization.
3. Set the **Project Name** to `AIR-MCP-Staging` (or similar).
4. Securely save the **Database Password**.
5. Select a region close to your backend application server (e.g., `us-east-1` or your local AWS equivalent).

### Step B: Run Migration Schema
1. In your Supabase dashboard, navigate to the **SQL Editor** in the left navigation panel.
2. Click **New Query**.
3. Open the migration file: [20260718000000_init_schema.sql](file:///home/flykrth/Downloads/air-mcp/supabase/migrations/20260718000000_init_schema.sql).
4. Copy the entire contents of the SQL file, paste it into the Supabase SQL editor, and click **Run**.
5. Verify that all 18 tables, indexes, triggers, and Row Level Security (RLS) policies are created successfully.

### Step C: Seed Demo Data
1. In the **SQL Editor**, click **New Query** again.
2. Open the seeding file: [seed.sql](file:///home/flykrth/Downloads/air-mcp/supabase/seed.sql).
3. Copy the entire contents, paste it into the editor, and click **Run**.
4. This registers:
   * 3 Zones, 12 Racks, and 48 physical assets
   * 96 active monitoring sensors
   * 20 Cloud workloads, 10 technicians, and 8 suppliers with inventories.

### Step D: Retrieve API Credentials
1. Navigate to **Project Settings** > **API**.
2. Copy the following keys:
   * **Project URL**: (maps to `SUPABASE_URL` in `.env`)
   * **API Key (service_role)**: (maps to `SUPABASE_KEY` in `.env`). *Note: Use the service_role key to allow the backend bypass RLS policies and write logs.*

---

## 3. Production Container Deployment

### A. Backend Container (FastAPI + Embedded MCP)
We bundle the FastAPI python app and Node MCP server inside the same container.
1. Build the backend image:
   ```bash
   docker build -t air-mcp-backend:latest -f ./backend/Dockerfile .
   ```
2. Push to your registry (e.g., AWS ECR, Docker Hub, or GitHub Container Registry):
   ```bash
   docker tag air-mcp-backend:latest <registry_uri>/air-mcp-backend:latest
   docker push <registry_uri>/air-mcp-backend:latest
   ```
3. Run the container on your target cluster, exposing port `8000`. Ensure you inject the following env variables:
   * `SUPABASE_URL`
   * `SUPABASE_KEY`
   * `MCP_SERVER_DIR=/app/mcp-server`
   * `PORT=8000`

### B. Frontend Container (Next.js Standalone)
The Next.js frontend runs as a separate container.
1. Build the frontend image, injecting the API URL at build-time (required for static page optimization):
   ```bash
   docker build -t air-mcp-frontend:latest -f ./frontend/Dockerfile --build-arg NEXT_PUBLIC_API_URL=https://<your-backend-domain>/api/v1 ./frontend
   ```
2. Push to your registry:
   ```bash
   docker tag air-mcp-frontend:latest <registry_uri>/air-mcp-frontend:latest
   docker push <registry_uri>/air-mcp-frontend:latest
   ```
3. Run on your cluster, exposing port `3000`. Set:
   * `PORT=3000`
   * `HOSTNAME=0.0.0.0`
   * `NEXT_PUBLIC_API_URL=https://<your-backend-domain>/api/v1`

---

## 4. HTTPS & Security Configuration

* **CORS Settings**: In production, do not allow wildcard CORS. Inject your frontend domain into the CORS middleware setup inside `backend/app/main.py`.
* **SSL Certificates**: Ensure all traffic goes through HTTPS. Use an API gateway (e.g., AWS ALB, Nginx Reverse Proxy, Cloudflare, or Traefik) to terminate SSL and route traffic to:
  * `/` -> Frontend Container (port 3000)
  * `/api/v1/*` -> Backend Container (port 8000)
