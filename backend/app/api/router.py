from fastapi import APIRouter
from app.api.v1 import orchestrator, racks, workloads, telemetry, tickets, orders, simulator

api_router = APIRouter()

# Register core endpoints
api_router.include_router(orchestrator.router, prefix="/orchestrator", tags=["orchestrator"])
api_router.include_router(racks.router, prefix="/racks", tags=["racks"])
api_router.include_router(workloads.router, prefix="/workloads", tags=["workloads"])
api_router.include_router(telemetry.router, prefix="/telemetry", tags=["telemetry"])
api_router.include_router(tickets.router, prefix="/tickets", tags=["tickets"])
api_router.include_router(orders.router, prefix="/orders", tags=["orders"])
api_router.include_router(simulator.router, prefix="/simulator", tags=["simulator"])

