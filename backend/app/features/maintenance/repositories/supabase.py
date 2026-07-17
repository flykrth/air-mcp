from typing import List, Optional
from uuid import UUID
from datetime import datetime
from supabase import AsyncClient
from app.domain.models import MaintenanceTicket, Technician
from app.features.maintenance.repositories.interfaces import MaintenanceTicketRepository, TechnicianRepository
from app.core.config import settings

class SupabaseMaintenanceTicketRepository(MaintenanceTicketRepository):
    _memory_store = {}

    def __init__(self, client: Optional[AsyncClient] = None):
        self.client = client
        self.is_offline = client is None or not settings.SUPABASE_URL

    async def get_by_id(self, ticket_id: str) -> Optional[MaintenanceTicket]:
        if self.is_offline:
            return self._memory_store.get(str(ticket_id))
        try:
            res = await self.client.table("maintenance_tickets").select("*").eq("id", str(ticket_id)).execute()
            if res.data:
                return MaintenanceTicket(**res.data[0])
        except Exception:
            pass
        return self._memory_store.get(str(ticket_id))

    async def list_all(self) -> List[MaintenanceTicket]:
        if self.is_offline:
            return list(self._memory_store.values())
        try:
            res = await self.client.table("maintenance_tickets").select("*").execute()
            return [MaintenanceTicket(**item) for item in res.data]
        except Exception:
            return list(self._memory_store.values())

    async def upsert(self, ticket: MaintenanceTicket) -> MaintenanceTicket:
        self._memory_store[str(ticket.id)] = ticket
        if self.is_offline:
            return ticket
        try:
            payload = ticket.model_dump()
            payload["id"] = str(payload["id"])
            payload["target_rack_id"] = str(payload["target_rack_id"])
            if payload.get("technician_id"):
                payload["technician_id"] = str(payload["technician_id"])
            payload["scheduled_time"] = payload["scheduled_time"].isoformat()
            if payload.get("resolved_at"):
                payload["resolved_at"] = payload["resolved_at"].isoformat()
            await self.client.table("maintenance_tickets").upsert(payload).execute()
        except Exception:
            pass
        return ticket

    async def assign_technician(self, ticket_id: str, technician_id: str, scheduled_time: str) -> Optional[MaintenanceTicket]:
        ticket = await self.get_by_id(ticket_id)
        if ticket:
            ticket.technician_id = UUID(technician_id) if isinstance(technician_id, str) else technician_id
            ticket.status = "ASSIGNED"
            # Parse scheduled time
            if isinstance(scheduled_time, str):
                ticket.scheduled_time = datetime.fromisoformat(scheduled_time.replace("Z", "+00:00"))
            else:
                ticket.scheduled_time = scheduled_time
            
            self._memory_store[str(ticket_id)] = ticket
            if not self.is_offline:
                try:
                    await self.client.table("maintenance_tickets").update({
                        "technician_id": str(technician_id),
                        "status": "ASSIGNED",
                        "scheduled_time": ticket.scheduled_time.isoformat()
                    }).eq("id", str(ticket_id)).execute()
                except Exception:
                    pass
            return ticket
        return None

    async def resolve_ticket(self, ticket_id: str) -> Optional[MaintenanceTicket]:
        ticket = await self.get_by_id(ticket_id)
        if ticket:
            ticket.status = "RESOLVED"
            ticket.resolved_at = datetime.now()
            self._memory_store[str(ticket_id)] = ticket
            if not self.is_offline:
                try:
                    await self.client.table("maintenance_tickets").update({
                        "status": "RESOLVED",
                        "resolved_at": ticket.resolved_at.isoformat()
                    }).eq("id", str(ticket_id)).execute()
                except Exception:
                    pass
            return ticket
        return None

class SupabaseTechnicianRepository(TechnicianRepository):
    _memory_store = {}

    def __init__(self, client: Optional[AsyncClient] = None):
        self.client = client
        self.is_offline = client is None or not settings.SUPABASE_URL

    async def get_by_id(self, technician_id: str) -> Optional[Technician]:
        if self.is_offline:
            return self._memory_store.get(str(technician_id))
        try:
            res = await self.client.table("technicians").select("*").eq("id", str(technician_id)).execute()
            if res.data:
                return Technician(**res.data[0])
        except Exception:
            pass
        return self._memory_store.get(str(technician_id))

    async def list_available(self) -> List[Technician]:
        all_techs = await self.list_all()
        return [t for t in all_techs if t.status == "AVAILABLE"]

    async def list_all(self) -> List[Technician]:
        if self.is_offline:
            return list(self._memory_store.values())
        try:
            res = await self.client.table("technicians").select("*").execute()
            return [Technician(**item) for item in res.data]
        except Exception:
            return list(self._memory_store.values())

    async def upsert(self, technician: Technician) -> Technician:
        self._memory_store[str(technician.id)] = technician
        if self.is_offline:
            return technician
        try:
            payload = technician.model_dump()
            payload["id"] = str(payload["id"])
            if payload.get("current_ticket_id"):
                payload["current_ticket_id"] = str(payload["current_ticket_id"])
            await self.client.table("technicians").upsert(payload).execute()
        except Exception:
            pass
        return technician

    async def update_status(self, technician_id: str, status: str, ticket_id: Optional[str] = None) -> Optional[Technician]:
        tech = await self.get_by_id(technician_id)
        if tech:
            tech.status = status
            tech.current_ticket_id = UUID(ticket_id) if ticket_id else None
            self._memory_store[str(technician_id)] = tech
            if not self.is_offline:
                try:
                    update_payload = {"status": status}
                    if ticket_id is not None:
                        update_payload["current_ticket_id"] = str(ticket_id)
                    else:
                        update_payload["current_ticket_id"] = None
                    await self.client.table("technicians").update(update_payload).eq("id", str(technician_id)).execute()
                except Exception:
                    pass
            return tech
        return None
