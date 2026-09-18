import json
from pathlib import Path

from app.analyzer.comparator import compare_plans
from app.analyzer.plan_parser import parse_explain_json
from app.domain.enums import ScanType


FIXTURES_DIR = Path(__file__).resolve().parents[1] / "fixtures"


def load_fixture(filename: str):
    path = FIXTURES_DIR / filename

    with path.open("r", encoding="utf-8") as file:
        return json.load(file)


def test_compare_baseline_and_optimized_plans():
    baseline = parse_explain_json(
        load_fixture("seq_scan_plan.json")
    )

    optimized = parse_explain_json(
        load_fixture("bitmap_scan_plan.json")
    )

    comparison = compare_plans(baseline, optimized)

    # The optimized query should be faster.
    assert comparison.execution_time_delta_ms < 0

    # Baseline / candidate gives the improvement ratio.
    assert comparison.execution_time_ratio > 100

    # The scan strategy changed.
    assert comparison.scan_type_changed is True

    # Index usage changed from false -> true.
    assert comparison.index_usage_changed is True

    # Optimized query should touch fewer shared blocks.
    assert comparison.shared_blocks_delta < 0

    assert baseline.scan_type == ScanType.SEQ_SCAN
    assert optimized.scan_type == ScanType.BITMAP_HEAP_SCAN


def test_compare_identical_plans():
    plan = parse_explain_json(
        load_fixture("bitmap_scan_plan.json")
    )

    comparison = compare_plans(plan, plan)

    assert comparison.execution_time_delta_ms == 0
    assert comparison.execution_time_ratio == 1
    assert comparison.shared_blocks_delta == 0
    assert comparison.index_usage_changed is False
    assert comparison.scan_type_changed is False