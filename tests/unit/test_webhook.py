import hashlib
import hmac
import json

from app.handlers.webhook import (
    lambda_handler,
    parse_webhook_event,
    verify_github_signature,
)


SECRET = "test-secret"


def _sign(payload: bytes) -> str:
    digest = hmac.new(
        SECRET.encode("utf-8"),
        payload,
        hashlib.sha256,
    ).hexdigest()

    return f"sha256={digest}"


def _payload() -> bytes:
    return json.dumps(
        {
            "action": "opened",
            "number": 1,
            "repository": {
                "full_name": "zunxii/costgate",
            },
        }
    ).encode("utf-8")


def test_verify_valid_github_signature():
    payload = _payload()

    signature = _sign(payload)

    assert verify_github_signature(
        payload,
        signature,
        SECRET,
    )


def test_reject_invalid_github_signature():
    payload = _payload()

    assert not verify_github_signature(
        payload,
        "sha256=invalid",
        SECRET,
    )


def test_parse_pull_request_webhook():
    body = _payload()

    event = parse_webhook_event(
        headers={
            "X-Hub-Signature-256": _sign(body),
            "X-GitHub-Event": "pull_request",
            "X-GitHub-Delivery": "delivery-123",
        },
        body=body,
        secret=SECRET,
    )

    assert event.event_type == "pull_request"
    assert event.action == "opened"
    assert event.delivery_id == "delivery-123"
    assert event.payload["number"] == 1


def test_lambda_handler_accepts_supported_pull_request():
    body = _payload()

    # The production handler reads this from the environment.
    import os

    os.environ["GITHUB_WEBHOOK_SECRET"] = SECRET

    response = lambda_handler(
        {
            "headers": {
                "X-Hub-Signature-256": _sign(body),
                "X-GitHub-Event": "pull_request",
                "X-GitHub-Delivery": "delivery-123",
            },
            "body": body.decode("utf-8"),
            "isBase64Encoded": False,
        },
        None,
    )

    assert response["statusCode"] == 200

    result = json.loads(response["body"])

    assert result["status"] == "accepted"
    assert result["event"] == "pull_request"
    assert result["action"] == "opened"
    assert result["repository"] == "zunxii/costgate"
    assert result["pull_number"] == 1


def test_lambda_handler_rejects_invalid_signature():
    body = _payload()

    import os

    os.environ["GITHUB_WEBHOOK_SECRET"] = SECRET

    response = lambda_handler(
        {
            "headers": {
                "X-Hub-Signature-256": "sha256=invalid",
                "X-GitHub-Event": "pull_request",
            },
            "body": body.decode("utf-8"),
            "isBase64Encoded": False,
        },
        None,
    )

    assert response["statusCode"] == 401


def test_lambda_handler_ignores_non_pull_request_event():
    body = json.dumps(
        {
            "action": "created",
        }
    ).encode("utf-8")

    import os

    os.environ["GITHUB_WEBHOOK_SECRET"] = SECRET

    response = lambda_handler(
        {
            "headers": {
                "X-Hub-Signature-256": _sign(body),
                "X-GitHub-Event": "issues",
            },
            "body": body.decode("utf-8"),
            "isBase64Encoded": False,
        },
        None,
    )

    assert response["statusCode"] == 200

    result = json.loads(response["body"])

    assert result["status"] == "ignored"
    assert result["event"] == "issues"