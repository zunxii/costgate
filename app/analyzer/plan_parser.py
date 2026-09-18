from __future__ import annotations

from typing import Any

from app.domain.enums import ScanType
from app.domain.errors import PlanParseError
from app.domain.models import PlanMetrics


def _map_scan_type(node_type: str) -> ScanType:
    """Map PostgreSQL node type to our internal enum."""
    mapping = {
        "Seq Scan": ScanType.SEQ_SCAN,
        "Index Scan": ScanType.INDEX_SCAN,
        "Bitmap Index Scan": ScanType.BITMAP_INDEX_SCAN,
        "Bitmap Heap Scan": ScanType.BITMAP_HEAP_SCAN,
    }

    return mapping.get(node_type, ScanType.UNKNOWN)


def _find_index_name(plan: dict[str, Any]) -> str | None:
    """
    Recursively search the PostgreSQL plan tree for an Index Name.
    """
    if "Index Name" in plan:
        return plan["Index Name"]

    for child in plan.get("Plans", []):
        if isinstance(child, dict):
            index_name = _find_index_name(child)
            if index_name:
                return index_name

    return None


def _find_scan_node(plan: dict[str, Any]) -> dict[str, Any]:
    """
    Find the most relevant scan node in the plan tree.

    For our MVP, we care about the first scan node encountered.
    """
    node_type = plan.get("Node Type")

    scan_types = {
        "Seq Scan",
        "Index Scan",
        "Bitmap Index Scan",
        "Bitmap Heap Scan",
    }

    if node_type in scan_types:
        return plan

    for child in plan.get("Plans", []):
        if isinstance(child, dict):
            result = _find_scan_node(child)
            if result:
                return result

    raise PlanParseError("No supported scan node found in PostgreSQL plan")


def parse_explain_json(explain_result: list[dict[str, Any]]) -> PlanMetrics:
    """
    Convert PostgreSQL EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
    output into our internal PlanMetrics model.
    """
    try:
        if not explain_result:
            raise PlanParseError("EXPLAIN result is empty")

        root = explain_result[0]

        if "Plan" not in root:
            raise PlanParseError("EXPLAIN result does not contain a Plan")

        plan = root["Plan"]
        scan_node = _find_scan_node(plan)

        node_type = scan_node.get("Node Type", "Unknown")
        scan_type = _map_scan_type(node_type)

        index_name = _find_index_name(plan)

        index_used = index_name is not None or scan_type in {
            ScanType.INDEX_SCAN,
            ScanType.BITMAP_INDEX_SCAN,
            ScanType.BITMAP_HEAP_SCAN,
        }

        actual_rows = int(plan.get("Actual Rows", 0))
        actual_execution_time = float(root.get("Execution Time", 0.0))
        planning_time = float(root.get("Planning Time", 0.0))

        shared_hit_blocks = int(
            scan_node.get("Shared Hit Blocks", plan.get("Shared Hit Blocks", 0))
        )
        shared_read_blocks = int(
            scan_node.get("Shared Read Blocks", plan.get("Shared Read Blocks", 0))
        )
        shared_dirtied_blocks = int(
            scan_node.get(
                "Shared Dirtied Blocks",
                plan.get("Shared Dirtied Blocks", 0),
            )
        )
        shared_written_blocks = int(
            scan_node.get(
                "Shared Written Blocks",
                plan.get("Shared Written Blocks", 0),
            )
        )

        estimated_plan_cost = float(plan.get("Total Cost", 0.0))

        return PlanMetrics(
            scan_type=scan_type,
            index_used=index_used,
            index_name=index_name,
            rows_returned=actual_rows,
            execution_time_ms=actual_execution_time,
            planning_time_ms=planning_time,
            shared_hit_blocks=shared_hit_blocks,
            shared_read_blocks=shared_read_blocks,
            shared_dirtied_blocks=shared_dirtied_blocks,
            shared_written_blocks=shared_written_blocks,
            estimated_plan_cost=estimated_plan_cost,
            raw_plan=root,
        )

    except PlanParseError:
        raise
    except (TypeError, ValueError, KeyError) as exc:
        raise PlanParseError(
            f"Failed to parse PostgreSQL EXPLAIN output: {exc}"
        ) from exc