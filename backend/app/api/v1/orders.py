from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from uuid import UUID
from app.domain.models import ProcurementOrder
from app.api.dependencies import get_order_repository
from app.features.supplier.repositories.interfaces import ProcurementOrderRepository
from app.core.security import get_current_user

router = APIRouter()

@router.get("/", response_model=List[ProcurementOrder])
async def list_orders(
    repo: ProcurementOrderRepository = Depends(get_order_repository),
    current_user: dict = Depends(get_current_user)
):
    """
    List all parts procurement orders.
    """
    return await repo.list_all()

@router.get("/{order_id}", response_model=ProcurementOrder)
async def get_order(
    order_id: UUID,
    repo: ProcurementOrderRepository = Depends(get_order_repository),
    current_user: dict = Depends(get_current_user)
):
    """
    Retrieve details of a specific procurement order.
    """
    order = await repo.get_by_id(str(order_id))
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order

@router.post("/", response_model=ProcurementOrder, status_code=status.HTTP_201_CREATED)
async def create_order(
    order: ProcurementOrder,
    repo: ProcurementOrderRepository = Depends(get_order_repository),
    current_user: dict = Depends(get_current_user)
):
    """
    Submit a new parts procurement purchase order.
    """
    return await repo.upsert(order)

@router.put("/{order_id}/status", response_model=ProcurementOrder)
async def update_order_status(
    order_id: UUID,
    status_str: str,
    repo: ProcurementOrderRepository = Depends(get_order_repository),
    current_user: dict = Depends(get_current_user)
):
    """
    Update the shipping or transit status of a procurement order.
    """
    order = await repo.update_status(str(order_id), status_str)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order
