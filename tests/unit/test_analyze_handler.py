from decimal import Decimal

import app.handlers.analyze as analyze_handler
from app.domain.enums import ConfidenceLevel, CostDirection, ScanType
from app.domain.models import CostEstimate, PlanMetrics


class FakeAnalysisService:
    def __init__(self, *, analyzer, assumptions, pricing):
        self.analyzer = analyzer
        self.assumptions = assumptions
        self.pricing = pricing

    def analyze(self, changed_query):
        assert changed_query.baseline_sql == (
            "SELECT * FROM orders WHERE customer_id = 12345;"
        )
        assert changed_query.candidate_sql == (
            "SELECT * FROM orders WHERE customer_id::text = '12345';"
        )
        assert changed_query.file_path == (
            "db/experiments/customer_lookup.sql"
        )

        baseline = PlanMetrics(
            scan_type=ScanType.INDEX_SCAN,
            index_used=True,
            index_name="idx_orders_customer_id",
            rows_returned=6,
            execution_time_ms=0.1,
            planning_time_ms=0.1,
            shared_hit_blocks=5,
            shared_read_blocks=0,
            shared_dirtied_blocks=0,
            shared_written_blocks=0,
            estimated_plan_cost=10.0,
            raw_plan={},
        )

        candidate = PlanMetrics(
            scan_type=ScanType.SEQ_SCAN,
            index_used=False,
            index_name=None,
            rows_returned=6,
            execution_time_ms=15.0,
            planning_time_ms=0.1,
            shared_hit_blocks=2500,
            shared_read_blocks=0,
            shared_dirtied_blocks=0,
            shared_written_blocks=0,
            estimated_plan_cost=5000.0,
            raw_plan={},
        )

        return type(
            "FakeResult",
            (),
            {
                "cost_estimate": CostEstimate(
                    monthly_delta=Decimal("12.34"),
                    lower_bound=Decimal("9.87"),
                    upper_bound=Decimal("14.81"),
                    confidence=ConfidenceLevel.HIGH,
                    direction=CostDirection.INCREASE,
                    assumptions={"monthly_requests": 1_000_000},
                ),
                "baseline": baseline,
                "candidate": candidate,
            },
        )()


class FakeRenderer:
    def render(self, result):
        assert result.cost_estimate.monthly_delta == Decimal("12.34")
        return "## CostGate\n\nEstimated impact: **+$12.34/month**"


def test_analyze_lambda_handler(monkeypatch):
    monkeypatch.setenv(
        "COSTGATE_MONTHLY_REQUESTS",
        "1000000",
    )
    monkeypatch.setenv(
        "RDS_INSTANCE_HOURLY_USD",
        "0.04",
    )
    monkeypatch.setenv(
        "RDS_REGION",
        "eu-north-1",
    )
    monkeypatch.setenv(
        "RDS_ENGINE",
        "postgres",
    )
    monkeypatch.setenv(
        "RDS_INSTANCE_CLASS",
        "db.t4g.small",
    )
    monkeypatch.setenv(
        "RDS_RESOURCE_ID",
        "costgate-db",
    )

    monkeypatch.setattr(
        analyze_handler,
        "QueryAnalyzer",
        lambda: object(),
    )

    monkeypatch.setattr(
        analyze_handler,
        "AnalysisService",
        FakeAnalysisService,
    )

    monkeypatch.setattr(
        analyze_handler,
        "CostGateCommentRenderer",
        FakeRenderer,
    )

    monkeypatch.setattr(
        analyze_handler,
        "get_rds_pricing",
        lambda **kwargs: object(),
    )

    response = analyze_handler.lambda_handler(
        {
            "baseline_sql": (
                "SELECT * FROM orders WHERE customer_id = 12345;"
            ),
            "candidate_sql": (
                "SELECT * FROM orders "
                "WHERE customer_id::text = '12345';"
            ),
            "file_path": "db/experiments/customer_lookup.sql",
        },
        None,
    )

    assert response["status"] == "success"
    assert response["comment_body"] == (
        "## CostGate\n\nEstimated impact: **+$12.34/month**"
    )
    assert response["monthly_delta"] == "12.34"
    assert response["lower_bound"] == "9.87"
    assert response["upper_bound"] == "14.81"
    assert response["confidence"] == "high"
    assert response["direction"] == "increase"
    assert response["baseline_execution_ms"] == 0.1
    assert response["candidate_execution_ms"] == 15.0
    assert response["baseline_rows"] == 6
    assert response["candidate_rows"] == 6
    assert response["baseline_scan_type"] == "Index Scan"
    assert response["candidate_scan_type"] == "Seq Scan"
    assert response["resource_id"] == "costgate-db"