from __future__ import annotations

import os
from decimal import Decimal
from typing import Any, Dict, List
import boto3

REGIONAL_DEFAULT = os.getenv("AWS_REGION", "eu-north-1")
TABLE_NAME = os.getenv("PREDICTION_TABLE_NAME", "costgate-predictions")


class DashboardService:
    def __init__(self, table_name: str = TABLE_NAME, region_name: str = REGIONAL_DEFAULT):
        self.table = boto3.resource("dynamodb", region_name=region_name).Table(table_name)

    def scan_all_items(self) -> List[Dict[str, Any]]:
        items: List[Dict[str, Any]] = []
        kwargs: Dict[str, Any] = {}
        while True:
            response = self.table.scan(**kwargs)
            items.extend(response.get("Items", []))
            last_key = response.get("LastEvaluatedKey")
            if not last_key:
                break
            kwargs["ExclusiveStartKey"] = last_key
        return items

    def get_summary(self, items: List[Dict[str, Any]] | None = None) -> Dict[str, Any]:
        if items is None:
            items = self.scan_all_items()

        predicted = sum(
            (Decimal(str(item.get("predicted_monthly_delta", 0))) for item in items),
            Decimal("0"),
        )
        verified = sum(
            (
                Decimal(str(item.get("actual_monthly_delta", 0)))
                for item in items
                if item.get("status") == "reconciled"
            ),
            Decimal("0"),
        )
        errors = [
            Decimal(str(item["actual_error_pct"]))
            for item in items
            if item.get("status") == "reconciled" and item.get("actual_error_pct") is not None
        ]

        mean_error = sum(errors, Decimal("0")) / len(errors) if errors else None

        return {
            "prediction_count": len(items),
            "reconciled_count": len(errors),
            "total_predicted_monthly": float(predicted),
            "total_verified_monthly": float(verified),
            "mean_error_pct": float(mean_error) if mean_error is not None else None,
        }

    def get_authors(self, items: List[Dict[str, Any]] | None = None) -> List[Dict[str, Any]]:
        if items is None:
            items = self.scan_all_items()

        grouped: Dict[str, Dict[str, Any]] = {}
        for item in items:
            author = str(item.get("author", "unknown"))
            record = grouped.setdefault(
                author,
                {
                    "author": author,
                    "prs": 0,
                    "predicted": Decimal("0"),
                    "verified": Decimal("0"),
                    "errors": [],
                },
            )
            record["prs"] += 1
            record["predicted"] += Decimal(str(item.get("predicted_monthly_delta", 0)))

            if item.get("status") == "reconciled":
                record["verified"] += Decimal(str(item.get("actual_monthly_delta", 0)))
                if item.get("actual_error_pct") is not None:
                    record["errors"].append(Decimal(str(item["actual_error_pct"])))

        result = []
        for record in grouped.values():
            errors = record["errors"]
            mean_error = sum(errors, Decimal("0")) / len(errors) if errors else None
            result.append(
                {
                    "author": record["author"],
                    "prs": record["prs"],
                    "predicted_monthly": float(record["predicted"]),
                    "verified_monthly": float(record["verified"]),
                    "mean_error_pct": float(mean_error) if mean_error is not None else None,
                }
            )

        return sorted(result, key=lambda x: x["predicted_monthly"], reverse=True)

    def get_recent_predictions(
        self, items: List[Dict[str, Any]] | None = None, limit: int = 20
    ) -> List[Dict[str, Any]]:
        if items is None:
            items = self.scan_all_items()

        ordered = sorted(items, key=lambda x: x.get("created_at", ""), reverse=True)
        result = []
        for item in ordered[:limit]:
            result.append(
                {
                    "prediction_id": item.get("prediction_id"),
                    "repository": item.get("repository"),
                    "pull_request_number": item.get("pull_request_number"),
                    "author": item.get("author"),
                    "created_at": item.get("created_at"),
                    "status": item.get("status"),
                    "predicted_monthly_delta": float(item.get("predicted_monthly_delta", 0)),
                    "actual_monthly_delta": (
                        float(item["actual_monthly_delta"])
                        if item.get("actual_monthly_delta") is not None
                        else None
                    ),
                    "actual_error_pct": (
                        float(item["actual_error_pct"])
                        if item.get("actual_error_pct") is not None
                        else None
                    ),
                    "confidence": item.get("confidence"),
                    "direction": item.get("direction"),
                }
            )
        return result
