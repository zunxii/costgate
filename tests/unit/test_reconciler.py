from decimal import Decimal

from app.ledger.reconciler import reconcile_prediction
from tests.unit.test_prediction_ledger import _prediction


def test_reconciliation_calculates_error():
    prediction = _prediction()

    result = reconcile_prediction(
        prediction,
        actual_monthly_delta=Decimal("81.90"),
        reconciled_at="2026-09-19T12:00:00Z",
    )

    assert result.status == "reconciled"
    assert result.actual_monthly_delta == Decimal("81.90")
    assert result.actual_error_pct == Decimal("5.00")
    assert result.reconciled_at == "2026-09-19T12:00:00Z"