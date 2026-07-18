from fastapi import APIRouter, HTTPException, BackgroundTasks, status
from pydantic import BaseModel
from typing import Optional, Dict
from uuid import UUID
import uuid
from datetime import datetime

from app.features.simulator.engine import SimulatorEngine
from app.features.simulator.sync_service import DatabaseSyncService

router = APIRouter()
engine = SimulatorEngine()
sync_service = DatabaseSyncService()

# Register the DB syncer callback to persist ticks
engine.register_callback(sync_service.on_simulator_tick)

class ControlPayload(BaseModel):
    mode: str  # 'NORMAL', 'ACCELERATED', 'PAUSED', 'STEP'
    speed_factor: Optional[float] = 1.0

class IncidentPayload(BaseModel):
    event_type: str  # 'HEATWAVE', 'COOLING_DEGRADATION', 'POWER_FLUCTUATION', 'FAN_FAILURE', 'SENSOR_MALFUNCTION', 'VALVE_BLOCKAGE'
    rack_id: Optional[UUID] = None

class MigratePayload(BaseModel):
    workload_id: UUID
    target_rack_id: UUID

class PlanMaintenancePayload(BaseModel):
    target_rack_id: UUID
    issue_type: str
    description: str

class ScheduleTechnicianPayload(BaseModel):
    ticket_id: UUID
    technician_id: UUID
    scheduled_time: datetime

class ConfirmRepairPayload(BaseModel):
    ticket_id: UUID

class ProcurePartsPayload(BaseModel):
    ticket_id: UUID
    supplier_id: UUID
    parts: Dict[str, int]

@router.get("/state")
def get_simulator_state():
    """Retrieve the full internal state of the Digital Twin."""
    return engine.state

@router.post("/control")
def control_simulation(payload: ControlPayload):
    """Start, pause, or change the speed of the simulation."""
    if payload.mode not in ["NORMAL", "ACCELERATED", "PAUSED", "STEP"]:
        raise HTTPException(status_code=400, detail="Invalid simulation mode")
    
    engine.start(payload.mode, payload.speed_factor or 1.0)
    if payload.mode == "PAUSED":
        engine.pause()
        
    return {
        "status": "success",
        "message": f"Simulation set to {payload.mode} mode with speed factor {payload.speed_factor or 1.0}",
        "mode": engine.state.mode,
        "speed_factor": engine.state.speed_factor
    }

@router.post("/tick")
def trigger_manual_tick():
    """Manually step the simulation forward one tick (useful in PAUSED or STEP mode)."""
    engine.tick()
    return {
        "status": "success",
        "message": "Manual simulation tick executed.",
        "tick_count": engine.state.tick_count
    }

@router.post("/incident")
def inject_incident(payload: IncidentPayload):
    """Inject a simulated incident into the data center infrastructure."""
    valid_events = [
        "HEATWAVE", "COOLING_DEGRADATION", "POWER_FLUCTUATION", 
        "FAN_FAILURE", "SENSOR_MALFUNCTION", "VALVE_BLOCKAGE"
    ]
    if payload.event_type not in valid_events:
        raise HTTPException(
            status_code=400, 
            detail=f"Invalid event type. Supported: {', '.join(valid_events)}"
        )
    
    incident = engine.inject_incident(payload.event_type, payload.rack_id)
    return {
        "status": "success",
        "message": f"Incident {payload.event_type} injected successfully.",
        "incident": incident
    }

@router.post("/migrate")
def migrate_workload(payload: MigratePayload):
    """Migrate a workload to a target rack inside the simulator."""
    try:
        engine.migrate_workload(payload.workload_id, payload.target_rack_id)
        return {"status": "success", "message": "Workload migrated successfully."}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.post("/maintenance/plan")
def plan_maintenance(payload: PlanMaintenancePayload):
    """File a maintenance ticket for a rack inside the simulator."""
    ticket = engine.plan_maintenance(payload.target_rack_id, payload.issue_type, payload.description)
    return {"status": "success", "ticket": ticket}

@router.post("/maintenance/schedule")
def schedule_technician(payload: ScheduleTechnicianPayload):
    """Schedule a technician for a maintenance work order inside the simulator."""
    try:
        engine.schedule_technician(payload.ticket_id, payload.technician_id, payload.scheduled_time)
        return {"status": "success", "message": "Technician scheduled successfully."}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/maintenance/confirm")
def confirm_repair(payload: ConfirmRepairPayload):
    """Confirm complete repair of a ticket inside the simulator."""
    try:
        engine.confirm_maintenance_repair(payload.ticket_id)
        return {"status": "success", "message": "Repair confirmed and loops restored."}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.post("/procure")
def procure_parts(payload: ProcurePartsPayload):
    """Generate a procurement order for missing replacement parts inside the simulator."""
    try:
        order = engine.generate_procurement_plan(payload.ticket_id, payload.supplier_id, payload.parts)
        return {"status": "success", "procurement_order": order}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/reset")
def reset_simulation():
    """Reset the digital twin simulation to initial healthy conditions."""
    engine.reset()
    return {
        "status": "success",
        "message": "Simulation reset completed."
    }

