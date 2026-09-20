from __future__ import annotations

import argparse
import os
from datetime import datetime
from decimal import Decimal

import boto3
from dotenv import load_dotenv

from app.billing.athena_cur import (
    AthenaCURBillingSource,
    Boto3AthenaQueryExecutor,
)
from app.ledger.reconciler import reconcile_prediction
from app.ledger.repository import PredictionLedger

load_dotenv(".env")


def _parse_datetime(value: str) -> datetime:
    parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    if parsed.tzinfo is None:
        raise ValueError("Datetime must include a timezone, e.g. Z.")
    return parsed


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Reconcile a CostGate prediction against real AWS CUR 2.0 data via Athena."
    )
    parser.add_argument("--prediction-id", default=os.getenv("PREDICTION_ID"))
    parser.add_argument("--baseline-start", required=True)
    parser.add_argument("--baseline-end", required=True)
    parser.add_argument("--candidate-start", required=True)
    parser.add_argument("--candidate-end", required=True)
    parser.add_argument("--table", default=os.getenv("CUR_TABLE"))
    parser.add_argument("--database", default=os.getenv("CUR_DATABASE"))
    parser.add_argument("--workgroup", default=os.getenv("CUR_WORKGROUP", "primary"))
    parser.add_argument("--output-location", default=os.getenv("CUR_QUERY_RESULTS_S3_URI"))
    parser.add_argument("--region", default=os.getenv("CUR_REGION", "eu-north-1"))
    args = parser.parse_args()

    missing = [
        name
        for name, value in {
            "prediction-id": args.prediction_id,
            "table": args.table,
            "database": args.database,
            "output-location": args.output_location,
        }.items()
        if not value
    ]
    if missing:
        raise SystemExit(
            "Missing configuration: " + ", ".join(missing)
        )

    dynamodb = boto3.resource(
        "dynamodb",
        region_name=args.region,
    )
    table_name = os.environ["PREDICTION_TABLE_NAME"]
    ledger = PredictionLedger(dynamodb.Table(table_name))

    prediction = ledger.get(args.prediction_id)
    if prediction is None:
        raise SystemExit(f"Prediction not found: {args.prediction_id}")
    if not prediction.resource_id:
        raise SystemExit("Prediction has no resource_id and cannot be reconciled from CUR.")

    executor = Boto3AthenaQueryExecutor(
        database=args.database,
        workgroup=args.workgroup,
        output_location=args.output_location,
        region=args.region,
    )
    billing_source = AthenaCURBillingSource(
        table=args.table,
        executor=executor,
    )

    actual_monthly_delta = billing_source.get_actual_monthly_delta(
        resource_id=prediction.resource_id,
        baseline_start=_parse_datetime(args.baseline_start),
        baseline_end=_parse_datetime(args.baseline_end),
        candidate_start=_parse_datetime(args.candidate_start),
        candidate_end=_parse_datetime(args.candidate_end),
    )

    reconciled = reconcile_prediction(
        prediction,
        actual_monthly_delta=actual_monthly_delta,
        reconciled_at=datetime.now().astimezone().isoformat(),
    )

    updated = ledger.mark_reconciled(
        prediction_id=prediction.prediction_id,
        actual_monthly_delta=Decimal(str(reconciled.actual_monthly_delta)),
        actual_error_pct=Decimal(str(reconciled.actual_error_pct)),
        reconciled_at=reconciled.reconciled_at,
    )

    print("Prediction reconciled from AWS CUR 2.0 via Athena")
    print(f"Prediction: ${prediction.predicted_monthly_delta}")
    print(f"Actual:     ${updated.actual_monthly_delta}")
    print(f"Error:      {updated.actual_error_pct:.2f}%")
    print(f"Status:     {updated.status}")


if __name__ == "__main__":
    main()
