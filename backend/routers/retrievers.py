from fastapi import APIRouter, HTTPException
import json
import os
from backend.models import RetrieverAnalysisResponse, RetrieverMetricsAtK
from backend.config import get_settings

router = APIRouter()
settings = get_settings()

@router.get("/retrievers")
async def list_retrievers():
    """List retrievers that have generated results."""
    ret_result_file = settings.abs_evaluation_dir / "RET_result.jsonl"
    retrievers = set()
    
    if os.path.exists(ret_result_file):
        with open(ret_result_file, "r", encoding="utf-8") as f:
            for line in f:
                try:
                    data = json.loads(line)
                    if data.get("Retriever_name"):
                        retrievers.add(data["Retriever_name"])
                except:
                    pass
                    
    return {"items": [{"id": r, "name": r} for r in sorted(list(retrievers))]}


@router.get("/retrievers/{retriever_id}/analysis", response_model=RetrieverAnalysisResponse)
async def get_retriever_analysis(retriever_id: str):
    """Get analysis metrics and sample chunks for a specific retriever."""
    ret_result_file = settings.abs_evaluation_dir / "RET_result.jsonl"
    metrics_at_k = {}
    
    # Extract overall metrics
    if os.path.exists(ret_result_file):
        with open(ret_result_file, "r", encoding="utf-8") as f:
            for line in f:
                try:
                    data = json.loads(line)
                    if data.get("Retriever_name") == retriever_id:
                        for k, vals in data.get("Average_results", {}).items():
                            metrics_at_k[str(k)] = RetrieverMetricsAtK(
                                F1=float(vals.get("F1", 0)),
                                NDCG=float(vals.get("NDCG", 0)),
                                precision=float(vals.get("precision", 0)),
                                recall=float(vals.get("recall", 0))
                            )
                        break
                except:
                    continue
                    
    # Extract sample chunks
    sample_chunks = []
    chunk_file = settings.abs_retrieval_dir / f"{retriever_id}_top5.json"
    if os.path.exists(chunk_file):
        with open(chunk_file, "r", encoding="utf-8") as f:
            try:
                ret_data = json.load(f)
                for item in ret_data[:10]: # Just first 10 for sample
                    sample_chunks.append({
                        "query_id": item.get("query_id"),
                        "chunks": [{"doc_chunk": c.get("doc_chunk", ""), "score": s} 
                                   for c, s in zip(item.get("top_chunks", []), item.get("scores", []))]
                    })
            except Exception:
                pass

    return RetrieverAnalysisResponse(
        retriever_name=retriever_id,
        metrics_at_k=metrics_at_k,
        sample_chunks=sample_chunks
    )
