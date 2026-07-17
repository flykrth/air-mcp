from abc import ABC, abstractmethod
from typing import List, Optional
from app.domain.models import Supplier, ProcurementOrder

class SupplierRepository(ABC):
    @abstractmethod
    async def get_by_id(self, supplier_id: str) -> Optional[Supplier]:
        pass

    @abstractmethod
    async def list_all(self) -> List[Supplier]:
        pass

    @abstractmethod
    async def upsert(self, supplier: Supplier) -> Supplier:
        pass

class ProcurementOrderRepository(ABC):
    @abstractmethod
    async def get_by_id(self, order_id: str) -> Optional[ProcurementOrder]:
        pass

    @abstractmethod
    async def list_all(self) -> List[ProcurementOrder]:
        pass

    @abstractmethod
    async def upsert(self, order: ProcurementOrder) -> ProcurementOrder:
        pass

    @abstractmethod
    async def update_status(self, order_id: str, status: str) -> Optional[ProcurementOrder]:
        pass
