from fastapi import APIRouter, Query, HTTPException
import json
import os
from typing import Optional
from backend.models import QueryListResponse, QuerySummary, QueryDetailResponse
from backend.config import get_settings

router = APIRouter()
settings = get_settings()

@router.get("/queries", response_model=QueryListResponse)
async def list_queries(
    experiment_id: Optional[str] = None, # If none, grab default from latest available
    page: int = 1,
    per_page: int = 50,
    search: Optional[str] = None
):
    """List paginated queries. To save memory, reads a representative file (e.g., base evaluation)."""
    # Find a file to read queries from. Preferably an evaluation file.
    # Usually LLM_base_eval.json has the questions and answers.
    target_file = None
    if os.path.exists(settings.abs_inference_dir):
        for f in os.listdir(settings.abs_inference_dir):
            if f.endswith("_base_eval.json"):
                target_file = settings.abs_inference_dir / f
                break
                
    if not target_file:
        return QueryListResponse(items=[], total=0, page=page, per_page=per_page)
        
    items = []
    try:
        with open(target_file, "r", encoding="utf-8") as f:
            data = json.load(f)
            
            # Filter
            if search:
                search_lower = search.lower()
                data = [d for d in data if search_lower in d.get("query", "").lower()]
                
            total = len(data)
            
            # Paginate
            start = (page - 1) * per_page
            end = start + per_page
            page_data = data[start:end]
            
            for item in page_data:
                # Answer might be stringified list in some legacy formats
                ans = item.get("answer", [])
                if isinstance(ans, str):
                    try:
                        import ast
                        ans = ast.literal_eval(ans)
                    except:
                        ans = [ans]
                        
                items.append(QuerySummary(
                    query_id=item.get("query_id", ""),
                    query=item.get("query", ""),
                    source=item.get("source", ""),
                    answer=ans,
                    has_eval="EM_label" in item
                ))
                
        return QueryListResponse(items=items, total=total, page=page, per_page=per_page)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load queries: {e}")


@router.get("/queries/{query_id}", response_model=QueryDetailResponse)
async def get_query_detail(
    query_id: str,
    sections: str = Query("chunks,prompts,responses", description="Comma separated list of lazy sections to load")
):
    """Get full details for a single query across all evaluation files."""
    sections_list = sections.split(",")
    
    # We must scan files to find the query and its corresponding data.
    # Base info
    detail = QueryDetailResponse(query_id=query_id, query="Not found")
    
    # We need to find the base item first
    found = False
    for f in os.listdir(settings.abs_inference_dir):
        if f.endswith("_base_eval.json"):
             with open(settings.abs_inference_dir / f, "r", encoding="utf-8") as file:
                 try:
                     data = json.load(file)
                     for item in data:
                         if item.get("query_id") == query_id:
                             detail.query = item.get("query", "")
                             detail.source = item.get("source", "")
                             detail.doc_name = item.get("doc_name", "")
                             
                             ans = item.get("answer", [])
                             if isinstance(ans, str):
                                 import ast
                                 ans = ast.literal_eval(ans)
                             detail.answer = ans
                             found = True
                             break
                 except:
                     pass
        if found: break
        
    if not found:
        raise HTTPException(status_code=404, detail="Query not found")
        
    # If sections include chunks, look in Retrieval_result
    if "chunks" in sections_list:
        detail.retrieved_chunks = []
        for f in os.listdir(settings.abs_retrieval_dir):
            if f.endswith("_top5.json"):
                retriever = f.replace("_top5.json", "")
                with open(settings.abs_retrieval_dir / f, "r", encoding="utf-8") as file:
                    try:
                        ret_data = json.load(file)
                        for item in ret_data:
                            if item.get("query_id") == query_id:
                                chunks = [{"doc_chunk": c.get("doc_chunk", ""), "score": s, "retriever": retriever} 
                                           for c, s in zip(item.get("top_chunks", []), item.get("scores", []))]
                                detail.retrieved_chunks.extend(chunks)
                                break
                    except:
                        pass
                        
    # If sections include responses or prompts, look in Inference_result
    if "responses" in sections_list:
        detail.responses = {}
        detail.eval_labels = {}
        for f in os.listdir(settings.abs_inference_dir):
            if f.endswith(".json") and not f.endswith("_eval.json"):
                # Non-eval file might have raw prompts if modified, but usually responses
                pass
            if f.endswith("_eval.json"):
                # Eval files have responses and labels
                mode_key = f.replace(".json", "") # e.g. gpt-4o_bge-small-en-v1.5_top5_eval
                with open(settings.abs_inference_dir / f, "r", encoding="utf-8") as file:
                    try:
                        data = json.load(file)
                        for item in data:
                            if item.get("query_id") == query_id:
                                preds = item.get("model_predictions", [])
                                if isinstance(preds, str): preds = [preds]
                                detail.responses[mode_key] = preds[0] if preds else ""
                                detail.eval_labels[mode_key] = {
                                    "em_loose": item.get("EM_label", 0),
                                    "em_strict": item.get("EM_strict", 0)
                                }
                                break
                    except:
                        pass
                        
    # Note: the existing python modules do not save the raw prompts to disk by default.
    # They only save 'model_predictions'. To support "prompts" section properly, 
    # LLMGenerator would need to be modified to save the prompt. 
    # For now, we omit it or return empty.
    
    return detail
