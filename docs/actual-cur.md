# Actual AWS CUR 2.0 reconciliation

CostGate can reconcile prediction records against AWS Cost and Usage Report 2.0 (CUR 2.0) data queried through Athena.

## AWS-side setup

1. Create an AWS Data Export for **Cost and Usage Report 2.0**.
2. Enable **Include resource IDs** so `line_item_resource_id` is present.
3. Use **Daily** time granularity for the initial CostGate integration.
4. Deliver the export to an S3 bucket. Parquet is recommended.
5. Configure Athena integration or use the generated `create-table.sql` / crawler CloudFormation assets from the export.
6. Create or choose an Athena query-results S3 location.
7. Set `CUR_DATABASE`, `CUR_TABLE`, `CUR_WORKGROUP`, and `CUR_QUERY_RESULTS_S3_URI`.

AWS states that CUR 2.0 resource IDs are enabled through the `INCLUDE_RESOURCES` configuration, and the resource-level identifier is `line_item_resource_id`. CUR 2.0 exports are delivered to S3 and refreshed at least daily; the first delivery can take up to 24 hours after creating an export.

## Reconciliation model

CostGate compares two explicit resource-cost windows:

- baseline window: before the change becomes active
- candidate window: after the change becomes active

For each window, CostGate computes normalized daily resource cost and scales the difference to a 30-day month.

This is **resource-level billing reconciliation**, not causal proof that the PR alone caused the entire resource-cost difference. Shared workloads, credits, discounts, reservations, and unrelated traffic can affect the observed resource cost.

## Local verification

Use:

```bash
PREDICTION_TABLE_NAME=... \\
CUR_DATABASE=... \\
CUR_TABLE=... \\
CUR_WORKGROUP=primary \\
CUR_QUERY_RESULTS_S3_URI=s3://... \\
python scripts/reconcile_cur.py \\
  --prediction-id ... \\
  --baseline-start 2026-09-01T00:00:00Z \\
  --baseline-end 2026-09-02T00:00:00Z \\
  --candidate-start 2026-09-02T00:00:00Z \\
  --candidate-end 2026-09-03T00:00:00Z
```

The script updates the existing prediction record using a conditional DynamoDB update, preserving the idempotency guarantees of the ledger.
