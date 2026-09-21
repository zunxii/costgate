from __future__ import annotations

import hashlib
import json
import os
from datetime import datetime, time as dt_time, timedelta, timezone
from decimal import Decimal
from typing import Any, Protocol

import boto3

from app.bedrock.explanation import (
    CostGateExplainer,
    ExplanationUnavailable,
)
from app.github.check_publisher import GitHubCheckPublisher
from app.policy.cost_policy import CostPolicy
from app.domain.errors import QueryExtractionError
from app.github.comment_publisher import GitHubCommentPublisher
from app.github.pr_reader import PullRequestReader
from app.github.client import GitHubClient
from app.github.app_auth import GitHubAppAuthenticator
from app.auth.repository import ConnectionRepository, PolicyRepository
from app.ledger.models import PredictionRecord
from app.ledger.repository import PredictionLedger
from app.query_extractor.detectors import detect_changed_query


class AnalysisInvoker(Protocol):
    def invoke(
        self,
        function_name: str,
        payload: dict[str, Any],
    ) -> dict[str, Any]:
        ...


class PullRequestEventProcessor:
    """
    Processes a queued GitHub PR event.

    Responsibilities:
        SQS event
        -> read PR from GitHub
        -> extract changed SQL
        -> invoke VPC analysis Lambda
        -> optionally generate a Bedrock explanation
        -> publish comment to GitHub
        -> save prediction record to ledger
    """

    def __init__(
        self,
        *,
        analysis_function_name: str,
        analysis_invoker: AnalysisInvoker | None,
        pr_reader: PullRequestReader | None = None,
        publisher: GitHubCommentPublisher | None = None,
        ledger: PredictionLedger | None = None,
        explainer: CostGateExplainer | None = None,
        check_publisher: GitHubCheckPublisher | None = None,
        policy: CostPolicy | None = None,
        installation_id: str | None = None,
        user_id: str | None = None,
    ) -> None:
        self.analysis_function_name = analysis_function_name
        self.analysis_invoker = analysis_invoker or LambdaAnalysisInvoker(boto3.client("lambda"))
        self.user_id = user_id
        if installation_id and not pr_reader:
            github_client = GitHubClient(
                authenticator=GitHubAppAuthenticator(installation_id=installation_id)
            )
            pr_reader = PullRequestReader(client=github_client)
            publisher = publisher or GitHubCommentPublisher(client=github_client)
            check_publisher = check_publisher or GitHubCheckPublisher(client=github_client)
        self.pr_reader = pr_reader or PullRequestReader()
        self.publisher = publisher or GitHubCommentPublisher()
        self.check_publisher = check_publisher or GitHubCheckPublisher()

        # Explicit test/invocation policies win; otherwise the authenticated
        # user's persisted policy is resolved after the repository owner is known.
        self.policy_override = policy
        self.enable_check = os.getenv(
            "COSTGATE_ENABLE_CHECK",
            "false",
        ).lower() in ("1", "true", "yes")

        self.ledger = ledger or PredictionLedger(
            table_name=os.getenv(
                "PREDICTION_TABLE_NAME",
                "costgate-predictions",
            )
        )

        self.explainer = explainer or CostGateExplainer()

        self.enable_explanation = os.getenv(
            "COSTGATE_ENABLE_EXPLANATION",
            "false",
        ).lower() in ("1", "true", "yes")


    @staticmethod
    def _prediction_id(owner: str, repo: str, pull_number: int, head_sha: str) -> str:
        return hashlib.sha256(
            f"{owner}/{repo}:{pull_number}:{head_sha}".encode("utf-8")
        ).hexdigest()[:32]

    @staticmethod
    def _verification_windows(merged_at: str) -> dict[str, str]:
        parsed = datetime.fromisoformat(merged_at.replace("Z", "+00:00"))
        if parsed.tzinfo is None:
            parsed = parsed.replace(tzinfo=timezone.utc)
        parsed = parsed.astimezone(timezone.utc)

        candidate_start = datetime.combine(
            parsed.date() + timedelta(days=1),
            dt_time.min,
            tzinfo=timezone.utc,
        )
        candidate_end = candidate_start + timedelta(days=1)
        baseline_start = candidate_start - timedelta(days=1)
        baseline_end = candidate_start

        delay_hours = max(
            0,
            int(os.getenv("COSTGATE_VERIFICATION_DELAY_HOURS", "24")),
        )
        verification_due_at = candidate_end + timedelta(hours=delay_hours)

        return {
            "merged_at": parsed.isoformat(),
            "verification_due_at": verification_due_at.isoformat(),
            "baseline_window_start": baseline_start.isoformat(),
            "baseline_window_end": baseline_end.isoformat(),
            "candidate_window_start": candidate_start.isoformat(),
            "candidate_window_end": candidate_end.isoformat(),
        }

    def schedule_verification(
        self,
        *,
        owner: str,
        repo: str,
        pull_number: int,
        head_sha: str | None,
        merged_at: str | None,
        delivery_id: str | None = None,
    ) -> dict[str, Any]:
        if not head_sha or not merged_at:
            raise ValueError("Merged pull request event is missing head SHA or merged_at.")

        prediction_id = self._prediction_id(
            owner,
            repo,
            pull_number,
            head_sha,
        )
        windows = self._verification_windows(merged_at)

        prediction = self.ledger.schedule_verification(
            prediction_id=prediction_id,
            merged_at=windows["merged_at"],
            verification_due_at=windows["verification_due_at"],
            verification_source="aws_cur_2",
            verification_delivery_id=delivery_id,
            baseline_window_start=windows["baseline_window_start"],
            baseline_window_end=windows["baseline_window_end"],
            candidate_window_start=windows["candidate_window_start"],
            candidate_window_end=windows["candidate_window_end"],
        )

        if prediction is None:
            existing = self.ledger.get(prediction_id)
            return {
                "status": "already_scheduled" if existing else "prediction_not_found",
                "prediction_id": prediction_id,
            }

        return {
            "status": "verification_scheduled",
            "prediction_id": prediction_id,
            "verification_due_at": prediction.verification_due_at,
            "delivery_id": delivery_id,
        }

    def process(
        self,
        *,
        owner: str,
        repo: str,
        pull_number: int,
        delivery_id: str | None = None,
        installation_id: str | None = None,
        user_id: str | None = None,
    ) -> dict[str, Any]:
        resolved_user_id = user_id or self.user_id
        connection = None
        if installation_id:
            connection = ConnectionRepository().find_by_installation_repo(
                installation_id,
                f"{owner}/{repo}",
            )
            if not connection:
                raise PermissionError(
                    f"Repository {owner}/{repo} is not connected to CostGate for this GitHub App installation."
                )
            connection_user_id = connection.get("user_id")
            if resolved_user_id and connection_user_id != resolved_user_id:
                raise PermissionError("GitHub installation is not connected to the authenticated CostGate account.")
            resolved_user_id = connection_user_id

        active_policy = self.policy_override
        if active_policy is None and resolved_user_id:
            persisted = PolicyRepository().get(resolved_user_id)
            active_policy = CostPolicy(
                warn_monthly_usd=Decimal(str(persisted.get("warn_usd", 5))),
                block_monthly_usd=Decimal(str(persisted.get("block_usd", 25))),
                minimum_confidence=os.getenv("COSTGATE_MIN_CONFIDENCE", "medium").lower(),
            )
        if active_policy is None:
            active_policy = CostPolicy.from_environment()

        pr = self.pr_reader.read(
            owner,
            repo,
            pull_number,
        )

        changed_queries = []

        for file in pr.files:
            if (
                file.base_content is None
                or file.head_content is None
            ):
                continue

            try:
                changed_query = detect_changed_query(
                    file.base_content,
                    file.head_content,
                    file.path,
                )
            except QueryExtractionError:
                continue

            changed_queries.append(changed_query)

        if not changed_queries:
            raise QueryExtractionError(
                f"No supported changed SQL query found "
                f"in PR #{pull_number}."
            )

        if len(changed_queries) > 1:
            raise QueryExtractionError(
                "CostGate MVP supports one changed SQL query per PR."
            )

        query = changed_queries[0]

        analysis_result = self.analysis_invoker.invoke(
            self.analysis_function_name,
            {
                "baseline_sql": query.baseline_sql,
                "candidate_sql": query.candidate_sql,
                "file_path": query.file_path,
            },
        )

        if analysis_result.get("status") != "success":
            raise RuntimeError(
                analysis_result.get(
                    "error",
                    "Analysis Lambda failed.",
                )
            )

        comment_body = analysis_result["comment_body"]

        policy_decision = active_policy.evaluate(
            monthly_delta=Decimal(
                analysis_result["monthly_delta"]
            ),
            direction=analysis_result["direction"],
            confidence=analysis_result["confidence"],
        )

        check_result: dict[str, Any] | None = None

        if self.enable_check:
            try:
                check_result = self.check_publisher.publish(
                    owner=owner,
                    repo=repo,
                    head_sha=pr.head_sha,
                    title=policy_decision.title,
                    conclusion=policy_decision.github_conclusion,
                    summary=(
                        f"Estimated monthly infrastructure impact: "
                        f"${Decimal(analysis_result['monthly_delta']):.2f}"
                    ),
                    text=(
                        f"**Verdict:** "
                        f"{policy_decision.verdict.value.upper()}\n\n"
                        f"{policy_decision.reason}\n\n"
                        f"**Confidence:** "
                        f"{analysis_result['confidence']}\n\n"
                        f"**Estimated range:** "
                        f"${Decimal(analysis_result.get('lower_bound', analysis_result['monthly_delta'])):.2f}"
                        f"–"
                        f"${Decimal(analysis_result.get('upper_bound', analysis_result['monthly_delta'])):.2f}"
                    ),
                )
            except Exception as exc:
                # A Check publication failure must never prevent
                # the deterministic PR analysis/comment.
                print(
                    "GitHub Check publication failed; "
                    f"continuing with PR comment: {exc}"
                )

        # Bedrock is strictly downstream of the deterministic
        # analysis result. It can explain the facts, but it can
        # never change the calculated dollar values.
        if self.enable_explanation:
            try:
                explanation = self.explainer.explain(
                    analysis_result,
                    query.baseline_sql,
                    query.candidate_sql,
                )
            except ExplanationUnavailable as exc:
                print(
                    "Bedrock explanation unavailable; "
                    f"continuing with deterministic comment: {exc}"
                )
                explanation = None

            if explanation:
                comment_body = (
                    f"{comment_body}\n\n"
                    "### Why this happened\n\n"
                    f"{explanation}"
                )

        comment = self.publisher.publish(
            owner=owner,
            repo=repo,
            pull_number=pull_number,
            body=comment_body,
        )

        prediction_id = self._prediction_id(
            owner,
            repo,
            pull_number,
            pr.head_sha,
        )

        prediction = PredictionRecord(
            prediction_id=prediction_id,
            repository=f"{owner}/{repo}",
            user_id=resolved_user_id,
            pull_request_number=pull_number,
            commit_sha=pr.head_sha,
            author=pr.author,
            created_at=datetime.now(
                timezone.utc
            ).isoformat(),
            predicted_monthly_delta=Decimal(
                analysis_result["monthly_delta"]
            ),
            predicted_lower_bound=Decimal(
                analysis_result.get(
                    "lower_bound",
                    analysis_result["monthly_delta"],
                )
            ),
            predicted_upper_bound=Decimal(
                analysis_result.get(
                    "upper_bound",
                    analysis_result["monthly_delta"],
                )
            ),
            confidence=analysis_result["confidence"],
            direction=analysis_result["direction"],
            baseline_execution_ms=float(
                analysis_result.get(
                    "baseline_execution_ms",
                    0.0,
                )
            ),
            candidate_execution_ms=float(
                analysis_result.get(
                    "candidate_execution_ms",
                    0.0,
                )
            ),
            baseline_rows=int(
                analysis_result.get(
                    "baseline_rows",
                    0,
                )
            ),
            candidate_rows=int(
                analysis_result.get(
                    "candidate_rows",
                    0,
                )
            ),
            baseline_scan_type=analysis_result.get(
                "baseline_scan_type",
                "Unknown",
            ),
            candidate_scan_type=analysis_result.get(
                "candidate_scan_type",
                "Unknown",
            ),
            delivery_id=delivery_id,
            resource_id=analysis_result.get("resource_id"),
            policy_verdict=policy_decision.verdict.value,
            check_run_id=(
                int(check_result["id"])
                if check_result and check_result.get("id") is not None
                else None
            ),
            check_run_url=(
                check_result.get("html_url")
                if check_result
                else None
            ),
        )

        self.ledger.save(prediction)

        return {
            "status": "success",
            "repository": f"{owner}/{repo}",
            "pull_number": pull_number,
            "comment_id": comment.get("id"),
            "prediction_id": prediction_id,
            "monthly_delta": analysis_result.get("monthly_delta"),
            "lower_bound": analysis_result.get("lower_bound"),
            "upper_bound": analysis_result.get("upper_bound"),
            "confidence": analysis_result.get("confidence"),
            "direction": analysis_result.get("direction"),
            "baseline_execution_ms": analysis_result.get("baseline_execution_ms"),
            "candidate_execution_ms": analysis_result.get("candidate_execution_ms"),
            "baseline_rows": analysis_result.get("baseline_rows"),
            "candidate_rows": analysis_result.get("candidate_rows"),
            "baseline_scan_type": analysis_result.get("baseline_scan_type"),
            "candidate_scan_type": analysis_result.get("candidate_scan_type"),
            "policy_verdict": policy_decision.verdict.value,
            "check_run_url": check_result.get("html_url") if check_result else None,
        }


class LambdaAnalysisInvoker:
    """Invokes the CostGate analysis Lambda."""

    def __init__(self, lambda_client: Any) -> None:
        self.lambda_client = lambda_client

    def invoke(
        self,
        function_name: str,
        payload: dict[str, Any],
    ) -> dict[str, Any]:
        response = self.lambda_client.invoke(
            FunctionName=function_name,
            InvocationType="RequestResponse",
            Payload=json.dumps(payload).encode("utf-8"),
        )

        raw_payload = response["Payload"].read()

        function_response = json.loads(
            raw_payload.decode("utf-8")
        )

        if "FunctionError" in response:
            raise RuntimeError(
                "Analysis Lambda invocation failed: "
                f"{function_response}"
            )

        return function_response