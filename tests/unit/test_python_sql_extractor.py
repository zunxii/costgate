from app.query_extractor.python_sql_extractor import extract_sql_from_python
from app.query_extractor.detectors import detect_changed_query


def test_extracts_execute_sql():
    source = '''
cursor.execute("""
    SELECT id, name
    FROM customers
    WHERE country = 'IN'
""")
'''

    queries = extract_sql_from_python(source)

    assert len(queries) == 1
    assert queries[0].startswith("SELECT id, name")


def test_extracts_assigned_query():
    source = '''
query = """
SELECT *
FROM orders
WHERE customer_id = 42
"""
'''

    queries = extract_sql_from_python(source)

    assert len(queries) == 1


def test_ignores_non_sql_strings():
    source = '''
message = "hello"
url = "https://example.com"
number = 42
'''

    assert extract_sql_from_python(source) == []


def test_extracts_with_query():
    source = '''
query = """
WITH recent AS (
    SELECT *
    FROM orders
)
SELECT *
FROM recent
"""
'''

    queries = extract_sql_from_python(source)

    assert len(queries) == 1
    assert queries[0].startswith("WITH recent")

def test_detect_changed_query_from_python_file():
    baseline = '''
query = """
SELECT id, name
FROM customers
WHERE country = 'IN'
"""
'''

    candidate = '''
query = """
SELECT id, name
FROM customers
WHERE country = 'US'
"""
'''

    result = detect_changed_query(
        baseline,
        candidate,
        "app/db/queries.py",
    )

    assert result.file_path == "app/db/queries.py"
    assert "country = 'IN'" in result.baseline_sql
    assert "country = 'US'" in result.candidate_sql

def test_sql_file_still_uses_existing_detector():
    baseline = """
    SELECT id FROM customers;
    """

    candidate = """
    SELECT id, name FROM customers;
    """

    result = detect_changed_query(
        baseline,
        candidate,
        "queries/customer.sql",
    )

    assert result.baseline_sql == "SELECT id FROM customers;"
    assert result.candidate_sql == "SELECT id, name FROM customers;"