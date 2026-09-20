from __future__ import annotations
from app.github.app_auth import GitHubAppAuthenticator
from app.github.client import GitHubClient
from app.auth.repository import PRStudioJobRepository

import json
import os
from datetime import datetime, timezone
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
    # PR Studio uses the same production processor asynchronously so the web
    # request never blocks on GitHub + VPC analysis latency.
    if event.get("type") == "pr_studio":
        job_repo = None
        try:
            from app.auth.repository import PRStudioJobRepository

            job_repo = PRStudioJobRepository()
            job_id = str(event["job_id"])
            job_repo.update(job_id, status="running", started_at=datetime.now(timezone.utc).isoformat())

            processor = PullRequestEventProcessor(
                analysis_function_name=os.getenv("ANALYSIS_FUNCTION_NAME", ""),
                analysis_invoker=LambdaAnalysisInvoker(lambda_client),
                installation_id=str(event["installation_id"]),
                user_id=str(event["user_id"]),
            )
            owner, repo = str(event["repository"]).split("/", maxsplit=1)
            result = processor.process(
                owner=owner,
                repo=repo,
                pull_number=int(event["pull_number"]),
                user_id=str(event["user_id"]),
                installation_id=str(event["installation_id"]),
            )
            job_repo.update(
                job_id,
                status="succeeded",
                completed_at=datetime.now(timezone.utc).isoformat(),
                result=result,
            )
            return {"status": "success", "job_id": job_id, "result": result}
        except Exception as exc:
            print(f"PR Studio job failed: {exc}")
            if job_repo is not None:
                try:
                    job_repo.update(job_id, status="failed", completed_at=datetime.now(timezone.utc).isoformat(), error=str(exc))
                except Exception as update_exc:
                    print(f"Could not update PR Studio job failure state: {update_exc}")
            return {"status": "error", "error": str(exc)}

    function_name = os.getenv(
        "ANALYSIS_FUNCTION_NAME"
    )

    if not function_name:
        raise RuntimeError(
            "ANALYSIS_FUNCTION_NAME is not configured."
        )

    for record in event.get("Records", []):
        message = json.loads(
            record["body"]
        )

        repository = message["repository"]
        pull_number = int(
            message["pull_number"]
        )
        installation_id = message.get("installation_id")

        owner, repo = repository.split(
            "/",
            maxsplit=1,
        )

        processor = PullRequestEventProcessor(
            analysis_function_name=function_name,
            analysis_invoker=LambdaAnalysisInvoker(lambda_client),
            installation_id=str(installation_id) if installation_id else None,
        )

        if message.get("action") == "closed" and message.get("merged"):
            scheduled = processor.schedule_verification(
                owner=owner,
                repo=repo,
                pull_number=pull_number,
                head_sha=message.get("head_sha"),
                merged_at=message.get("merged_at"),
                delivery_id=message.get("delivery_id"),
            )
            if scheduled.get("status") == "prediction_not_found":
                raise RuntimeError(
                    "Merged PR prediction is not persisted yet; retrying SQS message."
                )
        else:
            processor.process(
                owner=owner,
                repo=repo,
                pull_number=pull_number,
                delivery_id=message.get("delivery_id"),
                installation_id=installation_id,
            )

    return {
        "status": "success",
    }


def _is_pr_studio_event(event):
    return (
        isinstance(event, dict)
        and event.get("type") == "pr_studio"
    )


def _process_pr_studio_job(
    payload,
):
    job_id = payload["job_id"]
    user_id = payload["user_id"]
    repository = payload["repository"]
    pull_number = int(
        payload["pull_number"]
    )
    installation_id = str(
        payload["installation_id"]
    )

    job_repo = PRStudioJobRepository()

    job_repo.update(
        job_id,
        status="running",
    )

    try:
        owner, repo = repository.split(
            "/",
            1,
        )

        github_client = GitHubClient(
            authenticator=
                GitHubAppAuthenticator(
                    installation_id=
                        installation_id
                )
        )

        pull_request = github_client.get_pull_request(
                owner,
                repo,
                pull_number,
            )

        files =github_client.get_pull_request_files(
                owner,
                repo,
                pull_number,
            )

        # IMPORTANT:
        # feed these real PR contents into
        # your existing PullRequestEventProcessor.
        #
        # Do NOT create a second analysis engine.

        result = _run_existing_costgate_processor(
            user_id=user_id,
            repository=repository,
            pull_request=pull_request,
            files=files,
            installation_id=installation_id,
        )

        job_repo.update(
            job_id,
            status="succeeded",
            result=result,
        )

        return result

    except Exception as exc:
        job_repo.update(
            job_id,
            status="failed",
            error=str(exc),
        )

        raise

def _run_existing_costgate_processor(
    user_id: str,
    repository: str,
    pull_request: dict,
    files: list,
    installation_id: str,
) -> dict:
    """Run the existing CostGate processor for a PR.

    This function reuses the existing PullRequestEventProcessor to analyze a
    pull request using the provided data. It returns the processor result.
    """
    function_name = os.getenv("ANALYSIS_FUNCTION_NAME", "")
    if not function_name:
        raise RuntimeError("ANALYSIS_FUNCTION_NAME is not configured.")

    processor = PullRequestEventProcessor(
        analysis_function_name=function_name,
        analysis_invoker=LambdaAnalysisInvoker(lambda_client),
        installation_id=str(installation_id) if installation_id else None,
    )

    try:
        owner, repo = repository.split("/", 1)
    except Exception as exc:
        raise ValueError(f"Invalid repository format '{repository}': {exc}")

    if isinstance(pull_request, dict):
        pull_number = int(pull_request.get("number") or pull_request.get("pull_number"))
    else:
        pull_number = int(getattr(pull_request, "number", None))

    result = processor.process(
        owner=owner,
        repo=repo,
        pull_number=pull_number,
        user_id=str(user_id),
        installation_id=installation_id,
    )
    return result