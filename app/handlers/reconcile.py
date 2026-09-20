from __future__ import annotations

import os
from datetime import datetime, timezone
from decimal import Decimal
from typing import Any

from app.billing.athena_cur import (
    AthenaCURBillingSource,
    Boto3AthenaQueryExecutor,
    CURDataUnavailable,
)
from app.ledger.reconciler import reconcile_prediction
from app.ledger.repository import PredictionLedger


def _configured() -> bool:
    return all(
        os.getenv(name)
        for name in (
            "CUR_DATABASE",
            "CUR_TABLE",
            "CUR_QUERY_RESULTS_S3_URI",
        )
    )


def lambda_handler(event: dict[str, Any], context: Any) -> dict[str, Any]:
    if not _configured():
        print("CUR reconciliation skipped: Athena configuration is not set.")
        return {"status": "skipped", "reason": "cur_not_configured"}

    region = os.getenv("CUR_REGION", "us-east-1")
    table_name = os.environ["PREDICTION_TABLE_NAME"]
    ledger = PredictionLedger(
        table_name=table_name,
        region=os.getenv("LEDGER_REGION", "eu-north-1"),
    )

    due = ledger.get_due_verifications(limit=int(os.getenv("COSTGATE_RECONCILIATION_BATCH", "10")))
    if not due:
        return {"status": "success", "processed": 0, "reconciled": 0}

    executor = Boto3AthenaQueryExecutor(
        database=os.environ["CUR_DATABASE"],
        workgroup=os.getenv("CUR_WORKGROUP", "primary"),
        output_location=os.environ["CUR_QUERY_RESULTS_S3_URI"],
        region=region,
    )
    billing = AthenaCURBillingSource(
        table=os.environ["CUR_TABLE"],
        executor=executor,
    )

    reconciled_count = 0
    for prediction in due:
        if not all(
            (
                prediction.resource_id,
                prediction.baseline_window_start,
                prediction.baseline_window_end,
                prediction.candidate_window_start,
                prediction.candidate_window_end,
            )
        ):
            print(f"Skipping incomplete verification metadata: {prediction.prediction_id}")
            continue

        try:
            actual = billing.get_actual_monthly_delta(
                resource_id=prediction.resource_id,
                baseline_start=datetime.fromisoformat(prediction.baseline_window_start),
                baseline_end=datetime.fromisoformat(prediction.baseline_window_end),
                candidate_start=datetime.fromisoformat(prediction.candidate_window_start),
                candidate_end=datetime.fromisoformat(prediction.candidate_window_end),
            )
            reconciled = reconcile_prediction(
                prediction,
                actual_monthly_delta=actual,
                reconciled_at=datetime.now(timezone.utc).isoformat(),
            )
            ledger.mark_reconciled(
                prediction_id=prediction.prediction_id,
                actual_monthly_delta=Decimal(str(reconciled.actual_monthly_delta)),
                actual_error_pct=Decimal(str(reconciled.actual_error_pct)),
                reconciled_at=reconciled.reconciled_at,
            )
            reconciled_count += 1
        except CURDataUnavailable as exc:
            print(f"CUR data not ready for {prediction.prediction_id}: {exc}")
        except Exception as exc:
            print(f"CUR reconciliation failed for {prediction.prediction_id}: {exc}")

    return {
        "status": "success",
        "processed": len(due),
        "reconciled": reconciled_count,
    }
