-- Adaptive Infrastructure Resilience MCP (AIR-MCP)
-- Supabase PostgreSQL Schema Migration
-- Designed for Supabase with UUID PKs, referential integrity, triggers, and Row Level Security (RLS)

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 1. DATABASE TABLES
-- ==========================================

-- A. ZONES
CREATE TABLE IF NOT EXISTS zones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- B. RACKS
CREATE TABLE IF NOT EXISTS racks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    zone_id UUID REFERENCES zones(id) ON DELETE SET NULL,
    name VARCHAR(100) NOT NULL UNIQUE,
    row_id INTEGER NOT NULL,
    column_id INTEGER NOT NULL,
    max_kw_capacity NUMERIC(5,2) NOT NULL DEFAULT 15.00,
    cpu_capacity_cores INTEGER NOT NULL DEFAULT 64,
    memory_capacity_gb INTEGER NOT NULL DEFAULT 256,
    status VARCHAR(50) NOT NULL DEFAULT 'OPTIMAL' CHECK (status IN ('OPTIMAL', 'DEGRADED', 'CRITICAL')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- C. ASSETS
CREATE TABLE IF NOT EXISTS assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rack_id UUID REFERENCES racks(id) ON DELETE SET NULL,
    zone_id UUID REFERENCES zones(id) ON DELETE SET NULL,
    name VARCHAR(150) NOT NULL,
    asset_type VARCHAR(100) NOT NULL CHECK (asset_type IN ('RACK_FRAME', 'SERVER', 'CRAC', 'CHILLER', 'UPS', 'SWITCH', 'PDU', 'FAN_TRAY')),
    status VARCHAR(50) NOT NULL DEFAULT 'OPTIMAL' CHECK (status IN ('OPTIMAL', 'DEGRADED', 'CRITICAL')),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- D. SENSORS
CREATE TABLE IF NOT EXISTS sensors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id UUID REFERENCES assets(id) ON DELETE SET NULL,
    rack_id UUID REFERENCES racks(id) ON DELETE SET NULL,
    name VARCHAR(100) NOT NULL,
    sensor_type VARCHAR(100) NOT NULL CHECK (sensor_type IN ('TEMPERATURE', 'POWER', 'FLOW_RATE', 'HUMIDITY', 'PRESSURE', 'RPM', 'VOLTAGE', 'FUEL')),
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'FAULTY')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- E. TELEMETRY LOGS (Time-Series Table)
CREATE TABLE IF NOT EXISTS telemetry_logs (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    rack_id UUID REFERENCES racks(id) ON DELETE CASCADE,
    sensor_id UUID REFERENCES sensors(id) ON DELETE SET NULL,
    temperature_celsius NUMERIC(4,1) NOT NULL,
    power_draw_kw NUMERIC(4,2) NOT NULL,
    cooling_flow_rate_lps NUMERIC(4,2) NOT NULL,
    ambient_temperature NUMERIC(4,1) NOT NULL,
    cpu_utilization_percent INTEGER DEFAULT 0 CHECK (cpu_utilization_percent BETWEEN 0 AND 100),
    memory_utilization_percent INTEGER DEFAULT 0 CHECK (memory_utilization_percent BETWEEN 0 AND 100),
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- F. INCIDENT HISTORY
CREATE TABLE IF NOT EXISTS incident_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rack_id UUID REFERENCES racks(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    severity VARCHAR(50) NOT NULL DEFAULT 'WARNING' CHECK (severity IN ('INFO', 'WARNING', 'CRITICAL')),
    resolved BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    resolved_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- G. WORKFLOW RUNS
CREATE TABLE IF NOT EXISTS workflow_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_name VARCHAR(150) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED')),
    started_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- H. WORKFLOW STEPS
CREATE TABLE IF NOT EXISTS workflow_steps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    run_id UUID REFERENCES workflow_runs(id) ON DELETE CASCADE,
    step_name VARCHAR(150) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED')),
    logs TEXT,
    started_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- I. DECISION LOGS
CREATE TABLE IF NOT EXISTS decision_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_step_id UUID REFERENCES workflow_steps(id) ON DELETE SET NULL,
    tool_name VARCHAR(150) NOT NULL,
    input_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    output_summary TEXT NOT NULL,
    reasoning TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- J. TECHNICIANS
CREATE TABLE IF NOT EXISTS technicians (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(150) NOT NULL,
    skillset TEXT[] NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'AVAILABLE' CHECK (status IN ('AVAILABLE', 'ON_DUTY', 'OFF_LINE')),
    current_ticket_id UUID, -- Foreign key defined later due to circular reference
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- K. MAINTENANCE TICKETS (Corrective/Preventive Tasks)
CREATE TABLE IF NOT EXISTS maintenance_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    target_rack_id UUID REFERENCES racks(id) ON DELETE CASCADE,
    issue_type VARCHAR(100) NOT NULL CHECK (issue_type IN ('COOLING_LEAK', 'FAN_FAILURE', 'POWER_UNIT_FAULT', 'GPU_OVERHEAT', 'VALVE_BLOCKAGE')),
    description TEXT NOT NULL,
    technician_id UUID REFERENCES technicians(id) ON DELETE SET NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED')),
    parts_required JSONB NOT NULL DEFAULT '{}'::jsonb,
    scheduled_time TIMESTAMPTZ NOT NULL,
    resolved_at TIMESTAMPTZ,
    estimated_duration_hours NUMERIC(4,2) NOT NULL DEFAULT 1.00,
    labor_hours NUMERIC(4,2) NOT NULL DEFAULT 0.00,
    calculated_cost NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- Add circular foreign key for technician's current ticket
ALTER TABLE technicians 
ADD CONSTRAINT fk_technicians_current_ticket 
FOREIGN KEY (current_ticket_id) REFERENCES maintenance_tickets(id) ON DELETE SET NULL;

-- L. INVENTORY ITEMS (Warehouse Inventory)
CREATE TABLE IF NOT EXISTS inventory_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    part_name VARCHAR(150) NOT NULL UNIQUE,
    stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
    reorder_threshold INTEGER NOT NULL DEFAULT 0 CHECK (reorder_threshold >= 0),
    unit_cost NUMERIC(10,2) NOT NULL DEFAULT 0.00 CHECK (unit_cost >= 0.00),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- M. SUPPLIERS
CREATE TABLE IF NOT EXISTS suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(150) NOT NULL UNIQUE,
    rating NUMERIC(3,2) CHECK (rating BETWEEN 0.00 AND 5.00),
    inventory JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- N. PROCUREMENT ORDERS
CREATE TABLE IF NOT EXISTS procurement_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID REFERENCES maintenance_tickets(id) ON DELETE CASCADE,
    supplier_id UUID REFERENCES suppliers(id) ON DELETE CASCADE,
    item_name VARCHAR(150), -- Backward compatibility with Python backend
    quantity INTEGER,      -- Backward compatibility with Python backend
    items JSONB,           -- Compatibility with TS Server
    total_cost NUMERIC(10,2) NOT NULL DEFAULT 0.00 CHECK (total_cost >= 0.00),
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ORDERED', 'DELIVERED')),
    estimated_delivery TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- O. CLOUD WORKLOADS
CREATE TABLE IF NOT EXISTS cloud_workloads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rack_id UUID REFERENCES racks(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    vcpus INTEGER NOT NULL CHECK (vcpus > 0),
    memory_gb INTEGER NOT NULL CHECK (memory_gb > 0),
    power_kw NUMERIC(4,2) NOT NULL DEFAULT 0.00 CHECK (power_kw >= 0.00),
    priority INTEGER NOT NULL CHECK (priority BETWEEN 1 AND 5),
    sla_threshold_temp NUMERIC(4,1) NOT NULL DEFAULT 35.0,
    status VARCHAR(50) NOT NULL DEFAULT 'RUNNING' CHECK (status IN ('RUNNING', 'MIGRATING', 'TERMINATED', 'COMPLETED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- P. SLA POLICIES
CREATE TABLE IF NOT EXISTS sla_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    priority INTEGER UNIQUE NOT NULL CHECK (priority BETWEEN 1 AND 5),
    category VARCHAR(100) NOT NULL,
    penalty_per_hour_usd NUMERIC(10,2) NOT NULL DEFAULT 0.00 CHECK (penalty_per_hour_usd >= 0.00),
    max_allowable_temp NUMERIC(4,1) NOT NULL DEFAULT 35.0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- Q. STANDARD OPERATING PROCEDURES (SOPs)
CREATE TABLE IF NOT EXISTS sops (
    id VARCHAR(100) PRIMARY KEY, -- TS compatibility string ID
    title VARCHAR(150) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- R. NOTIFICATION LOGS
CREATE TABLE IF NOT EXISTS notification_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    incident_id UUID REFERENCES incident_history(id) ON DELETE CASCADE,
    severity VARCHAR(50) NOT NULL CHECK (severity IN ('INFO', 'WARNING', 'CRITICAL')),
    channel VARCHAR(50) NOT NULL CHECK (channel IN ('EMAIL', 'SLACK', 'PAGERDUTY')),
    message TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'SENT' CHECK (status IN ('SENT')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- ==========================================
-- 2. AUTOMATIC TIMESTAMP TRIGGERS
-- ==========================================

-- Standard function to set updated_at to now()
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc', now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables that have updated_at
CREATE TRIGGER update_zones_modtime BEFORE UPDATE ON zones FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_racks_modtime BEFORE UPDATE ON racks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_assets_modtime BEFORE UPDATE ON assets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sensors_modtime BEFORE UPDATE ON sensors FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_incident_history_modtime BEFORE UPDATE ON incident_history FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_workflow_runs_modtime BEFORE UPDATE ON workflow_runs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_workflow_steps_modtime BEFORE UPDATE ON workflow_steps FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_decision_logs_modtime BEFORE UPDATE ON decision_logs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_technicians_modtime BEFORE UPDATE ON technicians FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_maintenance_tickets_modtime BEFORE UPDATE ON maintenance_tickets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_inventory_items_modtime BEFORE UPDATE ON inventory_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_suppliers_modtime BEFORE UPDATE ON suppliers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_procurement_orders_modtime BEFORE UPDATE ON procurement_orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cloud_workloads_modtime BEFORE UPDATE ON cloud_workloads FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sla_policies_modtime BEFORE UPDATE ON sla_policies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sops_modtime BEFORE UPDATE ON sops FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_notification_logs_modtime BEFORE UPDATE ON notification_logs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- 3. ENTERPRISE INDEXES
-- ==========================================

-- Optimize Telemetry Lookups
CREATE INDEX IF NOT EXISTS idx_telemetry_rack_recorded ON telemetry_logs (rack_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_telemetry_recorded ON telemetry_logs (recorded_at DESC);

-- Optimize Incident Resolution Queries
CREATE INDEX IF NOT EXISTS idx_incidents_resolved ON incident_history (resolved) WHERE resolved = false;
CREATE INDEX IF NOT EXISTS idx_incidents_rack ON incident_history (rack_id);

-- Optimize Workload Scheduler & Migration Checks
CREATE INDEX IF NOT EXISTS idx_workloads_rack ON cloud_workloads (rack_id);
CREATE INDEX IF NOT EXISTS idx_workloads_priority ON cloud_workloads (priority DESC);

-- Optimize Maintenance Planning & Technician Matching
CREATE INDEX IF NOT EXISTS idx_maintenance_tickets_rack ON maintenance_tickets (target_rack_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_tickets_status ON maintenance_tickets (status);
CREATE INDEX IF NOT EXISTS idx_technicians_status ON technicians (status);

-- Optimize Workflow History Queries
CREATE INDEX IF NOT EXISTS idx_workflow_steps_run ON workflow_steps (run_id);
CREATE INDEX IF NOT EXISTS idx_decision_logs_step ON decision_logs (workflow_step_id);

-- Optimize Procurement & Inventory Operations
CREATE INDEX IF NOT EXISTS idx_procurement_orders_ticket ON procurement_orders (ticket_id);
CREATE INDEX IF NOT EXISTS idx_procurement_orders_supplier ON procurement_orders (supplier_id);
CREATE INDEX IF NOT EXISTS idx_inventory_reorder ON inventory_items (stock) WHERE stock <= reorder_threshold;

-- ==========================================
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================

-- Enable RLS for all tables
ALTER TABLE zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE racks ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE sensors ENABLE ROW LEVEL SECURITY;
ALTER TABLE telemetry_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE incident_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE decision_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE technicians ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE procurement_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE cloud_workloads ENABLE ROW LEVEL SECURITY;
ALTER TABLE sla_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE sops ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;

-- Helper to grant read-only access (anon & authenticated)
-- and read-write access to authenticated service applications
CREATE POLICY "Allow public read access" ON zones FOR SELECT USING (true);
CREATE POLICY "Allow authenticated full write" ON zones FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow public read access" ON racks FOR SELECT USING (true);
CREATE POLICY "Allow authenticated full write" ON racks FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow public read access" ON assets FOR SELECT USING (true);
CREATE POLICY "Allow authenticated full write" ON assets FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow public read access" ON sensors FOR SELECT USING (true);
CREATE POLICY "Allow authenticated full write" ON sensors FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow public read access" ON telemetry_logs FOR SELECT USING (true);
CREATE POLICY "Allow authenticated full write" ON telemetry_logs FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow public read access" ON incident_history FOR SELECT USING (true);
CREATE POLICY "Allow authenticated full write" ON incident_history FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow public read access" ON workflow_runs FOR SELECT USING (true);
CREATE POLICY "Allow authenticated full write" ON workflow_runs FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow public read access" ON workflow_steps FOR SELECT USING (true);
CREATE POLICY "Allow authenticated full write" ON workflow_steps FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow public read access" ON decision_logs FOR SELECT USING (true);
CREATE POLICY "Allow authenticated full write" ON decision_logs FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow public read access" ON technicians FOR SELECT USING (true);
CREATE POLICY "Allow authenticated full write" ON technicians FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow public read access" ON maintenance_tickets FOR SELECT USING (true);
CREATE POLICY "Allow authenticated full write" ON maintenance_tickets FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow public read access" ON inventory_items FOR SELECT USING (true);
CREATE POLICY "Allow authenticated full write" ON inventory_items FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow public read access" ON suppliers FOR SELECT USING (true);
CREATE POLICY "Allow authenticated full write" ON suppliers FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow public read access" ON procurement_orders FOR SELECT USING (true);
CREATE POLICY "Allow authenticated full write" ON procurement_orders FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow public read access" ON cloud_workloads FOR SELECT USING (true);
CREATE POLICY "Allow authenticated full write" ON cloud_workloads FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow public read access" ON sla_policies FOR SELECT USING (true);
CREATE POLICY "Allow authenticated full write" ON sla_policies FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow public read access" ON sops FOR SELECT USING (true);
CREATE POLICY "Allow authenticated full write" ON sops FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow public read access" ON notification_logs FOR SELECT USING (true);
CREATE POLICY "Allow authenticated full write" ON notification_logs FOR ALL TO authenticated USING (true) WITH CHECK (true);
