from __future__ import annotations

import json
import os
from typing import Any

import boto3

from app.pipeline.pr_event_processor import (
    LambdaAnalysisInvoker,
    PullRequestEventProcessor,
)


lambda_client = boto3.client("lambda")


def lambda_handler(
    event: dict[str, Any],
    context: Any,
) -> dict[str, Any]:
    function_name = os.getenv(
        "ANALYSIS_FUNCTION_NAME"
    )

    if not function_name:
        raise RuntimeError(
            "ANALYSIS_FUNCTION_NAME is not configured."
        )

    processor = PullRequestEventProcessor(
        analysis_function_name=function_name,
        analysis_invoker=LambdaAnalysisInvoker(
            lambda_client
        ),
    )

    for record in event.get("Records", []):
        message = json.loads(
            record["body"]
        )

        repository = message["repository"]
        pull_number = int(
            message["pull_number"]
        )

        owner, repo = repository.split(
            "/",
            maxsplit=1,
        )

        processor.process(
            owner=owner,
            repo=repo,
            pull_number=pull_number,
        )

    return {
        "status": "success",
    }