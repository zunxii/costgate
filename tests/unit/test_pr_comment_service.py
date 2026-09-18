from app.github.pr_reader import PullRequestContext, PullRequestFile
from app.pipeline.pr_comment_service import PullRequestCommentService


class FakeAnalysisService:
    def __init__(self):
        self.received_query = None
        self.result = object()

    def analyze(self, changed_query):
        self.received_query = changed_query
        return self.result


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
                    path="db/query.sql",
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


class FakeRenderer:
    def __init__(self):
        self.received_result = None

    def render(self, result):
        self.received_result = result
        return "## CostGate\n\nEstimated impact: +$10/month"


class FakePublisher:
    def __init__(self):
        self.received = None

    def publish(self, **kwargs):
        self.received = kwargs
        return {"id": 999}


def test_analyze_and_publish():
    analysis_service = FakeAnalysisService()
    reader = FakePRReader()
    renderer = FakeRenderer()
    publisher = FakePublisher()

    service = PullRequestCommentService(
        analysis_service=analysis_service,
        pr_reader=reader,
        renderer=renderer,
        publisher=publisher,
    )

    result, comment = service.analyze_and_publish(
        owner="zunxii",
        repo="costgate",
        pull_number=1,
    )

    assert result is analysis_service.result
    assert comment["id"] == 999

    assert analysis_service.received_query is not None
    assert (
        analysis_service.received_query.baseline_sql
        == "SELECT * FROM orders WHERE customer_id = 12345;"
    )
    assert (
        analysis_service.received_query.candidate_sql
        == "SELECT * FROM orders WHERE customer_id::text = '12345';"
    )

    assert renderer.received_result is analysis_service.result

    assert publisher.received == {
        "owner": "zunxii",
        "repo": "costgate",
        "pull_number": 1,
        "body": "## CostGate\n\nEstimated impact: +$10/month",
    }