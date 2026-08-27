"""
Pydantic models for API request/response schemas.
"""

from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


# ─── Experiment ──────────────────────────────────────────────────────

class ExperimentCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    mode: str = Field(..., pattern="^(RAG|LLM|RET)$")
    llms: list[str] = Field(default_factory=list)
    retrievers: list[str] = Field(default_factory=list)
    temperature: float = Field(default=0.1, ge=0, le=2)
    top_p: float = Field(default=0.1, ge=0, le=1)
    max_tokens: int = Field(default=256, ge=1, le=4096)
    top_k: int = Field(default=5, ge=1, le=20)
    use_cuda: bool = Field(default=False)
    prompts: Optional[dict] = None
    output_dir: Optional[str] = None


class ExperimentResponse(BaseModel):
    id: str
    name: str
    mode: str
    config: dict = {}
    status: str = "queued"
    progress: dict = {}
    created_at: Optional[str] = None
    started_at: Optional[str] = None
    completed_at: Optional[str] = None
    error_message: Optional[str] = None
    result_files: list[str] = []
    aggregates: Optional[dict] = None


class ExperimentListResponse(BaseModel):
    items: list[ExperimentResponse]
    total: int
    page: int
    per_page: int


class ExperimentRunResponse(BaseModel):
    id: str
    message: str = "Experiment queued successfully"


# ─── Dashboard ───────────────────────────────────────────────────────

class DashboardStats(BaseModel):
    total: int = 0
    queued: int = 0
    running: int = 0
    completed: int = 0
    failed: int = 0
    cancelled: int = 0


class DashboardResponse(BaseModel):
    stats: DashboardStats
    available_llms: list[str] = []
    available_retrievers: list[str] = []
    latest_experiment: Optional[ExperimentResponse] = None
    recent_activity: list[dict] = []
    chart_data: dict = {}


# ─── Leaderboard ─────────────────────────────────────────────────────

class LeaderboardEntry(BaseModel):
    rank: int
    name: str
    retriever_name: Optional[str] = None
    llm_name: Optional[str] = None
    mode: Optional[str] = None
    f1_score: float = 0
    em_loose: float = 0
    em_strict: float = 0
    noise_vulnerability: Optional[float] = None
    context_acceptability: Optional[float] = None
    context_insensitivity: Optional[float] = None
    context_misinterpretation: Optional[float] = None
    total_score: Optional[float] = None


class LeaderboardResponse(BaseModel):
    items: list[LeaderboardEntry]
    total: int
    type: str  # "llm" | "retriever" | "pair"


# ─── Retriever Analysis ─────────────────────────────────────────────

class RetrieverMetricsAtK(BaseModel):
    F1: float = 0
    NDCG: float = 0
    precision: float = 0
    recall: float = 0


class RetrieverAnalysisResponse(BaseModel):
    retriever_name: str
    metrics_at_k: dict[str, RetrieverMetricsAtK] = {}
    sample_chunks: list[dict] = []


# ─── LLM Analysis ───────────────────────────────────────────────────

class LLMAnalysisResponse(BaseModel):
    llm_name: str
    per_mode: dict[str, dict] = {}
    per_retriever: list[dict] = []


# ─── Query Explorer ──────────────────────────────────────────────────

class QuerySummary(BaseModel):
    query_id: str
    query: str
    source: str = ""
    answer: list[str] = []
    has_eval: bool = False


class QueryListResponse(BaseModel):
    items: list[QuerySummary]
    total: int
    page: int
    per_page: int


class QueryDetailResponse(BaseModel):
    query_id: str
    query: str
    source: str = ""
    answer: list[str] = []
    doc_name: str = ""
    retrieved_chunks: Optional[list[dict]] = None
    oracle_chunk: Optional[dict] = None
    prompts: Optional[dict] = None
    responses: Optional[dict] = None
    eval_labels: Optional[dict] = None
    context_metrics: Optional[dict] = None


# ─── Results ─────────────────────────────────────────────────────────

class ResultResponse(BaseModel):
    experiment_id: str
    metrics_summary: dict = {}
    label_counts: dict = {}
    per_llm: list[dict] = []
    per_retriever: list[dict] = []


# ─── Metrics Reference ──────────────────────────────────────────────

class MetricDefinition(BaseModel):
    name: str
    formula: str
    description: str
    interpretation: str
    category: str  # "llm" | "retriever" | "context"


class MetricsResponse(BaseModel):
    items: list[MetricDefinition]


# ─── Settings ────────────────────────────────────────────────────────

class SettingsResponse(BaseModel):
    config: dict = {}
    prompt_templates: dict = {}
    api_keys: dict = {}  # masked values only


class SettingsUpdate(BaseModel):
    config: Optional[dict] = None
    prompt_templates: Optional[dict] = None
    api_keys: Optional[dict] = None


# ─── Logs ────────────────────────────────────────────────────────────

class LogsResponse(BaseModel):
    experiment_id: str
    lines: list[str] = []


# ─── Generic ─────────────────────────────────────────────────────────

class StatusResponse(BaseModel):
    status: str
    message: str = ""
