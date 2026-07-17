from abc import ABC, abstractmethod
from typing import List, Optional
from app.domain.models import MaintenanceTicket, Technician

class MaintenanceTicketRepository(ABC):
    @abstractmethod
    async def get_by_id(self, ticket_id: str) -> Optional[MaintenanceTicket]:
        pass

    @abstractmethod
    async def list_all(self) -> List[MaintenanceTicket]:
        pass

    @abstractmethod
    async def upsert(self, ticket: MaintenanceTicket) -> MaintenanceTicket:
        pass

    @abstractmethod
    async def assign_technician(self, ticket_id: str, technician_id: str, scheduled_time: str) -> Optional[MaintenanceTicket]:
        pass

    @abstractmethod
    async def resolve_ticket(self, ticket_id: str) -> Optional[MaintenanceTicket]:
        pass

class TechnicianRepository(ABC):
    @abstractmethod
    async def get_by_id(self, technician_id: str) -> Optional[Technician]:
        pass

    @abstractmethod
    async def list_available(self) -> List[Technician]:
        pass

    @abstractmethod
    async def list_all(self) -> List[Technician]:
        pass

    @abstractmethod
    async def upsert(self, technician: Technician) -> Technician:
        pass

    @abstractmethod
    async def update_status(self, technician_id: str, status: str, ticket_id: Optional[str] = None) -> Optional[Technician]:
        pass
