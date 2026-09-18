from app.github.comment_publisher import GitHubCommentPublisher


class FakeGitHubClient:
    def __init__(self, comments=None):
        self.comments = comments or []
        self.created = []
        self.updated = []

    def list_pull_request_comments(
        self,
        *,
        owner: str,
        repo: str,
        pull_number: int,
    ):
        return self.comments

    def create_pull_request_comment(
        self,
        *,
        owner: str,
        repo: str,
        pull_number: int,
        body: str,
    ):
        comment = {
            "id": 123,
            "body": body,
            "html_url": (
                "https://github.com/zunxii/costgate/"
                "pull/1#issuecomment-123"
            ),
        }

        self.created.append(
            {
                "owner": owner,
                "repo": repo,
                "pull_number": pull_number,
                "body": body,
            }
        )

        self.comments.append(comment)

        return comment

    def update_issue_comment(
        self,
        *,
        owner: str,
        repo: str,
        comment_id: int,
        body: str,
    ):
        updated = {
            "id": comment_id,
            "body": body,
        }

        self.updated.append(
            {
                "owner": owner,
                "repo": repo,
                "comment_id": comment_id,
                "body": body,
            }
        )

        return updated


def test_publish_creates_costgate_comment():
    client = FakeGitHubClient()
    publisher = GitHubCommentPublisher(client=client)

    result = publisher.publish(
        owner="zunxii",
        repo="costgate",
        pull_number=1,
        body="## CostGate\n\nEstimated impact: +$12/month",
    )

    assert result["id"] == 123
    assert len(client.created) == 1
    assert len(client.updated) == 0

    assert "<!-- costgate-analysis -->" in client.created[0]["body"]
    assert "Estimated impact: +$12/month" in client.created[0]["body"]


def test_publish_updates_existing_costgate_comment():
    existing_comment = {
        "id": 456,
        "body": (
            "<!-- costgate-analysis -->\n"
            "Old CostGate result"
        ),
    }

    client = FakeGitHubClient(comments=[existing_comment])
    publisher = GitHubCommentPublisher(client=client)

    result = publisher.publish(
        owner="zunxii",
        repo="costgate",
        pull_number=1,
        body="## CostGate\n\nUpdated impact: +$25/month",
    )

    assert result["id"] == 456
    assert len(client.created) == 0
    assert len(client.updated) == 1

    assert (
        "<!-- costgate-analysis -->\n"
        "## CostGate\n\nUpdated impact: +$25/month"
    ) == client.updated[0]["body"]