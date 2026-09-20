from __future__ import annotations

import html
import os
from collections import defaultdict
from decimal import Decimal
from pathlib import Path

import boto3
from dotenv import load_dotenv

load_dotenv(".env")

TABLE_NAME = os.environ["PREDICTION_TABLE_NAME"]

table = boto3.resource(
    "dynamodb",
    region_name="eu-north-1",
).Table(TABLE_NAME)

items = table.scan()["Items"]

authors = defaultdict(
    lambda: {
        "predicted": Decimal("0"),
        "actual": Decimal("0"),
        "errors": [],
        "prs": 0,
    }
)

for item in items:
    author = item.get("author", "unknown")
    data = authors[author]

    data["prs"] += 1
    data["predicted"] += Decimal(str(item.get("predicted_monthly_delta", 0)))

    if item.get("status") == "reconciled":
        data["actual"] += Decimal(str(item.get("actual_monthly_delta", 0)))
        data["errors"].append(
            Decimal(str(item.get("actual_error_pct", 0)))
        )

rows = []

for author, data in authors.items():
    mean_error = (
        sum(data["errors"], Decimal("0")) / len(data["errors"])
        if data["errors"]
        else None
    )

    rows.append(
        f"""
        <tr>
            <td>{html.escape(author)}</td>
            <td>{data["prs"]}</td>
            <td>${data["predicted"]:.2f}</td>
            <td>${data["actual"]:.2f}</td>
            <td>{f"{mean_error:.2f}%" if mean_error is not None else "Pending"}</td>
        </tr>
        """
    )

total_predicted = sum(
    (v["predicted"] for v in authors.values()),
    Decimal("0"),
)

total_actual = sum(
    (v["actual"] for v in authors.values()),
    Decimal("0"),
)

all_errors = [
    error
    for data in authors.values()
    for error in data["errors"]
]

mean_error = (
    sum(all_errors, Decimal("0")) / len(all_errors)
    if all_errors
    else None
)

html_content = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>CostGate — Cloud Cost Attribution</title>
    <style>
        body {{
            font-family: Arial, sans-serif;
            max-width: 1100px;
            margin: 40px auto;
            padding: 0 24px;
            background: #f6f7f9;
            color: #222;
        }}

        h1 {{
            margin-bottom: 4px;
        }}

        .subtitle {{
            color: #666;
            margin-bottom: 30px;
        }}

        .cards {{
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 16px;
        }}

        .card {{
            background: white;
            padding: 24px;
            border-radius: 12px;
            box-shadow: 0 2px 8px rgba(0,0,0,.06);
        }}

        .value {{
            font-size: 28px;
            font-weight: bold;
            margin-top: 8px;
        }}

        table {{
            width: 100%;
            border-collapse: collapse;
            margin-top: 30px;
            background: white;
        }}

        th, td {{
            padding: 14px;
            border-bottom: 1px solid #eee;
            text-align: left;
        }}

        th {{
            background: #fafafa;
        }}

        .note {{
            margin-top: 24px;
            color: #777;
            font-size: 13px;
        }}
    </style>
</head>

<body>
    <h1>CostGate</h1>
    <div class="subtitle">
        Git blame for your cloud bill
    </div>

    <div class="cards">
        <div class="card">
            <div>Total predicted monthly impact</div>
            <div class="value">${total_predicted:.2f}</div>
        </div>

        <div class="card">
            <div>Total verified monthly impact</div>
            <div class="value">${total_actual:.2f}</div>
        </div>

        <div class="card">
            <div>Mean prediction error</div>
            <div class="value">
                {f"{mean_error:.2f}%" if mean_error is not None else "Pending"}
            </div>
        </div>
    </div>

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
            {"".join(rows)}
        </tbody>
    </table>

    <div class="note">
        Billing verification is currently demonstrated with synthetic
        CUR-like data. Production reconciliation will consume actual
        AWS billing exports.
    </div>
</body>
</html>
"""

output = Path("dashboard")
output.mkdir(exist_ok=True)

path = output / "costgate_dashboard.html"
path.write_text(html_content)

print(f"Dashboard written to: {path}")
print(f"Authors: {len(authors)}")
print(f"Predicted monthly impact: ${total_predicted:.2f}")
print(f"Verified monthly impact: ${total_actual:.2f}")
print(
    "Mean prediction error:",
    f"{mean_error:.2f}%" if mean_error is not None else "Pending",
)