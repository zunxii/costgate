from __future__ import annotations

import hashlib
import json
import os
from datetime import datetime, timezone
from decimal import Decimal
from typing import Any, Protocol

from app.bedrock.explanation import (
    CostGateExplainer,
    ExplanationUnavailable,
)
from app.github.check_publisher import GitHubCheckPublisher
from app.policy.cost_policy import CostPolicy
from app.domain.errors import QueryExtractionError
from app.github.comment_publisher import GitHubCommentPublisher
from app.github.pr_reader import PullRequestReader
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
        analysis_invoker: AnalysisInvoker,
        pr_reader: PullRequestReader | None = None,
        publisher: GitHubCommentPublisher | None = None,
        ledger: PredictionLedger | None = None,
        explainer: CostGateExplainer | None = None,
        check_publisher: GitHubCheckPublisher | None = None,
        policy: CostPolicy | None = None,
    ) -> None:
        self.analysis_function_name = analysis_function_name
        self.analysis_invoker = analysis_invoker
        self.pr_reader = pr_reader or PullRequestReader()
        self.publisher = publisher or GitHubCommentPublisher()
        self.check_publisher = (
    check_publisher or GitHubCheckPublisher()
)

        self.policy = policy or CostPolicy.from_environment()
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

    def process(
        self,
        *,
        owner: str,
        repo: str,
        pull_number: int,
        delivery_id: str | None = None,
    ) -> dict[str, Any]:
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

        policy_decision = self.policy.evaluate(
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

        prediction_id = hashlib.sha256(
            (
                f"{owner}/{repo}:"
                f"{pull_number}:"
                f"{pr.head_sha}"
            ).encode("utf-8")
        ).hexdigest()[:32]

        prediction = PredictionRecord(
            prediction_id=prediction_id,
            repository=f"{owner}/{repo}",
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
            "monthly_delta": analysis_result.get(
                "monthly_delta"
            ),
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