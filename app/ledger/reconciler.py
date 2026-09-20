from __future__ import annotations

from dataclasses import replace
from decimal import Decimal

from app.ledger.models import PredictionRecord


def reconcile_prediction(
    prediction: PredictionRecord,
    actual_monthly_delta: Decimal,
    reconciled_at: str,
) -> PredictionRecord:
    predicted = Decimal(str(prediction.predicted_monthly_delta))
    actual = Decimal(str(actual_monthly_delta))

    if predicted == 0:
        error_pct = Decimal("0") if actual == 0 else Decimal("100")
    else:
        error_pct = (
            abs(actual - predicted) / abs(predicted)
        ) * Decimal("100")

    return replace(
        prediction,
        status="reconciled",
        actual_monthly_delta=actual,
        actual_error_pct=error_pct,
        reconciled_at=reconciled_at,
    )