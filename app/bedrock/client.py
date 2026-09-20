from __future__ import annotations

import os
from typing import Any

import boto3


DEFAULT_MODEL_ID = "eu.anthropic.claude-haiku-4-5-20251001-v1:0"
DEFAULT_REGION = "eu-north-1"


class BedrockExplainerClient:
    """Thin wrapper around Bedrock Runtime Converse."""

    def __init__(
        self,
        *,
        model_id: str | None = None,
        region: str | None = None,
        client: Any | None = None,
        max_tokens: int = 250,
    ) -> None:
        self.model_id = model_id or os.getenv(
            "BEDROCK_MODEL_ID",
            DEFAULT_MODEL_ID,
        )
        self.max_tokens = max_tokens
        self.client = client or boto3.client(
            "bedrock-runtime",
            region_name=region or os.getenv(
                "BEDROCK_REGION",
                DEFAULT_REGION,
            ),
        )

    def generate(
        self,
        *,
        system_prompt: str,
        user_prompt: str,
    ) -> str:
        response = self.client.converse(
            modelId=self.model_id,
            system=[{"text": system_prompt}],
            messages=[
                {
                    "role": "user",
                    "content": [{"text": user_prompt}],
                }
            ],
            inferenceConfig={
                "maxTokens": self.max_tokens,
                "temperature": 0.2,
            },
        )

        blocks = response["output"]["message"]["content"]

        return "".join(
            block.get("text", "")
            for block in blocks
        ).strip()