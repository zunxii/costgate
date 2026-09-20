import os
from decimal import Decimal

from app.ledger.models import PredictionRecord
import app.handlers.reconcile as reconcile_handler


def _pending_prediction():
    return PredictionRecord(
        prediction_id="pred-123",
        repository="zunxii/costgate",
        pull_request_number=4,
        commit_sha="abc123",
        author="zunxii",
        created_at="2026-09-20T10:00:00+00:00",
        predicted_monthly_delta=Decimal("0.74"),
        predicted_lower_bound=Decimal("0.59"),
        predicted_upper_bound=Decimal("0.89"),
        confidence="high",
        direction="increase",
        baseline_execution_ms=0.127,
        candidate_execution_ms=66.737,
        baseline_rows=6,
        candidate_rows=6,
        baseline_scan_type="Bitmap Heap Scan",
        candidate_scan_type="Seq Scan",
        status="verification_pending",
        resource_id="costgate-db",
        verification_source="aws_cur_2",
        verification_due_at="2026-09-23T00:00:00+00:00",
        baseline_window_start="2026-09-20T00:00:00+00:00",
        baseline_window_end="2026-09-21T00:00:00+00:00",
        candidate_window_start="2026-09-21T00:00:00+00:00",
        candidate_window_end="2026-09-22T00:00:00+00:00",
    )


class FakeLedger:
    def __init__(self):
        self.prediction = _pending_prediction()
        self.marked = None

    def get_due_verifications(self, *, limit):
        return [self.prediction]

    def mark_reconciled(self, **kwargs):
        self.marked = kwargs
        self.prediction = PredictionRecord(
            **{
                **self.prediction.__dict__,
                "status": "reconciled",
                "actual_monthly_delta": Decimal(str(kwargs["actual_monthly_delta"])),
                "actual_error_pct": Decimal(str(kwargs["actual_error_pct"])),
                "reconciled_at": kwargs["reconciled_at"],
            }
        )
        return self.prediction


class FakeExecutor:
    pass


class FakeBilling:
    def __init__(self, *, table, executor):
        pass

    def get_actual_monthly_delta(self, **kwargs):
        return Decimal("0.84")


def test_reconcile_handler_marks_due_prediction(monkeypatch):
    ledger = FakeLedger()
    monkeypatch.setenv("PREDICTION_TABLE_NAME", "predictions")
    monkeypatch.setenv("CUR_DATABASE", "cur_db")
    monkeypatch.setenv("CUR_TABLE", "cur_table")
    monkeypatch.setenv("CUR_QUERY_RESULTS_S3_URI", "s3://results/path")
    monkeypatch.setenv("CUR_REGION", "us-east-1")
    monkeypatch.setattr(reconcile_handler, "PredictionLedger", lambda **kwargs: ledger)
    monkeypatch.setattr(reconcile_handler, "Boto3AthenaQueryExecutor", lambda **kwargs: FakeExecutor())
    monkeypatch.setattr(reconcile_handler, "AthenaCURBillingSource", FakeBilling)

    result = reconcile_handler.lambda_handler({}, None)

    assert result == {"status": "success", "processed": 1, "reconciled": 1}
    assert ledger.marked["actual_monthly_delta"] == Decimal("0.84")
