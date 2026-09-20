from __future__ import annotations

import os
from typing import Any

import requests

from app.domain.errors import GitHubIntegrationError
from app.github.app_auth import GitHubAppAuthenticator


class GitHubAppUserClient:
    """GitHub App API calls made with the app JWT or an installation token."""

    BASE_URL = "https://api.github.com"

    def __init__(self, app_id: str | None = None, installation_id: str | None = None) -> None:
        self.authenticator = GitHubAppAuthenticator(
            app_id=app_id or os.getenv("GITHUB_APP_ID"),
            installation_id=installation_id or os.getenv("GITHUB_INSTALLATION_ID") if installation_id or os.getenv("GITHUB_INSTALLATION_ID") else None,
        )
        self.installation_id = installation_id

    @staticmethod
    def _headers(token: str) -> dict[str, str]:
        return {
            "Accept": "application/vnd.github+json",
            "Authorization": f"Bearer {token}",
            "X-GitHub-Api-Version": "2022-11-28",
        }

    def _request(self, method: str, path: str, token: str, **kwargs: Any) -> Any:
        try:
            response = requests.request(
                method,
                f"{self.BASE_URL}{path}",
                headers={**self._headers(token), **kwargs.pop("headers", {})},
                timeout=15,
                **kwargs,
            )
        except requests.RequestException as exc:
            raise GitHubIntegrationError("Could not connect to GitHub.") from exc
        if not response.ok:
            raise GitHubIntegrationError(
                f"GitHub API request failed: {response.status_code} {response.text}"
            )
        return response.json() if response.content else {}

    def get_user_installation(self, github_login: str) -> dict[str, Any] | None:
        app_jwt = self.authenticator.generate_app_jwt()
        try:
            return self._request("GET", f"/users/{github_login}/installation", app_jwt)
        except GitHubIntegrationError as exc:
            if " 404 " in str(exc):
                return None
            raise

    def get_installation_token(self, installation_id: str) -> str:
        app_jwt = self.authenticator.generate_app_jwt()
        data = self._request(
            "POST",
            f"/app/installations/{installation_id}/access_tokens",
            app_jwt,
        )
        token = data.get("token")
        if not token:
            raise GitHubIntegrationError("GitHub did not return an installation access token.")
        return token

    def list_installation_repositories(self, installation_id: str) -> list[dict[str, Any]]:
        token = self.get_installation_token(installation_id)
        page = 1
        repos: list[dict[str, Any]] = []
        while page <= 10:
            data = self._request(
                "GET",
                "/installation/repositories",
                token,
                params={"per_page": 100, "page": page},
            )
            repos.extend(data.get("repositories", []))
            if len(data.get("repositories", [])) < 100:
                break
            page += 1
        return repos

    def repository(self, installation_id: str, owner: str, repo: str) -> dict[str, Any]:
        token = self.get_installation_token(installation_id)
        return self._request("GET", f"/repos/{owner}/{repo}", token)
