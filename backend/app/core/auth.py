"""API key authentication."""

from fastapi import Header, HTTPException
from app.core.config import get_settings

settings = get_settings()


async def verify_api_key(x_api_key: str = Header(default="")):
    """Validate API key from X-API-Key header.

    When no api_key is configured (empty string), auth is disabled for local dev.
    """
    if not settings.api_key:
        return
    if x_api_key != settings.api_key:
        raise HTTPException(status_code=401, detail="Invalid or missing API key")
