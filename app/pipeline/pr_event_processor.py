from __future__ import annotations

import json
from typing import Any, Protocol

from app.domain.errors import QueryExtractionError
from app.github.comment_publisher import GitHubCommentPublisher
from app.github.pr_reader import PullRequestReader
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
        -> publish returned comment to GitHub
    """

    def __init__(
        self,
        *,
        analysis_function_name: str,
        analysis_invoker: AnalysisInvoker,
        pr_reader: PullRequestReader | None = None,
        publisher: GitHubCommentPublisher | None = None,
    ) -> None:
        self.analysis_function_name = analysis_function_name
        self.analysis_invoker = analysis_invoker
        self.pr_reader = pr_reader or PullRequestReader()
        self.publisher = publisher or GitHubCommentPublisher()

    def process(
        self,
        *,
        owner: str,
        repo: str,
        pull_number: int,
    ) -> dict[str, Any]:
        pr = self.pr_reader.read(
            owner,
            repo,
            pull_number,
        )

        changed_queries = []

        for file in pr.files:
            if file.base_content is None or file.head_content is None:
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

        comment = self.publisher.publish(
            owner=owner,
            repo=repo,
            pull_number=pull_number,
            body=analysis_result["comment_body"],
        )

        return {
            "status": "success",
            "repository": f"{owner}/{repo}",
            "pull_number": pull_number,
            "comment_id": comment.get("id"),
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
                f"Analysis Lambda invocation failed: "
                f"{function_response}"
            )

        return function_response