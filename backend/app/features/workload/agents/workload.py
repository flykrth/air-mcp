from typing import Dict, Any, List
from app.features.workflow.agents.base import BaseAgent

class CloudWorkloadAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            name="CloudWorkloadAgent",
            description="Coordinates and executes hot-migrations of containerized/VM workloads to thermally safe host racks."
        )

    def execute(self, state: Dict[str, Any], mcp_client: Any) -> Dict[str, Any]:
        logs = state.setdefault("agent_logs", [])
        self.log(logs, "Initiating cloud workload migration planning.")

        hotspots = state.get("hotspots", [])
        if not hotspots:
            self.log(logs, "No workloads require migration. Workload layout is stable.")
            return {"migrations_executed": []}

        migrations = []
        for rack in hotspots:
            rack_id = rack["rack_id"]
            self.log(logs, f"MIGRATION PLANNING: Querying recommendations for source rack {rack['name']}.")
            
            # Fetch workload migration strategy prompt template
            try:
                if hasattr(mcp_client, "get_prompt"):
                    at_risk_ids = [str(w.get("workload_id", "")) for w in state.get("at_risk_workloads", []) if w.get("current_rack") == rack["name"]]
                    mcp_client.get_prompt("workload_migration_strategy", {
                        "workload_ids": ",".join(at_risk_ids) if at_risk_ids else "None",
                        "source_rack_id": rack_id
                    })
            except Exception as pe:
                self.log(logs, f"WARNING: Failed to fetch prompt template: {pe}")

            
            recommend_response = mcp_client.call_tool("recommend_workload_migration", {"source_rack_id": rack_id})
            if recommend_response.get("status") != "success":
                self.log(logs, f"ERROR: Failed to retrieve migration recommendations for {rack['name']}.")
                continue

            recommendations = recommend_response.get("recommendations", [])
            for rec in recommendations:
                target = rec.get("recommended_target")
                if not target:
                    self.log(logs, f"CRITICAL: No suitable target rack found to migrate workload '{rec['workload_name']}'!")
                    continue

                workload_id = rec["workload_id"]
                target_rack_id = target["rack_id"]
                target_rack_name = target["rack_name"]

                self.log(logs, f"MIGRATION PLAN: Evacuating workload '{rec['workload_name']}' -> Target Rack '{target_rack_name}' (Score: {target['score']}).")

                # Execute migration
                migration_response = mcp_client.call_tool("migrate_workload", {
                    "workload_id": workload_id,
                    "target_rack_id": target_rack_id
                })

                if migration_response.get("status") == "success":
                    self.log(logs, f"MIGRATION SUCCESS: Workload '{rec['workload_name']}' successfully hot-migrated to '{target_rack_name}'.")
                    migrations.append({
                        "workload_id": workload_id,
                        "workload_name": rec["workload_name"],
                        "target_rack": target_rack_name,
                        "status": "COMPLETED"
                    })
                else:
                    self.log(logs, f"MIGRATION FAILED: Failed to migrate workload '{rec['workload_name']}'.")

        self.log(logs, f"Migration cycle completed. Total migrations executed: {len(migrations)}.")

        return {
            "migrations_executed": migrations,
            "migration_completed": len(migrations) > 0
        }
