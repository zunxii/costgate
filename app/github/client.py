from __future__ import annotations

from typing import Any

import requests

from app.domain.errors import GitHubIntegrationError
from app.github.app_auth import GitHubAppAuthenticator


class GitHubClient:
    """Small GitHub API client authenticated as a GitHub App installation."""

    BASE_URL = "https://api.github.com"

    def __init__(
        self,
        authenticator: GitHubAppAuthenticator | None = None,
    ) -> None:
        self.authenticator = authenticator or GitHubAppAuthenticator()

    def _get_headers(self) -> dict[str, str]:
        token_data = self.authenticator.get_installation_token()

        return {
            "Accept": "application/vnd.github+json",
            "Authorization": f"Bearer {token_data['token']}",
            "X-GitHub-Api-Version": "2022-11-28",
        }

    def _request(
        self,
        method: str,
        path: str,
        **kwargs: Any,
    ) -> Any:
        url = f"{self.BASE_URL}{path}"

        try:
            response = requests.request(
                method,
                url,
                headers=self._get_headers(),
                timeout=15,
                **kwargs,
            )
        except requests.RequestException as exc:
            raise GitHubIntegrationError(
                "Could not connect to GitHub."
            ) from exc

        if not response.ok:
            raise GitHubIntegrationError(
                f"GitHub API request failed: "
                f"{response.status_code} {response.text}"
            )

        return response.json()

    def get_repository(
        self,
        owner: str,
        repo: str,
    ) -> dict[str, Any]:
        return self._request(
            "GET",
            f"/repos/{owner}/{repo}",
        )

    def get_pull_request(
        self,
        owner: str,
        repo: str,
        pull_number: int,
    ) -> dict[str, Any]:
        return self._request(
            "GET",
            f"/repos/{owner}/{repo}/pulls/{pull_number}",
        )

    def get_pull_request_files(
        self,
        owner: str,
        repo: str,
        pull_number: int,
    ) -> list[dict[str, Any]]:
        return self._request(
            "GET",
            f"/repos/{owner}/{repo}/pulls/{pull_number}/files",
            params={"per_page": 100},
        )

    def get_file_content(
        self,
        owner: str,
        repo: str,
        path: str,
        ref: str,
    ) -> dict[str, Any]:
        return self._request(
            "GET",
            f"/repos/{owner}/{repo}/contents/{path}",
            params={"ref": ref},
        )
    def create_pull_request_comment(
    self,
    *,
    owner: str,
    repo: str,
    pull_number: int,
    body: str,
) -> dict[str, Any]:
        return self._request(
            "POST",
            f"/repos/{owner}/{repo}/issues/{pull_number}/comments",
            json={"body": body},
        )

    def list_pull_request_comments(
    self,
    *,
    owner: str,
    repo: str,
    pull_number: int,
) -> list[dict[str, Any]]:
        return self._request(
            "GET",
            f"/repos/{owner}/{repo}/issues/{pull_number}/comments",
            params={"per_page": 100},
        )

    def update_issue_comment(
    self,
    *,
    owner: str,
    repo: str,
    comment_id: int,
    body: str,
    ) -> dict[str, Any]:
        return self._request(
            "PATCH",
            f"/repos/{owner}/{repo}/issues/comments/{comment_id}",
            json={"body": body},
        )

    def create_check_run(
    self,
    *,
    owner: str,
    repo: str,
    name: str,
    head_sha: str,
    conclusion: str,
    title: str,
    summary: str,
    text: str,
) -> dict[str, Any]:
        return self._request(
            "POST",
            f"/repos/{owner}/{repo}/check-runs",
            json={
                "name": name,
                "head_sha": head_sha,
                "status": "completed",
                "conclusion": conclusion,
                "output": {
                    "title": title,
                    "summary": summary,
                    "text": text,
                },
            },
        )

    def list_check_runs(
        self,
        *,
        owner: str,
        repo: str,
        head_sha: str,
        per_page: int = 100,
    ) -> list[dict[str, Any]]:
        response = self._request(
            "GET",
            f"/repos/{owner}/{repo}/commits/{head_sha}/check-runs",
            params={"per_page": per_page},
        )
        return response.get("check_runs", [])

    def update_check_run(
        self,
        *,
        owner: str,
        repo: str,
        check_run_id: int,
        conclusion: str,
        title: str,
        summary: str,
        text: str,
    ) -> dict[str, Any]:
        return self._request(
            "PATCH",
            f"/repos/{owner}/{repo}/check-runs/{check_run_id}",
            json={
                "status": "completed",
                "conclusion": conclusion,
                "output": {
                    "title": title,
                    "summary": summary,
                    "text": text,
                },
            },
        )
