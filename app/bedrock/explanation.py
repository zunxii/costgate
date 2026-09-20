from __future__ import annotations

from typing import Any

from app.bedrock.client import BedrockExplainerClient
from app.bedrock.prompt_builder import (
    SYSTEM_PROMPT,
    build_explanation_prompt,
)


class ExplanationUnavailable(Exception):
    """Raised when Bedrock cannot produce an explanation."""


class CostGateExplainer:
    def __init__(
        self,
        client: BedrockExplainerClient | None = None,
    ) -> None:
        self.client = client or BedrockExplainerClient()

    def explain(
        self,
        analysis: dict[str, Any],
        baseline_sql: str,
        candidate_sql: str,
    ) -> str:
        try:
            prompt = build_explanation_prompt(
                analysis,
                baseline_sql,
                candidate_sql,
            )

            return self.client.generate(
                system_prompt=SYSTEM_PROMPT,
                user_prompt=prompt,
            )

        except Exception as exc:  # noqa: BLE001
            raise ExplanationUnavailable(str(exc)) from exc