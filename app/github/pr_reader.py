from __future__ import annotations

import base64
from dataclasses import dataclass
from typing import Any

from app.domain.errors import GitHubIntegrationError
from app.github.client import GitHubClient


@dataclass(frozen=True)
class PullRequestFile:
    path: str
    status: str
    additions: int
    deletions: int
    patch: str | None
    base_content: str | None
    head_content: str | None


@dataclass(frozen=True)
class PullRequestContext:
    owner: str
    repo: str
    number: int
    title: str
    base_sha: str
    head_sha: str
    files: list[PullRequestFile]
    author: str = "unknown"


class PullRequestReader:
    """Reads a GitHub PR and reconstructs changed file contents."""

    def __init__(self, client: GitHubClient | None = None) -> None:
        self.client = client or GitHubClient()

    def read(
        self,
        owner: str,
        repo: str,
        pull_number: int,
    ) -> PullRequestContext:
        pr = self.client.get_pull_request(
            owner,
            repo,
            pull_number,
        )

        base_sha = pr["base"]["sha"]
        head_sha = pr["head"]["sha"]

        raw_files = self.client.get_pull_request_files(
            owner,
            repo,
            pull_number,
        )

        files: list[PullRequestFile] = []

        for raw_file in raw_files:
            path = raw_file["filename"]
            status = raw_file["status"]

            base_content = None
            head_content = None

            # Deleted files don't exist at the head commit.
            if status != "deleted":
                head_content = self._read_file(
                    owner,
                    repo,
                    path,
                    head_sha,
                )

            # Added files don't exist at the base commit.
            if status != "added":
                base_content = self._read_file(
                    owner,
                    repo,
                    path,
                    base_sha,
                )

            files.append(
                PullRequestFile(
                    path=path,
                    status=status,
                    additions=raw_file.get("additions", 0),
                    deletions=raw_file.get("deletions", 0),
                    patch=raw_file.get("patch"),
                    base_content=base_content,
                    head_content=head_content,
                )
            )

        return PullRequestContext(
            owner=owner,
            repo=repo,
            number=pull_number,
            title=pr["title"],
            base_sha=base_sha,
            head_sha=head_sha,
            files=files,
            author=pr.get("user", {}).get(
                "login",
                "unknown",
            ),
        )

    def _read_file(
        self,
        owner: str,
        repo: str,
        path: str,
        ref: str,
    ) -> str | None:
        try:
            data: dict[str, Any] = self.client.get_file_content(
                owner,
                repo,
                path,
                ref,
            )
        except GitHubIntegrationError:
            return None

        if data.get("type") != "file":
            return None

        encoding = data.get("encoding")
        content = data.get("content")

        if encoding != "base64" or not content:
            return None

        try:
            return base64.b64decode(content).decode("utf-8")
        except (ValueError, UnicodeDecodeError):
            return None