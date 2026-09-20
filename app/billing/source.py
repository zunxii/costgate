from __future__ import annotations

import json
from decimal import Decimal
from pathlib import Path
from typing import Protocol


class BillingSource(Protocol):
    def get_actual_monthly_delta(
        self,
        *,
        resource_id: str,
        **kwargs,
    ) -> Decimal:
        ...


class MockCURBillingSource:
    """
    Reads a small CUR-like JSON export for the hackathon demo.

    This deliberately models resource-level billing rather than
    pretending that AWS provides query-level invoice line items.
    """

    def __init__(self, path: str | Path) -> None:
        self.path = Path(path)

    def get_actual_monthly_delta(
        self,
        *,
        resource_id: str,
        **kwargs,
    ) -> Decimal:
        with self.path.open() as file:
            data = json.load(file)

        if data.get("resource_id") != resource_id:
            raise ValueError(
                f"Billing resource mismatch: expected {resource_id!r}, "
                f"got {data.get('resource_id')!r}"
            )

        baseline_daily = Decimal(
            data["baseline_window"]["daily_cost_usd"]
        )
        candidate_daily = Decimal(
            data["candidate_window"]["daily_cost_usd"]
        )

        return (
            candidate_daily - baseline_daily
        ) * Decimal("30")
