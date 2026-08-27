import uuid
import aiosqlite
from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
from typing import Optional

from backend.models import (
    ExperimentCreate,
    ExperimentRunResponse,
    ExperimentListResponse,
    ExperimentResponse,
    StatusResponse
)
from backend.dependencies import get_db, get_ws_manager
from backend.database import (
    create_experiment,
    list_experiments,
    get_experiment,
    add_activity,
    update_experiment
)
from backend.ws_manager import ConnectionManager
from backend.pipeline_runner import job_state

router = APIRouter()

@router.get("", response_model=ExperimentListResponse)
async def get_experiments(
    status: Optional[str] = None,
    page: int = 1,
    per_page: int = 20,
    db: aiosqlite.Connection = Depends(get_db)
):
    """List and filter experiments."""
    items, total = await list_experiments(db, status, page, per_page)
    return ExperimentListResponse(
        items=items,
        total=total,
        page=page,
        per_page=per_page
    )


@router.post("/run", response_model=ExperimentRunResponse, status_code=201)
async def run_experiment(
    req: ExperimentCreate,
    db: aiosqlite.Connection = Depends(get_db)
):
    """Submit a new experiment to the queue."""
    # Build the config.yaml equivalent dict
    config = {
        "mode": req.mode,
        "LLM_info": {
            "LLM_repo": req.llms,
            "vllm_configs": {
                "tensor_parallel_size": 1,
                "gpu_memory_utilization": 0.9,
                "dtype": "float16",
                "sampling_params": {
                    "temperature": req.temperature,
                    "top_p": req.top_p,
                    "max_tokens": req.max_tokens
                }
            },
            "preset_prompt": True, # Always true for UI simplicity right now unless prompt given
            "save_directory": "Inference_result"
        },
        "retriever_info": {
            "retriever_repo": req.retrievers,
            "top_k": req.top_k,
            "retriever_batch_size": 1024,
            "use_cuda": req.use_cuda,
            "save_directory": "Retrieval_result"
        },
        "prompt": req.prompts or {}
    }
    
    if req.prompts:
        config["LLM_info"]["preset_prompt"] = False
        
    exp_id = str(uuid.uuid4())
    experiment = {
        "id": exp_id,
        "name": req.name,
        "mode": req.mode,
        "config": config
    }
    
    await create_experiment(db, experiment)
    await add_activity(db, exp_id, "queued", f"Experiment queued for execution")
    
    # Background execution is handled by pipeline_runner.execute_experiment_queue
    # which is started in app.py lifespan
    return ExperimentRunResponse(id=exp_id)


@router.get("/{experiment_id}", response_model=ExperimentResponse)
async def get_experiment_detail(
    experiment_id: str,
    db: aiosqlite.Connection = Depends(get_db)
):
    exp = await get_experiment(db, experiment_id)
    if not exp:
        raise HTTPException(status_code=404, detail="Experiment not found")
    return exp


@router.post("/{experiment_id}/pause", response_model=StatusResponse)
async def pause_experiment(experiment_id: str, db: aiosqlite.Connection = Depends(get_db)):
    if job_state.active_experiment_id == experiment_id:
        job_state.pause_event.set()
        await update_experiment(db, experiment_id, status="paused")
        await add_activity(db, experiment_id, "paused", "Experiment paused manually")
        return StatusResponse(status="paused", message="Experiment paused")
    raise HTTPException(status_code=400, detail="Experiment is not currently running")


@router.post("/{experiment_id}/resume", response_model=StatusResponse)
async def resume_experiment(experiment_id: str, db: aiosqlite.Connection = Depends(get_db)):
    if job_state.active_experiment_id == experiment_id and job_state.pause_event.is_set():
        job_state.pause_event.clear()
        await update_experiment(db, experiment_id, status="running")
        await add_activity(db, experiment_id, "resumed", "Experiment resumed manually")
        return StatusResponse(status="running", message="Experiment resumed")
    raise HTTPException(status_code=400, detail="Experiment is not paused")


@router.post("/{experiment_id}/cancel", response_model=StatusResponse)
async def cancel_experiment(experiment_id: str, db: aiosqlite.Connection = Depends(get_db)):
    # If running
    if job_state.active_experiment_id == experiment_id:
        job_state.cancel_event.set()
        # pipeline_runner handles the DB update when it catches InterruptedError
        return StatusResponse(status="cancelling", message="Cancellation requested")
        
    # If queued
    exp = await get_experiment(db, experiment_id)
    if exp and exp["status"] == "queued":
        await update_experiment(db, experiment_id, status="cancelled")
        await add_activity(db, experiment_id, "cancelled", "Removed from queue")
        return StatusResponse(status="cancelled", message="Removed from queue")
        
    raise HTTPException(status_code=400, detail="Cannot cancel experiment in current state")


@router.websocket("/{experiment_id}/live")
async def websocket_endpoint(
    websocket: WebSocket, 
    experiment_id: str,
    ws_manager: ConnectionManager = Depends(get_ws_manager)
):
    """Real-time progress and logs."""
    await ws_manager.connect(websocket, experiment_id)
    try:
        while True:
            # We just hold connection open. Server pushes data via ws_manager methods.
            await websocket.receive_text() 
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket, experiment_id)
