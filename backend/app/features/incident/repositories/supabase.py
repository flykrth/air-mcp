from typing import List, Optional
from datetime import datetime
from supabase import AsyncClient
from app.domain.models import TelemetryLog, IncidentHistory
from app.features.incident.repositories.interfaces import TelemetryLogRepository, IncidentHistoryRepository
from app.core.config import settings

class SupabaseTelemetryLogRepository(TelemetryLogRepository):
    _memory_store = []

    def __init__(self, client: Optional[AsyncClient] = None):
        self.client = client
        self.is_offline = client is None or not settings.SUPABASE_URL

    async def add(self, log: TelemetryLog) -> TelemetryLog:
        self._memory_store.append(log)
        if self.is_offline:
            return log
        try:
            payload = log.model_dump()
            payload["rack_id"] = str(payload["rack_id"])
            payload["recorded_at"] = payload["recorded_at"].isoformat()
            if payload.get("id") is None:
                payload.pop("id", None)
            res = await self.client.table("telemetry_logs").insert(payload).execute()
            if res.data:
                return TelemetryLog(**res.data[0])
        except Exception:
            pass
        return log

    async def get_latest_by_rack(self, rack_id: str) -> Optional[TelemetryLog]:
        logs = [log for log in self._memory_store if str(log.rack_id) == str(rack_id)]
        if not self.is_offline:
            try:
                res = await self.client.table("telemetry_logs").select("*").eq("rack_id", str(rack_id)).order("recorded_at", desc=True).limit(1).execute()
                if res.data:
                    return TelemetryLog(**res.data[0])
            except Exception:
                pass
        if logs:
            # Sort by recorded_at desc
            logs.sort(key=lambda x: x.recorded_at, reverse=True)
            return logs[0]
        return None

    async def list_by_rack(self, rack_id: str, limit: int = 50) -> List[TelemetryLog]:
        logs = [log for log in self._memory_store if str(log.rack_id) == str(rack_id)]
        if not self.is_offline:
            try:
                res = await self.client.table("telemetry_logs").select("*").eq("rack_id", str(rack_id)).order("recorded_at", desc=True).limit(limit).execute()
                return [TelemetryLog(**item) for item in res.data]
            except Exception:
                pass
        logs.sort(key=lambda x: x.recorded_at, reverse=True)
        return logs[:limit]

class SupabaseIncidentHistoryRepository(IncidentHistoryRepository):
    _memory_store = {}

    def __init__(self, client: Optional[AsyncClient] = None):
        self.client = client
        self.is_offline = client is None or not settings.SUPABASE_URL

    async def get_by_id(self, incident_id: str) -> Optional[IncidentHistory]:
        if self.is_offline:
            return self._memory_store.get(str(incident_id))
        try:
            res = await self.client.table("incident_history").select("*").eq("id", str(incident_id)).execute()
            if res.data:
                return IncidentHistory(**res.data[0])
        except Exception:
            pass
        return self._memory_store.get(str(incident_id))

    async def list_active(self) -> List[IncidentHistory]:
        all_incidents = await self.list_all()
        return [i for i in all_incidents if not i.resolved]

    async def list_all(self) -> List[IncidentHistory]:
        if self.is_offline:
            return list(self._memory_store.values())
        try:
            res = await self.client.table("incident_history").select("*").execute()
            return [IncidentHistory(**item) for item in res.data]
        except Exception:
            return list(self._memory_store.values())

    async def upsert(self, incident: IncidentHistory) -> IncidentHistory:
        self._memory_store[str(incident.id)] = incident
        if self.is_offline:
            return incident
        try:
            payload = incident.model_dump()
            payload["id"] = str(payload["id"])
            payload["rack_id"] = str(payload["rack_id"])
            payload["created_at"] = payload["created_at"].isoformat()
            if payload.get("resolved_at"):
                payload["resolved_at"] = payload["resolved_at"].isoformat()
            await self.client.table("incident_history").upsert(payload).execute()
        except Exception:
            pass
        return incident

    async def resolve_incident(self, rack_id: str) -> List[IncidentHistory]:
        resolved_incidents = []
        for inc in self._memory_store.values():
            if str(inc.rack_id) == str(rack_id) and not inc.resolved:
                inc.resolved = True
                inc.resolved_at = datetime.now()
                resolved_incidents.append(inc)
                if not self.is_offline:
                    try:
                        await self.client.table("incident_history").update({
                            "resolved": True,
                            "resolved_at": inc.resolved_at.isoformat()
                        }).eq("id", str(inc.id)).execute()
                    except Exception:
                        pass
        return resolved_incidents
