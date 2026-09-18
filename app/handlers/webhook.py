from __future__ import annotations

import hashlib
import hmac
import json
import os
from dataclasses import dataclass
from typing import Any


@dataclass(frozen=True)
class WebhookEvent:
    event_type: str
    action: str | None
    delivery_id: str | None
    payload: dict[str, Any]


def verify_github_signature(
    payload: bytes,
    signature_header: str | None,
    secret: str,
) -> bool:
    """
    Verify a GitHub webhook using X-Hub-Signature-256.
    """

    if not signature_header:
        return False

    if not signature_header.startswith("sha256="):
        return False

    expected = "sha256=" + hmac.new(
        secret.encode("utf-8"),
        payload,
        hashlib.sha256,
    ).hexdigest()

    return hmac.compare_digest(
        expected,
        signature_header,
    )


def parse_webhook_event(
    *,
    headers: dict[str, str],
    body: bytes,
    secret: str,
) -> WebhookEvent:
    """
    Validate and parse one GitHub webhook delivery.
    """

    normalized_headers = {
        key.lower(): value
        for key, value in headers.items()
    }

    signature = normalized_headers.get("x-hub-signature-256")

    if not verify_github_signature(
        body,
        signature,
        secret,
    ):
        raise ValueError("Invalid GitHub webhook signature.")

    try:
        payload = json.loads(body.decode("utf-8"))
    except (UnicodeDecodeError, json.JSONDecodeError) as exc:
        raise ValueError("Invalid webhook JSON payload.") from exc

    event_type = normalized_headers.get(
        "x-github-event",
        "",
    )

    if not event_type:
        raise ValueError(
            "Missing X-GitHub-Event header."
        )

    return WebhookEvent(
        event_type=event_type,
        action=payload.get("action"),
        delivery_id=normalized_headers.get(
            "x-github-delivery"
        ),
        payload=payload,
    )


def lambda_handler(
    event: dict[str, Any],
    context: Any,
) -> dict[str, Any]:
    """
    AWS Lambda entry point.

    For now this only validates and classifies the webhook.
    Actual PR analysis will be connected after the AWS endpoint
    is deployed.
    """

    secret = os.getenv("GITHUB_WEBHOOK_SECRET")

    if not secret:
        return {
            "statusCode": 500,
            "body": json.dumps(
                {"error": "Webhook secret is not configured."}
            ),
        }

    body = event.get("body", "")

    if event.get("isBase64Encoded"):
        import base64

        raw_body = base64.b64decode(body)
    else:
        raw_body = body.encode("utf-8")

    headers = event.get("headers") or {}

    try:
        webhook = parse_webhook_event(
            headers=headers,
            body=raw_body,
            secret=secret,
        )
    except ValueError as exc:
        return {
            "statusCode": 401,
            "body": json.dumps({"error": str(exc)}),
        }

    if webhook.event_type != "pull_request":
        return {
            "statusCode": 200,
            "body": json.dumps(
                {
                    "status": "ignored",
                    "event": webhook.event_type,
                }
            ),
        }

    supported_actions = {
        "opened",
        "reopened",
        "synchronize",
    }

    if webhook.action not in supported_actions:
        return {
            "statusCode": 200,
            "body": json.dumps(
                {
                    "status": "ignored",
                    "event": "pull_request",
                    "action": webhook.action,
                }
            ),
        }

    return {
        "statusCode": 200,
        "body": json.dumps(
            {
                "status": "accepted",
                "event": "pull_request",
                "action": webhook.action,
                "delivery_id": webhook.delivery_id,
                "repository": webhook.payload.get(
                    "repository",
                    {},
                ).get("full_name"),
                "pull_number": webhook.payload.get(
                    "number"
                ),
            }
        ),
    }