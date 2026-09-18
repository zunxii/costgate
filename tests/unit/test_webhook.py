import hashlib
import hmac
import json
import app.handlers.webhook as webhook_handler

from app.handlers.webhook import (
    lambda_handler,
    parse_webhook_event,
    verify_github_signature,
)


SECRET = "test-secret"

class FakeSQSClient:
    def __init__(self):
        self.messages = []

    def send_message(self, *, QueueUrl, MessageBody):
        self.messages.append(
            {
                "QueueUrl": QueueUrl,
                "MessageBody": MessageBody,
            }
        )

        return {
            "MessageId": "test-message-123",
        }


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

def test_lambda_handler_queues_supported_pull_request(monkeypatch):
    body = _payload()

    monkeypatch.setenv(
        "GITHUB_WEBHOOK_SECRET",
        SECRET,
    )
    monkeypatch.setenv(
        "WEBHOOK_QUEUE_URL",
        "https://sqs.eu-north-1.amazonaws.com/123/costgate-test",
    )

    fake_sqs = FakeSQSClient()

    monkeypatch.setattr(
        webhook_handler.boto3,
        "client",
        lambda service_name: (
            fake_sqs
            if service_name == "sqs"
            else None
        ),
    )

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

    assert response["statusCode"] == 202

    result = json.loads(response["body"])

    assert result["status"] == "queued"
    assert result["repository"] == "zunxii/costgate"
    assert result["pull_number"] == 1
    assert result["delivery_id"] == "delivery-123"

    assert len(fake_sqs.messages) == 1
    assert (
        fake_sqs.messages[0]["QueueUrl"]
        == "https://sqs.eu-north-1.amazonaws.com/123/costgate-test"
    )

    queued_message = json.loads(
        fake_sqs.messages[0]["MessageBody"]
    )

    assert queued_message == {
        "delivery_id": "delivery-123",
        "event": "pull_request",
        "action": "opened",
        "repository": "zunxii/costgate",
        "pull_number": 1,
    }

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