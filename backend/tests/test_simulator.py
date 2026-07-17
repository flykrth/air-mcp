import pytest
import uuid
from datetime import datetime, timedelta
from app.features.simulator.engine import SimulatorEngine
from app.features.simulator.models import SimState

@pytest.fixture(autouse=True)
def setup_simulator():
    # Reset simulator before each test
    engine = SimulatorEngine()
    engine.reset()
    yield engine

def test_initial_state(setup_simulator):
    engine = setup_simulator
    state = engine.state
    
    assert state.ambient_temp == 24.0
    assert state.cooling_system_healthy is True
    assert len(state.racks) == 6
    assert all(r.status == "OPTIMAL" for r in state.racks)
    assert all(r.temperature_celsius == 22.5 for r in state.racks)
    assert len(state.technicians) == 3
    assert len(state.telemetry_logs) == 6

def test_causal_thermal_propagation_heatwave(setup_simulator):
    engine = setup_simulator
    
    # Inject Heatwave and Cooling Degradation (simulates double outage)
    engine.inject_incident("HEATWAVE")
    engine.inject_incident("COOLING_DEGRADATION")
    assert engine.state.heatwave_active is True
    assert engine.state.cooling_system_healthy is False
    
    # Tick simulator multiple times
    for _ in range(10):
        engine.tick()
        
    # Ambient temp should rise from 24.0C
    assert engine.state.ambient_temp > 24.0
    # Rack temperatures should rise as a result of degraded cooling and elevated ambient temp
    assert any(r.temperature_celsius > 22.5 for r in engine.state.racks)

def test_causal_cooling_failure(setup_simulator):
    engine = setup_simulator
    
    # Inject cooling loop degradation
    engine.inject_incident("COOLING_DEGRADATION")
    assert engine.state.cooling_system_healthy is False
    
    # Racks on Row A (0) and B (1) should spike to CRITICAL
    critical_racks = [r for r in engine.state.racks if r.row_id != 2]
    assert len(critical_racks) == 4
    assert all(r.status == "CRITICAL" for r in critical_racks)
    assert all(r.cooling_flow_rate_lps == 1.35 for r in critical_racks)
    
    # Racks on Row C (2) should remain OPTIMAL (uses backup cooling loop)
    backup_racks = [r for r in engine.state.racks if r.row_id == 2]
    assert len(backup_racks) == 2
    assert all(r.status == "OPTIMAL" for r in backup_racks)

def test_fan_failure_physics(setup_simulator):
    engine = setup_simulator
    target_rack = engine.state.racks[0]
    
    # Inject Fan Failure
    engine.inject_incident("FAN_FAILURE", target_rack.id)
    assert target_rack.fan_healthy is False
    
    # Flow rate should drop and temperature rise
    engine.tick()
    assert target_rack.fan_speed_rpm == 500.0  # fallback speed
    assert target_rack.cooling_flow_rate_lps < 4.5  # degraded flow

def test_maintenance_flow_with_inventory(setup_simulator):
    engine = setup_simulator
    target_rack = engine.state.racks[0]
    
    # 1. Inject Fan Failure
    engine.inject_incident("FAN_FAILURE", target_rack.id)
    
    # 2. Plan maintenance ticket
    ticket = engine.plan_maintenance(target_rack.id, "FAN_FAILURE", "Replace broken chassis fans")
    assert ticket.status == "OPEN"
    assert ticket.parts_required == {"chiller_fan_v2": 2}
    
    # 3. Schedule Technician (Sarah Connor has 'CRAC Repair' skillset)
    tech = engine.state.technicians[0]
    engine.schedule_technician(ticket.id, tech.id, datetime.now())
    
    assert ticket.status == "ASSIGNED"
    assert tech.status == "ON_DUTY"
    assert tech.travel_time_remaining_ticks == 2
    
    # 4. Tick to simulate travel time (2 ticks)
    engine.tick()
    assert ticket.status == "ASSIGNED"
    engine.tick()
    # On 2nd tick travel time becomes 0, parts are deducted, and status moves to IN_PROGRESS
    assert ticket.status == "IN_PROGRESS"
    assert tech.repair_time_remaining_ticks > 0
    
    # Deducted stock from warehouse: chiller_fan_v2 was stock 2, now should be 0
    assert engine.state.inventory["chiller_fan_v2"].stock == 0
    
    # 5. Tick to complete repair
    ticks_to_repair = tech.repair_time_remaining_ticks
    for _ in range(ticks_to_repair):
        engine.tick()
        
    assert ticket.status == "RESOLVED"
    assert tech.status == "AVAILABLE"
    assert target_rack.fan_healthy is True
    assert target_rack.status == "OPTIMAL"

def test_supply_chain_procurement(setup_simulator):
    engine = setup_simulator
    target_rack = engine.state.racks[0]
    
    # Valve blockage requires coolant_valve_3in, which is OUT of stock (stock = 0)
    ticket = engine.plan_maintenance(target_rack.id, "VALVE_BLOCKAGE", "Blocked loop valve")
    assert engine.state.inventory["coolant_valve_3in"].stock == 0
    
    # Schedule tech: Tech is assigned, but will wait at warehouse since parts are missing
    tech = engine.state.technicians[0]
    engine.schedule_technician(ticket.id, tech.id, datetime.now())
    assert ticket.status == "ASSIGNED"
    assert tech.status == "ON_DUTY"
    
    # Tick: technician should not start travel time since parts are missing
    engine.tick()
    assert tech.travel_time_remaining_ticks == 2 # remains at 2
    
    # Place procurement order with Supplier 1 (Apex Cooling)
    supplier = engine.state.suppliers[0]
    order = engine.generate_procurement_plan(ticket.id, supplier.id, {"coolant_valve_3in": 1})
    
    assert order.status == "ORDERED"
    assert order.ticks_to_delivery > 0
    
    # Tick until delivery
    ticks_to_delivery = order.ticks_to_delivery
    for _ in range(ticks_to_delivery):
        engine.tick()
        
    assert order.status == "DELIVERED"
    # Warehouse stock should be updated (was 0, ordered 1, tech travel will immediately deduct 1, so stock goes to 1 then 0)
    # Let's verify tech travel has started
    assert ticket.status == "ASSIGNED"
    assert tech.travel_time_remaining_ticks < 2  # tech travel has begun!

def test_workload_migration(setup_simulator):
    engine = setup_simulator
    rack_a = engine.state.racks[0]
    rack_b = engine.state.racks[1]
    
    # Find a workload running on rack A
    workload = next(w for w in engine.state.workloads if w.rack_id == rack_a.id)
    
    # Migrate to rack B
    engine.migrate_workload(workload.id, rack_b.id)
    
    assert workload.rack_id == rack_b.id
    # Power and utilization should shift on next tick
    engine.tick()
    
    # Verify workload is running on rack B
    assert workload.status == "RUNNING"
