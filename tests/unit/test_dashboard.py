from app.handlers.dashboard import _summary


def test_dashboard_summary():
    items = [
        {
            "predicted_monthly_delta": 0.80,
            "actual_monthly_delta": 0.84,
            "actual_error_pct": 5,
            "status": "reconciled",
        },
        {
            "predicted_monthly_delta": 2.00,
            "status": "predicted",
        },
    ]

    result = _summary(items)

    assert result["prediction_count"] == 2
    assert result["reconciled_count"] == 1
    assert result["total_predicted_monthly"] == 2.8
    assert result["total_verified_monthly"] == 0.84
    assert result["mean_error_pct"] == 5.0

from decimal import Decimal

from app.handlers.dashboard import _json_response


def test_json_response_serializes_decimal():
    response = _json_response(
        {
            "predicted": Decimal("0.80"),
            "error": Decimal("5.00"),
        }
    )

    assert response["statusCode"] == 200
    assert '"predicted": 0.8' in response["body"]
    assert '"error": 5.0' in response["body"]