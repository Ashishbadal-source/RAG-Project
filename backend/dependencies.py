"""
FastAPI dependencies for injecting DB connections and the WebSocket manager.
"""

from typing import AsyncGenerator
import aiosqlite
from backend.database import get_db_connection
from backend.ws_manager import ConnectionManager, ws_manager

async def get_db() -> AsyncGenerator[aiosqlite.Connection, None]:
    """Dependency for injecting an aiosqlite DB connection."""
    db = await get_db_connection()
    try:
        yield db
    finally:
        await db.close()

def get_ws_manager() -> ConnectionManager:
    """Dependency for injecting the global WebSocket manager."""
    return ws_manager
