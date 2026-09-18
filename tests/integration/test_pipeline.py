from app.analyzer.query_analyzer import QueryAnalyzer
from app.cost_engine.assumptions import CostAssumptions
from app.cost_engine.pricing import get_rds_pricing
from app.domain.enums import CostDirection, ScanType
from app.domain.models import ChangedQuery
from app.pipeline.analysis_service import AnalysisService


def test_end_to_end_changed_query_analysis():
    changed_query = ChangedQuery(
        file_path="queries/customer_lookup.sql",
        baseline_sql="""
            SELECT
                id,
                customer_id,
                status,
                total_cents,
                created_at
            FROM orders
            WHERE customer_id = 12345;
        """,
        candidate_sql="""
            SELECT
                id,
                customer_id,
                status,
                total_cents,
                created_at
            FROM orders
            WHERE customer_id::text = '12345';
        """,
    )

    assumptions = CostAssumptions(
        monthly_requests=1_000_000,
        db_instance_hourly_cost_usd=0.036,
    )

    pricing = get_rds_pricing(
        region="eu-north-1",
        engine="postgresql",
        instance_class="db.t4g.small",
        db_instance_hourly_usd="0.036",
    )

    service = AnalysisService(
        analyzer=QueryAnalyzer(),
        assumptions=assumptions,
        pricing=pricing,
    )

    result = service.analyze(changed_query)

    assert result.query == changed_query

    assert result.baseline.scan_type in {
        ScanType.INDEX_SCAN,
        ScanType.BITMAP_HEAP_SCAN,
    }

    assert result.candidate.scan_type == ScanType.SEQ_SCAN

    assert result.comparison.scan_type_changed is True
    assert result.comparison.index_usage_changed is True

    assert result.cost_estimate.direction == CostDirection.INCREASE
    assert result.cost_estimate.monthly_delta > 0