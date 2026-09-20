import hashlib

from app.github.pr_reader import PullRequestContext, PullRequestFile
from app.pipeline.pr_event_processor import PullRequestEventProcessor


class FakePRReader:
    def read(self, owner, repo, pull_number):
        return PullRequestContext(
            owner=owner,
            repo=repo,
            number=pull_number,
            title="Test PR",
            base_sha="base-sha",
            head_sha="head-sha",
            files=[
                PullRequestFile(
                    path="db/experiments/customer_lookup.sql",
                    status="modified",
                    additions=1,
                    deletions=1,
                    patch=None,
                    base_content=(
                        "SELECT * FROM orders "
                        "WHERE customer_id = 12345;"
                    ),
                    head_content=(
                        "SELECT * FROM orders "
                        "WHERE customer_id::text = '12345';"
                    ),
                )
            ],
            author="zunxii",
        )


class FakeAnalysisInvoker:
    def __init__(self):
        self.calls = []

    def invoke(self, function_name, payload):
        self.calls.append(
            {
                "function_name": function_name,
                "payload": payload,
            }
        )

        return {
            "status": "success",
            "comment_body": (
                "## CostGate\n\n"
                "Estimated impact: **+$12.34/month**"
            ),
            "monthly_delta": "12.34",
            "lower_bound": "9.87",
            "upper_bound": "14.81",
            "confidence": "high",
            "direction": "increase",
            "baseline_execution_ms": 10.0,
            "candidate_execution_ms": 150.0,
            "baseline_rows": 6,
            "candidate_rows": 6,
            "baseline_scan_type": "Index Scan",
            "candidate_scan_type": "Seq Scan",
            "resource_id": "costgate-db",
        }


class FakePublisher:
    def __init__(self):
        self.calls = []

    def publish(self, **kwargs):
        self.calls.append(kwargs)

        return {
            "id": 999,
        }


class FakeLedger:
    def __init__(self):
        self.saved_predictions = []

    def save(self, prediction):
        self.saved_predictions.append(prediction)


def test_process_pull_request():
    invoker = FakeAnalysisInvoker()
    publisher = FakePublisher()
    ledger = FakeLedger()

    processor = PullRequestEventProcessor(
        analysis_function_name="costgate-analysis",
        analysis_invoker=invoker,
        pr_reader=FakePRReader(),
        publisher=publisher,
        ledger=ledger,
    )

    result = processor.process(
        owner="zunxii",
        repo="costgate",
        pull_number=1,
        delivery_id="delivery-123",
    )

    expected_prediction_id = hashlib.sha256(
        "zunxii/costgate:1:head-sha".encode("utf-8")
    ).hexdigest()[:32]

    assert result == {
        "status": "success",
        "repository": "zunxii/costgate",
        "pull_number": 1,
        "comment_id": 999,
        "prediction_id": expected_prediction_id,
        "monthly_delta": "12.34",
    }

    assert invoker.calls == [
        {
            "function_name": "costgate-analysis",
            "payload": {
                "baseline_sql": (
                    "SELECT * FROM orders "
                    "WHERE customer_id = 12345;"
                ),
                "candidate_sql": (
                    "SELECT * FROM orders "
                    "WHERE customer_id::text = '12345';"
                ),
                "file_path": (
                    "db/experiments/customer_lookup.sql"
                ),
            },
        }
    ]

    assert publisher.calls == [
        {
            "owner": "zunxii",
            "repo": "costgate",
            "pull_number": 1,
            "body": (
                "## CostGate\n\n"
                "Estimated impact: **+$12.34/month**"
            ),
        }
    ]

    assert len(ledger.saved_predictions) == 1
    saved = ledger.saved_predictions[0]
    assert saved.prediction_id == expected_prediction_id
    assert saved.repository == "zunxii/costgate"
    assert saved.pull_request_number == 1
    assert saved.commit_sha == "head-sha"
    assert saved.author == "zunxii"
    assert str(saved.predicted_monthly_delta) == "12.34"