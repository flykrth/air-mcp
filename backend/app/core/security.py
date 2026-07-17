from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from supabase import AsyncClient
from app.core.database import get_supabase_client
from app.core.config import settings

security = HTTPBearer()

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    token = credentials.credentials
    # In offline mode or when Supabase credentials are not provided, we bypass auth and return a mock user
    if not settings.SUPABASE_URL or not settings.SUPABASE_KEY:
        return {"id": "00000000-0000-0000-0000-000000000000", "email": "mock@airmcp.com", "role": "admin"}
        
    try:
        supabase: AsyncClient = await get_supabase_client()
        # Verify token with Supabase Auth API
        res = await supabase.auth.get_user(token)
        if res and res.user:
            return {
                "id": res.user.id,
                "email": res.user.email,
                "token": token
            }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Could not validate credentials: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid authorization token",
        headers={"WWW-Authenticate": "Bearer"},
    )
