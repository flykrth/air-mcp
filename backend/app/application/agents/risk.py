from typing import Dict, Any, List
from app.application.agents.base import BaseAgent

class InfrastructureRiskAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            name="InfrastructureRiskAgent",
            description="Assesses active workload SLA breach risks, calculates failure probabilities, and estimates financial exposure."
        )

    def execute(self, state: Dict[str, Any], mcp_client: Any) -> Dict[str, Any]:
        logs = state.setdefault("agent_logs", [])
        self.log(logs, "Initiating workload risk and financial exposure assessment.")

        # Call calculate_sla_risk tool
        risk_response = mcp_client.call_tool("calculate_sla_risk", {})
        if risk_response.get("status") != "success":
            self.log(logs, "ERROR: Failed to calculate SLA risk.")
            return {"error": "SLA risk calculation failed"}

        at_risk_workloads = risk_response.get("at_risk_workloads", [])
        total_exposure = risk_response.get("total_financial_exposure_usd", 0)

        for wrk in at_risk_workloads:
            self.log(
                logs,
                f"SLA RISK: Workload '{wrk['workload_name']}' on {wrk['current_rack']} is at risk. "
                f"Temp: {wrk['temperature']}°C (Threshold: {wrk['threshold']}°C). "
                f"Failure Probability: {int(wrk['failure_probability'] * 100)}%. "
                f"Financial Exposure: ${wrk['calculated_risk_cost_usd']} USD."
            )

        self.log(logs, f"Assessment completed. Total financial exposure: ${total_exposure} USD. At-risk workloads: {len(at_risk_workloads)}.")

        return {
            "risk_exposure_usd": total_exposure,
            "at_risk_workloads": at_risk_workloads,
            "migration_required": len(at_risk_workloads) > 0
        }
