from __future__ import annotations

import json
import os
from decimal import Decimal
from html import escape
from typing import Any

import boto3


REGION = os.getenv("AWS_REGION", "eu-north-1")
TABLE_NAME = os.environ["PREDICTION_TABLE_NAME"]

table = boto3.resource(
    "dynamodb",
    region_name=REGION,
).Table(TABLE_NAME)


def _scan_all() -> list[dict[str, Any]]:
    items: list[dict[str, Any]] = []
    kwargs: dict[str, Any] = {}

    while True:
        response = table.scan(**kwargs)
        items.extend(response.get("Items", []))

        last_key = response.get("LastEvaluatedKey")
        if not last_key:
            break

        kwargs["ExclusiveStartKey"] = last_key

    return items


def _summary(items: list[dict[str, Any]]) -> dict[str, Any]:
    predicted = sum(
        (
            Decimal(str(item.get("predicted_monthly_delta", 0)))
            for item in items
        ),
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
        if item.get("status") == "reconciled"
        and item.get("actual_error_pct") is not None
    ]

    mean_error = (
        sum(errors, Decimal("0")) / len(errors)
        if errors
        else None
    )

    return {
        "prediction_count": len(items),
        "reconciled_count": len(errors),
        "total_predicted_monthly": float(predicted),
        "total_verified_monthly": float(verified),
        "mean_error_pct": (
            float(mean_error)
            if mean_error is not None
            else None
        ),
    }


def _authors(items: list[dict[str, Any]]) -> list[dict[str, Any]]:
    grouped: dict[str, dict[str, Any]] = {}

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

        record["predicted"] += Decimal(
            str(item.get("predicted_monthly_delta", 0))
        )

        if item.get("status") == "reconciled":
            record["verified"] += Decimal(
                str(item.get("actual_monthly_delta", 0))
            )

            if item.get("actual_error_pct") is not None:
                record["errors"].append(
                    Decimal(str(item["actual_error_pct"]))
                )

    result = []

    for record in grouped.values():
        errors = record["errors"]

        mean_error = (
            sum(errors, Decimal("0")) / len(errors)
            if errors
            else None
        )

        result.append(
            {
                "author": record["author"],
                "prs": record["prs"],
                "predicted_monthly": float(record["predicted"]),
                "verified_monthly": float(record["verified"]),
                "mean_error_pct": (
                    float(mean_error)
                    if mean_error is not None
                    else None
                ),
            }
        )

    return sorted(
        result,
        key=lambda item: item["predicted_monthly"],
        reverse=True,
    )


def _recent(items: list[dict[str, Any]]) -> list[dict[str, Any]]:
    ordered = sorted(
        items,
        key=lambda item: item.get("created_at", ""),
        reverse=True,
    )

    result = []

    for item in ordered[:20]:
        result.append(
            {
                "prediction_id": item.get("prediction_id"),
                "repository": item.get("repository"),
                "pull_request_number": item.get(
                    "pull_request_number"
                ),
                "author": item.get("author"),
                "created_at": item.get("created_at"),
                "status": item.get("status"),
                "predicted_monthly_delta": float(
                    item.get("predicted_monthly_delta", 0)
                ),
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


def _json_response(body: Any) -> dict[str, Any]:
    def json_default(value: Any) -> Any:
        if isinstance(value, Decimal):
            return float(value)

        return str(value)

    return {
        "statusCode": 200,
        "headers": {
            "Content-Type": "application/json",
        },
        "body": json.dumps(
            body,
            default=json_default,
        ),
    }


def _html_response(items: list[dict[str, Any]]) -> dict[str, Any]:
    summary = _summary(items)
    authors = _authors(items)
    recent = _recent(items)

    author_rows = "".join(
        f"""
        <tr>
            <td>{escape(str(author["author"]))}</td>
            <td>{author["prs"]}</td>
            <td>${author["predicted_monthly"]:.2f}</td>
            <td>${author["verified_monthly"]:.2f}</td>
            <td>
                {
                    f'{author["mean_error_pct"]:.2f}%'
                    if author["mean_error_pct"] is not None
                    else "Pending"
                }
            </td>
        </tr>
        """
        for author in authors
    )

    recent_rows = "".join(
        f"""
        <tr>
            <td>#{item["pull_request_number"]}</td>
            <td>{escape(str(item["author"]))}</td>
            <td>${item["predicted_monthly_delta"]:.2f}</td>
            <td>
                {
                    f'${item["actual_monthly_delta"]:.2f}'
                    if item["actual_monthly_delta"] is not None
                    else "Pending"
                }
            </td>
            <td>
                {
                    f'{item["actual_error_pct"]:.2f}%'
                    if item["actual_error_pct"] is not None
                    else "Pending"
                }
            </td>
            <td>{escape(str(item["status"]))}</td>
        </tr>
        """
        for item in recent
    )

    mean_error = summary["mean_error_pct"]

    html = f"""
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>CostGate Dashboard</title>
<style>
body {{
    font-family: Inter, Arial, sans-serif;
    max-width: 1200px;
    margin: 40px auto;
    padding: 0 24px;
    background: #f6f7f9;
    color: #222;
}}
h1 {{ margin-bottom: 4px; }}
.subtitle {{ color: #666; margin-bottom: 28px; }}
.cards {{
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
}}
.card {{
    background: white;
    padding: 20px;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0,0,0,.06);
}}
.label {{ color: #666; font-size: 13px; }}
.value {{ font-size: 27px; font-weight: 700; margin-top: 7px; }}
section {{
    margin-top: 28px;
    background: white;
    padding: 22px;
    border-radius: 12px;
}}
table {{
    width: 100%;
    border-collapse: collapse;
}}
th, td {{
    padding: 12px;
    border-bottom: 1px solid #eee;
    text-align: left;
}}
th {{ background: #fafafa; }}
.note {{
    margin-top: 24px;
    color: #777;
    font-size: 12px;
}}
</style>
</head>

<body>
<h1>CostGate</h1>
<div class="subtitle">Git blame for your cloud bill</div>

<div class="cards">
    <div class="card">
        <div class="label">Predicted monthly impact</div>
        <div class="value">
            ${summary["total_predicted_monthly"]:.2f}
        </div>
    </div>

    <div class="card">
        <div class="label">Verified monthly impact</div>
        <div class="value">
            ${summary["total_verified_monthly"]:.2f}
        </div>
    </div>

    <div class="card">
        <div class="label">Mean prediction error</div>
        <div class="value">
            {f"{mean_error:.2f}%" if mean_error is not None else "Pending"}
        </div>
    </div>

    <div class="card">
        <div class="label">Predictions</div>
        <div class="value">
            {summary["prediction_count"]}
        </div>
    </div>
</div>

<section>
<h2>Cost by author</h2>
<table>
<thead>
<tr>
<th>Author</th>
<th>PRs</th>
<th>Predicted / month</th>
<th>Verified / month</th>
<th>Mean error</th>
</tr>
</thead>
<tbody>
{author_rows}
</tbody>
</table>
</section>

<section>
<h2>Recent predictions</h2>
<table>
<thead>
<tr>
<th>PR</th>
<th>Author</th>
<th>Predicted</th>
<th>Verified</th>
<th>Error</th>
<th>Status</th>
</tr>
</thead>
<tbody>
{recent_rows}
</tbody>
</table>
</section>

<div class="note">
Billing verification is currently demonstrated with simulated
CUR-like resource-level data. Production AWS CUR ingestion is the
next billing integration.
</div>

</body>
</html>
"""

    return {
        "statusCode": 200,
        "headers": {
            "Content-Type": "text/html; charset=utf-8",
        },
        "body": html,
    }


def lambda_handler(
    event: dict[str, Any],
    context: Any,
) -> dict[str, Any]:
    items = _scan_all()

    path = event.get("rawPath", "")

    if path == "/api/dashboard/summary":
        return _json_response(_summary(items))

    if path == "/api/dashboard/authors":
        return _json_response(_authors(items))

    if path == "/api/dashboard/predictions":
        return _json_response(_recent(items))

    return _html_response(items)