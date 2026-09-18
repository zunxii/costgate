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
            "confidence": "high",
            "direction": "increase",
        }


class FakePublisher:
    def __init__(self):
        self.calls = []

    def publish(self, **kwargs):
        self.calls.append(kwargs)

        return {
            "id": 999,
        }


def test_process_pull_request():
    invoker = FakeAnalysisInvoker()
    publisher = FakePublisher()

    processor = PullRequestEventProcessor(
        analysis_function_name="costgate-analysis",
        analysis_invoker=invoker,
        pr_reader=FakePRReader(),
        publisher=publisher,
    )

    result = processor.process(
        owner="zunxii",
        repo="costgate",
        pull_number=1,
    )

    assert result == {
        "status": "success",
        "repository": "zunxii/costgate",
        "pull_number": 1,
        "comment_id": 999,
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