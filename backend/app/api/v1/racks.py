from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from uuid import UUID
from app.domain.models import Rack
from app.api.dependencies import get_rack_repository
from app.features.workload.repositories.interfaces import RackRepository
from app.core.security import get_current_user

router = APIRouter()

@router.get("/", response_model=List[Rack])
async def list_racks(
    repo: RackRepository = Depends(get_rack_repository),
    current_user: dict = Depends(get_current_user)
):
    """
    List all racks in the datacenter grid.
    """
    return await repo.list_all()

@router.get("/{rack_id}", response_model=Rack)
async def get_rack(
    rack_id: UUID,
    repo: RackRepository = Depends(get_rack_repository),
    current_user: dict = Depends(get_current_user)
):
    """
    Retrieve details of a specific server rack.
    """
    rack = await repo.get_by_id(str(rack_id))
    if not rack:
        raise HTTPException(status_code=404, detail="Rack not found")
    return rack

@router.post("/", response_model=Rack, status_code=status.HTTP_201_CREATED)
async def create_rack(
    rack: Rack,
    repo: RackRepository = Depends(get_rack_repository),
    current_user: dict = Depends(get_current_user)
):
    """
    Create or update a server rack in the digital twin registry.
    """
    return await repo.upsert(rack)

@router.put("/{rack_id}/status", response_model=Rack)
async def update_rack_status(
    rack_id: UUID,
    status_str: str,
    repo: RackRepository = Depends(get_rack_repository),
    current_user: dict = Depends(get_current_user)
):
    """
    Update the operational status of a server rack.
    """
    rack = await repo.update_status(str(rack_id), status_str)
    if not rack:
        raise HTTPException(status_code=404, detail="Rack not found")
    return rack
