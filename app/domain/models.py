from dataclasses import dataclass, field
from decimal import Decimal
from typing import Any

from .enums import ConfidenceLevel, CostDirection, ScanType


@dataclass(frozen=True)
class QueryCandidate:
    """
    A SQL query identified for analysis.
    """

    sql: str
    file_path: str | None = None
    source: str = "unknown"


@dataclass(frozen=True)
class PlanMetrics:
    """
    Structured metrics extracted from PostgreSQL EXPLAIN ANALYZE JSON.
    """

    scan_type: ScanType
    index_used: bool
    index_name: str | None

    rows_returned: int
    execution_time_ms: float
    planning_time_ms: float

    shared_hit_blocks: int
    shared_read_blocks: int
    shared_dirtied_blocks: int
    shared_written_blocks: int

    estimated_plan_cost: float

    raw_plan: dict[str, Any] = field(repr=False)


@dataclass(frozen=True)
class PlanComparison:
    """
    Comparison between a baseline query plan and a changed query plan.
    """

    baseline: PlanMetrics
    candidate: PlanMetrics

    execution_time_delta_ms: float
    execution_time_ratio: float

    shared_blocks_delta: int
    index_usage_changed: bool
    scan_type_changed: bool


@dataclass(frozen=True)
class CostEstimate:
    """
    Estimated monthly infrastructure impact.
    """

    monthly_delta: Decimal
    lower_bound: Decimal
    upper_bound: Decimal

    confidence: ConfidenceLevel
    direction: CostDirection

    assumptions: dict[str, Any] = field(default_factory=dict)


@dataclass(frozen=True)
class ChangedQuery:
    """
    A SQL statement that changed between the baseline and candidate
    versions of a file.
    """

    baseline_sql: str
    candidate_sql: str
    file_path: str


@dataclass(frozen=True)
class AnalysisResult:
    """
    Complete analysis of one changed SQL statement.
    """

    query: ChangedQuery
    baseline: PlanMetrics
    candidate: PlanMetrics
    comparison: PlanComparison
    cost_estimate: CostEstimate