from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import asyncio
import os

# Force HuggingFace to use a local cache directory instead of the globally configured G: drive
_hf_cache = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".hf_cache")
os.environ["HF_HOME"] = _hf_cache
os.environ["HUGGINGFACE_HUB_CACHE"] = _hf_cache
os.environ["TRANSFORMERS_CACHE"] = _hf_cache
os.environ["SENTENCE_TRANSFORMERS_HOME"] = _hf_cache

from backend.config import get_settings
from backend.database import init_db
from backend.pipeline_runner import execute_experiment_queue

# Import all routers
from backend.routers import (
    dashboard, experiments, leaderboard, retrievers, llms,
    queries, results, metrics, settings as settings_router, logs
)

import logging

# Configure basic logging
logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Initializing database schema...")
    await init_db()
    
    # Load env variables early on if needed
    settings = get_settings()
    logger.info(f"Using database at {settings.abs_database_path}")
    
    # Start the experiment execution queue as a background task
    queue_task = asyncio.create_task(execute_experiment_queue())
    
    yield
    # Shutdown
    logger.info("Shutting down MIRAGE Dashboard Backend...")
    queue_task.cancel()


app = FastAPI(
    title="MIRAGE Dashboard API",
    description="API for managing RAG experiments, LLM evaluation, and viewing metrics.",
    version="1.0.0",
    lifespan=lifespan,
)

settings = get_settings()

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount routers
app.include_router(dashboard.router, prefix="/api", tags=["dashboard"])
app.include_router(experiments.router, prefix="/api/experiments", tags=["experiments"])
app.include_router(leaderboard.router, prefix="/api", tags=["leaderboard"])
app.include_router(retrievers.router, prefix="/api", tags=["retrievers"])
app.include_router(llms.router, prefix="/api", tags=["llms"])
app.include_router(queries.router, prefix="/api", tags=["queries"])
app.include_router(results.router, prefix="/api", tags=["results"])
app.include_router(metrics.router, prefix="/api", tags=["metrics"])
app.include_router(settings_router.router, prefix="/api", tags=["settings"])
app.include_router(logs.router, prefix="/api", tags=["logs"])

@app.get("/api/health", tags=["system"])
async def health_check():
    return {"status": "ok", "message": "MIRAGE backend is running"}

@app.get("/")
async def root():
    return {
        "status": "ok",
        "message": "MIRAGE backend is running"
    }