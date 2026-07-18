import os
import time
import subprocess
import asyncio
from fastapi import APIRouter, Response, status
from app.core.config import settings
from app.core.database import get_supabase_client
from app.features.simulator.engine import SimulatorEngine

router = APIRouter()
START_TIME = time.time()

@router.get("")
async def health_check(response: Response):
    """
    Detailed health check monitoring application layers:
    - API Gateway responsiveness and uptime
    - Database connectivity (Supabase REST API status / Offline Fallback check)
    - Digital Twin Simulator Engine background loop activity
    - MCP Server binary and Node.js runtime readiness
    """
    is_healthy = True
    details = {}

    # 1. API gateway uptime
    uptime_seconds = time.time() - START_TIME
    details["api"] = {
        "status": "healthy",
        "uptime": f"{int(uptime_seconds)}s"
    }

    # 2. Database Connectivity Check
    if not settings.SUPABASE_URL or not settings.SUPABASE_KEY:
        details["database"] = {
            "status": "online_fallback",
            "type": "in_memory",
            "message": "Running in zero-dependency local memory mode"
        }
    else:
        try:
            supabase = await get_supabase_client()
            # Run simple query to verify connectivity
            await supabase.table("racks").select("id").limit(1).execute()
            details["database"] = {
                "status": "healthy",
                "type": "supabase"
            }
        except Exception as e:
            is_healthy = False
            details["database"] = {
                "status": "unhealthy",
                "type": "supabase",
                "error": str(e)
            }

    # 3. Digital Twin simulator background loop check
    try:
        engine = SimulatorEngine()
        loop_active = engine._loop_task is not None and not engine._loop_task.done()
        details["digital_twin"] = {
            "status": "healthy" if loop_active else "unhealthy",
            "loop_active": loop_active,
            "monitored_racks": len(engine.state.racks)
        }
        if not loop_active:
            is_healthy = False
    except Exception as e:
        is_healthy = False
        details["digital_twin"] = {
            "status": "unhealthy",
            "error": str(e)
        }

    # 4. MCP Server verification (Subprocess readiness)
    mcp_path = os.path.join(settings.MCP_SERVER_DIR, "dist", "index.js")
    mcp_compiled = os.path.exists(mcp_path)
    
    node_installed = False
    node_version = None
    try:
        proc = await asyncio.create_subprocess_exec(
            "node", "--version",
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        stdout, _ = await proc.communicate()
        if proc.returncode == 0:
            node_installed = True
            node_version = stdout.decode().strip()
    except Exception:
        pass

    details["mcp_server"] = {
        "status": "healthy" if (mcp_compiled and node_installed) else "unhealthy",
        "node_installed": node_installed,
        "node_version": node_version,
        "dist_compiled": mcp_compiled,
        "mcp_server_dir": settings.MCP_SERVER_DIR
    }
    
    if not (mcp_compiled and node_installed):
        is_healthy = False

    # Return response based on overall health
    if not is_healthy:
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
        return {
            "status": "unhealthy",
            "details": details
        }

    return {
        "status": "healthy",
        "details": details
    }
