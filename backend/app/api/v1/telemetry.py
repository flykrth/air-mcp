from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from uuid import UUID
from app.domain.models import TelemetryLog
from app.api.dependencies import get_telemetry_repository
from app.features.incident.repositories.interfaces import TelemetryLogRepository
from app.core.security import get_current_user

router = APIRouter()

@router.post("/", response_model=TelemetryLog, status_code=status.HTTP_201_CREATED)
async def create_telemetry_log(
    log: TelemetryLog,
    repo: TelemetryLogRepository = Depends(get_telemetry_repository),
    current_user: dict = Depends(get_current_user)
):
    """
    Ingest a new telemetry reading log for a server rack.
    """
    return await repo.add(log)

@router.get("/rack/{rack_id}", response_model=List[TelemetryLog])
async def list_rack_telemetry(
    rack_id: UUID,
    limit: int = 50,
    repo: TelemetryLogRepository = Depends(get_telemetry_repository),
    current_user: dict = Depends(get_current_user)
):
    """
    Retrieve historical telemetry readings for a specific server rack.
    """
    return await repo.list_by_rack(str(rack_id), limit)

@router.get("/rack/{rack_id}/latest", response_model=TelemetryLog)
async def get_latest_rack_telemetry(
    rack_id: UUID,
    repo: TelemetryLogRepository = Depends(get_telemetry_repository),
    current_user: dict = Depends(get_current_user)
):
    """
    Get the most recent telemetry log for a specific server rack.
    """
    log = await repo.get_latest_by_rack(str(rack_id))
    if not log:
        raise HTTPException(status_code=404, detail="No telemetry logs found for this rack")
    return log
