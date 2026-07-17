import asyncio
from typing import Optional
from uuid import UUID
from datetime import datetime

from app.core.database import get_supabase_client
from app.features.simulator.models import SimState
from app.domain.models import (
    Rack, TelemetryLog, CloudWorkload, Technician, 
    MaintenanceTicket, Supplier, ProcurementOrder, IncidentHistory
)
from app.api.dependencies import (
    get_rack_repository, get_workload_repository,
    get_telemetry_repository, get_incident_repository,
    get_ticket_repository, get_technician_repository,
    get_order_repository, get_supplier_repository
)

class DatabaseSyncService:
    def __init__(self):
        self.telemetry_sync_interval = 5  # sync telemetry logs every 5 ticks
        self.last_sync_tick = 0

    async def sync_state_to_db(self, state: SimState):
        """Asynchronously sync simulator state to Supabase / Repository layer."""
        try:
            # 1. Obtain database client (will return None if offline fallback)
            client = None
            try:
                client = await get_supabase_client()
            except Exception:
                pass

            # 2. Get repository singletons
            rack_repo = get_rack_repository(client)
            workload_repo = get_workload_repository(client)
            telemetry_repo = get_telemetry_repository(client)
            incident_repo = get_incident_repository(client)
            ticket_repo = get_ticket_repository(client)
            tech_repo = get_technician_repository(client)
            order_repo = get_order_repository(client)
            supplier_repo = get_supplier_repository(client)

            # 3. Sync Racks
            for sim_rack in state.racks:
                rack_domain = Rack(
                    id=sim_rack.id,
                    name=sim_rack.name,
                    row_id=sim_rack.row_id,
                    column_id=sim_rack.column_id,
                    max_kw_capacity=sim_rack.max_kw_capacity,
                    status=sim_rack.status,
                    created_at=datetime.now() # dummy created_at
                )
                await rack_repo.upsert(rack_domain)

            # 4. Sync Telemetry (Batched or anomalies)
            has_anomaly = any(r.status != "OPTIMAL" for r in state.racks) or state.heatwave_active or not state.cooling_system_healthy
            should_sync_telemetry = (state.tick_count - self.last_sync_tick >= self.telemetry_sync_interval) or has_anomaly
            
            if should_sync_telemetry:
                self.last_sync_tick = state.tick_count
                for sim_rack in state.racks:
                    log = TelemetryLog(
                        rack_id=sim_rack.id,
                        temperature_celsius=sim_rack.temperature_celsius,
                        power_draw_kw=sim_rack.power_draw_kw,
                        cooling_flow_rate_lps=sim_rack.cooling_flow_rate_lps,
                        ambient_temperature=state.ambient_temp,
                        cpu_utilization_percent=sim_rack.cpu_utilization_percent,
                        memory_utilization_percent=sim_rack.memory_utilization_percent,
                        recorded_at=datetime.now()
                    )
                    await telemetry_repo.add(log)

            # 5. Sync Workloads
            for sim_w in state.workloads:
                w_domain = CloudWorkload(
                    id=sim_w.id,
                    rack_id=sim_w.rack_id,
                    name=sim_w.name,
                    vcpus=sim_w.vcpus,
                    memory_gb=sim_w.memory_gb,
                    priority=sim_w.priority,
                    sla_threshold_temp=sim_w.sla_threshold_temp,
                    status=sim_w.status,
                    created_at=sim_w.created_at
                )
                await workload_repo.upsert(w_domain)

            # 6. Sync Technicians
            for sim_tech in state.technicians:
                tech_domain = Technician(
                    id=sim_tech.id,
                    name=sim_tech.name,
                    skillset=sim_tech.skillset,
                    status=sim_tech.status,
                    current_ticket_id=sim_tech.current_ticket_id,
                    created_at=datetime.now(),
                    updated_at=datetime.now()
                )
                await tech_repo.upsert(tech_domain)

            # 7. Sync Maintenance Tickets
            for sim_ticket in state.tickets:
                ticket_domain = MaintenanceTicket(
                    id=sim_ticket.id,
                    target_rack_id=sim_ticket.target_rack_id,
                    issue_type=sim_ticket.issue_type,
                    description=sim_ticket.description,
                    technician_id=sim_ticket.technician_id,
                    status=sim_ticket.status,
                    parts_required=sim_ticket.parts_required,
                    scheduled_time=sim_ticket.scheduled_time,
                    resolved_at=sim_ticket.resolved_at,
                    estimated_duration_hours=sim_ticket.estimated_duration_hours,
                    labor_hours=sim_ticket.labor_hours,
                    calculated_cost=sim_ticket.calculated_cost,
                    created_at=datetime.now(),
                    updated_at=datetime.now()
                )
                await ticket_repo.upsert(ticket_domain)

            # 8. Sync Procurement Orders
            for sim_order in state.orders:
                order_domain = ProcurementOrder(
                    id=sim_order.id,
                    ticket_id=sim_order.ticket_id,
                    supplier_id=sim_order.supplier_id,
                    item_name=sim_order.items[0]["part_name"] if sim_order.items else "chiller_fan_v2",
                    quantity=sim_order.items[0]["quantity"] if sim_order.items else 1,
                    total_cost=sim_order.total_cost,
                    status=sim_order.status,
                    estimated_delivery=sim_order.estimated_delivery,
                    created_at=datetime.now(),
                    updated_at=datetime.now()
                )
                await order_repo.upsert(order_domain)

            # 9. Sync Incident History
            for sim_inc in state.incidents:
                inc_domain = IncidentHistory(
                    id=sim_inc.id,
                    rack_id=sim_inc.rack_id,
                    description=sim_inc.description,
                    resolved=sim_inc.resolved,
                    created_at=sim_inc.created_at,
                    resolved_at=sim_inc.resolved_at
                )
                await incident_repo.upsert(inc_domain)

        except Exception as e:
            print(f"[SIMULATOR SYNC] Error synchronizing state to DB: {e}")

    def on_simulator_tick(self, state: SimState):
        """Callback handler registered on the SimulatorEngine."""
        # Check if there is an active event loop. If so, create a background task.
        try:
            loop = asyncio.get_event_loop()
            if loop.is_running():
                loop.create_task(self.sync_state_to_db(state))
            else:
                # Run synchronously if no loop is running
                asyncio.run(self.sync_state_to_db(state))
        except Exception as e:
            print(f"[SIMULATOR SYNC] Failed to schedule DB sync: {e}")
