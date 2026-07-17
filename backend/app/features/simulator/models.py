from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Any
from uuid import UUID, uuid4
from datetime import datetime

class SimRack(BaseModel):
    id: UUID
    name: str
    row_id: int
    column_id: int
    max_kw_capacity: float
    cpu_capacity_cores: int = 64
    memory_capacity_gb: int = 256
    status: str = "OPTIMAL"  # 'OPTIMAL', 'DEGRADED', 'CRITICAL'
    
    # Simulation metrics (current state)
    temperature_celsius: float = 22.5
    cooling_flow_rate_lps: float = 4.5
    fan_speed_rpm: float = 3000.0
    power_draw_kw: float = 2.0
    cpu_utilization_percent: int = 0
    memory_utilization_percent: int = 0
    
    # Failures / degradation
    fan_healthy: bool = True
    sensor_healthy: bool = True

class SimWorkload(BaseModel):
    id: UUID
    rack_id: UUID
    name: str
    vcpus: int
    memory_gb: int
    power_kw: float
    priority: int  # 1 to 5
    sla_threshold_temp: float
    status: str  # 'RUNNING', 'MIGRATING', 'TERMINATED', 'COMPLETED'
    created_at: datetime

class SimTechnician(BaseModel):
    id: UUID
    name: str
    skillset: List[str]
    status: str  # 'AVAILABLE', 'ON_DUTY', 'OFF_LINE'
    current_ticket_id: Optional[UUID] = None
    travel_time_remaining_ticks: int = 0
    repair_time_remaining_ticks: int = 0

class SimInventoryItem(BaseModel):
    part_name: str
    stock: int
    reorder_threshold: int
    unit_cost: float

class SimSupplier(BaseModel):
    id: UUID
    name: str
    rating: float
    inventory: Dict[str, Dict[str, Any]]  # part_name -> {stock, price, lead_time_hours}

class SimProcurementOrder(BaseModel):
    id: UUID
    ticket_id: UUID
    supplier_id: UUID
    supplier_name: str
    items: List[Dict[str, Any]]
    total_cost: float
    status: str  # 'ORDERED', 'DELIVERED'
    ticks_to_delivery: int = 0
    estimated_delivery: datetime

class SimMaintenanceTicket(BaseModel):
    id: UUID
    target_rack_id: UUID
    issue_type: str  # 'COOLING_LEAK', 'FAN_FAILURE', 'POWER_UNIT_FAULT', 'GPU_OVERHEAT', 'VALVE_BLOCKAGE'
    description: str
    technician_id: Optional[UUID] = None
    status: str  # 'OPEN', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED'
    parts_required: Dict[str, int]
    scheduled_time: datetime
    resolved_at: Optional[datetime] = None
    estimated_duration_hours: float
    labor_hours: float
    calculated_cost: float = 0.0

class SimIncident(BaseModel):
    id: UUID
    rack_id: UUID
    description: str
    severity: str  # 'INFO', 'WARNING', 'CRITICAL'
    resolved: bool
    created_at: datetime
    resolved_at: Optional[datetime] = None

class SimState(BaseModel):
    ambient_temp: float = 24.0
    ambient_humidity_percent: float = 45.0
    cooling_system_healthy: bool = True
    cooling_system_efficiency: float = 1.0  # 0.0 to 1.0
    heatwave_active: bool = False
    power_grid_frequency_hz: float = 50.0
    power_grid_voltage_v: float = 230.0
    ups_charge_percent: float = 100.0
    
    racks: List[SimRack] = Field(default_factory=list)
    telemetry_logs: List[Dict[str, Any]] = Field(default_factory=list)
    workloads: List[SimWorkload] = Field(default_factory=list)
    technicians: List[SimTechnician] = Field(default_factory=list)
    inventory: Dict[str, SimInventoryItem] = Field(default_factory=dict)
    suppliers: List[SimSupplier] = Field(default_factory=list)
    orders: List[SimProcurementOrder] = Field(default_factory=list)
    tickets: List[SimMaintenanceTicket] = Field(default_factory=list)
    incidents: List[SimIncident] = Field(default_factory=list)
    
    mode: str = "PAUSED"  # 'NORMAL', 'ACCELERATED', 'PAUSED', 'STEP'
    speed_factor: float = 1.0
    tick_count: int = 0
    last_tick_time: datetime = Field(default_factory=datetime.now)
