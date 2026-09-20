from datetime import datetime, timezone
from decimal import Decimal

import pytest

from app.billing.athena_cur import (
    AthenaCURBillingSource,
    CURDataUnavailable,
    CostWindow,
)


class FakeExecutor:
    def __init__(self):
        self.sql = None

    def query(self, sql):
        self.sql = sql
        return [
            ["baseline_cost_usd", "candidate_cost_usd", "baseline_row_count", "candidate_row_count"],
            ["5.7600", "5.8440", "3", "3"],
        ]


def test_cost_window_days():
    window = CostWindow(
        datetime(2026, 9, 1, tzinfo=timezone.utc),
        datetime(2026, 9, 4, tzinfo=timezone.utc),
    )
    assert window.days == Decimal("3")


def test_athena_cur_normalizes_daily_cost_and_annualizes_monthly():
    executor = FakeExecutor()
    source = AthenaCURBillingSource(
        table="cur_db.cost_and_usage_report",
        executor=executor,
    )

    result = source.get_actual_monthly_delta(
        resource_id="costgate-db",
        baseline_start=datetime(2026, 9, 1, tzinfo=timezone.utc),
        baseline_end=datetime(2026, 9, 4, tzinfo=timezone.utc),
        candidate_start=datetime(2026, 9, 4, tzinfo=timezone.utc),
        candidate_end=datetime(2026, 9, 7, tzinfo=timezone.utc),
    )

    assert result == Decimal("0.8400")
    assert "line_item_resource_id = 'costgate-db'" in executor.sql
    assert "line_item_product_code = 'AmazonRDS'" in executor.sql


def test_athena_cur_rejects_overlapping_windows():
    source = AthenaCURBillingSource(
        table="cur_db.cost_and_usage_report",
        executor=FakeExecutor(),
    )

    try:
        source.get_actual_monthly_delta(
            resource_id="costgate-db",
            baseline_start=datetime(2026, 9, 1, tzinfo=timezone.utc),
            baseline_end=datetime(2026, 9, 5, tzinfo=timezone.utc),
            candidate_start=datetime(2026, 9, 4, tzinfo=timezone.utc),
            candidate_end=datetime(2026, 9, 7, tzinfo=timezone.utc),
        )
    except ValueError as exc:
        assert "may not overlap" in str(exc)
    else:
        raise AssertionError("Expected overlapping-window validation")


def test_athena_cur_keeps_pending_when_data_has_not_arrived():
    class EmptyWindowExecutor:
        def query(self, sql):
            return [
                ["baseline_cost_usd", "candidate_cost_usd", "baseline_row_count", "candidate_row_count"],
                ["0", "0", "3", "0"],
            ]

    source = AthenaCURBillingSource(
        table="cur_db.cost_and_usage_report",
        executor=EmptyWindowExecutor(),
    )

    with pytest.raises(CURDataUnavailable):
        source.get_actual_monthly_delta(
            resource_id="costgate-db",
            baseline_start=datetime(2026, 9, 1, tzinfo=timezone.utc),
            baseline_end=datetime(2026, 9, 2, tzinfo=timezone.utc),
            candidate_start=datetime(2026, 9, 2, tzinfo=timezone.utc),
            candidate_end=datetime(2026, 9, 3, tzinfo=timezone.utc),
        )
