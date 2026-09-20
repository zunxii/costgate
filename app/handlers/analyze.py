from __future__ import annotations

import json
import os
from decimal import Decimal
from typing import Any

from app.analyzer.query_analyzer import QueryAnalyzer
from app.cost_engine.assumptions import CostAssumptions
from app.cost_engine.pricing import get_rds_pricing
from app.domain.errors import CostGateError
from app.domain.models import ChangedQuery
from app.github.comment_renderer import CostGateCommentRenderer
from app.pipeline.analysis_service import AnalysisService


def _required_env(name: str) -> str:
    value = os.getenv(name)

    if not value:
        raise RuntimeError(
            f"Required environment variable is missing: {name}"
        )

    return value


def lambda_handler(
    event: dict[str, Any],
    context: Any,
) -> dict[str, Any]:
    """
    Analyze one ChangedQuery against the shadow PostgreSQL database.

    This Lambda is intended to run inside the RDS VPC and does not
    communicate with GitHub directly.
    """

    try:
        baseline_sql = event["baseline_sql"]
        candidate_sql = event["candidate_sql"]
        file_path = event["file_path"]

        changed_query = ChangedQuery(
            baseline_sql=baseline_sql,
            candidate_sql=candidate_sql,
            file_path=file_path,
        )

        assumptions = CostAssumptions(
            monthly_requests=int(
                _required_env("COSTGATE_MONTHLY_REQUESTS")
            ),
            db_instance_hourly_cost_usd=Decimal(
                _required_env("RDS_INSTANCE_HOURLY_USD")
            ),
        )

        pricing = get_rds_pricing(
            region=_required_env("RDS_REGION"),
            engine=_required_env("RDS_ENGINE"),
            instance_class=_required_env("RDS_INSTANCE_CLASS"),
            db_instance_hourly_usd=_required_env(
                "RDS_INSTANCE_HOURLY_USD"
            ),
        )

        analysis_service = AnalysisService(
            analyzer=QueryAnalyzer(),
            assumptions=assumptions,
            pricing=pricing,
        )

        result = analysis_service.analyze(changed_query)

        comment_body = CostGateCommentRenderer().render(result)

        return {
            "status": "success",
            "comment_body": comment_body,

            "monthly_delta": str(
                result.cost_estimate.monthly_delta
            ),
            "lower_bound": str(
                result.cost_estimate.lower_bound
            ),
            "upper_bound": str(
                result.cost_estimate.upper_bound
            ),

            "confidence": result.cost_estimate.confidence.value,
            "direction": result.cost_estimate.direction.value,

            "baseline_execution_ms": (
                result.baseline.execution_time_ms
            ),
            "candidate_execution_ms": (
                result.candidate.execution_time_ms
            ),

            "baseline_rows": result.baseline.rows_returned,
            "candidate_rows": result.candidate.rows_returned,

            "baseline_scan_type": (
                result.baseline.scan_type.value
            ),
            "candidate_scan_type": (
                result.candidate.scan_type.value
            ),

            "resource_id": _required_env(
                "RDS_RESOURCE_ID"
            ),
        }

    except CostGateError as exc:
        return {
            "status": "error",
            "error": str(exc),
        }

    except (KeyError, ValueError, TypeError) as exc:
        return {
            "status": "error",
            "error": f"Invalid analysis request: {exc}",
        }

    except Exception as exc:
        # Keep the Lambda response JSON-safe while allowing
        # CloudWatch to capture the actual failure.
        print(f"Unhandled analysis error: {exc}")

        return {
            "status": "error",
            "error": "Internal analysis error.",
        }