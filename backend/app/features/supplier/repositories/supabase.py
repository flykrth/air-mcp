from typing import List, Optional
from uuid import UUID
from datetime import datetime
from supabase import AsyncClient
from app.domain.models import Supplier, ProcurementOrder
from app.features.supplier.repositories.interfaces import SupplierRepository, ProcurementOrderRepository
from app.core.config import settings

class SupabaseSupplierRepository(SupplierRepository):
    _memory_store = {}

    def __init__(self, client: Optional[AsyncClient] = None):
        self.client = client
        self.is_offline = client is None or not settings.SUPABASE_URL

    async def get_by_id(self, supplier_id: str) -> Optional[Supplier]:
        if self.is_offline:
            return self._memory_store.get(str(supplier_id))
        try:
            res = await self.client.table("suppliers").select("*").eq("id", str(supplier_id)).execute()
            if res.data:
                return Supplier(**res.data[0])
        except Exception:
            pass
        return self._memory_store.get(str(supplier_id))

    async def list_all(self) -> List[Supplier]:
        if self.is_offline:
            return list(self._memory_store.values())
        try:
            res = await self.client.table("suppliers").select("*").execute()
            return [Supplier(**item) for item in res.data]
        except Exception:
            return list(self._memory_store.values())

    async def upsert(self, supplier: Supplier) -> Supplier:
        self._memory_store[str(supplier.id)] = supplier
        if self.is_offline:
            return supplier
        try:
            payload = supplier.model_dump()
            payload["id"] = str(payload["id"])
            await self.client.table("suppliers").upsert(payload).execute()
        except Exception:
            pass
        return supplier

class SupabaseProcurementOrderRepository(ProcurementOrderRepository):
    _memory_store = {}

    def __init__(self, client: Optional[AsyncClient] = None):
        self.client = client
        self.is_offline = client is None or not settings.SUPABASE_URL

    async def get_by_id(self, order_id: str) -> Optional[ProcurementOrder]:
        if self.is_offline:
            return self._memory_store.get(str(order_id))
        try:
            res = await self.client.table("procurement_orders").select("*").eq("id", str(order_id)).execute()
            if res.data:
                return ProcurementOrder(**res.data[0])
        except Exception:
            pass
        return self._memory_store.get(str(order_id))

    async def list_all(self) -> List[ProcurementOrder]:
        if self.is_offline:
            return list(self._memory_store.values())
        try:
            res = await self.client.table("procurement_orders").select("*").execute()
            return [ProcurementOrder(**item) for item in res.data]
        except Exception:
            return list(self._memory_store.values())

    async def upsert(self, order: ProcurementOrder) -> ProcurementOrder:
        self._memory_store[str(order.id)] = order
        if self.is_offline:
            return order
        try:
            payload = order.model_dump()
            payload["id"] = str(payload["id"])
            payload["ticket_id"] = str(payload["ticket_id"])
            payload["supplier_id"] = str(payload["supplier_id"])
            payload["estimated_delivery"] = payload["estimated_delivery"].isoformat()
            await self.client.table("procurement_orders").upsert(payload).execute()
        except Exception:
            pass
        return order

    async def update_status(self, order_id: str, status: str) -> Optional[ProcurementOrder]:
        order = await self.get_by_id(order_id)
        if order:
            order.status = status
            self._memory_store[str(order_id)] = order
            if not self.is_offline:
                try:
                    await self.client.table("procurement_orders").update({"status": status}).eq("id", str(order_id)).execute()
                except Exception:
                    pass
            return order
        return None
