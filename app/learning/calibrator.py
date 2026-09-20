from __future__ import annotations

from dataclasses import dataclass
from decimal import Decimal
from typing import Iterable


@dataclass(frozen=True)
class CalibrationResult:
    calibrated_monthly_delta: Decimal
    bias_factor: Decimal
    sample_count: int
    applied: bool


def calibrate_prediction(
    *,
    predicted_monthly_delta: Decimal,
    verified_predictions: Iterable[tuple[Decimal, Decimal]],
    minimum_samples: int = 3,
) -> CalibrationResult:
    observations = list(verified_predictions)

    if not observations or len(observations) < minimum_samples:
        return CalibrationResult(
            calibrated_monthly_delta=predicted_monthly_delta,
            bias_factor=Decimal("1"),
            sample_count=len(observations),
            applied=False,
        )

    ratios = [
        actual / predicted
        for predicted, actual in observations
        if predicted != 0
    ]

    if not ratios:
        return CalibrationResult(
            calibrated_monthly_delta=predicted_monthly_delta,
            bias_factor=Decimal("1"),
            sample_count=0,
            applied=False,
        )

    bias_factor = sum(
        ratios,
        Decimal("0"),
    ) / Decimal(len(ratios))

    return CalibrationResult(
        calibrated_monthly_delta=(
            predicted_monthly_delta * bias_factor
        ),
        bias_factor=bias_factor,
        sample_count=len(ratios),
        applied=True,
    )