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