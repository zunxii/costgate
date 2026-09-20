from decimal import Decimal

from app.learning.calibrator import calibrate_prediction


def test_calibration_requires_minimum_history():
    result = calibrate_prediction(
        predicted_monthly_delta=Decimal("10"),
        verified_predictions=[
            (Decimal("10"), Decimal("12")),
        ],
        minimum_samples=3,
    )

    assert result.applied is False
    assert result.calibrated_monthly_delta == Decimal("10")


def test_calibration_applies_historical_bias():
    result = calibrate_prediction(
        predicted_monthly_delta=Decimal("10"),
        verified_predictions=[
            (Decimal("10"), Decimal("12")),
            (Decimal("20"), Decimal("24")),
            (Decimal("5"), Decimal("6")),
        ],
        minimum_samples=3,
    )

    assert result.applied is True
    assert result.sample_count == 3
    assert result.bias_factor == Decimal("1.2")
    assert result.calibrated_monthly_delta == Decimal("12")