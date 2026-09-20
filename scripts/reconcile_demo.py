from __future__ import annotations

import os
from datetime import datetime, timezone
from decimal import Decimal

import boto3
from dotenv import load_dotenv

from app.billing.source import MockCURBillingSource
from app.ledger.reconciler import reconcile_prediction
from app.ledger.repository import PredictionLedger

load_dotenv(".env")

TABLE_NAME = os.environ["PREDICTION_TABLE_NAME"]
PREDICTION_ID = os.environ["PREDICTION_ID"]

MOCK_CUR_PATH = os.environ.get(
    "MOCK_CUR_PATH",
    "data/mock_cur/sample_cur_export.json",
)

dynamodb = boto3.resource(
    "dynamodb",
    region_name="eu-north-1",
)

ledger = PredictionLedger(
    dynamodb.Table(TABLE_NAME)
)

prediction = ledger.get(PREDICTION_ID)

if prediction is None:
    raise SystemExit(
        f"Prediction not found: {PREDICTION_ID}"
    )

billing_source = MockCURBillingSource(
    MOCK_CUR_PATH
)

actual_monthly_delta = (
    billing_source.get_actual_monthly_delta(
        resource_id="costgate-db",
    )
)

reconciled = reconcile_prediction(
    prediction,
    actual_monthly_delta=actual_monthly_delta,
    reconciled_at=datetime.now(
        timezone.utc
    ).isoformat(),
)

ledger.save(reconciled)

print(
    f"Prediction reconciled from {MOCK_CUR_PATH}"
)
print(
    f"Prediction: ${prediction.predicted_monthly_delta}"
)
print(
    f"Actual:     ${reconciled.actual_monthly_delta}"
)
print(
    f"Error:      {reconciled.actual_error_pct:.2f}%"
)
print(
    f"Status:     {reconciled.status}"
)