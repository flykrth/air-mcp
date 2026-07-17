from typing import Dict, Any, List
import datetime
from app.features.workflow.agents.base import BaseAgent

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

        # Call plan_maintenance tool
        description = f"Chiller fan failure on cooling loop serving {rack_name}. Flow rate degraded."
        plan_response = mcp_client.call_tool("plan_maintenance", {
            "target_rack_id": rack_id,
            "issue_type": "FAN_FAILURE",
            "description": description
        })

        if plan_response.get("status") != "success":
            self.log(logs, "ERROR: Failed to create maintenance plan.")
            return {"error": "Maintenance planning failed"}

        ticket = plan_response.get("ticket", {})
        required_skills = plan_response.get("required_skills", ["CRAC Repair"])
        ticket_id = ticket["id"]
        self.log(logs, f"TICKET CREATED: Ticket ID: {ticket_id}. Status: {ticket['status']}. Required skills: {required_skills}.")

        # Fetch maintenance planning prompt template
        try:
            if hasattr(mcp_client, "get_prompt"):
                mcp_client.get_prompt("maintenance_planning", {
                    "ticket_id": str(ticket_id),
                    "issue_description": description,
                    "affected_assets": rack_name
                })
        except Exception as pe:
            self.log(logs, f"WARNING: Failed to fetch prompt template: {pe}")


        # Read technician registry resource
        technicians = []
        try:
            tech_registry = mcp_client.read_resource("maintenance://technicians/registry")
            technicians = tech_registry if isinstance(tech_registry, list) else []
        except Exception as e:
            self.log(logs, f"WARNING: Failed to read technician registry: {e}.")

        # Find best technician (skill-match for any required skill and status AVAILABLE)
        best_tech = None
        for tech in technicians:
            if tech.get("status") == "AVAILABLE":
                has_skill = any(skill in tech.get("skillset", []) for skill in required_skills)
                if has_skill:
                    best_tech = tech
                    break

        # Fallback to any available technician
        if not best_tech:
            for tech in technicians:
                if tech.get("status") == "AVAILABLE":
                    best_tech = tech
                      
        if best_tech:
            self.log(logs, f"TECHNICIAN IDENTIFIED: Selected '{best_tech['name']}' (Skills: {best_tech['skillset']}).")
            
            # Schedule the technician
            scheduled_time = (datetime.datetime.now() + datetime.timedelta(hours=1)).isoformat()
            schedule_response = mcp_client.call_tool("schedule_technician", {
                "ticket_id": ticket_id,
                "technician_id": best_tech["id"],
                "scheduled_time": scheduled_time
            })

            if schedule_response.get("status") == "success":
                ticket = schedule_response.get("ticket", ticket)
                self.log(logs, f"TECHNICIAN SCHEDULED: Technician '{best_tech['name']}' assigned to ticket {ticket_id}.")
            else:
                self.log(logs, f"ERROR: Failed to schedule technician: {schedule_response.get('message')}")
        else:
            self.log(logs, "WARNING: No technicians currently available. Maintenance ticket will remain open.")

        return {
            "maintenance_scheduled": True,
            "ticket": ticket,
            "selected_technician": best_tech,
            "parts_needed": ticket.get("parts_required", {"chiller_fan_v2": 1})
        }
