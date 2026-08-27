import json
import os
import aiosqlite
from backend.config import get_settings
from backend.database import update_experiment

settings = get_settings()

async def compute_and_save_aggregates(db: aiosqlite.Connection, experiment_id: str):
    """
    Called after an experiment completes to precompute all data needed for the dashboard.
    Reads from the recently generated Evaluation_result files and saves to an aggregates JSON.
    """
    aggregates = {
        "summary": {},
        "per_llm": [],
        "per_retriever": [],
        "per_pair": [],
        "chart_data": {}
    }
    
    metrics_file = settings.abs_evaluation_dir / "Metrics.jsonl"
    llm_file = settings.abs_evaluation_dir / "LLM_result.jsonl"
    ret_file = settings.abs_evaluation_dir / "RET_result.jsonl"
    
    # 1. Gather all pairs and per-LLM stats
    if os.path.exists(llm_file):
        with open(llm_file, "r", encoding="utf-8") as f:
            for line in f:
                try:
                    data = json.loads(line)
                    mode = data.get("Given_shot")
                    if mode == "top5":
                        aggregates["per_pair"].append({
                            "llm": data.get("LLM_name"),
                            "retriever": data.get("Retriever_name"),
                            "f1": float(data.get("F1_score", 0)),
                            "em_loose": float(data.get("EM_loose", 0))
                        })
                    elif mode == "base": # Just keep base for simple per_llm
                        aggregates["per_llm"].append({
                            "llm": data.get("LLM_name"),
                            "em_loose": float(data.get("EM_loose", 0))
                        })
                except:
                    pass
                    
    # 2. Gather context metrics and compute summary averages
    nv_sum, ca_sum, ci_sum, cm_sum = 0, 0, 0, 0
    count = 0
    if os.path.exists(metrics_file):
        with open(metrics_file, "r", encoding="utf-8") as f:
            for line in f:
                try:
                    data = json.loads(line)
                    scores = data.get("Scores", {})
                    nv_sum += float(scores.get("noise_vulnerability", 0))
                    ca_sum += float(scores.get("context_acceptibility", 0))
                    ci_sum += float(scores.get("context_insensitivity", 0))
                    cm_sum += float(scores.get("context_misinterpretation", 0))
                    count += 1
                except:
                    pass
    
    f1_sum, em_sum = 0, 0
    pair_count = len(aggregates["per_pair"])
    for p in aggregates["per_pair"]:
        f1_sum += p["f1"]
        em_sum += p["em_loose"]
        
    aggregates["summary"] = {
        "avg_em_loose": round(em_sum / pair_count, 4) if pair_count else 0,
        "avg_f1": round(f1_sum / pair_count, 4) if pair_count else 0,
        "avg_nv": round(nv_sum / count, 4) if count else 0,
        "avg_ca": round(ca_sum / count, 4) if count else 0,
        "avg_ci": round(ci_sum / count, 4) if count else 0,
        "avg_cm": round(cm_sum / count, 4) if count else 0,
    }
    
    # 3. Gather retriever stats
    if os.path.exists(ret_file):
        with open(ret_file, "r", encoding="utf-8") as f:
            for line in f:
                try:
                    data = json.loads(line)
                    top5 = data.get("Average_results", {}).get("5", {})
                    aggregates["per_retriever"].append({
                        "retriever": data.get("Retriever_name"),
                        "recall_at_5": float(top5.get("recall", 0))
                    })
                except:
                    pass
                    
    # 4. Generate Chart Data
    aggregates["chart_data"] = {
        "context_metrics": [
            {"name": "NV", "value": aggregates["summary"]["avg_nv"]},
            {"name": "CA", "value": aggregates["summary"]["avg_ca"]},
            {"name": "CI", "value": aggregates["summary"]["avg_ci"]},
            {"name": "CM", "value": aggregates["summary"]["avg_cm"]},
        ]
    }
    
    # Save to file
    out_file = settings.abs_evaluation_dir / f"{experiment_id}_aggregates.json"
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(aggregates, f, indent=4)
        
    # Update SQLite
    await update_experiment(db, experiment_id, aggregates=aggregates)
