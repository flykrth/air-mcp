import os
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseSettings):
    PROJECT_NAME: str = "AIR-MCP Mission Orchestrator"
    API_V1_STR: str = "/api/v1"
    
    # Supabase Credentials (optional for backend, primarily used by MCP server)
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
    SUPABASE_KEY: str = os.getenv(
        "SUPABASE_SERVICE_ROLE_KEY",
        os.getenv("SUPABASE_ANON_KEY", os.getenv("SUPABASE_KEY", ""))
    )
    SUPABASE_SERVICE_ROLE_KEY: str = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
    
    # MCP Server Configuration
    MCP_SERVER_URL: str = os.getenv("MCP_SERVER_URL", "")
    
    # CORS Origin Configuration
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "https://air-mcp.vercel.app")
    
    # MCP Server Configuration
    # We run the Nitrostack MCP server via node/ts-node stdio
    # If the configured path is relative, resolve it relative to the project root
    @property
    def MCP_SERVER_DIR(self) -> str:
        raw_path = os.getenv("MCP_SERVER_DIR", "")
        if not raw_path:
            return os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../mcp-server"))
        if not os.path.isabs(raw_path):
            repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../.."))
            return os.path.abspath(os.path.join(repo_root, raw_path))
        return raw_path

    @property
    def WORKFLOW_RECORD_DIR(self) -> str:
        raw_path = os.getenv("WORKFLOW_RECORD_DIR", "")
        if not raw_path:
            return os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../workflow_records"))
        if not os.path.isabs(raw_path):
            repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../.."))
            return os.path.abspath(os.path.join(repo_root, raw_path))
        return raw_path
    
    class Config:
        case_sensitive = True

settings = Settings()

