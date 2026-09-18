import pytest

from app.analyzer.query_analyzer import QueryAnalyzer
from app.domain.enums import ScanType


@pytest.mark.integration
def test_analyze_customer_lookup():
    analyzer = QueryAnalyzer()

    metrics = analyzer.analyze(
        """
        SELECT
            id,
            customer_id,
            status,
            total_cents,
            created_at
        FROM orders
        WHERE customer_id = 12345
        """
    )

    assert metrics.rows_returned == 6
    assert metrics.execution_time_ms > 0
    assert metrics.planning_time_ms > 0
    assert metrics.estimated_plan_cost > 0
    assert metrics.scan_type in {
        ScanType.BITMAP_HEAP_SCAN,
        ScanType.INDEX_SCAN,
    }