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
            # Proactive evaluation for parallel execution
            cooling_loop = state.get("cooling_loop", {})
            if cooling_loop and not cooling_loop.get("healthy", True):
                self.log(logs, "Parallel Execution: Proactively detected cooling loop degradation. Evaluating suppliers for replacement 'chiller_fan_v2'.")
                part_name = "chiller_fan_v2"
                quantity = 1
            else:
                self.log(logs, "No replacement parts required and cooling loop is healthy. Skipping supplier evaluation.")
                return {"supplier_evaluated": False}
        else:
            part_name = list(parts_needed.keys())[0]
            quantity = parts_needed[part_name]

        # Fetch supplier selection prompt template
        try:
            if hasattr(mcp_client, "get_prompt"):
                mcp_client.get_prompt("supplier_selection", {
                    "part_name": part_name,
                    "required_quantity": str(quantity)
                })
        except Exception as pe:
            self.log(logs, f"WARNING: Failed to fetch prompt template: {pe}")


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
