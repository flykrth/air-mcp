# Troubleshooting Guide - AIR-MCP Platform

This guide provides troubleshooting steps and diagnostic solutions for common platform failures during development, staging deployment, or live demonstrations.

---

## 1. Port Collisions

### Symptom
Startup fails, docker compose prints address/port binding errors:
`listen tcp 0.0.0.0:8000: bind: address already in use`

### Diagnostics
Check which processes are listening on ports `3000` or `8000`:
```bash
# Check port 8000
sudo lsof -i :8000
# Check port 3000
sudo lsof -i :3000
```
### Resolution
* Terminate any conflicting local process (e.g. standard local runs of python or npm):
  ```bash
  kill -9 <PID>
  ```
* Alternatively, change the mapped port in `docker-compose.yml`:
  ```yaml
  ports:
    - "8080:8000" # Map backend to port 8080 instead
  ```

---

## 2. Database Connectivity Failures

### Symptom
Backend health check reports `"database": {"status": "unhealthy", "error": "..."}` or backend fails to launch due to database timeouts.

### Diagnostics
Check the backend logs for database client errors:
```bash
docker compose logs backend | grep -i database
```
### Resolution
1. **Invalid Credentials**: Double check `.env` file credentials. Verify `SUPABASE_URL` begins with `https://` and does not contain trailing slashes. Verify `SUPABASE_KEY` is the `service_role` token, not the `anon` token.
2. **Network Block**: Verify your server can reach Supabase API:
   ```bash
   curl -I https://<your-project-id>.supabase.co/rest/v1/
   ```
3. **Offline Recovery**: If network connectivity is blocked or slow during the hackathon, clear the `SUPABASE_URL` and `SUPABASE_KEY` values in `.env` (leave them empty). The backend will output a notice and fall back to in-memory mode, which works with zero network dependencies.

---

## 3. Node/MCP Subprocess Spawning Failures

### Symptom
Mission Orchestrator workflow hangs, or backend logs report:
`WARNING: Failed to fetch prompt template` or `ERROR spawning MCP server`.

### Diagnostics
1. Confirm the Node.js runtime is installed and accessible in the backend container path:
   ```bash
   docker compose exec backend node --version
   ```
2. Verify the MCP server is compiled. The file `dist/index.js` must exist:
   ```bash
   docker compose exec backend ls -l /app/mcp-server/dist/index.js
   ```
### Resolution
* If `dist/index.js` is missing, compile the server files manually in your local project workspace:
  ```bash
  cd mcp-server
  npm install
  npm run build
  ```
* Rebuild the backend Docker image using `docker compose build --no-cache backend` to ensure the new compiled files are copied.

---

## 4. Mission Orchestrator Workflow Hangs

### Symptom
Triggering a workflow via POST `/api/v1/orchestrator/run` keeps loading, never completes, or returns 504 Gateway Timeout.

### Diagnostics
1. Check the backend thread logs:
   ```bash
   docker compose logs backend --tail=100
   ```
2. Inspect if a tool call was stuck waiting for a mock response or API timeout.
### Resolution
* **Simulator Reset**: Force a reset of the digital twin simulator state:
  ```bash
  curl -X POST https://air-mcp-production.up.railway.app/api/v1/simulator/reset
  ```
* **Restart Backend**: Restart the container to clear thread locks:
  ```bash
  docker compose restart backend
  ```
