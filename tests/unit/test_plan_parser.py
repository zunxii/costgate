import json
from pathlib import Path

from app.analyzer.plan_parser import parse_explain_json
from app.domain.enums import ScanType


FIXTURES_DIR = Path(__file__).resolve().parents[1] / "fixtures"


def load_fixture(filename: str):
    path = FIXTURES_DIR / filename

    with path.open("r", encoding="utf-8") as file:
        return json.load(file)


def test_parse_seq_scan_plan():
    explain_result = load_fixture("seq_scan_plan.json")

    metrics = parse_explain_json(explain_result)

    assert metrics.scan_type == ScanType.SEQ_SCAN
    assert metrics.index_used is False
    assert metrics.index_name is None

    assert metrics.rows_returned == 6
    assert metrics.execution_time_ms > 0
    assert metrics.planning_time_ms > 0

    assert metrics.shared_hit_blocks > 0
    assert metrics.estimated_plan_cost > 0


def test_parse_bitmap_scan_plan():
    explain_result = load_fixture("bitmap_scan_plan.json")

    metrics = parse_explain_json(explain_result)

    assert metrics.scan_type == ScanType.BITMAP_HEAP_SCAN
    assert metrics.index_used is True
    assert metrics.index_name == "idx_orders_customer_id"

    assert metrics.rows_returned == 6
    assert metrics.execution_time_ms > 0
    assert metrics.planning_time_ms > 0

    assert metrics.shared_hit_blocks > 0
    assert metrics.estimated_plan_cost > 0