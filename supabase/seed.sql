-- Adaptive Infrastructure Resilience MCP (AIR-MCP)
-- Supabase PostgreSQL Seed Script
-- Generates realistic enterprise seed data matching Digital Twin constraints

-- Clear existing data
TRUNCATE TABLE notification_logs CASCADE;
TRUNCATE TABLE procurement_orders CASCADE;
TRUNCATE TABLE maintenance_tickets CASCADE;
ALTER TABLE technicians DROP CONSTRAINT IF EXISTS fk_technicians_current_ticket;
TRUNCATE TABLE technicians CASCADE;
TRUNCATE TABLE decision_logs CASCADE;
TRUNCATE TABLE workflow_steps CASCADE;
TRUNCATE TABLE workflow_runs CASCADE;
TRUNCATE TABLE incident_history CASCADE;
TRUNCATE TABLE telemetry_logs CASCADE;
TRUNCATE TABLE sensors CASCADE;
TRUNCATE TABLE assets CASCADE;
TRUNCATE TABLE cloud_workloads CASCADE;
TRUNCATE TABLE racks CASCADE;
TRUNCATE TABLE zones CASCADE;
TRUNCATE TABLE inventory_items CASCADE;
TRUNCATE TABLE suppliers CASCADE;
TRUNCATE TABLE sla_policies CASCADE;
TRUNCATE TABLE sops CASCADE;

-- Re-add constraint
ALTER TABLE technicians 
ADD CONSTRAINT fk_technicians_current_ticket 
FOREIGN KEY (current_ticket_id) REFERENCES maintenance_tickets(id) ON DELETE SET NULL;

-- ==========================================
-- 1. ZONES (3 Zones)
-- ==========================================
INSERT INTO zones (id, name, description) VALUES
('7a0cf347-1577-4b11-a8cf-19597c8cf42b', 'Zone-A', 'High-Density AI & Machine Learning Cluster Row (Accelerated Compute)'),
('bd0f7572-c518-47bc-ad7b-05ad0e22591e', 'Zone-B', 'Standard Cloud Compute & Web Hosting Row (General Purpose)'),
('80d7ef5b-bf4f-4d69-be58-69ad0c19a9db', 'Zone-C', 'Storage Cluster & Archival Backup Row (High-Capacity Storage)');

-- ==========================================
-- 2. RACKS (12 Racks)
-- ==========================================
-- 12 Racks distributed across the 3 zones (4 racks per zone)
-- Row 0 for Zone A, Row 1 for Zone B, Row 2 for Zone C
INSERT INTO racks (id, zone_id, name, row_id, column_id, max_kw_capacity, cpu_capacity_cores, memory_capacity_gb, status) VALUES
-- Zone A (Row 0, Cols 0-3)
('f7dfd754-b54a-47e5-b3f9-e5a662c8f84b', '7a0cf347-1577-4b11-a8cf-19597c8cf42b', 'Rack-A1', 0, 0, 15.00, 128, 512, 'OPTIMAL'),
('0920f20a-7f86-4b80-9877-c0e717f4af70', '7a0cf347-1577-4b11-a8cf-19597c8cf42b', 'Rack-A2', 0, 1, 15.00, 128, 512, 'OPTIMAL'),
('8bcf8c83-fa4c-47e3-99b3-76f5decf7e8b', '7a0cf347-1577-4b11-a8cf-19597c8cf42b', 'Rack-A3', 0, 2, 15.00, 128, 512, 'OPTIMAL'),
('ea3b4542-a8b2-4d2c-80a5-f489f66bbd09', '7a0cf347-1577-4b11-a8cf-19597c8cf42b', 'Rack-A4', 0, 3, 15.00, 128, 512, 'OPTIMAL'),
-- Zone B (Row 1, Cols 0-3)
('f23cf467-de30-4c47-8950-44bf5b321afd', 'bd0f7572-c518-47bc-ad7b-05ad0e22591e', 'Rack-B1', 1, 0, 15.00, 64, 256, 'OPTIMAL'),
('a9521a0e-6a88-4848-ad49-e64be022589f', 'bd0f7572-c518-47bc-ad7b-05ad0e22591e', 'Rack-B2', 1, 1, 15.00, 64, 256, 'OPTIMAL'),
('7ad887c9-4b6b-4e0c-b26a-de9bb3e3bdf8', 'bd0f7572-c518-47bc-ad7b-05ad0e22591e', 'Rack-B3', 1, 2, 15.00, 64, 256, 'OPTIMAL'),
('0a3ef7df-1b03-49de-ae0e-74409bb10db4', 'bd0f7572-c518-47bc-ad7b-05ad0e22591e', 'Rack-B4', 1, 3, 15.00, 64, 256, 'OPTIMAL'),
-- Zone C (Row 2, Cols 0-3)
('565755f8-8942-492e-9eb7-38c9b43bad1d', '80d7ef5b-bf4f-4d69-be58-69ad0c19a9db', 'Rack-C1', 2, 0, 15.00, 48, 512, 'OPTIMAL'),
('5e71eb3f-eb20-476a-ac58-bd215e051e6b', '80d7ef5b-bf4f-4d69-be58-69ad0c19a9db', 'Rack-C2', 2, 1, 15.00, 48, 512, 'OPTIMAL'),
('2abcfd87-3e4b-4b1d-85fa-7f89b9cd4ef1', '80d7ef5b-bf4f-4d69-be58-69ad0c19a9db', 'Rack-C3', 2, 2, 15.00, 48, 512, 'OPTIMAL'),
('6fa78bcf-1a4f-4d2e-90ab-c89bdf01a23e', '80d7ef5b-bf4f-4d69-be58-69ad0c19a9db', 'Rack-C4', 2, 3, 15.00, 48, 512, 'OPTIMAL');

-- ==========================================
-- 3. ASSETS (48 Assets)
-- ==========================================
-- Loop through 12 racks and create 4 assets per rack: Rack Frame, Server Chassis, PDU, Fan Tray
DO $$
DECLARE
    r RECORD;
    frame_id UUID;
    server_id UUID;
    pdu_id UUID;
    fan_id UUID;
BEGIN
    FOR r IN SELECT id, name, zone_id FROM racks LOOP
        frame_id := gen_random_uuid();
        server_id := gen_random_uuid();
        pdu_id := gen_random_uuid();
        fan_id := gen_random_uuid();
        
        -- Frame
        INSERT INTO assets (id, rack_id, zone_id, name, asset_type, status, metadata)
        VALUES (frame_id, r.id, r.zone_id, r.name || ' Cabinet Frame', 'RACK_FRAME', 'OPTIMAL', '{"u_height": 42}');
        
        -- Server Chassis
        INSERT INTO assets (id, rack_id, zone_id, name, asset_type, status, metadata)
        VALUES (server_id, r.id, r.zone_id, r.name || ' Server Node Cluster', 'SERVER', 'OPTIMAL', '{"num_nodes": 4, "server_model": "Supermicro A+ 2U"}');
        
        -- PDU
        INSERT INTO assets (id, rack_id, zone_id, name, asset_type, status, metadata)
        VALUES (pdu_id, r.id, r.zone_id, r.name || ' Smart PDU v3', 'PDU', 'OPTIMAL', '{"voltage_phases": 3, "ip_address": "10.240.10.15"}');
        
        -- Fan Tray
        INSERT INTO assets (id, rack_id, zone_id, name, asset_type, status, metadata)
        VALUES (fan_id, r.id, r.zone_id, r.name || ' Fan Exhaust Array', 'FAN_TRAY', 'OPTIMAL', '{"num_fans": 6}');
    END LOOP;
END $$;

-- ==========================================
-- 4. SENSORS (96 Sensors)
-- ==========================================
-- 8 sensors per rack, mapped to assets
DO $$
DECLARE
    r RECORD;
    asset_rec RECORD;
    frame_id UUID;
    server_id UUID;
    pdu_id UUID;
    fan_id UUID;
BEGIN
    FOR r IN SELECT id, name FROM racks LOOP
        -- Retrieve asset IDs for this rack
        SELECT id INTO frame_id FROM assets WHERE rack_id = r.id AND asset_type = 'RACK_FRAME';
        SELECT id INTO server_id FROM assets WHERE rack_id = r.id AND asset_type = 'SERVER';
        SELECT id INTO pdu_id FROM assets WHERE rack_id = r.id AND asset_type = 'PDU';
        SELECT id INTO fan_id FROM assets WHERE rack_id = r.id AND asset_type = 'FAN_TRAY';
        
        -- Sensor 1: Core Temp (Server)
        INSERT INTO sensors (id, asset_id, rack_id, name, sensor_type, status)
        VALUES (gen_random_uuid(), server_id, r.id, r.name || ' Node CPU Temp Sensor', 'TEMPERATURE', 'ACTIVE');
        
        -- Sensor 2: Power Sensor (PDU)
        INSERT INTO sensors (id, asset_id, rack_id, name, sensor_type, status)
        VALUES (gen_random_uuid(), pdu_id, r.id, r.name || ' Total Power Draw Sensor', 'POWER', 'ACTIVE');
        
        -- Sensor 3: RPM Sensor (Fan Tray)
        INSERT INTO sensors (id, asset_id, rack_id, name, sensor_type, status)
        VALUES (gen_random_uuid(), fan_id, r.id, r.name || ' Exhaust Fan RPM Sensor', 'RPM', 'ACTIVE');
        
        -- Sensor 4: Inlet Air Temp (Frame)
        INSERT INTO sensors (id, asset_id, rack_id, name, sensor_type, status)
        VALUES (gen_random_uuid(), frame_id, r.id, r.name || ' Inlet Temperature Sensor', 'TEMPERATURE', 'ACTIVE');
        
        -- Sensor 5: Outlet Air Temp (Frame)
        INSERT INTO sensors (id, asset_id, rack_id, name, sensor_type, status)
        VALUES (gen_random_uuid(), frame_id, r.id, r.name || ' Outlet Temperature Sensor', 'TEMPERATURE', 'ACTIVE');
        
        -- Sensor 6: Cooling Flow Rate (Frame)
        INSERT INTO sensors (id, asset_id, rack_id, name, sensor_type, status)
        VALUES (gen_random_uuid(), frame_id, r.id, r.name || ' Coolant Flow Rate Sensor', 'FLOW_RATE', 'ACTIVE');
        
        -- Sensor 7: Coolant Pressure (Frame)
        INSERT INTO sensors (id, asset_id, rack_id, name, sensor_type, status)
        VALUES (gen_random_uuid(), frame_id, r.id, r.name || ' Coolant Pressure Sensor', 'PRESSURE', 'ACTIVE');
        
        -- Sensor 8: Humidity (Frame)
        INSERT INTO sensors (id, asset_id, rack_id, name, sensor_type, status)
        VALUES (gen_random_uuid(), frame_id, r.id, r.name || ' Cabinet Humidity Sensor', 'HUMIDITY', 'ACTIVE');
    END LOOP;
END $$;

-- ==========================================
-- 5. CLOUD WORKLOADS (20 Workloads)
-- ==========================================
INSERT INTO cloud_workloads (id, rack_id, name, vcpus, memory_gb, power_kw, priority, sla_threshold_temp, status) VALUES
-- Rack-A1
(gen_random_uuid(), 'f7dfd754-b54a-47e5-b3f9-e5a662c8f84b', 'LLM-Training-Deepseek', 64, 256, 6.50, 5, 35.0, 'RUNNING'),
(gen_random_uuid(), 'f7dfd754-b54a-47e5-b3f9-e5a662c8f84b', 'VectorSearch-Indexer-1', 16, 64, 1.20, 4, 33.0, 'RUNNING'),
-- Rack-A2
(gen_random_uuid(), '0920f20a-7f86-4b80-9877-c0e717f4af70', 'AI-Inference-Endpoint-1', 32, 128, 3.80, 5, 35.0, 'RUNNING'),
(gen_random_uuid(), '0920f20a-7f86-4b80-9877-c0e717f4af70', 'DataPipeline-Preprocessing', 24, 96, 2.10, 3, 32.0, 'RUNNING'),
-- Rack-A3
(gen_random_uuid(), '8bcf8c83-fa4c-47e3-99b3-76f5decf7e8b', 'LLM-Training-Lora', 48, 192, 5.00, 4, 35.0, 'RUNNING'),
-- Rack-A4
(gen_random_uuid(), 'ea3b4542-a8b2-4d2c-80a5-f489f66bbd09', 'AI-Inference-Endpoint-2', 32, 128, 3.80, 5, 35.0, 'RUNNING'),
-- Rack-B1
(gen_random_uuid(), 'f23cf467-de30-4c47-8950-44bf5b321afd', 'Kubernetes-API-Gateway', 8, 32, 0.80, 4, 32.0, 'RUNNING'),
(gen_random_uuid(), 'f23cf467-de30-4c47-8950-44bf5b321afd', 'Nginx-LoadBalancer', 4, 16, 0.40, 4, 32.0, 'RUNNING'),
-- Rack-B2
(gen_random_uuid(), 'a9521a0e-6a88-4848-ad49-e64be022589f', 'Microservice-Checkout', 12, 48, 1.10, 4, 32.0, 'RUNNING'),
(gen_random_uuid(), 'a9521a0e-6a88-4848-ad49-e64be022589f', 'Auth-Service-Session', 8, 32, 0.70, 4, 32.0, 'RUNNING'),
-- Rack-B3
(gen_random_uuid(), '7ad887c9-4b6b-4e0c-b26a-de9bb3e3bdf8', 'Microservice-Catalog', 12, 48, 1.00, 3, 31.0, 'RUNNING'),
(gen_random_uuid(), '7ad887c9-4b6b-4e0c-b26a-de9bb3e3bdf8', 'LogElasticSearch-Aggregator', 16, 64, 1.40, 2, 30.0, 'RUNNING'),
-- Rack-B4
(gen_random_uuid(), '0a3ef7df-1b03-49de-ae0e-74409bb10db4', 'Batch-VideoTranscoder', 32, 128, 3.00, 1, 30.0, 'RUNNING'),
-- Rack-C1
(gen_random_uuid(), '565755f8-8942-492e-9eb7-38c9b43bad1d', 'Database-PostgreSQL-Primary', 24, 128, 2.50, 5, 34.0, 'RUNNING'),
(gen_random_uuid(), '565755f8-8942-492e-9eb7-38c9b43bad1d', 'Redis-Cache-Cluster', 8, 64, 0.90, 4, 32.0, 'RUNNING'),
-- Rack-C2
(gen_random_uuid(), '5e71eb3f-eb20-476a-ac58-bd215e051e6b', 'Database-PostgreSQL-Replica', 24, 128, 2.20, 5, 34.0, 'RUNNING'),
-- Rack-C3
(gen_random_uuid(), '2abcfd87-3e4b-4b1d-85fa-7f89b9cd4ef1', 'Ceph-ObjectStorage-OSD1', 12, 64, 1.30, 4, 32.0, 'RUNNING'),
(gen_random_uuid(), '2abcfd87-3e4b-4b1d-85fa-7f89b9cd4ef1', 'Ceph-ObjectStorage-OSD2', 12, 64, 1.30, 4, 32.0, 'RUNNING'),
-- Rack-C4
(gen_random_uuid(), '6fa78bcf-1a4f-4d2e-90ab-c89bdf01a23e', 'GlusterFS-Brick-1', 16, 96, 1.60, 4, 32.0, 'RUNNING'),
(gen_random_uuid(), '6fa78bcf-1a4f-4d2e-90ab-c89bdf01a23e', 'Hadoop-DataNode-3', 16, 64, 1.10, 2, 30.0, 'RUNNING');

-- ==========================================
-- 6. TECHNICIANS (10 Technicians)
-- ==========================================
INSERT INTO technicians (id, name, skillset, status) VALUES
('df6211f4-7879-4d10-8d2c-5b91b6bdb726', 'Sarah Connor', ARRAY['CRAC Repair', 'Cooling Loops', 'Piping'], 'AVAILABLE'),
('6da60d86-2fda-41e0-8ef8-cf9a46c641ce', 'John Connor', ARRAY['GPU Replacement', 'Power Distribution', 'CRAC Repair'], 'AVAILABLE'),
('55f8a3db-cd1b-4d3c-83e1-ab1ef3bdad37', 'T-800', ARRAY['Physical Maintenance', 'Heavy Valve Replacement'], 'AVAILABLE'),
('ab12fcd8-3b4e-4c7b-95fa-e9fb8dcd23ab', 'Miles Dyson', ARRAY['Logic Boards', 'Diagnostic Testing', 'GPU Replacement'], 'AVAILABLE'),
('12cfba3b-4d7a-4ef8-bc8a-c9d78facb02a', 'Marcus Wright', ARRAY['CRAC Repair', 'Electrical Wiring'], 'AVAILABLE'),
('f02a3bcd-4f8e-4a7b-ba5f-b98df12bcdef', 'Kyle Reese', ARRAY['Piping', 'Coolant Recharge', 'Physical Maintenance'], 'AVAILABLE'),
('ea12bcfd-3a4b-4a5f-be8c-90fbcdf8a123', 'Katherine Brewster', ARRAY['GPU Replacement', 'PCIe Diagnostics', 'Logic Boards'], 'AVAILABLE'),
('45bcfd8e-3a2b-4e6f-90fa-bcfda81e3ac8', 'Grace Harper', ARRAY['Power Distribution', 'UPS Battery Swap', 'Electrical Wiring'], 'AVAILABLE'),
('bd78cf2a-3b4a-4e6b-ba7d-df98bacfe822', 'Dani Ramos', ARRAY['Physical Maintenance', 'Air Baffle Fitting'], 'AVAILABLE'),
('cc12bfde-4b3a-4e6b-be8a-cf890bacde23', 'T-1000', ARRAY['Cooling Loops', 'High-Pressure Valves', 'Welding', 'Piping'], 'AVAILABLE');

-- ==========================================
-- 7. INVENTORY ITEMS (30 Items)
-- ==========================================
INSERT INTO inventory_items (part_name, stock, reorder_threshold, unit_cost) VALUES
('chiller_fan_v2', 2, 3, 350.00),
('coolant_valve_3in', 0, 2, 950.00),
('ambient_sensor_hxt', 15, 5, 45.00),
('crac_compressor_p4', 1, 1, 4500.00),
('gpu_fan_block', 8, 4, 120.00),
('copper_pipe_1in', 25, 10, 35.00),
('pressure_sensor_v5', 6, 2, 110.00),
('power_distribution_board', 3, 1, 620.00),
('ups_battery_pack', 4, 2, 1200.00),
('cat6_patch_cable', 120, 30, 2.50),
('thermal_paste_50g', 18, 5, 18.00),
('memory_module_32gb', 14, 5, 115.00),
('cooling_liquid_glycol', 40, 15, 15.00),
('air_baffle_standard', 10, 4, 55.00),
('rack_cabinet_door', 2, 1, 280.00),
('static_grounding_strap', 15, 5, 12.00),
('led_indicator_bulb', 50, 10, 1.50),
('fuse_link_15a', 45, 15, 4.00),
('bolt_screw_kit', 8, 3, 15.00),
('bracket_mounting_kit', 12, 5, 22.00),
('pdu_circuit_breaker', 5, 2, 95.00),
('air_filter_panel', 10, 4, 30.00),
('gpu_retaining_clip', 40, 10, 5.00),
('coolant_hose_braided', 6, 2, 75.00),
('voltage_regulator_mod', 4, 2, 180.00),
('fiber_transceiver_10g', 22, 10, 45.00),
('power_cord_c13_c14', 50, 15, 8.00),
('warning_decal_high_temp', 30, 5, 3.00),
('fan_controller_board', 2, 1, 190.00),
('chiller_seal_gasket', 12, 4, 25.00);

-- ==========================================
-- 8. SUPPLIERS (8 Suppliers)
-- ==========================================
INSERT INTO suppliers (id, name, rating, inventory) VALUES
('548fc991-0f04-45ed-a22b-c0337c7f4d9b', 'Apex Cooling Systems Inc.', 4.80, '{
  "chiller_fan_v2": {"stock": 5, "price": 450.00, "lead_time_hours": 2},
  "coolant_valve_3in": {"stock": 2, "price": 1200.00, "lead_time_hours": 4},
  "crac_compressor_p4": {"stock": 1, "price": 4200.00, "lead_time_hours": 6}
}'::jsonb),
('c9ca69c3-f5ee-440d-b8fb-c06d7b3b9c34', 'Global HVAC Logistics', 4.20, '{
  "chiller_fan_v2": {"stock": 12, "price": 380.00, "lead_time_hours": 8},
  "coolant_valve_3in": {"stock": 0, "price": 1100.00, "lead_time_hours": 24}
}'::jsonb),
('c08debfd-1e0f-4889-be8f-bfdcf922ad23', 'Titan Power Solutions', 4.90, '{
  "ups_battery_pack": {"stock": 10, "price": 1150.00, "lead_time_hours": 3},
  "pdu_circuit_breaker": {"stock": 20, "price": 85.00, "lead_time_hours": 2},
  "power_distribution_board": {"stock": 5, "price": 590.00, "lead_time_hours": 4}
}'::jsonb),
('a5f1de6f-2b87-43cf-bc8f-b98fbc11dddf', 'Silicon Semiconductor Logistics', 4.60, '{
  "memory_module_32gb": {"stock": 150, "price": 95.00, "lead_time_hours": 12},
  "fiber_transceiver_10g": {"stock": 80, "price": 38.00, "lead_time_hours": 6}
}'::jsonb),
('e9bc2a4b-f542-4f81-ba2c-bd7c4f6ab63b', 'Delta Industrial Electronics', 4.50, '{
  "voltage_regulator_mod": {"stock": 8, "price": 165.00, "lead_time_hours": 4},
  "fan_controller_board": {"stock": 10, "price": 175.00, "lead_time_hours": 6}
}'::jsonb),
('f2e1a3bc-2d4e-4b2a-aef4-cf51d8b9d045', 'Thermo Dynamics Corp', 4.30, '{
  "cooling_liquid_glycol": {"stock": 200, "price": 12.00, "lead_time_hours": 12},
  "chiller_seal_gasket": {"stock": 50, "price": 20.00, "lead_time_hours": 2}
}'::jsonb),
('da12bc8f-1a3b-4f7c-ba8e-c90a1b2d3c4e', 'CoolForce Liquid Systems', 4.70, '{
  "coolant_hose_braided": {"stock": 15, "price": 70.00, "lead_time_hours": 3},
  "copper_pipe_1in": {"stock": 100, "price": 30.00, "lead_time_hours": 4}
}'::jsonb),
('18bc7def-2a3b-4c4d-85fa-ff789debc01a', 'Core Component Group', 4.10, '{
  "cat6_patch_cable": {"stock": 500, "price": 1.90, "lead_time_hours": 24},
  "bolt_screw_kit": {"stock": 100, "price": 12.00, "lead_time_hours": 8}
}'::jsonb);

-- ==========================================
-- 9. HISTORICAL INCIDENTS
-- ==========================================
INSERT INTO incident_history (id, rack_id, description, severity, resolved, created_at, resolved_at) VALUES
(gen_random_uuid(), 'f7dfd754-b54a-47e5-b3f9-e5a662c8f84b', 'Chiller valve pressure fluctuation detected. Local temperature spike to 31.2C.', 'WARNING', true, timezone('utc', now() - INTERVAL '3 days'), timezone('utc', now() - INTERVAL '2 days 22 hours')),
(gen_random_uuid(), '0920f20a-7f86-4b80-9877-c0e717f4af70', 'Coolant distribution failure on Rack-A2 secondary manifold. Flow dropped to 1.1 Lps.', 'CRITICAL', true, timezone('utc', now() - INTERVAL '1 day'), timezone('utc', now() - INTERVAL '22 hours')),
(gen_random_uuid(), 'f23cf467-de30-4c47-8950-44bf5b321afd', 'Cabinet vibration alarm triggered on Row-1. Baffle alignment inspected.', 'INFO', true, timezone('utc', now() - INTERVAL '5 days'), timezone('utc', now() - INTERVAL '4 days 23 hours')),
(gen_random_uuid(), 'a9521a0e-6a88-4848-ad49-e64be022589f', 'Warning thermal alert on PDU. Transient current spike detected during database backup.', 'WARNING', true, timezone('utc', now() - INTERVAL '2 days'), timezone('utc', now() - INTERVAL '1 day 23 hours'));

-- ==========================================
-- 10. MAINTENANCE RECORDS
-- ==========================================
INSERT INTO maintenance_tickets (id, target_rack_id, issue_type, description, technician_id, status, parts_required, scheduled_time, resolved_at, estimated_duration_hours, labor_hours, calculated_cost) VALUES
(
    '092df78a-b54a-47e5-b3f9-e5a662c8f84b', 
    '0920f20a-7f86-4b80-9877-c0e717f4af70', 
    'COOLING_LEAK', 
    'Repair degraded coolant inlet hose and replace valve.', 
    'df6211f4-7879-4d10-8d2c-5b91b6bdb726', 
    'RESOLVED', 
    '{"coolant_valve_3in": 1, "coolant_hose_braided": 1}'::jsonb, 
    timezone('utc', now() - INTERVAL '1 day'), 
    timezone('utc', now() - INTERVAL '22 hours'), 
    2.50, 
    2.00, 
    1275.00
);

-- ==========================================
-- 11. WORKFLOW HISTORY
-- ==========================================
INSERT INTO workflow_runs (id, workflow_name, status, started_at, completed_at) VALUES
('b08debfd-1e0f-4889-be8f-bfdcf922ad23', 'HEATWAVE_MITIGATION_MISSION_1', 'COMPLETED', timezone('utc', now() - INTERVAL '1 day'), timezone('utc', now() - INTERVAL '23 hours 50 minutes'));

INSERT INTO workflow_steps (id, run_id, step_name, status, logs, started_at, completed_at) VALUES
(
    'f7dfd754-b54a-47e5-b3f9-e5a662c8f84b', 
    'b08debfd-1e0f-4889-be8f-bfdcf922ad23', 
    'HEATWAVE_TRIGGERED', 
    'COMPLETED', 
    '[Orchestrator] Heatwave simulation activated. Row A temperature spiking.', 
    timezone('utc', now() - INTERVAL '1 day'), 
    timezone('utc', now() - INTERVAL '1 day' + INTERVAL '1 minute')
),
(
    '0920f20a-7f86-4b80-9877-c0e717f4af70', 
    'b08debfd-1e0f-4889-be8f-bfdcf922ad23', 
    'THERMAL_ANALYSIS', 
    'COMPLETED', 
    '[Orchestrator] Hotspot detected on Rack-A2: 37.8°C. Coolant flow degraded to 1.1 lps.', 
    timezone('utc', now() - INTERVAL '1 day' + INTERVAL '2 minutes'), 
    timezone('utc', now() - INTERVAL '1 day' + INTERVAL '3 minutes')
),
(
    'f23cf467-de30-4c47-8950-44bf5b321afd', 
    'b08debfd-1e0f-4889-be8f-bfdcf922ad23', 
    'RISK_ASSESSMENT', 
    'COMPLETED', 
    '[Orchestrator] Risk assessment executed. Exposed SLA costs calculated: $5,000/hr.', 
    timezone('utc', now() - INTERVAL '1 day' + INTERVAL '4 minutes'), 
    timezone('utc', now() - INTERVAL '1 day' + INTERVAL '5 minutes')
);

INSERT INTO decision_logs (id, workflow_step_id, tool_name, input_payload, output_summary, reasoning) VALUES
(
    gen_random_uuid(), 
    'f23cf467-de30-4c47-8950-44bf5b321afd', 
    'assess_operational_risk', 
    '{"rack_id": "0920f20a-7f86-4b80-9877-c0e717f4af70"}'::jsonb, 
    'Operational risk verified: $5,000 SLA penalty exposure on Rack-A2.', 
    'Rack-A2 contains mission critical AI inference endpoints with SLA priority 5. Temperature exceeding 35C threshold triggers penalty clauses of $5000/hour. Immediate mitigation required.'
);

-- ==========================================
-- 12. SLA POLICIES
-- ==========================================
INSERT INTO sla_policies (priority, category, penalty_per_hour_usd, max_allowable_temp) VALUES
(5, 'Mission Critical', 5000.00, 35.0),
(4, 'Production Tier 1', 2500.00, 35.0),
(3, 'Production Tier 2', 1000.00, 32.0),
(2, 'Dev/Test Environment', 250.00, 32.0),
(1, 'Batch Processing', 50.00, 30.0);

-- ==========================================
-- 13. STANDARD OPERATING PROCEDURES (SOPs)
-- ==========================================
INSERT INTO sops (id, title, content) VALUES
(
    'sop-cooling-failure',
    'Emergency Chiller/Cooling Loop Failure Response SOP',
    '# SOP: Emergency Chiller/Cooling Loop Failure Response

## 1. Diagnostics & Verification
- Check `Telemetry Feed` to confirm drop in cooling flow rates (`cooling_flow_rate_lps` < 2.0 L/s).
- Verify chiller efficiency rating and chiller valve pressure.

## 2. Mitigation Strategy
- Identify all racks with temperature trending above 30.0°C.
- Calculate SLA financial exposure and failure risks.
- Migrate high-priority workloads (Priority 4 and 5) first to stable zones (Row C, column 1 & 2).

## 3. Maintenance and Technician Dispatch
- File an emergency corrective maintenance work order detailing needed parts.
- Allocate certified technicians matching the required skillset (e.g. "CRAC Repair").
- Check warehouse inventory. If parts are missing, submit procurement order.
'
),
(
    'sop-thermal-hotspot',
    'Localized Thermal Hotspot Investigation SOP',
    '# SOP: Localized Thermal Hotspot Investigation

## 1. Hotspot Identification
- A localized thermal hotspot is defined as any server rack temperature exceeding 35.0°C while surrounding racks remain stable.
- Check fans and air exhaust blockage telemetry.

## 2. Load Management
- Migrate low-priority workloads away from the affected rack to reduce power draw.
- Cap power draw if temperature exceeds 40.0°C.

## 3. Physical Dispatch
- Schedule a technician to inspect rack fan array and airflow baffles.
'
),
(
    'sop-power-instability',
    'Power Distribution Unit (PDU) & Power Grid Instability SOP',
    '# SOP: Power Grid and PDU Instability

## 1. Emergency Assessment
- Evaluate grid frequency fluctuations.
- Run load balancing to balance power draw across grid phases.
'
);

-- ==========================================
-- 14. TELEMETRY INITIAL LOGS
-- ==========================================
-- Generate initial telemetry readings for 12 racks
INSERT INTO telemetry_logs (rack_id, temperature_celsius, power_draw_kw, cooling_flow_rate_lps, ambient_temperature, cpu_utilization_percent, memory_utilization_percent, recorded_at) VALUES
('f7dfd754-b54a-47e5-b3f9-e5a662c8f84b', 24.5, 9.70, 4.5, 24.0, 62, 60, timezone('utc', now() - INTERVAL '5 minutes')),
('0920f20a-7f86-4b80-9877-c0e717f4af70', 25.1, 7.90, 4.5, 24.0, 43, 43, timezone('utc', now() - INTERVAL '5 minutes')),
('8bcf8c83-fa4c-47e3-99b3-76f5decf7e8b', 23.9, 7.00, 4.5, 24.0, 37, 37, timezone('utc', now() - INTERVAL '5 minutes')),
('ea3b4542-a8b2-4d2c-80a5-f489f66bbd09', 24.0, 5.80, 4.5, 24.0, 25, 25, timezone('utc', now() - INTERVAL '5 minutes')),
('f23cf467-de30-4c47-8950-44bf5b321afd', 21.8, 3.20, 4.5, 24.0, 18, 18, timezone('utc', now() - INTERVAL '5 minutes')),
('a9521a0e-6a88-4848-ad49-e64be022589f', 22.1, 3.80, 4.5, 24.0, 31, 31, timezone('utc', now() - INTERVAL '5 minutes')),
('7ad887c9-4b6b-4e0c-b26a-de9bb3e3bdf8', 22.4, 4.40, 4.5, 24.0, 43, 43, timezone('utc', now() - INTERVAL '5 minutes')),
('0a3ef7df-1b03-49de-ae0e-74409bb10db4', 21.9, 5.00, 4.5, 24.0, 50, 50, timezone('utc', now() - INTERVAL '5 minutes')),
('565755f8-8942-492e-9eb7-38c9b43bad1d', 20.5, 5.40, 4.5, 24.0, 66, 37, timezone('utc', now() - INTERVAL '5 minutes')),
('5e71eb3f-eb20-476a-ac58-bd215e051e6b', 21.0, 4.20, 4.5, 24.0, 50, 25, timezone('utc', now() - INTERVAL '5 minutes')),
('2abcfd87-3e4b-4b1d-85fa-7f89b9cd4ef1', 20.8, 4.60, 4.5, 24.0, 50, 25, timezone('utc', now() - INTERVAL '5 minutes')),
('6fa78bcf-1a4f-4d2e-90ab-c89bdf01a23e', 21.2, 4.70, 4.5, 24.0, 66, 31, timezone('utc', now() - INTERVAL '5 minutes'));
