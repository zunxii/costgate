from __future__ import annotations

from app.github.client import GitHubClient


class GitHubCommentPublisher:
    """Create or update the CostGate PR comment."""

    MARKER = "<!-- costgate-analysis -->"

    def __init__(
        self,
        client: GitHubClient | None = None,
    ) -> None:
        self.client = client or GitHubClient()

    def publish(
        self,
        *,
        owner: str,
        repo: str,
        pull_number: int,
        body: str,
    ) -> dict:
        rendered_body = f"{self.MARKER}\n{body}"

        comments = self.client.list_pull_request_comments(
            owner=owner,
            repo=repo,
            pull_number=pull_number,
        )

        for comment in comments:
            existing_body = comment.get("body") or ""

            if self.MARKER in existing_body:
                return self.client.update_issue_comment(
                    owner=owner,
                    repo=repo,
                    comment_id=comment["id"],
                    body=rendered_body,
                )

        return self.client.create_pull_request_comment(
            owner=owner,
            repo=repo,
            pull_number=pull_number,
            body=rendered_body,
        )