from typing import Dict, Any, List
from app.application.agents.base import BaseAgent

class InfrastructureHealthAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            name="InfrastructureHealthAgent",
            description="Monitors datacenter telemetry, identifies thermal hotspots, and diagnoses cooling loop degradation."
        )

    def execute(self, state: Dict[str, Any], mcp_client: Any) -> Dict[str, Any]:
        logs = state.setdefault("agent_logs", [])
        self.log(logs, "Initiating thermal hotspot scan and cooling loop diagnostics.")

        # Call get_telemetry tool
        telemetry_response = mcp_client.call_tool("get_telemetry", {})
        if telemetry_response.get("status") != "success":
            self.log(logs, "ERROR: Failed to retrieve telemetry.")
            return {"error": "Telemetry retrieval failed"}

        telemetry = telemetry_response.get("telemetry", [])
        hotspots = []
        for rack in telemetry:
            if rack.get("temperature_celsius", 0) > 35.0:
                hotspots.append(rack)
                self.log(logs, f"HOTSPOT DETECTED: {rack['name']} is at {rack['temperature_celsius']}°C (threshold: 35.0°C). Status: {rack['status']}.")

        # Call get_cooling_status tool
        cooling_response = mcp_client.call_tool("get_cooling_status", {})
        cooling = cooling_response.get("cooling", {})
        cooling_healthy = cooling.get("healthy", True)
        cooling_efficiency = cooling.get("efficiency", 1.0)

        if not cooling_healthy:
            self.log(logs, f"COOLING LOOP DEGRADED: Efficiency at {cooling_efficiency * 100}%. Ambient: {cooling.get('ambient_temp')}°C.")

        updates = {
            "health_status": "CRITICAL" if hotspots or not cooling_healthy else "OPTIMAL",
            "hotspots": hotspots,
            "cooling_loop": cooling,
            "scanned_racks": len(telemetry)
        }
        
        self.log(logs, f"Scan completed. Racks scanned: {len(telemetry)}. Hotspots: {len(hotspots)}.")
        return updates
