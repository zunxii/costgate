from decimal import Decimal

from app.domain.enums import ConfidenceLevel, CostDirection, ScanType
from app.domain.models import (
    AnalysisResult,
    ChangedQuery,
    CostEstimate,
    PlanComparison,
    PlanMetrics,
)
from app.github.comment_renderer import CostGateCommentRenderer


def _plan(
    *,
    scan_type: ScanType,
    index_used: bool,
    execution_time_ms: float,
    rows_returned: int,
    shared_hit_blocks: int,
    estimated_plan_cost: float,
) -> PlanMetrics:
    return PlanMetrics(
        scan_type=scan_type,
        index_used=index_used,
        index_name="idx_orders_customer_id" if index_used else None,
        rows_returned=rows_returned,
        execution_time_ms=execution_time_ms,
        planning_time_ms=0.1,
        shared_hit_blocks=shared_hit_blocks,
        shared_read_blocks=0,
        shared_dirtied_blocks=0,
        shared_written_blocks=0,
        estimated_plan_cost=estimated_plan_cost,
        raw_plan={},
    )


def test_render_costgate_comment():
    baseline = _plan(
        scan_type=ScanType.INDEX_SCAN,
        index_used=True,
        execution_time_ms=0.100,
        rows_returned=6,
        shared_hit_blocks=9,
        estimated_plan_cost=31.45,
    )

    candidate = _plan(
        scan_type=ScanType.SEQ_SCAN,
        index_used=False,
        execution_time_ms=14.643,
        rows_returned=6,
        shared_hit_blocks=2500,
        estimated_plan_cost=5706.58,
    )

    comparison = PlanComparison(
        baseline=baseline,
        candidate=candidate,
        execution_time_delta_ms=14.543,
        execution_time_ratio=146.43,
        shared_blocks_delta=2491,
        index_usage_changed=True,
        scan_type_changed=True,
    )

    cost = CostEstimate(
        monthly_delta=Decimal("0.1616"),
        lower_bound=Decimal("0.1293"),
        upper_bound=Decimal("0.1939"),
        confidence=ConfidenceLevel.HIGH,
        direction=CostDirection.INCREASE,
        assumptions={
            "monthly_requests": 1_000_000,
            "db_instance_hourly_cost_usd": "0.04",
        },
    )

    result = AnalysisResult(
        query=ChangedQuery(
            baseline_sql=(
                "SELECT * FROM orders "
                "WHERE customer_id = 12345;"
            ),
            candidate_sql=(
                "SELECT * FROM orders "
                "WHERE customer_id::text = '12345';"
            ),
            file_path="db/experiments/customer_lookup.sql",
        ),
        baseline=baseline,
        candidate=candidate,
        comparison=comparison,
        cost_estimate=cost,
    )

    comment = CostGateCommentRenderer().render(result)

    assert "Estimated monthly infrastructure impact" in comment
    assert "$0.16" in comment
    assert "Index" in comment
    assert "Seq Scan" in comment
    assert "customer_id::text = '12345'" in comment
    assert "not an AWS invoice prediction" in comment