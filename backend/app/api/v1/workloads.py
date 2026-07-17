from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from uuid import UUID
from app.domain.models import CloudWorkload
from app.api.dependencies import get_workload_repository
from app.features.workload.repositories.interfaces import CloudWorkloadRepository
from app.core.security import get_current_user

router = APIRouter()

@router.get("/", response_model=List[CloudWorkload])
async def list_workloads(
    repo: CloudWorkloadRepository = Depends(get_workload_repository),
    current_user: dict = Depends(get_current_user)
):
    """
    List all cloud workloads active in the cluster.
    """
    return await repo.list_all()

@router.get("/{workload_id}", response_model=CloudWorkload)
async def get_workload(
    workload_id: UUID,
    repo: CloudWorkloadRepository = Depends(get_workload_repository),
    current_user: dict = Depends(get_current_user)
):
    """
    Retrieve details of a specific cloud workload.
    """
    workload = await repo.get_by_id(str(workload_id))
    if not workload:
        raise HTTPException(status_code=404, detail="Workload not found")
    return workload

@router.get("/rack/{rack_id}", response_model=List[CloudWorkload])
async def list_rack_workloads(
    rack_id: UUID,
    repo: CloudWorkloadRepository = Depends(get_workload_repository),
    current_user: dict = Depends(get_current_user)
):
    """
    List all active workloads running on a specific server rack.
    """
    return await repo.list_by_rack(str(rack_id))

@router.post("/", response_model=CloudWorkload, status_code=status.HTTP_201_CREATED)
async def create_workload(
    workload: CloudWorkload,
    repo: CloudWorkloadRepository = Depends(get_workload_repository),
    current_user: dict = Depends(get_current_user)
):
    """
    Create or update a cloud workload in the cluster database.
    """
    return await repo.upsert(workload)

@router.post("/{workload_id}/migrate", response_model=CloudWorkload)
async def migrate_workload(
    workload_id: UUID,
    target_rack_id: UUID,
    repo: CloudWorkloadRepository = Depends(get_workload_repository),
    current_user: dict = Depends(get_current_user)
):
    """
    Manually trigger a hot-migration of a cloud workload to a target rack.
    """
    workload = await repo.migrate_workload(str(workload_id), str(target_rack_id))
    if not workload:
        raise HTTPException(status_code=404, detail="Workload not found")
    return workload
