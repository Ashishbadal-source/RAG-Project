import asyncio
import os
import json
import logging
import threading
from datetime import datetime, timezone
import yaml

# Force HuggingFace to use a local cache directory instead of the globally configured G: drive
_hf_cache = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".hf_cache")
os.environ["HF_HOME"] = _hf_cache
os.environ["HUGGINGFACE_HUB_CACHE"] = _hf_cache
os.environ["TRANSFORMERS_CACHE"] = _hf_cache
os.environ["SENTENCE_TRANSFORMERS_HOME"] = _hf_cache


from backend.config import get_settings
from backend.database import get_db_connection, update_experiment, add_activity, get_next_queued
from backend.ws_manager import ws_manager
from backend.aggregator import compute_and_save_aggregates

settings = get_settings()
logger = logging.getLogger(__name__)

# Global state for managing the running job
class JobState:
    def __init__(self):
        self.active_experiment_id = None
        self.pause_event = threading.Event()
        self.cancel_event = threading.Event()
        self.is_running = False

    def reset(self):
        self.active_experiment_id = None
        self.pause_event.clear()
        self.cancel_event.clear()
        self.is_running = False

job_state = JobState()


# Only forward logs from our own modules to the live UI — suppress noisy third-party library output
_ALLOWED_LOG_PREFIXES = (
    "root",
    "__main__",
    "backend.",
    "LLM",
    "retriever",
    "evaluation",
    "utils",
    "pipeline",
)
_BLOCKED_LOG_PREFIXES = (
    "huggingface",
    "datasets",
    "transformers",
    "sentence_transformers",
    "torch",
    "urllib3",
    "httpx",
    "httpcore",
    "filelock",
    "fsspec",
    "PIL",
    "tqdm",
)

class ProgressLogHandler(logging.Handler):
    """Intercepts logger output and sends it over WebSocket (filtered to our own modules)."""
    def __init__(self, experiment_id: str, loop: asyncio.AbstractEventLoop):
        super().__init__()
        self.experiment_id = experiment_id
        self.loop = loop

    def emit(self, record):
        try:
            # Block noisy third-party library logs
            name = record.name or ""
            if any(name.startswith(blocked) for blocked in _BLOCKED_LOG_PREFIXES):
                return
            msg = self.format(record)
            asyncio.run_coroutine_threadsafe(
                ws_manager.send_log(self.experiment_id, msg),
                self.loop
            )
        except Exception:
            self.handleError(record)


def _check_controls():
    """Helper for pipeline to check pause/cancel flags."""
    if job_state.cancel_event.is_set():
        raise InterruptedError("Experiment cancelled by user")
    
    if job_state.pause_event.is_set():
        # wait until unpaused or cancelled
        while job_state.pause_event.is_set() and not job_state.cancel_event.is_set():
             import time
             time.sleep(0.5)
        if job_state.cancel_event.is_set():
             raise InterruptedError("Experiment cancelled by user")


async def execute_experiment_queue():
    """Continuously poll and execute queued experiments one by one."""
    while True:
        try:
            if not job_state.is_running:
                db = await get_db_connection()
                next_exp = await get_next_queued(db)
                if next_exp:
                    job_state.is_running = True
                    job_state.active_experiment_id = next_exp["id"]
                    
                    # Update status to running
                    await update_experiment(db, next_exp["id"], 
                                          status="running", 
                                          started_at=datetime.now(timezone.utc).isoformat())
                    await add_activity(db, next_exp["id"], "started", f"Started execution of {next_exp['mode']} mode")
                    await db.close()
                    
                    # Run it (this blocks in a thread executor to avoid blocking the event loop)
                    main_loop = asyncio.get_running_loop()
                    logger.info(">>> Before asyncio.to_thread")
                    await asyncio.to_thread(_run_pipeline_sync, next_exp, main_loop)
                    logger.info(">>> After asyncio.to_thread")
                    
                    job_state.reset()
                else:
                    await db.close()
                    
            await asyncio.sleep(2) # Poll every 2 seconds
        except Exception as e:
            logger.error(f"Queue error: {e}")
            job_state.reset()
            await asyncio.sleep(5)


def _run_pipeline_sync(exp: dict, loop: asyncio.AbstractEventLoop):
    """
    Synchronously runs the existing MIRAGE logic wrapped in our controls.
    Lazy imports are used to avoid downloading HF dataset on server start.
    """
    print("========== PIPELINE STARTED ==========")
    print(">>>>>>>> PIPELINE FUNCTION ENTERED <<<<<<<<")
    print(exp)
    exp_id = exp["id"]
    # loop = asyncio.get_event_loop()
    
    # Setup custom logging
    log_file = settings.abs_log_dir / f"{exp_id}.log"
    file_handler = logging.FileHandler(log_file)
    ws_handler = ProgressLogHandler(exp_id, loop)
    formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')
    file_handler.setFormatter(formatter)
    ws_handler.setFormatter(formatter)
    
    root_logger = logging.getLogger()
    root_logger.setLevel(logging.INFO)
    root_logger.addHandler(file_handler)
    root_logger.addHandler(ws_handler)

    try:
        logging.info(f"Starting pipeline for experiment {exp_id}")
        config = exp["config"]
        mode = exp["mode"]

        # 1. Update config.yaml with this experiment's settings
        # The existing modules rely on config.yaml being read by utils.load_yaml
        with open(settings.abs_config_yaml, "w", encoding="utf-8") as f:
            yaml.safe_dump(config, f)
            
        _check_controls()
        
        # 2. Lazy Import existing modules!
        logging.info("Importing MIRAGE modules...")
        
        # Changing working directory temporarily so modules find Preset_prompt etc.
        import sys
        mirage_dir = str(settings.abs_config_yaml.parent)
        if mirage_dir not in sys.path:
            sys.path.insert(0, mirage_dir)
            
        old_cwd = os.getcwd()
        os.chdir(mirage_dir)
            
        from utils import load_yaml
        from LLM import LLMGenerator
        from retriever import Retriever
        
        _check_controls()
        asyncio.run_coroutine_threadsafe(ws_manager.send_stage_change(exp_id, "Inference"), loop)

        # 3. Execute logic (copied structure from main.py, but wrapped with _check_controls)
        try:
            if mode == "RAG":
                LLM_repos = config['LLM_info']['LLM_repo']
                retriever_repos = config['retriever_info']['retriever_repo']
                prompts = config['prompt']

                for llm_repo in LLM_repos:
                    current_LLM_info = {**config['LLM_info'], 'LLM_repo': llm_repo}
                    for retriever_repo in retriever_repos:
                        _check_controls()
                        asyncio.run_coroutine_threadsafe(ws_manager.send_progress(
                            exp_id, stage="Retrieving", llm=llm_repo, retriever=retriever_repo
                        ), loop)
                        
                        current_retriever_info = {**config['retriever_info'], 'retriever_repo': retriever_repo}

                        with Retriever(current_retriever_info) as retriever:
                            current_retriever_info['retriever_id'] = retriever.retriever_id
                            current_retriever_info['save_path'] = retriever.save_path
                            retriever.retrieve()
                            
                        _check_controls()
                        asyncio.run_coroutine_threadsafe(ws_manager.send_progress(
                            exp_id, stage="Generating", llm=llm_repo, retriever=retriever_repo
                        ), loop)
                        
                        with LLMGenerator(current_LLM_info) as LLM:
                            LLM.generate_RAG(current_retriever_info, prompts)

            elif mode == "RET":
                retriever_repos = config['retriever_info']['retriever_repo']
                for retriever_repo in retriever_repos:
                    _check_controls()
                    asyncio.run_coroutine_threadsafe(ws_manager.send_progress(
                        exp_id, stage="Retrieving", retriever=retriever_repo
                    ), loop)
                    current_retriever_info = {**config['retriever_info'], 'retriever_repo': retriever_repo}
                    with Retriever(current_retriever_info) as retriever:
                        retriever.retrieve()

            elif mode == "LLM":
                LLM_repos = config['LLM_info']['LLM_repo']
                prompts = config['prompt']
                for llm_repo in LLM_repos:
                    _check_controls()
                    asyncio.run_coroutine_threadsafe(ws_manager.send_progress(
                        exp_id, stage="Generating", llm=llm_repo
                    ), loop)
                    current_LLM_info = {**config['LLM_info'], 'LLM_repo': llm_repo}
                    with LLMGenerator(current_LLM_info) as LLM:
                        LLM.generate_LLM(prompts)
                        
        finally:
            os.chdir(old_cwd)

        _check_controls()
        
        # 4. Evaluation
        logging.info("Starting Evaluation phase...")
        asyncio.run_coroutine_threadsafe(ws_manager.send_stage_change(exp_id, "Evaluating"), loop)
        
        os.chdir(mirage_dir)
        try:
            from LLM import LLM_Evaluator
            from retriever import Retriever_Evaluator
            from evaluation import Metrics
            import argparse
            
            # Use defaults from evaluation.py
            do_llm = mode in ["RAG", "LLM"]
            do_ret = mode in ["RAG", "RET"]
            do_met = mode == "RAG"
            
            if do_llm:
                logging.info("Evaluating LLM output...")
                evaluator = LLM_Evaluator("Inference_result/", "Evaluation_result/LLM_result.jsonl")
                evaluator.evaluate()
            
            if do_ret:
                logging.info("Evaluating Retriever output...")
                evaluator = Retriever_Evaluator("Retrieval_result/", "Evaluation_result/RET_result.jsonl")
                evaluator.evaluate()
                
            if do_met:
                logging.info("Calculating Context Metrics...")
                metrics = Metrics("Inference_result/", "Evaluation_result/Metrics.jsonl")
                metrics.evaluate()
                
        finally:
            os.chdir(old_cwd)

        # 5. Success cleanup
        logging.info("Experiment completed successfully.")
        asyncio.run_coroutine_threadsafe(ws_manager.send_completed(exp_id), loop)
        
        # Finalize in DB
        async def finalize():
            db = await get_db_connection()
            await compute_and_save_aggregates(db, exp_id)
            await update_experiment(db, exp_id, 
                                  status="completed", 
                                  completed_at=datetime.now(timezone.utc).isoformat())
            await add_activity(db, exp_id, "completed", "Run finished successfully")
            await db.close()
            
        asyncio.run_coroutine_threadsafe(finalize(), loop)

    except InterruptedError as e:
        logging.warning(str(e))
        asyncio.run_coroutine_threadsafe(ws_manager.send_error(exp_id, str(e)), loop)
        async def cancel_db():
            db = await get_db_connection()
            await update_experiment(db, exp_id, status="cancelled", error_message=str(e))
            await add_activity(db, exp_id, "cancelled", str(e))
            await db.close()
        asyncio.run_coroutine_threadsafe(cancel_db(), loop)
        
    except Exception as e:
        import traceback
        err_msg = f"Pipeline Error: {e}\n{traceback.format_exc()}"
        logging.error(err_msg)
        asyncio.run_coroutine_threadsafe(ws_manager.send_error(exp_id, str(e)), loop)
        async def fail_db():
            db = await get_db_connection()
            await update_experiment(db, exp_id, status="failed", error_message=str(e))
            await add_activity(db, exp_id, "failed", str(e))
            await db.close()
        asyncio.run_coroutine_threadsafe(fail_db(), loop)
        
    finally:
        root_logger.removeHandler(file_handler)
        root_logger.removeHandler(ws_handler)
        file_handler.close()
        ws_handler.close()
