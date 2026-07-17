from typing import Dict, Any, List
from app.application.agents.base import BaseAgent

class CloudWorkloadAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            name="CloudWorkloadAgent",
            description="Coordinates and executes hot-migrations of containerized/VM workloads to thermally safe host racks."
        )

    def execute(self, state: Dict[str, Any], mcp_client: Any) -> Dict[str, Any]:
        logs = state.setdefault("agent_logs", [])
        self.log(logs, "Initiating cloud workload migration planning.")

        at_risk_workloads = state.get("at_risk_workloads", [])
        if not at_risk_workloads:
            self.log(logs, "No workloads require migration. Workload layout is stable.")
            return {"migrations_executed": []}

        # Fetch telemetry to find candidate target racks
        telemetry_response = mcp_client.call_tool("get_telemetry", {})
        if telemetry_response.get("status") != "success":
            self.log(logs, "ERROR: Failed to retrieve telemetry for target mapping.")
            return {"error": "Target telemetry retrieval failed"}

        telemetry = telemetry_response.get("telemetry", [])
        
        # Candidate target racks are those with temp <= 26°C and status OPTIMAL
        candidates = [
            rack for rack in telemetry
            if rack.get("status") == "OPTIMAL" and rack.get("temperature_celsius", 99) < 26.0
        ]
        
        if not candidates:
            # Fallback to any optimal rack
            candidates = [rack for rack in telemetry if rack.get("status") == "OPTIMAL"]

        if not candidates:
            self.log(logs, "CRITICAL: No thermally safe target racks found! Aborting migration to prevent thermal runaway.")
            return {"error": "No safe destination racks available"}

        migrations = []
        candidate_idx = 0

        for wrk in at_risk_workloads:
            # Round-robin target selection
            target_rack = candidates[candidate_idx % len(candidates)]
            candidate_idx += 1
            
            workload_id = wrk["workload_id"]
            self.log(logs, f"MIGRATION PLAN: Assigning workload '{wrk['workload_name']}' -> Target Rack '{target_rack['name']}' ({target_rack['temperature_celsius']}°C).")

            # Execute migration
            migration_response = mcp_client.call_tool("migrate_workload", {
                "workload_id": workload_id,
                "target_rack_id": target_rack["rack_id"]
            })

            if migration_response.get("status") == "success":
                self.log(logs, f"MIGRATION SUCCESS: Workload '{wrk['workload_name']}' successfully hot-migrated to '{target_rack['name']}'.")
                migrations.append({
                    "workload_id": workload_id,
                    "workload_name": wrk["workload_name"],
                    "target_rack": target_rack["name"],
                    "status": "COMPLETED"
                })
            else:
                self.log(logs, f"MIGRATION FAILED: Failed to migrate workload '{wrk['workload_name']}'.")

        self.log(logs, f"Migration cycle completed. Total migrations executed: {len(migrations)}.")

        return {
            "migrations_executed": migrations,
            "migration_completed": len(migrations) == len(at_risk_workloads)
        }
