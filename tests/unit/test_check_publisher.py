from app.github.check_publisher import GitHubCheckPublisher


class FakeGitHubClient:
    def __init__(self, existing=None):
        self.calls = []
        self.existing = existing or []

    def list_check_runs(self, **kwargs):
        self.calls.append(("list", kwargs))
        return self.existing

    def create_check_run(self, **kwargs):
        self.calls.append(("create", kwargs))
        return {
            "id": 123,
            "name": kwargs["name"],
            "html_url": "https://github.com/example/check/123",
        }

    def update_check_run(self, **kwargs):
        self.calls.append(("update", kwargs))
        return {
            "id": kwargs["check_run_id"],
            "html_url": "https://github.com/example/check/456",
        }


def test_check_publisher_creates_when_missing():
    client = FakeGitHubClient()
    publisher = GitHubCheckPublisher(client=client)

    result = publisher.publish(
        owner="zunxii",
        repo="costgate",
        head_sha="abc123",
        title="CostGate: WARNING",
        conclusion="neutral",
        summary="Estimated impact: $8.00",
        text="Confidence is high.",
    )

    assert result["id"] == 123
    assert [kind for kind, _ in client.calls] == ["list", "create"]


def test_check_publisher_updates_existing_check():
    client = FakeGitHubClient(
        existing=[{"id": 456, "name": "CostGate"}]
    )
    publisher = GitHubCheckPublisher(client=client)

    result = publisher.publish(
        owner="zunxii",
        repo="costgate",
        head_sha="abc123",
        title="CostGate: PASS",
        conclusion="success",
        summary="Estimated impact: $1.00",
        text="Confidence is high.",
    )

    assert result["id"] == 456
    assert [kind for kind, _ in client.calls] == ["list", "update"]
    assert client.calls[1][1]["check_run_id"] == 456
