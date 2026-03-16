"""API key authentication."""

import logging
from fastapi import Header, HTTPException
from app.core.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


async def verify_api_key(x_api_key: str = Header(default="")):
    """Validate API key from X-API-Key header.

    When no api_key is configured (empty string), auth is disabled for local dev.
    In production, an empty api_key logs a warning — set API_KEY env var.
    """
    if not settings.api_key:
        if settings.environment != "development":
            logger.error("API_KEY is not set in %s environment. Rejecting request.", settings.environment)
            raise HTTPException(
                status_code=500,
                detail="Server misconfiguration: authentication is not configured",
            )
        return
    if x_api_key != settings.api_key:
        raise HTTPException(status_code=401, detail="Invalid or missing API key")


def validate_byok_key(key: str | None) -> str | None:
    """Validate a user-supplied Anthropic API key format. Returns the key or None."""
    if not key:
        return None
    key = key.strip()
    if not key.startswith("sk-ant-") or len(key) < 20 or len(key) > 256:
        return None
    return key
