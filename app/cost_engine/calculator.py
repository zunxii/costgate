from __future__ import annotations

from decimal import Decimal, ROUND_HALF_UP

from app.domain.enums import CostDirection
from app.domain.models import CostEstimate, PlanComparison

from .assumptions import CostAssumptions
from .pricing import RDSPricing
from .confidence import determine_confidence


MILLISECONDS_PER_SECOND = Decimal("1000")
SECONDS_PER_HOUR = Decimal("3600")
DEFAULT_UNCERTAINTY = Decimal("0.20")


def _direction(delta: Decimal) -> CostDirection:
    if delta > 0:
        return CostDirection.INCREASE

    if delta < 0:
        return CostDirection.DECREASE

    return CostDirection.NEUTRAL


def _bounds(
    value: Decimal,
    uncertainty: Decimal,
) -> tuple[Decimal, Decimal]:
    """
    Create a simple uncertainty range around the estimate.

    This is an engineering estimate, not a statistical confidence
    interval.
    """
    low = value * (Decimal("1") - uncertainty)
    high = value * (Decimal("1") + uncertainty)

    return min(low, high), max(low, high)


def calculate_cost_impact(
    comparison: PlanComparison,
    assumptions: CostAssumptions,
    pricing: RDSPricing,
    *,
    uncertainty: Decimal = DEFAULT_UNCERTAINTY,
) -> CostEstimate:
    """
    Estimate the monthly attributed database compute-cost impact.

    Formula:

        execution_time_delta
        × monthly_requests
        × effective_parallelism
        × db_instance_hourly_price

    converted into hours.

    Positive result:
        candidate query consumes more compute time.

    Negative result:
        candidate query consumes less compute time.

    Important:
        This is an attributed infrastructure-impact estimate,
        not an exact AWS bill delta.
    """

    assumptions.validate()

    if uncertainty < 0 or uncertainty >= 1:
        raise ValueError(
            "uncertainty must be between 0 and 1."
        )

    baseline_seconds = (
        Decimal(str(comparison.baseline.execution_time_ms))
        / MILLISECONDS_PER_SECOND
    )

    candidate_seconds = (
        Decimal(str(comparison.candidate.execution_time_ms))
        / MILLISECONDS_PER_SECOND
    )

    execution_delta_seconds = candidate_seconds - baseline_seconds

    monthly_compute_seconds = (
        execution_delta_seconds
        * Decimal(assumptions.monthly_requests)
        * Decimal(str(assumptions.effective_parallelism))
    )

    monthly_compute_hours = (
        monthly_compute_seconds / SECONDS_PER_HOUR
    )

    monthly_delta = (
        monthly_compute_hours
        * pricing.db_instance_hourly_usd
        * Decimal(str(assumptions.billing_multiplier))
    )

    monthly_delta = monthly_delta.quantize(
        Decimal("0.01"),
        rounding=ROUND_HALF_UP,
    )

    lower_bound, upper_bound = _bounds(
        monthly_delta,
        uncertainty,
    )

    lower_bound = lower_bound.quantize(
        Decimal("0.01"),
        rounding=ROUND_HALF_UP,
    )

    upper_bound = upper_bound.quantize(
        Decimal("0.01"),
        rounding=ROUND_HALF_UP,
    )

    return CostEstimate(
        monthly_delta=monthly_delta,
        lower_bound=lower_bound,
        upper_bound=upper_bound,
        # We will replace this with the dedicated confidence
        # system once confidence.py is implemented.
        confidence=determine_confidence(comparison),
        direction=_direction(monthly_delta),
        assumptions={
            "method": "attributed_database_compute",
            "monthly_requests": assumptions.monthly_requests,
            "effective_parallelism": assumptions.effective_parallelism,
            "billing_multiplier": assumptions.billing_multiplier,
            "db_instance": pricing.instance_class,
            "db_hourly_price_usd": str(
                pricing.db_instance_hourly_usd
            ),
            "uncertainty": str(uncertainty),
        },
    )