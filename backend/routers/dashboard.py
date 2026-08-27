from fastapi import APIRouter, Depends, HTTPException
import aiosqlite
from backend.dependencies import get_db
from backend.models import DashboardResponse, DashboardStats
from backend.database import get_experiment_stats, get_recent_activity, get_experiment
from backend.config import get_settings
import json

router = APIRouter()
settings = get_settings()

@router.get("/dashboard", response_model=DashboardResponse)
async def get_dashboard(db: aiosqlite.Connection = Depends(get_db)):
    """Get high-level statistics and recent activity for the dashboard."""
    # Stats
    stats_dict = await get_experiment_stats(db)
    stats = DashboardStats(**stats_dict)
    
    # Activity
    recent_activity = await get_recent_activity(db, limit=10)
    
    # Available LLMs/Retrievers from config.yaml
    available_llms = []
    available_retrievers = []
    
    # We parse config manually to get the lists.
    # Note: we use utils.load_yaml directly or simple python yaml
    try:
        import yaml
        with open(settings.abs_config_yaml, "r", encoding="utf-8") as f:
            config = yaml.safe_load(f)
            available_llms = config.get("LLM_info", {}).get("LLM_repo", [])
            available_retrievers = config.get("retriever_info", {}).get("retriever_repo", [])
    except Exception:
        pass
        
    # Get the latest completed experiment
    cursor = await db.execute(
        "SELECT id FROM experiments WHERE status = 'completed' ORDER BY completed_at DESC LIMIT 1"
    )
    latest_row = await cursor.fetchone()
    latest_experiment = None
    chart_data = {}
    
    if latest_row:
        latest_experiment = await get_experiment(db, latest_row["id"])
        
        # Load chart data from its aggregates
        if latest_experiment and latest_experiment.get("aggregates"):
            chart_data = latest_experiment["aggregates"].get("chart_data", {})
            
    return DashboardResponse(
        stats=stats,
        available_llms=available_llms,
        available_retrievers=available_retrievers,
        latest_experiment=latest_experiment,
        recent_activity=recent_activity,
        chart_data=chart_data
    )
