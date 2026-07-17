from abc import ABC, abstractmethod
from typing import List, Optional
from app.domain.models import TelemetryLog, IncidentHistory

class TelemetryLogRepository(ABC):
    @abstractmethod
    async def add(self, log: TelemetryLog) -> TelemetryLog:
        pass

    @abstractmethod
    async def get_latest_by_rack(self, rack_id: str) -> Optional[TelemetryLog]:
        pass

    @abstractmethod
    async def list_by_rack(self, rack_id: str, limit: int = 50) -> List[TelemetryLog]:
        pass

class IncidentHistoryRepository(ABC):
    @abstractmethod
    async def get_by_id(self, incident_id: str) -> Optional[IncidentHistory]:
        pass

    @abstractmethod
    async def list_active(self) -> List[IncidentHistory]:
        pass

    @abstractmethod
    async def list_all(self) -> List[IncidentHistory]:
        pass

    @abstractmethod
    async def upsert(self, incident: IncidentHistory) -> IncidentHistory:
        pass

    @abstractmethod
    async def resolve_incident(self, rack_id: str) -> List[IncidentHistory]:
        pass
