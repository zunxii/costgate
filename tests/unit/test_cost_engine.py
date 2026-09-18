from decimal import Decimal

from app.cost_engine.assumptions import CostAssumptions
from app.cost_engine.pricing import get_rds_pricing


def test_valid_cost_assumptions():
    assumptions = CostAssumptions(
        monthly_requests=2_000_000,
        db_instance_hourly_cost_usd=0.036,
    )

    assumptions.validate()


def test_invalid_monthly_requests():
    assumptions = CostAssumptions(
        monthly_requests=0,
        db_instance_hourly_cost_usd=0.036,
    )

    try:
        assumptions.validate()
    except ValueError:
        return

    raise AssertionError("Expected ValueError")


def test_rds_pricing():
    pricing = get_rds_pricing(
        region="eu-north-1",
        engine="postgresql",
        instance_class="db.t4g.small",
        db_instance_hourly_usd="0.036",
    )

    assert pricing.region == "eu-north-1"
    assert pricing.engine == "postgresql"
    assert pricing.instance_class == "db.t4g.small"

    assert pricing.db_instance_hourly_usd == Decimal("0.036")
    assert pricing.db_instance_monthly_usd == Decimal("26.280")