from abc import ABC, abstractmethod
from typing import List, Optional
from app.domain.models import Rack, CloudWorkload

class RackRepository(ABC):
    @abstractmethod
    async def get_by_id(self, rack_id: str) -> Optional[Rack]:
        pass

    @abstractmethod
    async def list_all(self) -> List[Rack]:
        pass

    @abstractmethod
    async def upsert(self, rack: Rack) -> Rack:
        pass

    @abstractmethod
    async def update_status(self, rack_id: str, status: str) -> Optional[Rack]:
        pass

class CloudWorkloadRepository(ABC):
    @abstractmethod
    async def get_by_id(self, workload_id: str) -> Optional[CloudWorkload]:
        pass

    @abstractmethod
    async def list_by_rack(self, rack_id: str) -> List[CloudWorkload]:
        pass

    @abstractmethod
    async def list_all(self) -> List[CloudWorkload]:
        pass

    @abstractmethod
    async def upsert(self, workload: CloudWorkload) -> CloudWorkload:
        pass

    @abstractmethod
    async def migrate_workload(self, workload_id: str, target_rack_id: str) -> Optional[CloudWorkload]:
        pass
