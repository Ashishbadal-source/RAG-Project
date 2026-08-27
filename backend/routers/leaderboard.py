from fastapi import APIRouter, Query
import json
import os
from backend.models import LeaderboardResponse, LeaderboardEntry
from backend.config import get_settings

router = APIRouter()
settings = get_settings()

@router.get("/leaderboard", response_model=LeaderboardResponse)
async def get_leaderboard(
    type: str = Query(..., description="llm | retriever | pair"),
    sort_by: str = Query("total_score", description="Metric to sort by"),
    order: str = Query("desc", description="asc | desc"),
    page: int = 1,
    per_page: int = 50
):
    """Get the leaderboard data."""
    entries = []
    
    if type == "llm" or type == "pair":
        llm_file = settings.abs_evaluation_dir / "LLM_result.jsonl"
        metrics_file = settings.abs_evaluation_dir / "Metrics.jsonl"
        
        # Load metrics context scores to merge
        context_scores = {}
        if os.path.exists(metrics_file):
            with open(metrics_file, "r", encoding="utf-8") as f:
                for line in f:
                    try:
                        data = json.loads(line)
                        key = f"{data.get('LLM_name')}_{data.get('Retriever_name')}_{data.get('Given_shot')}"
                        context_scores[key] = data.get("Scores", {})
                    except:
                        pass
        
        if os.path.exists(llm_file):
            with open(llm_file, "r", encoding="utf-8") as f:
                for line in f:
                    try:
                        data = json.loads(line)
                        llm_name = data.get("LLM_name")
                        retriever_name = data.get("Retriever_name")
                        mode = data.get("Given_shot")
                        
                        if type == "llm" and mode in ["base", "oracle"]:
                            # Standard LLM entry
                            pass
                        elif type == "pair" and mode == "top5":
                            # Pair entry
                            pass
                        else:
                            continue
                            
                        # Look up context scores if applicable
                        key = f"{llm_name}_{retriever_name}_{mode}"
                        c_scores = context_scores.get(key, {})
                        
                        nv = c_scores.get("noise_vulnerability", 0)
                        ca = c_scores.get("context_acceptibility", 0)
                        ci = c_scores.get("context_insensitivity", 0)
                        cm = c_scores.get("context_misinterpretation", 0)
                        
                        # Total score formula from evaluation.py
                        total_score = -nv + ca - ci - cm
                        
                        entries.append(LeaderboardEntry(
                            rank=0, # Computed later after sorting
                            name=f"{llm_name} + {retriever_name}" if retriever_name else llm_name,
                            retriever_name=retriever_name,
                            llm_name=llm_name,
                            mode=mode,
                            f1_score=float(data.get("F1_score", 0)),
                            em_loose=float(data.get("EM_loose", 0)),
                            em_strict=float(data.get("EM_strict", 0)),
                            noise_vulnerability=nv if c_scores else None,
                            context_acceptability=ca if c_scores else None,
                            context_insensitivity=ci if c_scores else None,
                            context_misinterpretation=cm if c_scores else None,
                            total_score=total_score if c_scores else float(data.get("F1_score", 0))
                        ))
                    except:
                        continue
                        
    elif type == "retriever":
        ret_file = settings.abs_evaluation_dir / "RET_result.jsonl"
        if os.path.exists(ret_file):
            with open(ret_file, "r", encoding="utf-8") as f:
                for line in f:
                    try:
                        data = json.loads(line)
                        ret_name = data.get("Retriever_name")
                        avg_res = data.get("Average_results", {})
                        
                        # We use top 5 for the main leaderboard rank
                        top5 = avg_res.get("5", {})
                        f1 = float(top5.get("F1", 0))
                        
                        entries.append(LeaderboardEntry(
                            rank=0,
                            name=ret_name,
                            retriever_name=ret_name,
                            f1_score=f1,
                            # We hijack em_loose/em_strict to show NDCG/Recall on the frontend
                            em_loose=float(top5.get("NDCG", 0)), 
                            em_strict=float(top5.get("recall", 0)),
                            total_score=f1
                        ))
                    except:
                        continue
                        
    # Sort
    reverse = order.lower() == "desc"
    # Ensure sort_by exists as attribute
    def get_sort_key(e):
        val = getattr(e, sort_by, 0)
        return val if val is not None else 0
        
    entries.sort(key=get_sort_key, reverse=reverse)
    
    # Assign ranks
    for i, entry in enumerate(entries):
        entry.rank = i + 1
        
    # Paginate
    total = len(entries)
    start = (page - 1) * per_page
    end = start + per_page
    paginated = entries[start:end]
    
    return LeaderboardResponse(
        items=paginated,
        total=total,
        type=type
    )
