import asyncio
from typing import Dict, Any, List, Optional
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client
from app.core.config import settings
from app.application.orchestrator.state import OrchestratorState

# Import Agents
from app.application.agents.health import InfrastructureHealthAgent
from app.application.agents.risk import InfrastructureRiskAgent
from app.application.agents.workload import CloudWorkloadAgent
from app.application.agents.maintenance import MaintenancePlanningAgent
from app.application.agents.supplier import SupplierIntelligenceAgent
from app.application.agents.procurement import ProcurementAgent

class McpClientWrapper:
    """
    Asynchronous helper client that wraps the MCP stdio_client and ClientSession connection
    to expose standard synchronous/asynchronous tool execution.
    """
    def __init__(self, session: ClientSession):
        self.session = session

    def call_tool(self, tool_name: str, arguments: Dict[str, Any]) -> Dict[str, Any]:
        """
        Synchronous-looking wrapper for calling a tool.
        Since our agents are run in an async loop, we resolve the coroutine.
        """
        loop = asyncio.get_event_loop()
        if loop.is_running():
            # If loop is already running (e.g. FastAPI requests), we need to run it in a future or
            # execute it using asyncio.run_coroutine_threadsafe or use await inside async agent.
            # Let's make our agents async! It's much cleaner for FastAPI.
            raise RuntimeError("Use async_call_tool from async context.")
        
    async def async_call_tool(self, tool_name: str, arguments: Dict[str, Any]) -> Dict[str, Any]:
        try:
            print(f"[MCP CLIENT] Calling tool '{tool_name}' with args {arguments}...")
            result = await self.session.call_tool(tool_name, arguments)
            # result is a CallToolResult model which contains content (List of TextContent/ImageContent/etc)
            # Let's extract the JSON response or text
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

    def get_server_parameters(self) -> StdioServerParameters:
        """
        Returns parameters to spawn the Nitrostack Node.js server.
        """
        import os
        env = os.environ.copy()
        env["PATH"] = "/usr/bin:/bin:/usr/sbin:/sbin:/usr/local/bin:" + env.get("PATH", "")
        return StdioServerParameters(
            command="node",
            args=["dist/index.js"],
            env=env
        )

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
        but call async tool wrappers. We pass the client directly.
        """
        # We can construct a mock client that has a synchronous `call_tool` wrapper
        # mapping to client.async_call_tool.
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

        # Since we are running on the main event loop, we can't block the loop with fut.result().
        # Therefore, we will run the agent execution in a separate thread, which allows it to block
        # on `fut.result()` without freezing the FastAPI event loop!
        # This is a classic and very clean Enterprise Integration Pattern.
        loop = asyncio.get_running_loop()
        sync_mock = SyncMcpClientMock(client, loop)
        
        # We run the agent's execute method in the threadpool
        import concurrent.futures
        with concurrent.futures.ThreadPoolExecutor() as pool:
            result = await loop.run_in_executor(
                pool,
                agent.execute,
                self.state.dict(),
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
                    await asyncio.sleep(0.5) # small delay for visual simulation effect

        return self.state
