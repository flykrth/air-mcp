from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from uuid import UUID
from datetime import datetime

class Rack(BaseModel):
    id: UUID
    name: str
    row_id: int
    column_id: int
    max_kw_capacity: float
    status: str  # 'OPTIMAL', 'DEGRADED', 'CRITICAL'
    created_at: datetime

class TelemetryLog(BaseModel):
    id: Optional[int] = None
    rack_id: UUID
    temperature_celsius: float
    power_draw_kw: float
    cooling_flow_rate_lps: float
    ambient_temperature: float
    recorded_at: datetime

class CloudWorkload(BaseModel):
    id: UUID
    rack_id: UUID
    name: str
    vcpus: int
    memory_gb: int
    priority: int  # 1 to 5
    sla_threshold_temp: float
    status: str  # 'RUNNING', 'MIGRATING', 'TERMINATED', 'COMPLETED'
    created_at: datetime

class MaintenanceTicket(BaseModel):
    id: UUID
    target_rack_id: UUID
    description: str
    technician_id: Optional[UUID] = None
    status: str  # 'OPEN', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED'
    parts_required: Dict[str, int] = Field(default_factory=dict)  # e.g., {"chiller_fan": 1}
    scheduled_time: datetime
    resolved_at: Optional[datetime] = None

class Technician(BaseModel):
    id: UUID
    name: str
    skillset: List[str]
    status: str  # 'AVAILABLE', 'ON_DUTY', 'OFF_LINE'
    current_ticket_id: Optional[UUID] = None

class Supplier(BaseModel):
    id: UUID
    name: str
    rating: float
    inventory: Dict[str, Dict[str, Any]]  # e.g., {"chiller_fan_v2": {"stock": 10, "price": 450, "lead_time_hours": 4}}

class ProcurementOrder(BaseModel):
    id: UUID
    ticket_id: UUID
    supplier_id: UUID
    item_name: str
    quantity: int
    total_cost: float
    status: str  # 'PENDING', 'ORDERED', 'DELIVERED'
    estimated_delivery: datetime

class IncidentHistory(BaseModel):
    id: UUID
    rack_id: UUID
    description: str
    resolved: bool
    created_at: datetime
    resolved_at: Optional[datetime] = None
