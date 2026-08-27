"""
WebSocket connection manager for real-time experiment progress updates.
Manages per-experiment connection pools and broadcasts structured JSON events.
"""

import json
import logging
from fastapi import WebSocket
from typing import Optional

logger = logging.getLogger(__name__)


class ConnectionManager:
    """Manages WebSocket connections grouped by experiment ID."""

    def __init__(self):
        # experiment_id -> list of active WebSocket connections
        self.active_connections: dict[str, list[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, experiment_id: str):
        """Accept a WebSocket connection and register it for an experiment."""
        await websocket.accept()
        if experiment_id not in self.active_connections:
            self.active_connections[experiment_id] = []
        self.active_connections[experiment_id].append(websocket)
        logger.info(f"WS connected for experiment {experiment_id}. "
                     f"Total connections: {len(self.active_connections[experiment_id])}")

    def disconnect(self, websocket: WebSocket, experiment_id: str):
        """Remove a WebSocket connection."""
        if experiment_id in self.active_connections:
            self.active_connections[experiment_id] = [
                ws for ws in self.active_connections[experiment_id] if ws != websocket
            ]
            if not self.active_connections[experiment_id]:
                del self.active_connections[experiment_id]
        logger.info(f"WS disconnected for experiment {experiment_id}")

    async def broadcast(self, experiment_id: str, data: dict):
        """Send a JSON message to all connections watching an experiment."""
        if experiment_id not in self.active_connections:
            return

        dead_connections = []
        for ws in self.active_connections[experiment_id]:
            try:
                await ws.send_json(data)
            except Exception:
                dead_connections.append(ws)

        # Clean up dead connections
        for ws in dead_connections:
            self.disconnect(ws, experiment_id)

    async def send_progress(
        self,
        experiment_id: str,
        stage: str,
        llm: Optional[str] = None,
        retriever: Optional[str] = None,
        query_index: int = 0,
        total: int = 0,
        elapsed_sec: float = 0,
        eta_sec: float = 0,
    ):
        """Send a structured progress event."""
        await self.broadcast(experiment_id, {
            "type": "progress",
            "data": {
                "stage": stage,
                "llm": llm,
                "retriever": retriever,
                "query_index": query_index,
                "total": total,
                "elapsed_sec": round(elapsed_sec, 1),
                "eta_sec": round(eta_sec, 1),
            },
        })

    async def send_log(self, experiment_id: str, message: str):
        """Send a log line event."""
        await self.broadcast(experiment_id, {
            "type": "log",
            "data": {"message": message},
        })

    async def send_stage_change(self, experiment_id: str, stage: str):
        """Send a stage transition event."""
        await self.broadcast(experiment_id, {
            "type": "stage_change",
            "data": {"stage": stage},
        })

    async def send_completed(self, experiment_id: str):
        """Send experiment completion event."""
        await self.broadcast(experiment_id, {
            "type": "completed",
            "data": {"message": "Experiment completed successfully"},
        })

    async def send_error(self, experiment_id: str, error: str):
        """Send experiment error event."""
        await self.broadcast(experiment_id, {
            "type": "error",
            "data": {"message": error},
        })


# Singleton instance
ws_manager = ConnectionManager()
