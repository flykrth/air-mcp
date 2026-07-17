from typing import Dict, Any, List
from app.features.workflow.agents.base import BaseAgent

class InfrastructureHealthAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            name="InfrastructureHealthAgent",
            description="Monitors datacenter telemetry, identifies thermal hotspots, and diagnoses cooling loop degradation."
        )

    def execute(self, state: Dict[str, Any], mcp_client: Any) -> Dict[str, Any]:
        logs = state.setdefault("agent_logs", [])
        self.log(logs, "Initiating thermal hotspot scan and cooling loop diagnostics.")

        # Call analyze_infrastructure_health tool
        telemetry_response = mcp_client.call_tool("analyze_infrastructure_health", {"all": True})
        if telemetry_response.get("status") != "success":
            self.log(logs, "ERROR: Failed to retrieve infrastructure health.")
            return {"error": "Telemetry retrieval failed"}

        health_metrics = telemetry_response.get("health_metrics", [])
        hotspots = []
        for metric in health_metrics:
            temp = metric.get("temperature", 0.0)
            if temp > 35.0:
                rack_info = {
                    "rack_id": metric.get("rack_id"),
                    "name": metric.get("name"),
                    "temperature_celsius": temp,
                    "status": metric.get("status")
                }
                hotspots.append(rack_info)
                self.log(logs, f"HOTSPOT DETECTED: {metric['name']} is at {temp}°C (threshold: 35.0°C). Status: {metric['status']}.")

        # Read datacenter://assets/registry resource to check cooling chiller health
        cooling_healthy = True
        cooling_efficiency = 1.0
        ambient_temp = 24.0
        try:
            assets = mcp_client.read_resource("datacenter://assets/registry")
            chillers = assets.get("cooling_chillers", [])
            if chillers:
                chiller = chillers[0]
                cooling_healthy = chiller.get("status") == "OPTIMAL"
                cooling_efficiency = chiller.get("efficiency", 1.0)
            
            # Read telemetry feed resource for ambient temperature
            telemetry_feed = mcp_client.read_resource("datacenter://telemetry/feed")
            if telemetry_feed and isinstance(telemetry_feed, list) and len(telemetry_feed) > 0:
                latest = telemetry_feed[0].get("latest_telemetry", {})
                ambient_temp = latest.get("ambient_temperature", 24.0)
        except Exception as e:
            self.log(logs, f"WARNING: Failed to read asset/telemetry registry: {e}. Falling back to default cooling parameters.")

        cooling_loop = {
            "healthy": cooling_healthy,
            "efficiency": cooling_efficiency,
            "ambient_temp": ambient_temp
        }

        if not cooling_healthy:
            self.log(logs, f"COOLING LOOP DEGRADED: Efficiency at {cooling_efficiency * 100}%. Ambient: {ambient_temp}°C.")

        updates = {
            "health_status": "CRITICAL" if hotspots or not cooling_healthy else "OPTIMAL",
            "hotspots": hotspots,
            "cooling_loop": cooling_loop,
            "scanned_racks": len(health_metrics)
        }
        
        self.log(logs, f"Scan completed. Racks scanned: {len(health_metrics)}. Hotspots: {len(hotspots)}.")
        return updates
