from __future__ import annotations

from app.domain.errors import QueryExtractionError
from app.domain.models import AnalysisResult
from app.github.pr_reader import PullRequestReader
from app.pipeline.analysis_service import AnalysisService
from app.query_extractor.detectors import detect_changed_query


class PullRequestAnalysisService:
    """Connects GitHub pull requests to the CostGate analysis pipeline."""

    def __init__(
        self,
        analysis_service: AnalysisService,
        pr_reader: PullRequestReader | None = None,
    ) -> None:
        self.analysis_service = analysis_service
        self.pr_reader = pr_reader or PullRequestReader()

    def analyze_pr(
        self,
        owner: str,
        repo: str,
        pull_number: int,
    ) -> AnalysisResult:
        pr = self.pr_reader.read(
            owner,
            repo,
            pull_number,
        )

        candidates = []

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

            candidates.append(changed_query)

        if not candidates:
            raise QueryExtractionError(
                f"No supported changed SQL query found in PR #{pull_number}."
            )

        if len(candidates) > 1:
            raise QueryExtractionError(
                "CostGate MVP supports one changed SQL query per PR."
            )

        return self.analysis_service.analyze(candidates[0])