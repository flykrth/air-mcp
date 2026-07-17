from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

class OrchestratorState(BaseModel):
    workflow_id: str = ""
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    trigger: Optional[str] = None
    current_step: str = "IDLE"  # IDLE, HEATWAVE_TRIGGERED, THERMAL_ANALYSIS, RISK_ASSESSMENT, WORKLOAD_MIGRATION, MAINTENANCE_PLANNING, SUPPLIER_EVALUATION, PROCUREMENT_AND_RECOVERY, COMPLETED
    step_history: List[str] = Field(default_factory=list)
    agent_logs: List[str] = Field(default_factory=list)
    
    # State data collected by agents
    hotspots: List[Dict[str, Any]] = Field(default_factory=list)
    cooling_loop: Dict[str, Any] = Field(default_factory=dict)
    risk_exposure_usd: float = 0.0
    at_risk_workloads: List[Dict[str, Any]] = Field(default_factory=list)
    migrations_executed: List[Dict[str, Any]] = Field(default_factory=list)
    ticket: Optional[Dict[str, Any]] = None
    selected_technician: Optional[Dict[str, Any]] = None
    parts_needed: Dict[str, int] = Field(default_factory=dict)
    selected_supplier: Optional[Dict[str, Any]] = None
    procure_item: Optional[str] = None
    procure_quantity: Optional[int] = None
    order: Optional[Dict[str, Any]] = None
    recovery_verified: bool = False
    recovery_message: Optional[str] = None

    # First-class Execution Record Tracing Fields
    agent_timeline: List[Dict[str, Any]] = Field(default_factory=list)
    mcp_tool_calls: List[Dict[str, Any]] = Field(default_factory=list)
    resource_reads: List[Dict[str, Any]] = Field(default_factory=list)
    prompt_templates_used: List[Dict[str, Any]] = Field(default_factory=list)
    decision_points: List[Dict[str, Any]] = Field(default_factory=list)
    recovery_metrics: Dict[str, Any] = Field(default_factory=dict)

    def reset(self):
        self.workflow_id = ""
        self.start_time = None
        self.end_time = None
        self.trigger = None
        self.current_step = "IDLE"
        self.step_history = []
        self.agent_logs = []
        self.hotspots = []
        self.cooling_loop = {}
        self.risk_exposure_usd = 0.0
        self.at_risk_workloads = []
        self.migrations_executed = []
        self.ticket = None
        self.selected_technician = None
        self.parts_needed = {}
        self.selected_supplier = None
        self.procure_item = None
        self.procure_quantity = None
        self.order = None
        self.recovery_verified = False
        self.recovery_message = None
        self.agent_timeline = []
        self.mcp_tool_calls = []
        self.resource_reads = []
        self.prompt_templates_used = []
        self.decision_points = []
        self.recovery_metrics = {}

