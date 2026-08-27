from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import FileResponse
import aiosqlite
import json
import zipfile
import os
import shutil
from typing import Optional
from backend.models import ResultResponse
from backend.dependencies import get_db
from backend.database import get_experiment
from backend.config import get_settings

router = APIRouter()
settings = get_settings()


@router.get("/results/{experiment_id}", response_model=ResultResponse)
async def get_results(experiment_id: str, db: aiosqlite.Connection = Depends(get_db)):
    """Get summarized results for an experiment."""
    experiment = await get_experiment(db, experiment_id)
    if not experiment:
        raise HTTPException(status_code=404, detail="Experiment not found")
        
    aggregates = experiment.get("aggregates", {})
    if not aggregates:
        # If it's not completed, aggregates might not exist yet
        return ResultResponse(experiment_id=experiment_id)
        
    # The Metrics.jsonl provides detailed counts for the latest run.
    # In a full production system, metrics might be keyed by experiment ID,
    # but here we'll rely on the precomputed aggregates JSON.
    
    # We will extract label_counts from the first item in Metrics.jsonl 
    # matching this run if available, otherwise just return empty dict for counts
    # (Since this is a file-based legacy backend, it overwrites Metrics.jsonl each run)
    
    metrics_summary = aggregates.get("summary", {})
    per_llm = aggregates.get("per_llm", [])
    per_retriever = aggregates.get("per_retriever", [])
    label_counts = {}
    
    try:
        metrics_file = settings.abs_evaluation_dir / "Metrics.jsonl"
        if os.path.exists(metrics_file):
            with open(metrics_file, "r", encoding="utf-8") as f:
                for line in f:
                    data = json.loads(line)
                    if data.get("Counts"):
                        label_counts = data["Counts"].get("label_count", {})
                        break # Just grab the first one for now
    except Exception:
        pass
        
    return ResultResponse(
        experiment_id=experiment_id,
        metrics_summary=metrics_summary,
        label_counts=label_counts,
        per_llm=per_llm,
        per_retriever=per_retriever
    )


@router.get("/results/{experiment_id}/download")
async def download_results(experiment_id: str, db: aiosqlite.Connection = Depends(get_db)):
    """Download a ZIP archive of the evaluation results."""
    experiment = await get_experiment(db, experiment_id)
    if not experiment:
        raise HTTPException(status_code=404, detail="Experiment not found")
        
    zip_path = settings.abs_log_dir / f"{experiment_id}_results.zip"
    
    # Create the zip if it doesn't exist
    if not os.path.exists(zip_path):
        try:
            with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
                # Add evaluation results
                for filename in os.listdir(settings.abs_evaluation_dir):
                    file_path = settings.abs_evaluation_dir / filename
                    if os.path.isfile(file_path):
                        zipf.write(file_path, arcname=f"Evaluation_result/{filename}")
                
                # Optionally add some inference results (might be huge)
                # We'll just add the aggregates JSON
                agg_path = settings.abs_evaluation_dir / f"{experiment_id}_aggregates.json"
                if os.path.exists(agg_path):
                     zipf.write(agg_path, arcname=f"Evaluation_result/{experiment_id}_aggregates.json")
                     
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to create ZIP: {e}")
            
    return FileResponse(
        path=zip_path,
        media_type="application/zip",
        filename=f"mirage_results_{experiment_id}.zip"
    )
