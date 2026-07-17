import pytest
import asyncio
import datetime
from app.application.orchestrator.engine import OrchestratorEngine
from unittest.mock import MagicMock

@pytest.mark.asyncio
async def test_conflict_resolution():
    engine = OrchestratorEngine()
    
    # Mock Risk assessment to show high SLA risk exposure
    engine.state.risk_exposure_usd = 120000.0 # $120,000 SLA penalty
    
    # Mock supplier evaluations:
    # Option A (selected by agent, cost optimized): Price: $380, Lead time: 8 hours
    # Option B (optimal calculated): Price: $450, Lead time: 2 hours
    supplier_res = {
        "supplier_evaluated": True,
        "selected_supplier": {
            "supplier_id": "supplier-hvac-logistics",
            "supplier_name": "Global HVAC Logistics",
            "unit_price_usd": 380.0,
            "lead_time_hours": 8,
            "rating": 4.2
        },
        "procure_item": "chiller_fan_v2",
        "procure_quantity": 1
    }
    
    mock_client = MagicMock()
    
    async def async_call_tool(tool_name, arguments):
        return {
            "status": "success",
            "supplier_evaluations": [
                {
                    "supplier_id": "supplier-hvac-logistics",
                    "supplier_name": "Global HVAC Logistics",
                    "unit_price_usd": 380.0,
                    "lead_time_hours": 8,
                    "rating": 4.2
                },
                {
                    "supplier_id": "supplier-apex",
                    "supplier_name": "Apex Cooling Systems Inc.",
                    "unit_price_usd": 450.0,
                    "lead_time_hours": 2,
                    "rating": 4.8
                }
            ]
        }
        
    mock_client.async_call_tool = async_call_tool
    
    await engine._consolidate_decisions(
        workload_res={},
        maintenance_res={"ticket": {"id": "t1"}, "selected_technician": {"name": "Tech"}, "parts_needed": {"chiller_fan_v2": 1}},
        supplier_res=supplier_res,
        client=mock_client
    )
    
    # The conflict resolver must override the selected supplier to Apex Cooling Systems Inc. due to shorter lead time
    assert engine.state.selected_supplier["supplier_name"] == "Apex Cooling Systems Inc."
    assert any(dp["decision"] == "Supplier Selection Optimization" for dp in engine.state.decision_points)
    print("\n[TEST SUCCESS] Conflict resolution logic successfully overrode cost-optimized supplier for fast delivery under high SLA penalty.")

@pytest.mark.asyncio
async def test_agent_failure_injection_and_fallback():
    engine = OrchestratorEngine()
    
    # Create mock client
    mock_client = MagicMock()
    
    async def dummy_call_tool(tool_name, arguments):
        return {"status": "success", "message": "Triggered"}
    mock_client.async_call_tool = dummy_call_tool
    
    # Mock an agent to fail
    failing_agent = MagicMock()
    failing_agent.name = "FailingAgent"
    failing_agent.execute = MagicMock(side_effect=Exception("Database Timeout"))
    
    # Execute the failing agent through the runner
    res = await engine._execute_agent_async(failing_agent, mock_client)
    
    # Verify that the runner logs the failure, does not crash, and returns an error dictionary
    assert "error" in res
    assert "failingagent" in [e["agent"].lower() for e in engine.state.agent_timeline]
    assert engine.state.agent_timeline[0]["status"] == "FAILED"
    print("[TEST SUCCESS] Agent failure injection and retry fallback handled gracefully.")
