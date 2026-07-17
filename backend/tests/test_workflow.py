import pytest
import asyncio
from app.application.orchestrator.engine import OrchestratorEngine

@pytest.mark.asyncio
async def test_full_resilience_workflow():
    engine = OrchestratorEngine()
    
    # Run full workflow
    state = await engine.run_full_workflow()
    
    # Assertions to ensure all steps completed successfully
    assert state.current_step == "COMPLETED"
    assert "HEATWAVE_TRIGGERED" in state.step_history
    assert "THERMAL_ANALYSIS" in state.step_history
    assert "RISK_ASSESSMENT" in state.step_history
    assert "WORKLOAD_MIGRATION" in state.step_history
    assert "MAINTENANCE_PLANNING" in state.step_history
    assert "SUPPLIER_EVALUATION" in state.step_history
    assert "PROCUREMENT_AND_RECOVERY" in state.step_history
    
    # Verify that workloads were migrated
    assert len(state.migrations_executed) > 0
    for migration in state.migrations_executed:
        assert migration["status"] == "COMPLETED"
        
    # Verify ticket was created and technician assigned
    assert state.ticket["status"] == "RESOLVED"
    assert state.selected_technician is not None
    
    # Verify parts procurement and order
    assert state.order is not None
    assert state.order["status"] == "PENDING"
    
    # Verify final recovery confirmed
    assert state.recovery_verified is True
    assert "Recovery verified" in state.recovery_message
    
    print("\n[TEST SUCCESS] End-to-end mission orchestration completed and verified.")

if __name__ == "__main__":
    asyncio.run(test_full_resilience_workflow())
