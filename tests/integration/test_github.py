import pytest

from app.github.pr_reader import PullRequestReader
from app.query_extractor.detectors import detect_changed_query


@pytest.mark.integration
def test_read_costgate_pr_and_detect_sql_change():
    reader = PullRequestReader()

    pr = reader.read("zunxii", "costgate", 1)

    assert pr.number == 1
    assert len(pr.files) == 1

    file = pr.files[0]

    assert file.path == "db/experiments/customer_lookup.sql"
    assert file.base_content is not None
    assert file.head_content is not None

    changed = detect_changed_query(
        file.base_content,
        file.head_content,
        file.path,
    )

    assert "customer_id = 12345" in changed.baseline_sql
    assert "customer_id::text = '12345'" in changed.candidate_sql