import asyncio
from typing import Dict, Any, List, Optional
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client
from app.core.config import settings
from app.features.workflow.state import OrchestratorState

# Import Agents
from app.features.incident.agents.health import InfrastructureHealthAgent
from app.features.incident.agents.risk import InfrastructureRiskAgent
from app.features.workload.agents.workload import CloudWorkloadAgent
from app.features.maintenance.agents.maintenance import MaintenancePlanningAgent
from app.features.supplier.agents.supplier import SupplierIntelligenceAgent
from app.features.supplier.agents.procurement import ProcurementAgent

class McpClientWrapper:
    """
    Asynchronous helper client that wraps the MCP stdio_client and ClientSession connection
    to expose standard synchronous/asynchronous tool execution.
    """
    def __init__(self, session: ClientSession):
        self.session = session

    async def async_call_tool(self, tool_name: str, arguments: Dict[str, Any]) -> Dict[str, Any]:
        try:
            print(f"[MCP CLIENT] Calling tool '{tool_name}' with args {arguments}...")
            result = await self.session.call_tool(tool_name, arguments)
            if result.content and len(result.content) > 0:
                text_content = result.content[0].text
                import json
                try:
                    return json.loads(text_content)
                except json.JSONDecodeError:
                    return {"status": "success", "raw_text": text_content}
            return {"status": "success", "content": []}
        except Exception as e:
            print(f"[MCP CLIENT] ERROR calling tool {tool_name}: {e}")
            return {"status": "error", "message": str(e)}

    async def async_read_resource(self, uri: str) -> Any:
        try:
            print(f"[MCP CLIENT] Reading resource '{uri}'...")
            result = await self.session.read_resource(uri)
            if result.contents and len(result.contents) > 0:
                text_content = result.contents[0].text
                import json
                try:
                    data = json.loads(text_content)
                    # Check if Nitrostack double-wrapped the JSON response in a contents wrapper
                    if isinstance(data, dict) and "contents" in data:
                        inner_contents = data["contents"]
                        if len(inner_contents) > 0 and "text" in inner_contents[0]:
                            inner_text = inner_contents[0]["text"]
                            try:
                                return json.loads(inner_text)
                            except json.JSONDecodeError:
                                return inner_text
                    return data
                except json.JSONDecodeError:
                    return text_content
            return None
        except Exception as e:
            print(f"[MCP CLIENT] ERROR reading resource {uri}: {e}")
            return None

class OrchestratorEngine:
    def __init__(self):
        # Instantiate Agents
        self.health_agent = InfrastructureHealthAgent()
        self.risk_agent = InfrastructureRiskAgent()
        self.workload_agent = CloudWorkloadAgent()
        self.maintenance_agent = MaintenancePlanningAgent()
        self.supplier_agent = SupplierIntelligenceAgent()
        self.procurement_agent = ProcurementAgent()
        
        # Shared active state in-memory (singleton-like for the demo runtime)
        self.state = OrchestratorState()

    def log(self, message: str):
        import datetime
        timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        self.state.agent_logs.append(f"[{timestamp}] [Orchestrator] {message}")
        print(f"[Orchestrator] {message}")

    async def run_step(self, step_name: str, session: ClientSession) -> None:
        client = McpClientWrapper(session)
        
        if step_name == "HEATWAVE_TRIGGERED":
            self.log("Triggering Simulation: HEATWAVE and COOLING_DEGRADATION.")
            
            # Call trigger_simulation_event tools
            r1 = await client.async_call_tool("trigger_simulation_event", {"event_type": "HEATWAVE"})
            r2 = await client.async_call_tool("trigger_simulation_event", {"event_type": "COOLING_DEGRADATION"})
            
            self.state.agent_logs.append(f"[Simulation] {r1.get('message')}")
            self.state.agent_logs.append(f"[Simulation] {r2.get('message')}")
            
            self.state.current_step = "HEATWAVE_TRIGGERED"
            self.state.step_history.append("HEATWAVE_TRIGGERED")

        elif step_name == "THERMAL_ANALYSIS":
            self.log("Executing Step: THERMAL_ANALYSIS (Infrastructure Health Analysis).")
            updates = await self._execute_agent_async(self.health_agent, client)
            
            # Merge updates
            self.state.hotspots = updates.get("hotspots", [])
            self.state.cooling_loop = updates.get("cooling_loop", {})
            self.state.current_step = "THERMAL_ANALYSIS"
            self.state.step_history.append("THERMAL_ANALYSIS")

        elif step_name == "RISK_ASSESSMENT":
            self.log("Executing Step: RISK_ASSESSMENT (Infrastructure Risk Assessment).")
            updates = await self._execute_agent_async(self.risk_agent, client)
            
            self.state.risk_exposure_usd = updates.get("risk_exposure_usd", 0.0)
            self.state.at_risk_workloads = updates.get("at_risk_workloads", [])
            self.state.current_step = "RISK_ASSESSMENT"
            self.state.step_history.append("RISK_ASSESSMENT")

        elif step_name == "WORKLOAD_MIGRATION":
            self.log("Executing Step: WORKLOAD_MIGRATION (Cloud Workload Migration).")
            updates = await self._execute_agent_async(self.workload_agent, client)
            
            self.state.migrations_executed = updates.get("migrations_executed", [])
            self.state.current_step = "WORKLOAD_MIGRATION"
            self.state.step_history.append("WORKLOAD_MIGRATION")

        elif step_name == "MAINTENANCE_PLANNING":
            self.log("Executing Step: MAINTENANCE_PLANNING (Maintenance Planning).")
            updates = await self._execute_agent_async(self.maintenance_agent, client)
            
            self.state.ticket = updates.get("ticket")
            self.state.selected_technician = updates.get("selected_technician")
            self.state.parts_needed = updates.get("parts_needed", {})
            self.state.current_step = "MAINTENANCE_PLANNING"
            self.state.step_history.append("MAINTENANCE_PLANNING")

        elif step_name == "SUPPLIER_EVALUATION":
            self.log("Executing Step: SUPPLIER_EVALUATION (Supplier Catalog Evaluation).")
            updates = await self._execute_agent_async(self.supplier_agent, client)
            
            self.state.selected_supplier = updates.get("selected_supplier")
            self.state.procure_item = updates.get("procure_item")
            self.state.procure_quantity = updates.get("procure_quantity")
            self.state.current_step = "SUPPLIER_EVALUATION"
            self.state.step_history.append("SUPPLIER_EVALUATION")

        elif step_name == "PROCUREMENT_AND_RECOVERY":
            self.log("Executing Step: PROCUREMENT_AND_RECOVERY (Procurement & Recovery Confirmation).")
            updates = await self._execute_agent_async(self.procurement_agent, client)
            
            self.state.order = updates.get("order")
            self.state.ticket = updates.get("ticket")
            self.state.recovery_verified = updates.get("recovery_verified", False)
            self.state.recovery_message = updates.get("recovery_message")
            self.state.current_step = "COMPLETED"
            self.state.step_history.append("PROCUREMENT_AND_RECOVERY")
            self.log("Datacenter fully recovered. Resilience mission successfully accomplished.")

    async def _execute_agent_async(self, agent: Any, client: McpClientWrapper) -> Dict[str, Any]:
        """
        Runs the agent in an async executor since the agent methods are synchronous
        but call async tool and resource wrappers. We pass the client directly.
        """
        class SyncMcpClientMock:
            def __init__(self, async_client: McpClientWrapper, main_loop: asyncio.AbstractEventLoop):
                self.async_client = async_client
                self.main_loop = main_loop

            def call_tool(self, tool_name: str, arguments: Dict[str, Any]) -> Dict[str, Any]:
                fut = asyncio.run_coroutine_threadsafe(
                    self.async_client.async_call_tool(tool_name, arguments),
                    self.main_loop
                )
                return fut.result()

            def read_resource(self, uri: str) -> Any:
                fut = asyncio.run_coroutine_threadsafe(
                    self.async_client.async_read_resource(uri),
                    self.main_loop
                )
                return fut.result()

        loop = asyncio.get_running_loop()
        sync_mock = SyncMcpClientMock(client, loop)
        
        import concurrent.futures
        with concurrent.futures.ThreadPoolExecutor() as pool:
            result = await loop.run_in_executor(
                pool,
                agent.execute,
                self.state.model_dump(),  # Pydantic v2
                sync_mock
            )
            return result

    async def run_full_workflow(self) -> OrchestratorState:
        """
        Executes the entire workflow end-to-end sequentially.
        Spawns the MCP Node server subprocess, completes all steps, and shuts it down.
        """
        server_params = StdioServerParameters(
            command="node",
            args=["dist/index.js"],
            cwd=settings.MCP_SERVER_DIR
        )

        self.log(f"Starting MCP Server subprocess at {settings.MCP_SERVER_DIR}...")
        
        async with stdio_client(server_params) as (read, write):
            async with ClientSession(read, write) as session:
                await session.initialize()
                self.log("MCP Client session initialized. Standard tools registered.")

                # Reset state
                self.state = OrchestratorState()
                
                # Execute Steps
                steps = [
                    "HEATWAVE_TRIGGERED",
                    "THERMAL_ANALYSIS",
                    "RISK_ASSESSMENT",
                    "WORKLOAD_MIGRATION",
                    "MAINTENANCE_PLANNING",
                    "SUPPLIER_EVALUATION",
                    "PROCUREMENT_AND_RECOVERY"
                ]

                for step in steps:
                    await self.run_step(step, session)
                    await asyncio.sleep(0.5)

        # Save the final resolved state to Supabase PostgreSQL database
        await self.save_state_to_db()

        return self.state

    async def save_state_to_db(self) -> None:
        """
        Saves the orchestrator state to the database via repositories.
        """
        try:
            import datetime
            from app.api.dependencies import (
                get_rack_repository, get_workload_repository,
                get_telemetry_repository, get_incident_repository,
                get_ticket_repository, get_technician_repository,
                get_order_repository
            )
            # Retrieve repositories (since this is run inside the FastAPI worker, we can get client)
            from app.core.database import get_supabase_client
            client = None
            try:
                client = await get_supabase_client()
            except Exception:
                pass

            rack_repo = get_rack_repository(client)
            workload_repo = get_workload_repository(client)
            telemetry_repo = get_telemetry_repository(client)
            incident_repo = get_incident_repository(client)
            ticket_repo = get_ticket_repository(client)
            tech_repo = get_technician_repository(client)
            order_repo = get_order_repository(client)

            # 1. Update Racks status
            for hotspot in self.state.hotspots:
                await rack_repo.update_status(hotspot["rack_id"], hotspot["status"])

            # 2. Add Telemetry Logs (latest)
            for hotspot in self.state.hotspots:
                from app.domain.models import TelemetryLog
                import uuid
                log = TelemetryLog(
                    rack_id=uuid.UUID(hotspot["rack_id"]) if isinstance(hotspot["rack_id"], str) else hotspot["rack_id"],
                    temperature_celsius=hotspot["temperature_celsius"],
                    power_draw_kw=4.0,  # mock power load
                    cooling_flow_rate_lps=1.35, # degraded flow
                    ambient_temperature=self.state.cooling_loop.get("ambient_temp", 24.0),
                    recorded_at=datetime.datetime.now()
                )
                await telemetry_repo.add(log)

            # 3. Save Workload Migrations
            for migration in self.state.migrations_executed:
                workload_id = migration["workload_id"]
                target_rack_name = migration["target_rack"]
                # Find target rack ID by name
                all_racks = await rack_repo.list_all()
                target_rack = next((r for r in all_racks if r.name == target_rack_name), None)
                if target_rack:
                    await workload_repo.migrate_workload(workload_id, str(target_rack.id))

            # 4. Save Maintenance Ticket & Technician Status
            if self.state.ticket:
                from app.domain.models import MaintenanceTicket
                import uuid
                # Parse times
                sched_time = self.state.ticket.get("scheduled_time")
                if isinstance(sched_time, str):
                    sched_time = sched_time.replace("Z", "+00:00")
                t = MaintenanceTicket(
                    id=uuid.UUID(self.state.ticket["id"]) if isinstance(self.state.ticket["id"], str) else self.state.ticket["id"],
                    target_rack_id=uuid.UUID(self.state.ticket["target_rack_id"]) if isinstance(self.state.ticket["target_rack_id"], str) else self.state.ticket["target_rack_id"],
                    description=self.state.ticket["description"],
                    technician_id=uuid.UUID(self.state.selected_technician["id"]) if self.state.selected_technician and isinstance(self.state.selected_technician["id"], str) else (self.state.selected_technician.id if self.state.selected_technician else None),
                    status=self.state.ticket["status"],
                    parts_required=self.state.ticket.get("parts_required", {}),
                    scheduled_time=datetime.datetime.fromisoformat(sched_time) if isinstance(sched_time, str) else sched_time,
                    resolved_at=datetime.datetime.fromisoformat(self.state.ticket["resolved_at"].replace("Z", "+00:00")) if self.state.ticket.get("resolved_at") else None
                )
                await ticket_repo.upsert(t)

                # Update Technician status
                if self.state.selected_technician:
                    tech_id = self.state.selected_technician["id"] if isinstance(self.state.selected_technician, dict) else self.state.selected_technician.id
                    status = "AVAILABLE" if t.status == "RESOLVED" else "ON_DUTY"
                    await tech_repo.update_status(str(tech_id), status, str(t.id) if status == "ON_DUTY" else None)

            # 5. Save Procurement Order
            if self.state.order:
                from app.domain.models import ProcurementOrder
                import uuid
                del_time = self.state.order.get("estimated_delivery")
                if isinstance(del_time, str):
                    del_time = del_time.replace("Z", "+00:00")
                o = ProcurementOrder(
                    id=uuid.UUID(self.state.order["id"]) if isinstance(self.state.order["id"], str) else self.state.order["id"],
                    ticket_id=uuid.UUID(self.state.order["ticket_id"]) if isinstance(self.state.order["ticket_id"], str) else self.state.order["ticket_id"],
                    supplier_id=uuid.UUID(self.state.order["supplier_id"]) if isinstance(self.state.order["supplier_id"], str) else self.state.order["supplier_id"],
                    item_name=self.state.order["items"][0]["part_name"] if self.state.order.get("items") else self.state.order.get("item_name", "chiller_fan_v2"),
                    quantity=self.state.order["items"][0]["quantity"] if self.state.order.get("items") else self.state.order.get("quantity", 1),
                    total_cost=self.state.order["total_cost"],
                    status="DELIVERED" if self.state.ticket and self.state.ticket["status"] == "RESOLVED" else "ORDERED",
                    estimated_delivery=datetime.datetime.fromisoformat(del_time) if isinstance(del_time, str) else del_time
                )
                await order_repo.upsert(o)

            # 6. Save Incident History
            if self.state.hotspots:
                from app.domain.models import IncidentHistory
                import uuid
                for hotspot in self.state.hotspots:
                    inc_id = uuid.uuid4()
                    inc = IncidentHistory(
                        id=inc_id,
                        rack_id=uuid.UUID(hotspot["rack_id"]) if isinstance(hotspot["rack_id"], str) else hotspot["rack_id"],
                        description=f"Cooling loop degradation hotspot detected on {hotspot['name']}.",
                        resolved=self.state.recovery_verified,
                        created_at=datetime.datetime.now(),
                        resolved_at=datetime.datetime.now() if self.state.recovery_verified else None
                    )
                    await incident_repo.upsert(inc)

        except Exception as e:
            print(f"[Orchestrator] Error saving state to DB: {e}")
            import traceback
            traceback.print_exc()
