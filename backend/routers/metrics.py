from fastapi import APIRouter
from backend.models import MetricsResponse, MetricDefinition

router = APIRouter()

METRICS = [
    MetricDefinition(
        name="Exact Match (Loose)",
        formula="EM_loose = 1 if any(ans in prediction) else 0",
        description="Checks if any of the valid answers are substrings of the model's prediction.",
        interpretation="Higher is better. Measures lenient correctness.",
        category="llm"
    ),
    MetricDefinition(
        name="Exact Match (Strict)",
        formula="EM_strict = 1 if any(ans == prediction) else 0",
        description="Checks if the model's prediction exactly matches any valid answer.",
        interpretation="Higher is better. Measures strict correctness.",
        category="llm"
    ),
    MetricDefinition(
        name="F1 Score",
        formula="F1 = 2 * (Precision * Recall) / (Precision + Recall)",
        description="Token-level harmonic mean of precision and recall between prediction and answers.",
        interpretation="Higher is better. Measures overlap of words.",
        category="llm"
    ),
    MetricDefinition(
        name="Recall@K",
        formula="Recall@K = len(Relevant_Retrieved) / len(All_Relevant)",
        description="Proportion of all relevant chunks that were successfully retrieved in the top K.",
        interpretation="Higher is better. Measures coverage.",
        category="retriever"
    ),
    MetricDefinition(
        name="Precision@K",
        formula="Precision@K = len(Relevant_Retrieved) / K",
        description="Proportion of the top K retrieved chunks that are actually relevant.",
        interpretation="Higher is better. Measures accuracy of retrieval.",
        category="retriever"
    ),
    MetricDefinition(
        name="NDCG@K",
        formula="NDCG@K = DCG / IDCG",
        description="Normalized Discounted Cumulative Gain. Accounts for the position of relevant chunks in the top K.",
        interpretation="Higher is better. Measures ranking quality.",
        category="retriever"
    ),
    MetricDefinition(
        name="Noise Vulnerability (NV)",
        formula="NV = P(Mix_Label=0 | Oracle_Label=1)",
        description="Probability that the model fails when given retrieved chunks (noise), despite succeeding with the perfect oracle chunk.",
        interpretation="Lower is better. High NV means the model is easily distracted.",
        category="context"
    ),
    MetricDefinition(
        name="Context Acceptability (CA)",
        formula="CA = P(Mix_Label=1 | Oracle_Label=1)",
        description="Probability that the model succeeds with retrieved chunks, given it also succeeds with the oracle chunk.",
        interpretation="Higher is better. High CA means the model uses retrieved context effectively.",
        category="context"
    ),
    MetricDefinition(
        name="Context Insensitivity (CI)",
        formula="CI = P(Base_Label=0 | Oracle_Label=0)",
        description="Model fails without context, and still fails even with perfect oracle context.",
        interpretation="Lower is better. High CI implies the model cannot be helped by context.",
        category="context"
    ),
    MetricDefinition(
        name="Context Misinterpretation (CM)",
        formula="CM = P(Base_Label=1 | Oracle_Label=0)",
        description="Model succeeds without context, but fails when given perfect oracle context.",
        interpretation="Lower is better. High CM means the model is actively confused by good context.",
        category="context"
    ),
]

@router.get("/metrics", response_model=MetricsResponse)
async def get_metrics():
    """Returns static metric definitions for the metrics dictionary page."""
    return MetricsResponse(items=METRICS)
