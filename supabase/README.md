# Supabase PostgreSQL Data Layer - AIR-MCP

This directory contains the database migration scripts, seed data, and schema documentation for the **Adaptive Infrastructure Resilience MCP (AIR-MCP)** platform.

## Directory Structure

* **`migrations/20260718000000_init_schema.sql`**: Schema migration script defining the 18 PostgreSQL tables, relationships, indexes, updated_at triggers, and RLS policies.
* **`seed.sql`**: Populates the database with realistic demo scenarios (3 Zones, 12 Racks, 48 Assets, 96 Sensors, 20 Workloads, 10 Technicians, 30 Inventory Items, 8 Suppliers, historical incidents, maintenance work orders, and workflow history logs).
* **`er_diagram.md`**: Mermaid-format Entity Relationship Diagram.

---

## Database Design Principles

1. **Normalized Relational Model:** Avoids generic EAV schemas and giant JSON blobs where standard columns are appropriate. Structured tables enforce data constraints, data integrity, and strict domain boundaries.
2. **Flexible Metadata Integration:** JSONB fields are utilized strictly where flexibility is required (e.g., `assets.metadata` for hardware specs, `suppliers.inventory` for dynamic supplier part details, `maintenance_tickets.parts_required` for parts lists, and `decision_logs.input_payload` for LLM inputs).
3. **Pydantic / TS Compatibility:** Hybrid columns (e.g., coordinates, CPU/RAM capacity details) are nullable or have defaults to prevent deserialization exceptions in both the Python FastAPI backend and the TypeScript MCP server. Telemetry uses a sequential integer ID to match Pydantic model expectations.
4. **Referential Integrity:** All tables use explicit foreign key constraints with intentional ON DELETE behaviors (`CASCADE` or `SET NULL`) to prevent orphaned records.
5. **Auditing and Triggers:** All tables include standard UTC timestamps `created_at` and `updated_at`. Pre-compiled triggers automatically bump the `updated_at` timestamp on updates.

---

## Indexing Strategy

We optimize database latency for typical Digital Twin and Mission Orchestrator operations:
* **Telemetry history**: Composite index on `(rack_id, recorded_at DESC)` for fetching the latest sensor logs instantly.
* **Active incidents**: Partial index on `resolved = false` for high-frequency polling by the Incident Health Agent.
* **Workload priority**: Index on `priority DESC` to assist the Cloud Workload Agent in prioritizing migrations.
* **Warehouse alerts**: Partial index on `stock <= reorder_threshold` to alert the Procurement Agent immediately when supplies run low.

---

## Security (Row Level Security)

RLS is enabled by default on all tables. Supabase uses JWTs to distinguish anonymous and authenticated API consumers:
* **Read Access:** Granted to all clients (`anon` and `authenticated` roles) to enable public dashboard widgets.
* **Write Access:** Restricted to `authenticated` API consumers (the Python backend service and TypeScript MCP Server).
* **Bypass:** The `service_role` administrative key bypasses RLS for seeding and migrations.
