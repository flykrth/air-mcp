# Operational Runbook - AIR-MCP Platform

This runbook outlines procedures for system administration, service restarts, configuration changes, database rollbacks, and recovery operations.

---

## 1. Quick Service Diagnostic Commands

When running the stack locally or in a dockerized VM environment, use these diagnostic checks:

### Check Container Statuses
```bash
docker compose ps
```
### View Live Logs
```bash
# Scroll all logs
docker compose logs -f

# Follow specific service logs
docker compose logs -f backend
docker compose logs -f frontend
```
### Check Service Resource Usage
```bash
docker stats
```

---

## 2. Configuration Recovery & Updates

To update configurations (e.g. updating database credentials or target URLs):

1. **Modify the Environment File**: Update `.env` with the new values.
2. **Apply Changes with Zero Downtime (Rolling Restart)**:
   ```bash
   # Re-create and restart containers that had env changes without bringing down other services
   docker compose up -d --no-deps --build <service_name>
   ```
3. **Verify Health**: Check the status endpoint:
   ```bash
   curl -i http://localhost:8000/api/v1/health
   ```

---

## 3. Database Migration Recovery & Seed Reset

### Reset Database Schema & Seed Data
If the database becomes corrupted, desynchronized, or poisoned with invalid demo telemetry, you can execute a hard reset:

#### Option A: Local Docker Compose (Hard Reset)
Since Compose uses Docker volumes, you can wipe the database state and start clean:
```bash
# Bring down container stack and delete volumes
./scripts/down.sh

# Rebuild and start container stack with fresh migrations
./scripts/up.sh
```

#### Option B: Cloud Supabase Project (SQL Hard Reset)
To force a clean slate in your Supabase cloud database:
1. In the Supabase SQL editor, execute a truncate/drop script:
   ```sql
   -- Warning: This drops all AIR-MCP tables
   DROP TABLE IF EXISTS decision_logs CASCADE;
   DROP TABLE IF EXISTS procurement_orders CASCADE;
   DROP TABLE IF EXISTS maintenance_tickets CASCADE;
   DROP TABLE IF EXISTS incident_history CASCADE;
   DROP TABLE IF EXISTS workloads CASCADE;
   DROP TABLE IF EXISTS technicians CASCADE;
   DROP TABLE IF EXISTS racks CASCADE;
   -- Rerun migrations after dropping
   ```
2. Paste and run the schema code from [20260718000000_init_schema.sql](../supabase/migrations/20260718000000_init_schema.sql).
3. Paste and run the seed records from [seed.sql](../supabase/seed.sql).

---

## 4. Rollback Strategy for Failed Deployments

If a newly deployed image crashes or fails health checks in staging/production:

1. **Identify the Last Stable Image Tag**: Track stable builds in your registry (e.g., `v1.0.1`, `v1.0.0`).
2. **Revert Compose Setup**:
   Update the image tag in your deployment manifest or `docker-compose.yml`:
   ```yaml
   image: <registry_uri>/air-mcp-backend:v1.0.0 # Reverting from v1.0.1
   ```
3. **Redeploy**:
   ```bash
   docker compose up -d --no-deps backend
   ```
4. **Verify Rollback Success**: Confirm that the API status code returns `200 OK` on the health check endpoint:
   ```bash
   curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/api/v1/health
   ```
