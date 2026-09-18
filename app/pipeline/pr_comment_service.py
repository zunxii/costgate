from __future__ import annotations

from app.domain.models import AnalysisResult
from app.github.comment_publisher import GitHubCommentPublisher
from app.github.comment_renderer import CostGateCommentRenderer
from app.github.pr_reader import PullRequestReader
from app.pipeline.analysis_service import AnalysisService
from app.pipeline.pr_analysis_service import PullRequestAnalysisService


class PullRequestCommentService:
    """
    Runs CostGate analysis for a GitHub PR and publishes the result
    as a create-or-update PR comment.
    """

    def __init__(
        self,
        analysis_service: AnalysisService,
        pr_reader: PullRequestReader | None = None,
        renderer: CostGateCommentRenderer | None = None,
        publisher: GitHubCommentPublisher | None = None,
    ) -> None:
        self.analysis_service = analysis_service

        self.pr_reader = pr_reader or PullRequestReader()
        self.renderer = renderer or CostGateCommentRenderer()
        self.publisher = publisher or GitHubCommentPublisher()

    def analyze_and_publish(
        self,
        *,
        owner: str,
        repo: str,
        pull_number: int,
    ) -> tuple[AnalysisResult, dict]:
        analysis_service = PullRequestAnalysisService(
            analysis_service=self.analysis_service,
            pr_reader=self.pr_reader,
        )

        result = analysis_service.analyze_pr(
            owner=owner,
            repo=repo,
            pull_number=pull_number,
        )

        body = self.renderer.render(result)

        comment = self.publisher.publish(
            owner=owner,
            repo=repo,
            pull_number=pull_number,
            body=body,
        )

        return result, comment