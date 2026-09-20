from __future__ import annotations

from dataclasses import asdict, dataclass
from decimal import Decimal
def _decimal(value):
    if value is None:
        return None
    return Decimal(str(value))

@dataclass(frozen=True)
class PredictionRecord:
    prediction_id: str
    repository: str
    pull_request_number: int
    commit_sha: str
    author: str
    created_at: str

    predicted_monthly_delta: Decimal
    predicted_lower_bound: Decimal
    predicted_upper_bound: Decimal

    confidence: str
    direction: str

    baseline_execution_ms: float
    candidate_execution_ms: float
    baseline_rows: int
    candidate_rows: int

    baseline_scan_type: str
    candidate_scan_type: str

    status: str = "predicted"

    actual_monthly_delta: Decimal | None = None
    actual_error_pct: Decimal | None = None
    reconciled_at: str | None = None

    # Audit / policy metadata. These fields are populated after the
    # deterministic analysis so the ledger can trace how a prediction
    # moved through the GitHub policy pipeline.
    delivery_id: str | None = None
    resource_id: str | None = None
    policy_verdict: str | None = None
    check_run_id: int | None = None
    check_run_url: str | None = None

    # Post-merge billing verification lifecycle.
    merged_at: str | None = None
    verification_due_at: str | None = None
    verification_source: str | None = None
    verification_delivery_id: str | None = None
    baseline_window_start: str | None = None
    baseline_window_end: str | None = None
    candidate_window_start: str | None = None
    candidate_window_end: str | None = None

    def to_item(self) -> dict:
        item = asdict(self)

        numeric_fields = (
            "predicted_monthly_delta",
            "predicted_lower_bound",
            "predicted_upper_bound",
            "baseline_execution_ms",
            "candidate_execution_ms",
            "actual_monthly_delta",
            "actual_error_pct",
        )

        for key in numeric_fields:
            value = item.get(key)

            if value is None:
                item.pop(key, None)
            else:
                item[key] = Decimal(str(value))

        return item