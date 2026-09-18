from decimal import Decimal

import app.handlers.analyze as analyze_handler
from app.domain.enums import ConfidenceLevel, CostDirection
from app.domain.models import CostEstimate


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
                )
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
    assert response["confidence"] == "high"
    assert response["direction"] == "increase"