# Hackathon Submission Checklist - AIR-MCP

This checklist outlines the criteria to verify the completeness, correctness, and readiness of the AIR-MCP platform for submission.

---

## 1. Environment & Setup Checklist

- [ ] **Dependency Checks**:
  - [ ] Python version verified: `python3 --version` returns 3.11+.
  - [ ] Node.js version verified: `node --version` returns v20+.
  - [ ] Docker and Docker Compose active.
- [ ] **Config Files**:
  - [ ] Root `.env` file generated from `.env.example`.
  - [ ] `/mcp-server/.env` file generated from `.env.example`.
- [ ] **Database Connection**:
  - [ ] Verify local database fallback (in-memory mode) works with blank credentials.
  - [ ] Verify Cloud Supabase credentials connection works (if using persistent storage).

---

## 2. Compile & Verification Tests

- [ ] **TypeScript Builds**:
  - [ ] Run `npx tsc --noEmit` in `/mcp-server` to verify zero typecheck errors.
  - [ ] Run `npx tsc --noEmit` in `/frontend` to verify dashboard type integrity.
- [ ] **Python Code Validation**:
  - [ ] Run `black --check backend/app/` to verify code formatting.
  - [ ] Run `flake8 backend/app/` to check for syntax limit warnings.
- [ ] **Unit Tests Suite**:
  - [ ] Run `pytest` inside `/backend` and confirm all tests pass successfully.
- [ ] **Container Compilation**:
  - [ ] Run `docker compose build` to confirm all docker images compile without errors.

---

## 3. Demo Run Verification

- [ ] **Pre-flight Check script**:
  - [ ] Boot containers via `./scripts/up.sh`.
  - [ ] Run the validator utility:
    ```bash
    python3 scripts/verify_demo.py --check-all
    ```
  - [ ] Confirm all steps print green `[✓]` status indicators.
- [ ] **Dashboard Check**:
  - [ ] Navigate to [https://air-mcp.vercel.app](https://air-mcp.vercel.app).
  - [ ] Verify telemetry graphs display live data points.
  - [ ] Click "Trigger Heatwave" and check that temperatures rise.
  - [ ] Run the orchestrator and check that workloads migrate from hot racks to cool racks.
