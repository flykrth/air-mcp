from fastapi import APIRouter, HTTPException
from app.application.orchestrator.engine import OrchestratorEngine
from app.api.schemas import RunWorkflowResponse
import asyncio

router = APIRouter()

# Singleton engine instance for the API session
engine = OrchestratorEngine()

@router.post("/run", response_model=RunWorkflowResponse)
async def run_orchestrator_workflow():
    try:
        state = await engine.run_full_workflow()
        return RunWorkflowResponse(
            status="success",
            current_step=state.current_step,
            step_history=state.step_history,
            agent_logs=state.agent_logs,
            hotspots=state.hotspots,
            cooling_loop=state.cooling_loop,
            risk_exposure_usd=state.risk_exposure_usd,
            at_risk_workloads=state.at_risk_workloads,
            migrations_executed=state.migrations_executed,
            ticket=state.ticket,
            selected_technician=state.selected_technician,
            selected_supplier=state.selected_supplier,
            order=state.order,
            recovery_verified=state.recovery_verified,
            recovery_message=state.recovery_message
        )
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Workflow execution failed: {str(e)}")

@router.get("/state", response_model=RunWorkflowResponse)
async def get_orchestrator_state():
    state = engine.state
    return RunWorkflowResponse(
        status="success",
        current_step=state.current_step,
        step_history=state.step_history,
        agent_logs=state.agent_logs,
        hotspots=state.hotspots,
        cooling_loop=state.cooling_loop,
        risk_exposure_usd=state.risk_exposure_usd,
        at_risk_workloads=state.at_risk_workloads,
        migrations_executed=state.migrations_executed,
        ticket=state.ticket,
        selected_technician=state.selected_technician,
        selected_supplier=state.selected_supplier,
        order=state.order,
        recovery_verified=state.recovery_verified,
        recovery_message=state.recovery_message
    )

@router.post("/reset")
async def reset_orchestrator_state():
    engine.state.reset()
    return {"status": "success", "message": "State reset successfully."}
