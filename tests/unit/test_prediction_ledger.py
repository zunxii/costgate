from decimal import Decimal

from botocore.exceptions import ClientError

from app.ledger.models import PredictionRecord
from app.ledger.repository import PredictionLedger


class FakeTable:
    def __init__(self):
        self.items = {}

    def put_item(self, *, Item, ConditionExpression=None):
        prediction_id = Item["prediction_id"]

        if (
            ConditionExpression == "attribute_not_exists(prediction_id)"
            and prediction_id in self.items
        ):
            raise ClientError(
                {
                    "Error": {
                        "Code": "ConditionalCheckFailedException",
                        "Message": "Item already exists",
                    }
                },
                "PutItem",
            )

        self.items[prediction_id] = Item

    def update_item(self, *, Key, UpdateExpression, ConditionExpression, ExpressionAttributeNames, ExpressionAttributeValues, ReturnValues):
        item = self.items.get(Key["prediction_id"])
        if item is None:
            raise ClientError({"Error": {"Code": "ResourceNotFoundException", "Message": "missing"}}, "UpdateItem")
        if item.get("status") != ExpressionAttributeValues[":predicted"]:
            raise ClientError({"Error": {"Code": "ConditionalCheckFailedException", "Message": "condition failed"}}, "UpdateItem")
        item = dict(item)
        item["status"] = ExpressionAttributeValues[":reconciled"]
        item["actual_monthly_delta"] = ExpressionAttributeValues[":actual"]
        item["actual_error_pct"] = ExpressionAttributeValues[":error"]
        item["reconciled_at"] = ExpressionAttributeValues[":time"]
        self.items[Key["prediction_id"]] = item
        return {"Attributes": item}

    def get_item(self, *, Key):
        item = self.items.get(Key["prediction_id"])

        if item is None:
            return {}

        return {"Item": item}


def _prediction() -> PredictionRecord:
    return PredictionRecord(
        prediction_id="pred-123",
        repository="zunxii/costgate",
        pull_request_number=3,
        commit_sha="abc123",
        author="zunxii",
        created_at="2026-09-19T15:00:00Z",
        predicted_monthly_delta=Decimal("78.00"),
        predicted_lower_bound=Decimal("62.40"),
        predicted_upper_bound=Decimal("93.60"),
        confidence="high",
        direction="increase",
        baseline_execution_ms=66.823,
        candidate_execution_ms=136.711,
        baseline_rows=6,
        candidate_rows=74549,
        baseline_scan_type="Seq Scan",
        candidate_scan_type="Seq Scan",
    )


def test_prediction_is_saved_and_loaded():
    table = FakeTable()
    ledger = PredictionLedger(table=table)

    original = _prediction()

    ledger.save(original)

    loaded = ledger.get("pred-123")

    assert loaded == original

def test_prediction_serializes_decimal_values():
    item = _prediction().to_item()

    assert item["predicted_monthly_delta"] == Decimal("78.00")
    assert item["predicted_lower_bound"] == Decimal("62.40")
    assert item["predicted_upper_bound"] == Decimal("93.60")
    assert item["baseline_execution_ms"] == Decimal("66.823")
    assert item["candidate_execution_ms"] == Decimal("136.711")

def test_reconciled_prediction_is_saved_and_loaded():
    table = FakeTable()
    ledger = PredictionLedger(table=table)

    original = _prediction()
    reconciled = PredictionRecord(
        **{
            **original.__dict__,
            "status": "reconciled",
            "actual_monthly_delta": Decimal("0.84"),
            "actual_error_pct": Decimal("5.00"),
            "reconciled_at": "2026-09-19T12:00:00Z",
        }
    )

    ledger.save(reconciled)

    loaded = ledger.get("pred-123")

    assert loaded == reconciled
    assert loaded.actual_monthly_delta == Decimal("0.84")
    assert loaded.actual_error_pct == Decimal("5.00")
    assert loaded.reconciled_at == "2026-09-19T12:00:00Z"

def test_duplicate_prediction_is_not_overwritten():
    table = FakeTable()
    ledger = PredictionLedger(table=table)

    original = _prediction()
    assert ledger.save(original) is True

    reconciled = PredictionRecord(
        **{
            **original.__dict__,
            "status": "reconciled",
            "actual_monthly_delta": Decimal("99.99"),
            "actual_error_pct": Decimal("27.0"),
            "reconciled_at": "2026-09-20T10:00:00Z",
        }
    )

    assert ledger.save(reconciled) is False
    assert ledger.get("pred-123") == original


def test_mark_reconciled_updates_existing_prediction():
    table = FakeTable()
    ledger = PredictionLedger(table=table)
    original = _prediction()
    ledger.save(original)

    updated = ledger.mark_reconciled(
        prediction_id=original.prediction_id,
        actual_monthly_delta=Decimal("81.00"),
        actual_error_pct=Decimal("3.846153846"),
        reconciled_at="2026-09-20T12:00:00Z",
    )

    assert updated.status == "reconciled"
    assert updated.actual_monthly_delta == Decimal("81.00")
    assert updated.reconciled_at == "2026-09-20T12:00:00Z"
