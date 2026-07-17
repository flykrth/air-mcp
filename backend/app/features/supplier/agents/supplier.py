from typing import Dict, Any, List
from app.features.workflow.agents.base import BaseAgent

class SupplierIntelligenceAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            name="SupplierIntelligenceAgent",
            description="Evaluates external supplier catalogues, reviews lead times/ratings, and selects optimal parts source."
        )

    def execute(self, state: Dict[str, Any], mcp_client: Any) -> Dict[str, Any]:
        logs = state.setdefault("agent_logs", [])
        self.log(logs, "Initiating supplier inventory search and lead-time analysis.")

        parts_needed = state.get("parts_needed", {})
        if not parts_needed:
            self.log(logs, "No replacement parts required. Skipping supplier evaluation.")
            return {"supplier_evaluated": False}

        part_name = list(parts_needed.keys())[0] # chiller_fan_v2
        quantity = parts_needed[part_name]

        # Call evaluate_suppliers tool
        search_response = mcp_client.call_tool("evaluate_suppliers", {
            "part_name": part_name,
            "quantity": quantity
        })

        if search_response.get("status") != "success":
            self.log(logs, f"ERROR: Failed to query supplier catalog for part '{part_name}'.")
            return {"error": "Supplier inventory query failed"}

        evaluations = search_response.get("supplier_evaluations", [])
        if not evaluations:
            self.log(logs, f"CRITICAL: Part '{part_name}' is completely out of stock across all certified suppliers!")
            return {"error": "Out of stock globally"}

        for option in evaluations:
            self.log(
                logs,
                f"SUPPLIER OPTION: '{option['supplier_name']}' has {option['stock_available']}x in stock. "
                f"Price: ${option['unit_price_usd']} USD. Lead time: {option['lead_time_hours']} hours. Rating: {option['rating']}."
            )

        # Select the best supplier (which is first in the pre-sorted list)
        best_match = evaluations[0]
        self.log(
            logs,
            f"SUPPLIER SELECTED: Recommending '{best_match['supplier_name']}' for '{part_name}'. "
            f"Lead Time: {best_match['lead_time_hours']} hrs. Unit Price: ${best_match['unit_price_usd']} USD."
        )

        return {
            "supplier_evaluated": True,
            "selected_supplier": best_match,
            "procure_item": part_name,
            "procure_quantity": quantity
        }
