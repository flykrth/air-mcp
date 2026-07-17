from pydantic import BaseModel
from typing import List, Dict, Any, Optional

class RunWorkflowResponse(BaseModel):
    status: str
    current_step: str
    step_history: List[str]
    agent_logs: List[str]
    hotspots: List[Dict[str, Any]]
    cooling_loop: Dict[str, Any]
    risk_exposure_usd: float
    at_risk_workloads: List[Dict[str, Any]]
    migrations_executed: List[Dict[str, Any]]
    ticket: Optional[Dict[str, Any]] = None
    selected_technician: Optional[Dict[str, Any]] = None
    selected_supplier: Optional[Dict[str, Any]] = None
    order: Optional[Dict[str, Any]] = None
    recovery_verified: bool
    recovery_message: Optional[str] = None

class TriggerSimulationRequest(BaseModel):
    event_type: str  # 'HEATWAVE' or 'COOLING_DEGRADATION' or 'RESET'
