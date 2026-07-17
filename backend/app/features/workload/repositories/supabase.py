from typing import List, Optional
from uuid import UUID
from supabase import AsyncClient
from app.domain.models import Rack, CloudWorkload
from app.features.workload.repositories.interfaces import RackRepository, CloudWorkloadRepository
from app.core.config import settings

class SupabaseRackRepository(RackRepository):
    _memory_store = {}

    def __init__(self, client: Optional[AsyncClient] = None):
        self.client = client
        self.is_offline = client is None or not settings.SUPABASE_URL

    async def get_by_id(self, rack_id: str) -> Optional[Rack]:
        if self.is_offline:
            return self._memory_store.get(str(rack_id))
        try:
            res = await self.client.table("racks").select("*").eq("id", str(rack_id)).execute()
            if res.data:
                return Rack(**res.data[0])
        except Exception:
            pass
        return self._memory_store.get(str(rack_id))

    async def list_all(self) -> List[Rack]:
        if self.is_offline:
            return list(self._memory_store.values())
        try:
            res = await self.client.table("racks").select("*").execute()
            return [Rack(**item) for item in res.data]
        except Exception:
            return list(self._memory_store.values())

    async def upsert(self, rack: Rack) -> Rack:
        # Save to memory store first
        self._memory_store[str(rack.id)] = rack
        if self.is_offline:
            return rack
        try:
            payload = rack.model_dump()
            payload["id"] = str(payload["id"])
            payload["created_at"] = payload["created_at"].isoformat()
            await self.client.table("racks").upsert(payload).execute()
        except Exception:
            pass
        return rack

    async def update_status(self, rack_id: str, status: str) -> Optional[Rack]:
        rack = await self.get_by_id(rack_id)
        if rack:
            rack.status = status
            self._memory_store[str(rack_id)] = rack
            if not self.is_offline:
                try:
                    await self.client.table("racks").update({"status": status}).eq("id", str(rack_id)).execute()
                except Exception:
                    pass
            return rack
        return None

class SupabaseCloudWorkloadRepository(CloudWorkloadRepository):
    _memory_store = {}

    def __init__(self, client: Optional[AsyncClient] = None):
        self.client = client
        self.is_offline = client is None or not settings.SUPABASE_URL

    async def get_by_id(self, workload_id: str) -> Optional[CloudWorkload]:
        if self.is_offline:
            return self._memory_store.get(str(workload_id))
        try:
            res = await self.client.table("cloud_workloads").select("*").eq("id", str(workload_id)).execute()
            if res.data:
                return CloudWorkload(**res.data[0])
        except Exception:
            pass
        return self._memory_store.get(str(workload_id))

    async def list_by_rack(self, rack_id: str) -> List[CloudWorkload]:
        all_workloads = await self.list_all()
        return [w for w in all_workloads if str(w.rack_id) == str(rack_id)]

    async def list_all(self) -> List[CloudWorkload]:
        if self.is_offline:
            return list(self._memory_store.values())
        try:
            res = await self.client.table("cloud_workloads").select("*").execute()
            return [CloudWorkload(**item) for item in res.data]
        except Exception:
            return list(self._memory_store.values())

    async def upsert(self, workload: CloudWorkload) -> CloudWorkload:
        self._memory_store[str(workload.id)] = workload
        if self.is_offline:
            return workload
        try:
            payload = workload.model_dump()
            payload["id"] = str(payload["id"])
            payload["rack_id"] = str(payload["rack_id"])
            payload["created_at"] = payload["created_at"].isoformat()
            await self.client.table("cloud_workloads").upsert(payload).execute()
        except Exception:
            pass
        return workload

    async def migrate_workload(self, workload_id: str, target_rack_id: str) -> Optional[CloudWorkload]:
        workload = await self.get_by_id(workload_id)
        if workload:
            workload.rack_id = UUID(target_rack_id) if isinstance(target_rack_id, str) else target_rack_id
            self._memory_store[str(workload_id)] = workload
            if not self.is_offline:
                try:
                    await self.client.table("cloud_workloads").update({"rack_id": str(target_rack_id)}).eq("id", str(workload_id)).execute()
                except Exception:
                    pass
            return workload
        return None
