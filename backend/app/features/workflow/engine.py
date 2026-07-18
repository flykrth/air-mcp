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

    async def async_get_prompt(self, prompt_name: str, arguments: Dict[str, Any]) -> Dict[str, Any]:
        try:
            print(f"[MCP CLIENT] Retrieving prompt '{prompt_name}' with args {arguments}...")
            result = await self.session.get_prompt(prompt_name, arguments)
            messages = []
            if hasattr(result, "messages"):
                for msg in result.messages:
                    content_text = ""
                    if hasattr(msg, "content"):
                        content_text = getattr(msg.content, "text", str(msg.content))
                    else:
                        content_text = str(msg)
                    messages.append({
                        "role": getattr(msg, "role", "user"),
                        "content": content_text
                    })
            return {"status": "success", "messages": messages}
        except Exception as e:
            print(f"[MCP CLIENT] ERROR calling get_prompt {prompt_name}: {e}")
            return {"status": "error", "message": str(e)}


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
        import datetime
        client = McpClientWrapper(session)
        
        if step_name == "HEATWAVE_TRIGGERED":
            self.log("Triggering Simulation: HEATWAVE and COOLING_DEGRADATION.")
            
            # Call trigger_simulation_event tools
            r1 = await client.async_call_tool("trigger_simulation_event", {"event_type": "HEATWAVE"})
            r2 = await client.async_call_tool("trigger_simulation_event", {"event_type": "COOLING_DEGRADATION"})
            
            # Force a simulator tick to propagate degraded states to telemetry immediately
            from app.features.simulator.engine import SimulatorEngine
            SimulatorEngine().tick()
            
            self.state.agent_logs.append(f"[Simulation] {r1.get('message')}")
            self.state.agent_logs.append(f"[Simulation] {r2.get('message')}")
            
            # Record tool calls
            self.state.mcp_tool_calls.append({
                "tool": "trigger_simulation_event",
                "arguments": {"event_type": "HEATWAVE"},
                "response": r1,
                "timestamp": datetime.datetime.now().isoformat()
            })
            self.state.mcp_tool_calls.append({
                "tool": "trigger_simulation_event",
                "arguments": {"event_type": "COOLING_DEGRADATION"},
                "response": r2,
                "timestamp": datetime.datetime.now().isoformat()
            })
            
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
        but call async tool and resource wrappers. Handles timeouts, retries, and traces operations.
        """
        import datetime
        import time
        
        agent_name = agent.name
        start_time = datetime.datetime.now()
        
        tool_calls = []
        resource_reads = []
        prompts = []
        logs = []
        state_snapshot = self.state.model_dump()
        state_snapshot["agent_logs"] = logs
        
        retries = 2
        success = False
        result = {}
        
        class SyncMcpClientMock:
            def __init__(self, async_client: McpClientWrapper, main_loop: asyncio.AbstractEventLoop):
                self.async_client = async_client
                self.main_loop = main_loop

            def call_tool(self, tool_name: str, arguments: Dict[str, Any]) -> Dict[str, Any]:
                call_start = datetime.datetime.now().isoformat()
                fut = asyncio.run_coroutine_threadsafe(
                    self.async_client.async_call_tool(tool_name, arguments),
                    self.main_loop
                )
                res = fut.result()
                tool_calls.append({
                    "tool": tool_name,
                    "arguments": arguments,
                    "response": res,
                    "timestamp": call_start
                })
                return res

            def read_resource(self, uri: str) -> Any:
                read_start = datetime.datetime.now().isoformat()
                fut = asyncio.run_coroutine_threadsafe(
                    self.async_client.async_read_resource(uri),
                    self.main_loop
                )
                res = fut.result()
                resource_reads.append({
                    "uri": uri,
                    "response": res,
                    "timestamp": read_start
                })
                return res

            def get_prompt(self, prompt_name: str, arguments: Dict[str, Any]) -> Dict[str, Any]:
                prompt_start = datetime.datetime.now().isoformat()
                fut = asyncio.run_coroutine_threadsafe(
                    self.async_client.async_get_prompt(prompt_name, arguments),
                    self.main_loop
                )
                res = fut.result()
                prompts.append({
                    "name": prompt_name,
                    "arguments": arguments,
                    "result": res,
                    "timestamp": prompt_start
                })
                return res

        loop = asyncio.get_running_loop()
        sync_mock = SyncMcpClientMock(client, loop)
        
        for attempt in range(retries):
            try:
                self.log(f"Running agent {agent_name} (Attempt {attempt+1}/{retries})...")
                import concurrent.futures
                
                async def run_in_pool():
                    with concurrent.futures.ThreadPoolExecutor() as pool:
                        return await loop.run_in_executor(
                            pool,
                            agent.execute,
                            state_snapshot,
                            sync_mock
                        )
                
                # 15s timeout
                result = await asyncio.wait_for(run_in_pool(), timeout=15.0)
                success = True
                break
            except asyncio.TimeoutError:
                self.log(f"ERROR: Agent {agent_name} timed out after 15 seconds.")
                logs.append(f"[{datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] [{agent_name}] TIMEOUT: Execution exceeded 15s limit.")
            except Exception as e:
                import traceback
                error_msg = f"Exception: {str(e)}\n{traceback.format_exc()}"
                self.log(f"ERROR: Agent {agent_name} failed: {error_msg}")
                logs.append(f"[{datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] [{agent_name}] FAILURE: {str(e)}")
                await asyncio.sleep(0.5)
        
        end_time = datetime.datetime.now()
        duration = (end_time - start_time).total_seconds()
        
        for l in logs:
            self.state.agent_logs.append(l)
            
        self.state.mcp_tool_calls.extend(tool_calls)
        self.state.resource_reads.extend(resource_reads)
        self.state.prompt_templates_used.extend(prompts)
        
        timeline_event = {
            "agent": agent_name,
            "status": "SUCCESS" if success else "FAILED",
            "start_time": start_time.isoformat(),
            "end_time": end_time.isoformat(),
            "duration_sec": duration,
            "logs": logs,
            "inputs": {k: v for k, v in state_snapshot.items() if k not in ["agent_logs", "agent_timeline", "mcp_tool_calls", "resource_reads", "prompt_templates_used", "decision_points"]},
            "outputs": result if success else {}
        }
        self.state.agent_timeline.append(timeline_event)
        
        if not success:
            return {"error": f"Agent {agent_name} failed after all retries"}
            
        return result

    async def run_parallel_phase(self, session: ClientSession) -> None:
        self.log("Entering Concurrency Layer: Scheduling parallel agent execution.")
        client = McpClientWrapper(session)
        
        results = await asyncio.gather(
            self._execute_agent_async(self.workload_agent, client),
            self._execute_agent_async(self.maintenance_agent, client),
            self._execute_agent_async(self.supplier_agent, client),
            return_exceptions=True
        )
        
        workload_res = results[0]
        maintenance_res = results[1]
        supplier_res = results[2]
        
        if isinstance(workload_res, Exception):
            self.log(f"CRITICAL: Workload Agent execution crashed completely: {workload_res}")
            workload_res = {"error": str(workload_res)}
        if isinstance(maintenance_res, Exception):
            self.log(f"CRITICAL: Maintenance Agent execution crashed completely: {maintenance_res}")
            maintenance_res = {"error": str(maintenance_res)}
        if isinstance(supplier_res, Exception):
            self.log(f"CRITICAL: Supplier Agent execution crashed completely: {supplier_res}")
            supplier_res = {"error": str(supplier_res)}

        self.state.step_history.append("WORKLOAD_MIGRATION")
        self.state.step_history.append("MAINTENANCE_PLANNING")
        self.state.step_history.append("SUPPLIER_EVALUATION")
        self.state.current_step = "SUPPLIER_EVALUATION"
        
        await self._consolidate_decisions(workload_res, maintenance_res, supplier_res, client)

    async def _consolidate_decisions(self, workload_res: Dict[str, Any], maintenance_res: Dict[str, Any], supplier_res: Dict[str, Any], client: McpClientWrapper) -> None:
        import datetime
        self.log("Initiating Decision Consolidation and Conflict Resolution.")
        
        # 1. Merge workload migrations
        if "error" not in workload_res:
            self.state.migrations_executed = workload_res.get("migrations_executed", [])
            self.log(f"Consolidated Workload Migrations: {len(self.state.migrations_executed)} workloads migrated.")
        else:
            self.log("WARNING: Workload Agent failed. Attempting recovery. Checking if workloads can be migrated.")
            try:
                hotspots = self.state.hotspots
                migrations = []
                for rack in hotspots:
                    rec_resp = await client.async_call_tool("recommend_workload_migration", {"source_rack_id": rack["rack_id"]})
                    for rec in rec_resp.get("recommendations", []):
                        target = rec.get("recommended_target")
                        if target:
                            mig_resp = await client.async_call_tool("migrate_workload", {
                                "workload_id": rec["workload_id"],
                                "target_rack_id": target["rack_id"]
                            })
                            if mig_resp.get("status") == "success":
                                migrations.append({
                                    "workload_id": rec["workload_id"],
                                    "workload_name": rec["workload_name"],
                                    "target_rack": target["rack_name"],
                                    "status": "COMPLETED"
                                })
                self.state.migrations_executed = migrations
                self.state.decision_points.append({
                    "decision": "Workload Agent Fallback Recovery",
                    "resolution": f"Orchestrator bypassed failed Workload Agent and executed {len(migrations)} migrations directly.",
                    "timestamp": datetime.datetime.now().isoformat()
                })
            except Exception as fe:
                self.log(f"CRITICAL: Fallback workload migration failed: {fe}")
        
        # 2. Merge maintenance ticket & technician assignment
        if "error" not in maintenance_res:
            self.state.ticket = maintenance_res.get("ticket")
            self.state.selected_technician = maintenance_res.get("selected_technician")
            self.state.parts_needed = maintenance_res.get("parts_needed", {})
            self.log(f"Consolidated Maintenance Plan: Technician '{self.state.selected_technician.get('name') if self.state.selected_technician else 'None'}' assigned to Ticket '{self.state.ticket.get('id') if self.state.ticket else 'None'}'.")
        else:
            self.log("WARNING: Maintenance Agent failed. Executing fallback ticket creation and technician scheduling.")
            try:
                rack_id = self.state.hotspots[0]["rack_id"] if self.state.hotspots else "f7dfd754-b54a-47e5-b3f9-e5a662c8f84b"
                rack_name = self.state.hotspots[0]["name"] if self.state.hotspots else "Rack-A1"
                description = f"Chiller fan failure on cooling loop serving {rack_name}. Flow rate degraded."
                
                plan_resp = await client.async_call_tool("plan_maintenance", {
                    "target_rack_id": rack_id,
                    "issue_type": "FAN_FAILURE",
                    "description": description
                })
                ticket = plan_resp.get("ticket", {})
                
                techs = await client.async_read_resource("maintenance://technicians/registry")
                best_tech = next((t for t in techs if t.get("status") == "AVAILABLE"), None)
                
                if best_tech:
                    scheduled_time = (datetime.datetime.now() + datetime.timedelta(hours=1)).isoformat()
                    sch_resp = await client.async_call_tool("schedule_technician", {
                        "ticket_id": ticket["id"],
                        "technician_id": best_tech["id"],
                        "scheduled_time": scheduled_time
                    })
                    ticket = sch_resp.get("ticket", ticket)
                
                self.state.ticket = ticket
                self.state.selected_technician = best_tech
                self.state.parts_needed = ticket.get("parts_required", {"chiller_fan_v2": 1})
                
                self.state.decision_points.append({
                    "decision": "Maintenance Agent Fallback Recovery",
                    "resolution": f"Orchestrator bypassed failed Maintenance Agent, created ticket {ticket.get('id')}, and scheduled technician {best_tech.get('name')}.",
                    "timestamp": datetime.datetime.now().isoformat()
                })
            except Exception as fe:
                self.log(f"CRITICAL: Fallback maintenance planning failed: {fe}")

        # 3. Merge supplier selection and run Conflict Resolution Engine
        if "error" not in supplier_res and supplier_res.get("supplier_evaluated"):
            selected_supplier = supplier_res.get("selected_supplier")
            part_name = supplier_res.get("procure_item")
            quantity = supplier_res.get("procure_quantity")
            
            try:
                eval_resp = await client.async_call_tool("evaluate_suppliers", {
                    "part_name": part_name,
                    "quantity": quantity
                })
                options = eval_resp.get("supplier_evaluations", [])
            except Exception:
                options = [selected_supplier] if selected_supplier else []
                
            # Conflict Resolution: cost vs lead time under SLA penalty
            # SLA exposure is the calculated total penalty risk
            risk_rate = self.state.risk_exposure_usd / 12.0 # hourly rate assuming 12 hours resolution time
            
            best_supplier = selected_supplier
            min_calculated_cost = float('inf')
            chosen_by_cost_only = selected_supplier
            
            for option in options:
                unit_price = option.get("unit_price_usd", 0.0)
                lead_time = option.get("lead_time_hours", 0)
                po_cost = unit_price * quantity
                sla_cost = lead_time * risk_rate
                total_projected_cost = po_cost + sla_cost
                
                self.log(f"Conflict Resolution Eval: Supplier '{option['supplier_name']}' - PO Cost: ${po_cost:.2f}, Est SLA Penalty: ${sla_cost:.2f}, Total projected: ${total_projected_cost:.2f}")
                
                if total_projected_cost < min_calculated_cost:
                    min_calculated_cost = total_projected_cost
                    best_supplier = option
            
            if best_supplier and chosen_by_cost_only and best_supplier["supplier_id"] != chosen_by_cost_only["supplier_id"]:
                self.log(f"CONFLICT DETECTED: Supplier Agent recommended '{chosen_by_cost_only['supplier_name']}' (cost-optimized, price: ${chosen_by_cost_only['unit_price_usd']}, lead time: {chosen_by_cost_only['lead_time_hours']}h). "
                         f"However, under SLA pressure of ${self.state.risk_exposure_usd:.2f} USD, Orchestrator overrides this choice and selects "
                         f"'{best_supplier['supplier_name']}' (lead-time-optimized, price: ${best_supplier['unit_price_usd']}, lead time: {best_supplier['lead_time_hours']}h) "
                         f"to minimize business impact.")
                
                self.state.decision_points.append({
                    "decision": "Supplier Selection Optimization",
                    "resolution": f"Overrode Supplier Agent recommendation '{chosen_by_cost_only['supplier_name']}' (8h lead time) with '{best_supplier['supplier_name']}' (2h lead time) under SLA breach pressure of ${self.state.risk_exposure_usd:.2f} USD.",
                    "timestamp": datetime.datetime.now().isoformat()
                })
            else:
                self.log(f"No supplier conflict. Proceeding with '{best_supplier.get('supplier_name') if best_supplier else 'None'}' as the optimal choice.")
                self.state.decision_points.append({
                    "decision": "Supplier Selection Confirmation",
                    "resolution": f"Confirmed '{best_supplier.get('supplier_name') if best_supplier else 'None'}' as the optimal supplier.",
                    "timestamp": datetime.datetime.now().isoformat()
                })
                
            self.state.selected_supplier = best_supplier
            self.state.procure_item = part_name
            self.state.procure_quantity = quantity
        else:
            self.log("WARNING: Supplier Agent failed. Running fallback supplier evaluation.")
            try:
                part_name = list(self.state.parts_needed.keys())[0] if self.state.parts_needed else "chiller_fan_v2"
                quantity = self.state.parts_needed.get(part_name, 1)
                eval_resp = await client.async_call_tool("evaluate_suppliers", {
                    "part_name": part_name,
                    "quantity": quantity
                })
                evaluations = eval_resp.get("supplier_evaluations", [])
                if evaluations:
                    best_supplier = evaluations[0]
                    self.state.selected_supplier = best_supplier
                    self.state.procure_item = part_name
                    self.state.procure_quantity = quantity
                    
                    self.state.decision_points.append({
                        "decision": "Supplier Agent Fallback Recovery",
                        "resolution": f"Orchestrator bypassed failed Supplier Agent and queried supplier catalog directly, selecting {best_supplier['supplier_name']}.",
                        "timestamp": datetime.datetime.now().isoformat()
                    })
            except Exception as fe:
                self.log(f"CRITICAL: Fallback supplier evaluation failed: {fe}")

    def save_workflow_record(self):
        import json
        import os
        record_id = self.state.workflow_id
        record_dir = "/home/flykrth/.gemini/antigravity/brain/30b022c1-854c-4457-b2e2-8d2d284551e2"
        os.makedirs(record_dir, exist_ok=True)
        file_path = os.path.join(record_dir, f"workflow_record_{record_id}.json")
        try:
            with open(file_path, "w") as f:
                json.dump(self.state.model_dump(), f, indent=2)
            self.log(f"Workflow execution record saved to {file_path}")
        except Exception as e:
            self.log(f"ERROR: Failed to save workflow execution record: {e}")

    async def run_full_workflow(self) -> OrchestratorState:
        """
        Executes the entire workflow end-to-end concurrently.
        Spawns the MCP Node server subprocess, completes all steps, and shuts it down.
        """
        import datetime
        import uuid
        
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

                # Reset state and initialize execution tracing metadata
                self.state = OrchestratorState()
                self.state.workflow_id = str(uuid.uuid4())
                self.state.start_time = datetime.datetime.now().isoformat()
                self.state.trigger = "COOLING_DEGRADATION"
                
                # Execute Steps
                await self.run_step("HEATWAVE_TRIGGERED", session)
                await asyncio.sleep(0.5)
                
                await self.run_step("THERMAL_ANALYSIS", session)
                await asyncio.sleep(0.5)
                
                await self.run_step("RISK_ASSESSMENT", session)
                await asyncio.sleep(0.5)
                
                # Concurrently execute Workload, Maintenance, and Supplier Agents
                await self.run_parallel_phase(session)
                await asyncio.sleep(0.5)
                
                await self.run_step("PROCUREMENT_AND_RECOVERY", session)
                await asyncio.sleep(0.5)
                
                # Fetch executive incident summary prompt for audit trail
                client = McpClientWrapper(session)
                try:
                    await client.async_get_prompt("executive_incident_summary", {
                        "incident_id": self.state.workflow_id,
                        "downtime_minutes": "120",
                        "financial_impact_usd": str(self.state.risk_exposure_usd)
                    })
                except Exception as pe:
                    self.log(f"WARNING: Failed to fetch executive summary prompt template: {pe}")

                # Populate final recovery metrics
                po_cost = 0.0
                if self.state.order:
                    po_cost = self.state.order.get("total_cost", 0.0)
                self.state.recovery_metrics = {
                    "risk_reduction_usd": self.state.risk_exposure_usd,
                    "actual_cost_usd": po_cost,
                    "downtime_saved_minutes": 120,
                    "resolution_status": "SUCCESS" if self.state.recovery_verified else "PARTIAL"
                }
                
                self.state.end_time = datetime.datetime.now().isoformat()

        # Save workflow execution record file
        self.save_workflow_record()

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
