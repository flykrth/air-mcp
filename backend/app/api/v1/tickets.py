from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from uuid import UUID
from app.domain.models import MaintenanceTicket, Technician
from app.api.dependencies import get_ticket_repository, get_technician_repository
from app.features.maintenance.repositories.interfaces import MaintenanceTicketRepository, TechnicianRepository
from app.core.security import get_current_user

router = APIRouter()

@router.get("/", response_model=List[MaintenanceTicket])
async def list_tickets(
    repo: MaintenanceTicketRepository = Depends(get_ticket_repository),
    current_user: dict = Depends(get_current_user)
):
    """
    List all maintenance tickets in the system.
    """
    return await repo.list_all()

@router.get("/{ticket_id}", response_model=MaintenanceTicket)
async def get_ticket(
    ticket_id: UUID,
    repo: MaintenanceTicketRepository = Depends(get_ticket_repository),
    current_user: dict = Depends(get_current_user)
):
    """
    Retrieve details of a specific maintenance ticket.
    """
    ticket = await repo.get_by_id(str(ticket_id))
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return ticket

@router.post("/", response_model=MaintenanceTicket, status_code=status.HTTP_201_CREATED)
async def create_ticket(
    ticket: MaintenanceTicket,
    repo: MaintenanceTicketRepository = Depends(get_ticket_repository),
    current_user: dict = Depends(get_current_user)
):
    """
    Create or update a maintenance ticket.
    """
    return await repo.upsert(ticket)

@router.post("/{ticket_id}/assign", response_model=MaintenanceTicket)
async def assign_technician(
    ticket_id: UUID,
    technician_id: UUID,
    scheduled_time: str,
    ticket_repo: MaintenanceTicketRepository = Depends(get_ticket_repository),
    tech_repo: TechnicianRepository = Depends(get_technician_repository),
    current_user: dict = Depends(get_current_user)
):
    """
    Assign a technician to an open maintenance ticket.
    """
    ticket = await ticket_repo.assign_technician(str(ticket_id), str(technician_id), scheduled_time)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    await tech_repo.update_status(str(technician_id), "ON_DUTY", str(ticket_id))
    return ticket

@router.post("/{ticket_id}/resolve", response_model=MaintenanceTicket)
async def resolve_ticket(
    ticket_id: UUID,
    ticket_repo: MaintenanceTicketRepository = Depends(get_ticket_repository),
    tech_repo: TechnicianRepository = Depends(get_technician_repository),
    current_user: dict = Depends(get_current_user)
):
    """
    Mark a maintenance ticket as resolved and release the assigned technician.
    """
    ticket = await ticket_repo.resolve_ticket(str(ticket_id))
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    if ticket.technician_id:
        await tech_repo.update_status(str(ticket.technician_id), "AVAILABLE", None)
    return ticket
