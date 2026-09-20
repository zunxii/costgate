from __future__ import annotations

from app.github.client import GitHubClient


class GitHubCheckPublisher:
    """Publish CostGate policy decisions as GitHub Check Runs."""

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
        head_sha: str,
        title: str,
        conclusion: str,
        summary: str,
        text: str,
    ) -> dict:
        existing = next(
            (
                run
                for run in self.client.list_check_runs(
                    owner=owner,
                    repo=repo,
                    head_sha=head_sha,
                )
                if run.get("name") == "CostGate"
            ),
            None,
        )

        if existing:
            return self.client.update_check_run(
                owner=owner,
                repo=repo,
                check_run_id=int(existing["id"]),
                conclusion=conclusion,
                title=title,
                summary=summary,
                text=text,
            )

        return self.client.create_check_run(
            owner=owner,
            repo=repo,
            name="CostGate",
            head_sha=head_sha,
            conclusion=conclusion,
            title=title,
            summary=summary,
            text=text,
        )
