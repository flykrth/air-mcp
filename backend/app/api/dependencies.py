from fastapi import Depends
from typing import Optional
from supabase import AsyncClient
from app.core.database import get_supabase_client
from app.core.config import settings

# Import Supabase repository concrete classes
from app.features.workload.repositories.supabase import SupabaseRackRepository, SupabaseCloudWorkloadRepository
from app.features.incident.repositories.supabase import SupabaseTelemetryLogRepository, SupabaseIncidentHistoryRepository
from app.features.maintenance.repositories.supabase import SupabaseMaintenanceTicketRepository, SupabaseTechnicianRepository
from app.features.supplier.repositories.supabase import SupabaseSupplierRepository, SupabaseProcurementOrderRepository

# Import interfaces
from app.features.workload.repositories.interfaces import RackRepository, CloudWorkloadRepository
from app.features.incident.repositories.interfaces import TelemetryLogRepository, IncidentHistoryRepository
from app.features.maintenance.repositories.interfaces import MaintenanceTicketRepository, TechnicianRepository
from app.features.supplier.repositories.interfaces import SupplierRepository, ProcurementOrderRepository

async def get_db_client() -> Optional[AsyncClient]:
    if not settings.SUPABASE_URL or not settings.SUPABASE_KEY:
        return None
    try:
        return await get_supabase_client()
    except Exception:
        return None

# Singleton repositories to preserve shared in-memory fallbacks
_rack_repo = None
_workload_repo = None
_telemetry_repo = None
_incident_repo = None
_ticket_repo = None
_technician_repo = None
_supplier_repo = None
_order_repo = None

def get_rack_repository(client: Optional[AsyncClient] = Depends(get_db_client)) -> RackRepository:
    global _rack_repo
    if _rack_repo is None:
        _rack_repo = SupabaseRackRepository(client)
    return _rack_repo

def get_workload_repository(client: Optional[AsyncClient] = Depends(get_db_client)) -> CloudWorkloadRepository:
    global _workload_repo
    if _workload_repo is None:
        _workload_repo = SupabaseCloudWorkloadRepository(client)
    return _workload_repo

def get_telemetry_repository(client: Optional[AsyncClient] = Depends(get_db_client)) -> TelemetryLogRepository:
    global _telemetry_repo
    if _telemetry_repo is None:
        _telemetry_repo = SupabaseTelemetryLogRepository(client)
    return _telemetry_repo

def get_incident_repository(client: Optional[AsyncClient] = Depends(get_db_client)) -> IncidentHistoryRepository:
    global _incident_repo
    if _incident_repo is None:
        _incident_repo = SupabaseIncidentHistoryRepository(client)
    return _incident_repo

def get_ticket_repository(client: Optional[AsyncClient] = Depends(get_db_client)) -> MaintenanceTicketRepository:
    global _ticket_repo
    if _ticket_repo is None:
        _ticket_repo = SupabaseMaintenanceTicketRepository(client)
    return _ticket_repo

def get_technician_repository(client: Optional[AsyncClient] = Depends(get_db_client)) -> TechnicianRepository:
    global _technician_repo
    if _technician_repo is None:
        _technician_repo = SupabaseTechnicianRepository(client)
    return _technician_repo

def get_supplier_repository(client: Optional[AsyncClient] = Depends(get_db_client)) -> SupplierRepository:
    global _supplier_repo
    if _supplier_repo is None:
        _supplier_repo = SupabaseSupplierRepository(client)
    return _supplier_repo

def get_order_repository(client: Optional[AsyncClient] = Depends(get_db_client)) -> ProcurementOrderRepository:
    global _order_repo
    if _order_repo is None:
        _order_repo = SupabaseProcurementOrderRepository(client)
    return _order_repo
