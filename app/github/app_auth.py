from __future__ import annotations

import os
import time
from pathlib import Path
from typing import Any

import jwt
import requests
from dotenv import load_dotenv

from app.domain.errors import GitHubIntegrationError


load_dotenv()


class GitHubAppAuthenticator:
    """Authenticate as a GitHub App and obtain an installation token."""

    def __init__(
        self,
        app_id: str | None = None,
        installation_id: str | None = None,
        private_key_path: str | None = None,
    ) -> None:
        self.app_id = app_id or os.getenv("GITHUB_APP_ID")
        self.installation_id = installation_id or os.getenv(
            "GITHUB_INSTALLATION_ID"
        )
        self.private_key = os.getenv("GITHUB_PRIVATE_KEY")
        self.private_key_path = private_key_path or os.getenv(
            "GITHUB_PRIVATE_KEY_PATH"
        )

        if not self.app_id:
            raise GitHubIntegrationError("GITHUB_APP_ID is not configured.")

        if not self.private_key and not self.private_key_path:
            raise GitHubIntegrationError(
                "Either GITHUB_PRIVATE_KEY or "
                "GITHUB_PRIVATE_KEY_PATH must be configured."
            )

        if self.private_key_path:
            key_path = Path(self.private_key_path).expanduser()

            if not key_path.is_file():
                raise GitHubIntegrationError(
                    f"GitHub private key not found: {key_path}"
                )

            self.private_key_path = str(key_path)

    def _load_private_key(self) -> str:
        if self.private_key:
            return self.private_key

        if not self.private_key_path:
            raise GitHubIntegrationError(
                "GitHub private key is not configured."
            )

        try:
            return Path(self.private_key_path).read_text()
        except OSError as exc:
            raise GitHubIntegrationError(
                "Unable to read GitHub App private key."
            ) from exc

    def generate_app_jwt(self) -> str:
        """Generate a short-lived JWT used to authenticate as the GitHub App."""

        now = int(time.time())

        payload = {
            "iat": now - 60,
            "exp": now + (9 * 60),
            "iss": str(self.app_id),
        }

        try:
            return jwt.encode(
                payload,
                self._load_private_key(),
                algorithm="RS256",
            )
        except Exception as exc:
            raise GitHubIntegrationError(
                "Failed to generate GitHub App JWT."
            ) from exc

    def get_installation_token(self) -> dict[str, Any]:
        """Exchange the App JWT for an installation access token."""

        if not self.installation_id:
            raise GitHubIntegrationError(
                "GITHUB_INSTALLATION_ID is required for installation authentication."
            )

        token = self.generate_app_jwt()

        url = (
            "https://api.github.com/app/installations/"
            f"{self.installation_id}/access_tokens"
        )

        headers = {
            "Accept": "application/vnd.github+json",
            "Authorization": f"Bearer {token}",
            "X-GitHub-Api-Version": "2022-11-28",
        }

        try:
            response = requests.post(
                url,
                headers=headers,
                timeout=15,
            )
        except requests.RequestException as exc:
            raise GitHubIntegrationError(
                "Could not connect to GitHub."
            ) from exc

        if response.status_code != 201:
            raise GitHubIntegrationError(
                "GitHub rejected the installation token request: "
                f"{response.status_code} {response.text}"
            )

        data = response.json()

        if "token" not in data:
            raise GitHubIntegrationError(
                "GitHub response did not contain an installation token."
            )

        return data