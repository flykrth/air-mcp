from typing import Dict, Any, List
from app.features.workflow.agents.base import BaseAgent

class ProcurementAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            name="ProcurementAgent",
            description="Coordinates the dispatch logistics and submits emergency procurement purchase orders."
        )

    def execute(self, state: Dict[str, Any], mcp_client: Any) -> Dict[str, Any]:
        logs = state.setdefault("agent_logs", [])
        self.log(logs, "Initiating procurement transaction and shipping coordination.")

        ticket = state.get("ticket")
        selected_supplier = state.get("selected_supplier")
        item_name = state.get("procure_item")
        quantity = state.get("procure_quantity")

        if not ticket or not selected_supplier or not item_name or not quantity:
            self.log(logs, "ERROR: Missing required procurement context.")
            return {"procurement_status": "FAILED", "error": "Context incomplete"}

        ticket_id = ticket["id"]
        supplier_id = selected_supplier["supplier_id"]

        self.log(
            logs,
            f"PROCUREMENT ORDER SUBMISSION: Submitting PO to '{selected_supplier['supplier_name']}' "
            f"for {quantity}x '{item_name}' (Ticket Ref: {ticket_id})."
        )

        # Call generate_procurement_plan tool
        order_response = mcp_client.call_tool("generate_procurement_plan", {
            "ticket_id": ticket_id,
            "supplier_id": supplier_id,
            "parts": {item_name: quantity}
        })

        if order_response.get("status") != "success":
            self.log(logs, "ERROR: Purchase order submission rejected by supplier.")
            return {"procurement_status": "FAILED", "error": "PO submission failed"}

        # TS tool returns 'procurement_order', let's map it to 'order'
        order = order_response.get("procurement_order", {})
        self.log(
            logs,
            f"PO CONFIRMED: Order ID: {order['id']}. Total Cost: ${order['total_cost']} USD. "
            f"Est. Delivery: {order['estimated_delivery']}."
        )

        # Simulate repair completion
        self.log(logs, f"REPAIR SIMULATION: Dispatching technician to install replacement '{item_name}'.")
        repair_response = mcp_client.call_tool("confirm_maintenance_repair", {
            "ticket_id": ticket_id
        })

        if repair_response.get("status") != "success":
            self.log(logs, "ERROR: Repair verification failed.")
            return {"procurement_status": "FAILED", "error": "Repair verification failed"}

        self.log(logs, f"REPAIR COMPLETE: {repair_response.get('message')}")

        # Verify thermal recovery
        recovery_response = mcp_client.call_tool("validate_thermal_recovery", {})
        recovered = recovery_response.get("recovered", False)
        
        if recovered:
            self.log(logs, f"THERMAL RECOVERY CONFIRMED: {recovery_response.get('message')}")
        else:
            self.log(logs, f"RECOVERY IN PROGRESS: {recovery_response.get('message')}")

        return {
            "procurement_status": "SUCCESS",
            "order": order,
            "ticket": repair_response.get("ticket"),
            "recovery_verified": recovered,
            "recovery_message": recovery_response.get("message")
        }
