import time
import uuid
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.router import api_router
from app.core.database import initialize_database
from app.features.simulator.engine import SimulatorEngine

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

@app.middleware("http")
async def request_logging_middleware(request: Request, call_next):
    request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
    request.state.request_id = request_id
    start_time = time.time()
    try:
        response = await call_next(request)
        latency_ms = (time.time() - start_time) * 1000
        # Print structured request logs
        print(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] [INFO] [ReqID: {request_id}] {request.method} {request.url.path} - Status: {response.status_code} ({latency_ms:.2f}ms)")
        response.headers["X-Request-ID"] = request_id
        return response
    except Exception as e:
        latency_ms = (time.time() - start_time) * 1000
        print(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] [ERROR] [ReqID: {request_id}] {request.method} {request.url.path} - Exception: {str(e)} ({latency_ms:.2f}ms)")
        raise e

@app.on_event("startup")
async def startup_event():
    await initialize_database()
    # Initialize and start digital twin simulator background loop
    engine = SimulatorEngine()
    engine.start_background_loop()

@app.on_event("shutdown")
async def shutdown_event():
    engine = SimulatorEngine()
    engine.stop_background_loop()


# Set CORS origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For hackathon ease of connectivity
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Router
app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/")
def read_root():
    return {
        "status": "online",
        "project": settings.PROJECT_NAME,
        "message": "Welcome to the Adaptive Infrastructure Resilience MCP API gateway."
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
