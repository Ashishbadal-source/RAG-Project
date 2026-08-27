from fastapi import APIRouter, HTTPException
import os
from backend.models import LogsResponse
from backend.config import get_settings
import aiofiles

router = APIRouter()
settings = get_settings()

@router.get("/logs/{experiment_id}", response_model=LogsResponse)
async def get_logs(experiment_id: str, tail: int = 200):
    """Get the last N lines of logs for an experiment."""
    log_file = settings.abs_log_dir / f"{experiment_id}.log"
    
    if not os.path.exists(log_file):
        # We don't raise 404, just return empty list
        return LogsResponse(experiment_id=experiment_id, lines=[])
        
    try:
        # For simplicity, we read the whole file and tail it.
        # In a massive log file, seeking from the end would be better,
        # but for this scale, reading lines is fine.
        async with aiofiles.open(log_file, mode="r", encoding="utf-8") as f:
            lines = await f.readlines()
            
        tail_lines = [line.rstrip() for line in lines[-tail:]]
        return LogsResponse(experiment_id=experiment_id, lines=tail_lines)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to read logs: {e}")
