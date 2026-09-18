from __future__ import annotations

from app.domain.enums import ConfidenceLevel
from app.domain.models import PlanComparison


def determine_confidence(
    comparison: PlanComparison,
) -> ConfidenceLevel:
    """
    Determine confidence in a cost-impact estimate based on
    observable query-plan evidence.

    This is an evidence-strength score, not a statistical
    confidence interval.
    """

    score = 0

    # Strong evidence: query plan changed.
    if comparison.scan_type_changed:
        score += 2

    # Strong evidence: index usage changed.
    if comparison.index_usage_changed:
        score += 2

    # Strong evidence: meaningful execution-time difference.
    baseline_time = comparison.baseline.execution_time_ms
    candidate_time = comparison.candidate.execution_time_ms

    if baseline_time > 0 and candidate_time > 0:
        slower_ratio = max(
            baseline_time / candidate_time,
            candidate_time / baseline_time,
        )

        if slower_ratio >= 10:
            score += 2
        elif slower_ratio >= 2:
            score += 1

    # Supporting evidence: shared block usage changed substantially.
    baseline_blocks = (
        comparison.baseline.shared_hit_blocks
        + comparison.baseline.shared_read_blocks
    )

    candidate_blocks = (
        comparison.candidate.shared_hit_blocks
        + comparison.candidate.shared_read_blocks
    )

    if baseline_blocks > 0:
        block_ratio = max(
            baseline_blocks / max(candidate_blocks, 1),
            candidate_blocks / max(baseline_blocks, 1),
        )

        if block_ratio >= 10:
            score += 2
        elif block_ratio >= 2:
            score += 1

    if score >= 5:
        return ConfidenceLevel.HIGH

    if score >= 2:
        return ConfidenceLevel.MEDIUM

    return ConfidenceLevel.LOW