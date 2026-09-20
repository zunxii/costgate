from __future__ import annotations

from decimal import Decimal
from datetime import datetime, timezone
from typing import Any

from boto3.dynamodb.conditions import Key

from botocore.exceptions import ClientError

from app.ledger.models import PredictionRecord


class PredictionLedger:
    """Persistence layer for CostGate prediction history."""

    def __init__(
        self,
        table: Any | None = None,
        table_name: str = "costgate-predictions",
        region: str = "eu-north-1",
    ) -> None:
        if table is not None:
            self.table = table
            return

        import boto3

        dynamodb = boto3.resource(
            "dynamodb",
            region_name=region,
        )

        self.table = dynamodb.Table(table_name)

    def save(self, prediction: PredictionRecord) -> bool:
        """Create a prediction exactly once.

        Re-processing the same PR head must never overwrite a reconciled
        historical record. Returns True when inserted, False when the
        prediction already exists.
        """
        try:
            self.table.put_item(
                Item=prediction.to_item(),
                ConditionExpression="attribute_not_exists(prediction_id)",
            )
        except ClientError as exc:
            if exc.response.get("Error", {}).get("Code") == "ConditionalCheckFailedException":
                return False
            raise

        return True

    def schedule_verification(
        self,
        *,
        prediction_id: str,
        merged_at: str,
        verification_due_at: str,
        verification_source: str,
        verification_delivery_id: str | None,
        baseline_window_start: str,
        baseline_window_end: str,
        candidate_window_start: str,
        candidate_window_end: str,
    ) -> PredictionRecord | None:
        try:
            response = self.table.update_item(
                Key={"prediction_id": prediction_id},
                UpdateExpression=(
                    "SET #s = :pending, "
                    "merged_at = :merged_at, "
                    "verification_due_at = :due_at, "
                    "verification_source = :source, "
                    "verification_delivery_id = :delivery_id, "
                    "baseline_window_start = :baseline_start, "
                    "baseline_window_end = :baseline_end, "
                    "candidate_window_start = :candidate_start, "
                    "candidate_window_end = :candidate_end"
                ),
                ConditionExpression="#s = :predicted",
                ExpressionAttributeNames={"#s": "status"},
                ExpressionAttributeValues={
                    ":pending": "verification_pending",
                    ":predicted": "predicted",
                    ":merged_at": merged_at,
                    ":due_at": verification_due_at,
                    ":source": verification_source,
                    ":delivery_id": verification_delivery_id,
                    ":baseline_start": baseline_window_start,
                    ":baseline_end": baseline_window_end,
                    ":candidate_start": candidate_window_start,
                    ":candidate_end": candidate_window_end,
                },
                ReturnValues="ALL_NEW",
            )
        except ClientError as exc:
            code = exc.response.get("Error", {}).get("Code")
            if code == "ConditionalCheckFailedException":
                return None
            raise

        return self._from_item(response["Attributes"])

    def get_due_verifications(
        self,
        *,
        as_of: datetime | None = None,
        limit: int = 25,
    ) -> list[PredictionRecord]:
        now = (as_of or datetime.now(timezone.utc)).astimezone(timezone.utc).isoformat()
        items: list[PredictionRecord] = []
        last_key = None

        while len(items) < limit:
            params: dict[str, Any] = {
                "IndexName": "VerificationDueIndex",
                "KeyConditionExpression": (
                    Key("status").eq("verification_pending")
                    & Key("verification_due_at").lte(now)
                ),
                "Limit": min(25, limit - len(items)),
            }
            if last_key:
                params["ExclusiveStartKey"] = last_key

            response = self.table.query(**params)
            items.extend(
                self._from_item(item)
                for item in response.get("Items", [])
            )
            last_key = response.get("LastEvaluatedKey")
            if not last_key:
                break

        return items[:limit]

    def mark_reconciled(
        self,
        *,
        prediction_id: str,
        actual_monthly_delta: Decimal,
        actual_error_pct: Decimal,
        reconciled_at: str,
    ) -> PredictionRecord:
        response = self.table.update_item(
            Key={"prediction_id": prediction_id},
            UpdateExpression=(
                "SET #s = :reconciled, "
                "actual_monthly_delta = :actual, "
                "actual_error_pct = :error, "
                "reconciled_at = :time"
            ),
            ConditionExpression="#s IN (:predicted, :pending)",
            ExpressionAttributeNames={"#s": "status"},
            ExpressionAttributeValues={
                ":reconciled": "reconciled",
                ":predicted": "predicted",
                ":pending": "verification_pending",
                ":actual": Decimal(str(actual_monthly_delta)),
                ":error": Decimal(str(actual_error_pct)),
                ":time": reconciled_at,
            },
            ReturnValues="ALL_NEW",
        )

        return self._from_item(response["Attributes"])


    def list_for_user(self, user_id: str, *, limit: int = 200) -> list[dict[str, Any]]:
        """Return prediction items belonging to one authenticated CostGate account."""
        items: list[dict[str, Any]] = []
        last_key = None
        while len(items) < limit:
            params: dict[str, Any] = {
                "IndexName": "UserCreatedAtIndex",
                "KeyConditionExpression": Key("user_id").eq(user_id),
                "ScanIndexForward": False,
                "Limit": min(100, limit - len(items)),
            }
            if last_key:
                params["ExclusiveStartKey"] = last_key
            response = self.table.query(**params)
            items.extend(response.get("Items", []))
            last_key = response.get("LastEvaluatedKey")
            if not last_key:
                break
        return items[:limit]

    def get(self, prediction_id: str) -> PredictionRecord | None:
        response = self.table.get_item(
            Key={"prediction_id": prediction_id}
        )

        item = response.get("Item")

        if not item:
            return None

        return self._from_item(item)
    @staticmethod
    def _from_item(item: dict[str, Any]) -> PredictionRecord:
        return PredictionRecord(
            prediction_id=item["prediction_id"],
            repository=item["repository"],
            user_id=item.get("user_id"),
            pull_request_number=int(item["pull_request_number"]),
            commit_sha=item["commit_sha"],
            author=item["author"],
            created_at=item["created_at"],
            predicted_monthly_delta=Decimal(item["predicted_monthly_delta"]),
            predicted_lower_bound=Decimal(item["predicted_lower_bound"]),
            predicted_upper_bound=Decimal(item["predicted_upper_bound"]),
            confidence=item["confidence"],
            direction=item["direction"],
            baseline_execution_ms=float(item["baseline_execution_ms"]),
            candidate_execution_ms=float(item["candidate_execution_ms"]),
            baseline_rows=int(item["baseline_rows"]),
            candidate_rows=int(item["candidate_rows"]),
            baseline_scan_type=item["baseline_scan_type"],
            candidate_scan_type=item["candidate_scan_type"],
            status=item.get("status", "predicted"),
            actual_monthly_delta=(
                Decimal(item["actual_monthly_delta"])
                if item.get("actual_monthly_delta") is not None
                else None
            ),
            actual_error_pct=(
                Decimal(item["actual_error_pct"])
                if item.get("actual_error_pct") is not None
                else None
            ),
            reconciled_at=item.get("reconciled_at"),
            delivery_id=item.get("delivery_id"),
            resource_id=item.get("resource_id"),
            policy_verdict=item.get("policy_verdict"),
            check_run_id=(
                int(item["check_run_id"])
                if item.get("check_run_id") is not None
                else None
            ),
            check_run_url=item.get("check_run_url"),
            merged_at=item.get("merged_at"),
            verification_due_at=item.get("verification_due_at"),
            verification_source=item.get("verification_source"),
            verification_delivery_id=item.get("verification_delivery_id"),
            baseline_window_start=item.get("baseline_window_start"),
            baseline_window_end=item.get("baseline_window_end"),
            candidate_window_start=item.get("candidate_window_start"),
            candidate_window_end=item.get("candidate_window_end"),
        )
