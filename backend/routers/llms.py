from fastapi import APIRouter
import json
import os
from backend.models import LLMAnalysisResponse
from backend.config import get_settings

router = APIRouter()
settings = get_settings()

@router.get("/llms")
async def list_llms():
    """List LLMs that have generated results."""
    llm_result_file = settings.abs_evaluation_dir / "LLM_result.jsonl"
    llms = set()
    
    if os.path.exists(llm_result_file):
        with open(llm_result_file, "r", encoding="utf-8") as f:
            for line in f:
                try:
                    data = json.loads(line)
                    if data.get("LLM_name"):
                        llms.add(data["LLM_name"])
                except:
                    pass
                    
    return {"items": [{"id": l, "name": l} for l in sorted(list(llms))]}


@router.get("/llms/{llm_id}/analysis", response_model=LLMAnalysisResponse)
async def get_llm_analysis(llm_id: str):
    """Get analysis metrics for a specific LLM."""
    llm_result_file = settings.abs_evaluation_dir / "LLM_result.jsonl"
    
    per_mode = {"base": {}, "oracle": {}, "top5": {}}
    per_retriever = []
    
    if os.path.exists(llm_result_file):
        with open(llm_result_file, "r", encoding="utf-8") as f:
            for line in f:
                try:
                    data = json.loads(line)
                    if data.get("LLM_name") == llm_id:
                        shot = data.get("Given_shot")
                        retriever = data.get("Retriever_name")
                        
                        if shot in ["base", "oracle"]:
                            per_mode[shot] = {
                                "em_loose": float(data.get("EM_loose", 0)),
                                "em_strict": float(data.get("EM_strict", 0)),
                                "f1": float(data.get("F1_score", 0)),
                            }
                        elif shot == "top5":
                            if retriever:
                                per_retriever.append({
                                    "retriever": retriever,
                                    "em_loose": float(data.get("EM_loose", 0)),
                                    "em_strict": float(data.get("EM_strict", 0)),
                                    "f1": float(data.get("F1_score", 0)),
                                })
                except:
                    continue
                    
    # Calculate average for top5 mode across all retrievers
    if per_retriever:
        avg_em_loose = sum(r["em_loose"] for r in per_retriever) / len(per_retriever)
        avg_em_strict = sum(r["em_strict"] for r in per_retriever) / len(per_retriever)
        avg_f1 = sum(r["f1"] for r in per_retriever) / len(per_retriever)
        per_mode["top5"] = {
            "em_loose": round(avg_em_loose, 5),
            "em_strict": round(avg_em_strict, 5),
            "f1": round(avg_f1, 5)
        }
        
    return LLMAnalysisResponse(
        llm_name=llm_id,
        per_mode=per_mode,
        per_retriever=per_retriever
    )
