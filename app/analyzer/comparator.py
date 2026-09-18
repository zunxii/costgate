from __future__ import annotations

from app.domain.models import PlanComparison, PlanMetrics


def compare_plans(
    baseline: PlanMetrics,
    candidate: PlanMetrics,
) -> PlanComparison:
    """
    Compare two PostgreSQL execution plans.

    Definitions:
    - execution_time_delta_ms:
        candidate - baseline.
        Positive means the candidate became slower.
        Negative means the candidate became faster.

    - execution_time_ratio:
        baseline / candidate.
        A value > 1 means the baseline took longer than the candidate.
        Example: 100ms -> 10ms = 10x improvement.

    - shared_blocks_delta:
        candidate_total_blocks - baseline_total_blocks.
        Negative means the candidate touched fewer shared blocks.
    """

    execution_time_delta_ms = (
        candidate.execution_time_ms - baseline.execution_time_ms
    )

    if candidate.execution_time_ms > 0:
        execution_time_ratio = (
            baseline.execution_time_ms / candidate.execution_time_ms
        )
    else:
        execution_time_ratio = float("inf")

    baseline_shared_blocks = (
        baseline.shared_hit_blocks + baseline.shared_read_blocks
    )

    candidate_shared_blocks = (
        candidate.shared_hit_blocks + candidate.shared_read_blocks
    )

    shared_blocks_delta = candidate_shared_blocks - baseline_shared_blocks

    return PlanComparison(
        baseline=baseline,
        candidate=candidate,
        execution_time_delta_ms=execution_time_delta_ms,
        execution_time_ratio=execution_time_ratio,
        shared_blocks_delta=shared_blocks_delta,
        index_usage_changed=(
            baseline.index_used != candidate.index_used
        ),
        scan_type_changed=(
            baseline.scan_type != candidate.scan_type
        ),
    )