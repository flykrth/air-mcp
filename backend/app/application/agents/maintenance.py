from typing import Dict, Any, List
from app.application.agents.base import BaseAgent

class MaintenancePlanningAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            name="MaintenancePlanningAgent",
            description="Diagnoses hardware replacement needs, schedules work orders, and assigns certified technicians."
        )

    def execute(self, state: Dict[str, Any], mcp_client: Any) -> Dict[str, Any]:
        logs = state.setdefault("agent_logs", [])
        self.log(logs, "Initiating maintenance scheduling and technician assignment.")

        hotspots = state.get("hotspots", [])
        if not hotspots:
            self.log(logs, "No active hotspots. No physical maintenance required.")
            return {"maintenance_scheduled": False}

        # Identify target rack (primary hotspot)
        target_rack = hotspots[0]
        rack_id = target_rack["rack_id"]
        rack_name = target_rack["name"]

        # Call get_technician_availability
        tech_response = mcp_client.call_tool("get_technician_availability", {})
        if tech_response.get("status") != "success":
            self.log(logs, "ERROR: Failed to fetch technician availability.")
            return {"error": "Technician retrieval failed"}

        technicians = tech_response.get("technicians", [])
        if not technicians:
            self.log(logs, "WARNING: No technicians currently available. Maintenance ticket will remain open.")

        # Find best technician (skill-match for "CRAC Repair")
        best_tech = None
        for tech in technicians:
            if "CRAC Repair" in tech.get("skillset", []):
                best_tech = tech
                break
        
        if not best_tech and technicians:
            best_tech = technicians[0]

        parts_needed = {"chiller_fan_v2": 1}
        self.log(logs, f"MAINTENANCE WORK ORDER: Creating ticket for {rack_name} (Cooling Loop Failure). Parts needed: {parts_needed}.")

        # Create the ticket
        ticket_response = mcp_client.call_tool("create_maintenance_ticket", {
            "target_rack_id": rack_id,
            "description": f"Chiller fan failure on cooling loop serving {rack_name}. Flow rate degraded.",
            "parts_required": parts_needed
        })

        if ticket_response.get("status") != "success":
            self.log(logs, "ERROR: Failed to create maintenance ticket.")
            return {"error": "Ticket creation failed"}

        ticket = ticket_response.get("ticket", {})
        self.log(logs, f"TICKET CREATED: Ticket ID: {ticket['id']}. Status: {ticket['status']}.")

        if best_tech:
            self.log(logs, f"TECHNICIAN IDENTIFIED: Selected '{best_tech['name']}' (Skills: {best_tech['skillset']}).")
        else:
            self.log(logs, "No technicians available. Ticket remains in queue.")

        return {
            "maintenance_scheduled": True,
            "ticket": ticket,
            "selected_technician": best_tech,
            "parts_needed": parts_needed
        }
