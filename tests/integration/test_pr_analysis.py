import pytest

from app.analyzer.query_analyzer import QueryAnalyzer
from app.cost_engine.assumptions import CostAssumptions
from app.cost_engine.pricing import get_rds_pricing
from app.github.pr_reader import PullRequestReader
from app.pipeline.analysis_service import AnalysisService
from app.pipeline.pr_analysis_service import PullRequestAnalysisService


@pytest.mark.integration
def test_costgate_analyzes_github_pr():
    analyzer = QueryAnalyzer()

    assumptions = CostAssumptions(
        monthly_requests=1_000_000,
        db_instance_hourly_cost_usd=0.04,
    )

    pricing = get_rds_pricing(
        region="eu-north-1",
        engine="postgres",
        instance_class="db.t4g.small",
        db_instance_hourly_usd=0.04,
    )

    analysis_service = AnalysisService(
        analyzer=analyzer,
        assumptions=assumptions,
        pricing=pricing,
    )

    pr_service = PullRequestAnalysisService(
        analysis_service=analysis_service,
        pr_reader=PullRequestReader(),
    )

    result = pr_service.analyze_pr(
        owner="zunxii",
        repo="costgate",
        pull_number=1,
    )

    assert result.query.file_path == (
        "db/experiments/customer_lookup.sql"
    )

    assert result.baseline.scan_type != result.candidate.scan_type
    assert result.comparison.execution_time_delta_ms > 0
    assert result.cost_estimate.monthly_delta > 0