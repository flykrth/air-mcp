import os
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseSettings):
    PROJECT_NAME: str = "AIR-MCP Mission Orchestrator"
    API_V1_STR: str = "/api/v1"
    
    # Supabase Credentials (optional for backend, primarily used by MCP server)
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
    SUPABASE_KEY: str = os.getenv("SUPABASE_KEY", "")
    
    # MCP Server Configuration
    # We run the Nitrostack MCP server via node/ts-node stdio
    MCP_SERVER_DIR: str = os.path.abspath(
        os.path.join(os.path.dirname(__file__), "../../../mcp-server")
    )
    
    class Config:
        case_sensitive = True

settings = Settings()
