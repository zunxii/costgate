from datetime import datetime, timezone
from decimal import Decimal
from unittest.mock import MagicMock

from app.ledger.models import PredictionRecord
from app.ledger.repository import PredictionLedger
from app.pipeline.pr_event_processor import PullRequestEventProcessor


class VerificationTable:
    def __init__(self, item):
        self.item = dict(item)

    def update_item(self, *, Key, UpdateExpression, ConditionExpression, ExpressionAttributeNames, ExpressionAttributeValues, ReturnValues):
        if self.item.get("status") != ExpressionAttributeValues[":predicted"]:
            from botocore.exceptions import ClientError
            raise ClientError(
                {"Error": {"Code": "ConditionalCheckFailedException"}},
                "UpdateItem",
            )
        self.item["status"] = ExpressionAttributeValues[":pending"]
        self.item["merged_at"] = ExpressionAttributeValues[":merged_at"]
        self.item["verification_due_at"] = ExpressionAttributeValues[":due_at"]
        self.item["verification_source"] = ExpressionAttributeValues[":source"]
        self.item["verification_delivery_id"] = ExpressionAttributeValues[":delivery_id"]
        self.item["baseline_window_start"] = ExpressionAttributeValues[":baseline_start"]
        self.item["baseline_window_end"] = ExpressionAttributeValues[":baseline_end"]
        self.item["candidate_window_start"] = ExpressionAttributeValues[":candidate_start"]
        self.item["candidate_window_end"] = ExpressionAttributeValues[":candidate_end"]
        return {"Attributes": self.item}

    def get_item(self, *, Key):
        return {"Item": self.item}


def _record():
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
        resource_id="costgate-db",
    )


def test_verification_windows_align_to_utc_days(monkeypatch):
    monkeypatch.setenv("COSTGATE_VERIFICATION_DELAY_HOURS", "24")
    windows = PullRequestEventProcessor._verification_windows("2026-09-20T17:00:00+05:30")

    assert windows["baseline_window_start"] == "2026-09-20T00:00:00+00:00"
    assert windows["baseline_window_end"] == "2026-09-21T00:00:00+00:00"
    assert windows["candidate_window_start"] == "2026-09-21T00:00:00+00:00"
    assert windows["candidate_window_end"] == "2026-09-22T00:00:00+00:00"
    assert windows["verification_due_at"] == "2026-09-23T00:00:00+00:00"


def test_schedule_verification_is_idempotent():
    record = _record()
    table = VerificationTable(record.to_item())
    ledger = PredictionLedger(table=table)

    windows = PullRequestEventProcessor._verification_windows("2026-09-20T17:00:00+05:30")
    updated = ledger.schedule_verification(
        prediction_id=record.prediction_id,
        merged_at=windows["merged_at"],
        verification_due_at=windows["verification_due_at"],
        verification_source="aws_cur_2",
        verification_delivery_id="merge-delivery",
        baseline_window_start=windows["baseline_window_start"],
        baseline_window_end=windows["baseline_window_end"],
        candidate_window_start=windows["candidate_window_start"],
        candidate_window_end=windows["candidate_window_end"],
    )

    assert updated is not None
    assert updated.status == "verification_pending"
    assert updated.verification_source == "aws_cur_2"
    assert updated.verification_delivery_id == "merge-delivery"
