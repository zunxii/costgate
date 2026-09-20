from __future__ import annotations

import re
import time
from dataclasses import dataclass
from datetime import date, datetime, timezone
from decimal import Decimal
from typing import Any, Protocol


_IDENTIFIER_RE = re.compile(r"^[A-Za-z_][A-Za-z0-9_]*(?:\.[A-Za-z_][A-Za-z0-9_]*)?$")


class AthenaQueryExecutor(Protocol):
    def query(self, sql: str) -> list[list[str | None]]:
        ...


@dataclass(frozen=True)
class CostWindow:
    start: datetime
    end: datetime

    @property
    def days(self) -> Decimal:
        seconds = Decimal(str((self.end - self.start).total_seconds()))
        days = seconds / Decimal("86400")
        if days <= 0:
            raise ValueError("Cost window must be greater than zero days.")
        return days


def _utc(value: datetime | date) -> datetime:
    if isinstance(value, date) and not isinstance(value, datetime):
        return datetime(
            value.year,
            value.month,
            value.day,
            tzinfo=timezone.utc,
        )

    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)

    return value.astimezone(timezone.utc)


def _athena_timestamp(value: datetime) -> str:
    return value.astimezone(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")


def _sql_string(value: str) -> str:
    return "'" + value.replace("'", "''") + "'"


def _validate_identifier(value: str, field: str) -> str:
    if not _IDENTIFIER_RE.fullmatch(value):
        raise ValueError(f"Invalid {field}: {value!r}")
    return value


class Boto3AthenaQueryExecutor:
    """Small Athena adapter used by the real CUR billing source."""

    def __init__(
        self,
        *,
        database: str,
        workgroup: str = "primary",
        output_location: str,
        region: str = "eu-north-1",
        poll_interval_seconds: float = 1.0,
        timeout_seconds: float = 60.0,
        client: Any | None = None,
    ) -> None:
        self.database = _validate_identifier(database, "database")
        self.workgroup = _validate_identifier(workgroup, "workgroup")
        self.output_location = output_location
        self.poll_interval_seconds = poll_interval_seconds
        self.timeout_seconds = timeout_seconds

        if client is not None:
            self.client = client
        else:
            import boto3

            self.client = boto3.client(
                "athena",
                region_name=region,
            )

    def query(self, sql: str) -> list[list[str | None]]:
        response = self.client.start_query_execution(
            QueryString=sql,
            QueryExecutionContext={"Database": self.database},
            WorkGroup=self.workgroup,
            ResultConfiguration={
                "OutputLocation": self.output_location,
            },
        )
        query_execution_id = response["QueryExecutionId"]

        deadline = time.monotonic() + self.timeout_seconds

        while True:
            execution = self.client.get_query_execution(
                QueryExecutionId=query_execution_id,
            )
            state = execution["QueryExecution"]["Status"]["State"]

            if state == "SUCCEEDED":
                break

            if state in {"FAILED", "CANCELLED"}:
                reason = execution["QueryExecution"]["Status"].get(
                    "StateChangeReason",
                    "Athena query did not succeed.",
                )
                raise RuntimeError(reason)

            if time.monotonic() >= deadline:
                raise TimeoutError(
                    f"Athena query timed out after {self.timeout_seconds}s."
                )

            time.sleep(self.poll_interval_seconds)

        rows: list[list[str | None]] = []
        next_token: str | None = None

        while True:
            params = {
                "QueryExecutionId": query_execution_id,
                "MaxResults": 1000,
            }
            if next_token:
                params["NextToken"] = next_token

            result = self.client.get_query_results(**params)

            for row in result.get("ResultSet", {}).get("Rows", []):
                rows.append([
                    cell.get("VarCharValue")
                    for cell in row.get("Data", [])
                ])

            next_token = result.get("NextToken")
            if not next_token:
                break

        return rows


class CURDataUnavailable(RuntimeError):
    """Raised when CUR has not delivered data for a requested window."""


class AthenaCURBillingSource:
    """
    Reads real AWS CUR 2.0 data through Athena.

    CUR 2.0 must be configured with resource IDs so
    `line_item_resource_id` can attribute resource-level RDS spend.
    The source compares normalized daily cost for two windows and
    annualizes the difference to a 30-day month.
    """

    def __init__(
        self,
        *,
        table: str,
        executor: AthenaQueryExecutor,
        cost_column: str = "line_item_unblended_cost",
    ) -> None:
        self.table = _validate_identifier(table, "CUR table")
        self.executor = executor
        self.cost_column = _validate_identifier(
            cost_column,
            "CUR cost column",
        )

    def get_actual_monthly_delta(
        self,
        *,
        resource_id: str,
        baseline_start: datetime | date,
        baseline_end: datetime | date,
        candidate_start: datetime | date,
        candidate_end: datetime | date,
    ) -> Decimal:
        baseline = CostWindow(_utc(baseline_start), _utc(baseline_end))
        candidate = CostWindow(_utc(candidate_start), _utc(candidate_end))

        if baseline.end > candidate.start:
            raise ValueError("Baseline and candidate windows may not overlap.")

        sql = self._build_query(
            resource_id=resource_id,
            baseline=baseline,
            candidate=candidate,
        )
        rows = self.executor.query(sql)

        if len(rows) < 2:
            raise RuntimeError("Athena returned no billing result row.")

        # Athena returns a header row followed by the aggregate row.
        values = rows[1]
        if len(values) < 4:
            raise RuntimeError("Athena billing result is malformed.")

        baseline_total = Decimal(values[0] or "0")
        candidate_total = Decimal(values[1] or "0")
        baseline_rows = int(values[2] or "0")
        candidate_rows = int(values[3] or "0")

        if baseline_rows == 0 or candidate_rows == 0:
            raise CURDataUnavailable(
                "CUR has not delivered billing rows for the full verification window yet."
            )

        baseline_daily = baseline_total / baseline.days
        candidate_daily = candidate_total / candidate.days

        return (candidate_daily - baseline_daily) * Decimal("30")

    def _build_query(
        self,
        *,
        resource_id: str,
        baseline: CostWindow,
        candidate: CostWindow,
    ) -> str:
        resource = _sql_string(resource_id)
        start = _sql_string(_athena_timestamp(baseline.start))
        end = _sql_string(_athena_timestamp(candidate.end))
        baseline_start = _sql_string(_athena_timestamp(baseline.start))
        baseline_end = _sql_string(_athena_timestamp(baseline.end))
        candidate_start = _sql_string(_athena_timestamp(candidate.start))
        candidate_end = _sql_string(_athena_timestamp(candidate.end))

        return f"""
SELECT
    COALESCE(
        SUM(
            CASE
                WHEN line_item_usage_start_date >= TIMESTAMP {baseline_start}
                 AND line_item_usage_start_date < TIMESTAMP {baseline_end}
                THEN {self.cost_column}
                ELSE 0
            END
        ),
        0
    ) AS baseline_cost_usd,
    COALESCE(
        SUM(
            CASE
                WHEN line_item_usage_start_date >= TIMESTAMP {candidate_start}
                 AND line_item_usage_start_date < TIMESTAMP {candidate_end}
                THEN {self.cost_column}
                ELSE 0
            END
        ),
        0
    ) AS candidate_cost_usd,
    COUNT(
        CASE
            WHEN line_item_usage_start_date >= TIMESTAMP {baseline_start}
             AND line_item_usage_start_date < TIMESTAMP {baseline_end}
            THEN 1
        END
    ) AS baseline_row_count,
    COUNT(
        CASE
            WHEN line_item_usage_start_date >= TIMESTAMP {candidate_start}
             AND line_item_usage_start_date < TIMESTAMP {candidate_end}
            THEN 1
        END
    ) AS candidate_row_count
FROM {self.table}
WHERE line_item_resource_id = {resource}
  AND line_item_product_code = 'AmazonRDS'
  AND line_item_usage_start_date >= TIMESTAMP {start}
  AND line_item_usage_start_date < TIMESTAMP {_sql_string(_athena_timestamp(candidate.end))}
""".strip()
