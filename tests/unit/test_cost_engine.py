from decimal import Decimal

from app.cost_engine.assumptions import CostAssumptions
from app.cost_engine.pricing import get_rds_pricing
from app.analyzer.comparator import compare_plans
from app.analyzer.plan_parser import parse_explain_json
from app.cost_engine.calculator import calculate_cost_impact
from app.domain.enums import ConfidenceLevel, CostDirection
import json
from pathlib import Path

FIXTURES_DIR = Path(__file__).resolve().parents[1] / "fixtures"

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

def load_fixture(filename: str):
    path = FIXTURES_DIR / filename

    with path.open("r", encoding="utf-8") as file:
        return json.load(file)


def test_cost_increase():
    baseline = parse_explain_json(
        load_fixture("bitmap_scan_plan.json")
    )

    candidate = parse_explain_json(
        load_fixture("seq_scan_plan.json")
    )

    comparison = compare_plans(
        baseline,
        candidate,
    )

    assumptions = CostAssumptions(
        monthly_requests=1_000_000,
        db_instance_hourly_cost_usd=0.036,
    )

    pricing = get_rds_pricing(
        region="eu-north-1",
        engine="postgresql",
        instance_class="db.t4g.small",
        db_instance_hourly_usd="0.036",
    )

    estimate = calculate_cost_impact(
        comparison,
        assumptions,
        pricing,
    )

    assert estimate.direction == CostDirection.INCREASE
    assert estimate.monthly_delta > Decimal("0")
    assert estimate.lower_bound < estimate.monthly_delta
    assert estimate.upper_bound > estimate.monthly_delta
    assert estimate.confidence == ConfidenceLevel.MEDIUM


def test_cost_decrease():
    baseline = parse_explain_json(
        load_fixture("seq_scan_plan.json")
    )

    candidate = parse_explain_json(
        load_fixture("bitmap_scan_plan.json")
    )

    comparison = compare_plans(
        baseline,
        candidate,
    )

    assumptions = CostAssumptions(
        monthly_requests=1_000_000,
        db_instance_hourly_cost_usd=0.036,
    )

    pricing = get_rds_pricing(
        region="eu-north-1",
        engine="postgresql",
        instance_class="db.t4g.small",
        db_instance_hourly_usd="0.036",
    )

    estimate = calculate_cost_impact(
        comparison,
        assumptions,
        pricing,
    )

    assert estimate.direction == CostDirection.DECREASE
    assert estimate.monthly_delta < Decimal("0")
    assert estimate.lower_bound < estimate.upper_bound