from app.query_extractor.diff_parser import parse_unified_diff
from app.query_extractor.sql_extractor import extract_sql_queries
from app.query_extractor.detectors import detect_changed_query

def test_parse_unified_diff():
    patch = """@@ -1,4 +1,4 @@
 SELECT *
 FROM orders
-WHERE customer_id = 12345;
+WHERE LOWER(customer_id) = LOWER(12345);
"""

    change = parse_unified_diff(
        file_path="queries/customer_lookup.sql",
        patch=patch,
    )

    assert change.file_path == "queries/customer_lookup.sql"

    assert change.removed_lines == [
        "WHERE customer_id = 12345;"
    ]

    assert change.added_lines == [
        "WHERE LOWER(customer_id) = LOWER(12345);"
    ]


def test_parse_multiple_changed_lines():
    patch = """@@ -1,5 +1,7 @@
 SELECT id
 FROM orders
-WHERE customer_id = 12345;
+WHERE status = 'paid'
+  AND customer_id = 12345
+ORDER BY created_at DESC;
"""

    change = parse_unified_diff(
        file_path="queries/orders.sql",
        patch=patch,
    )

    assert change.removed_lines == [
        "WHERE customer_id = 12345;"
    ]

    assert change.added_lines == [
        "WHERE status = 'paid'",
        "  AND customer_id = 12345",
        "ORDER BY created_at DESC;",
    ]

def test_extract_single_select():
    patch = """@@ -1,3 +1,3 @@
-SELECT *
-FROM orders
-WHERE customer_id = 12345;
+SELECT id, customer_id, status
+FROM orders
+WHERE customer_id = 12345;
"""

    change = parse_unified_diff(
        file_path="queries/customer_lookup.sql",
        patch=patch,
    )

    queries = extract_sql_queries(change)

    assert len(queries) == 1

    assert queries[0].sql == (
        "SELECT id, customer_id, status "
        "FROM orders "
        "WHERE customer_id = 12345;"
    )

    assert queries[0].file_path == "queries/customer_lookup.sql"
    assert queries[0].source == "diff"


def test_extract_multiple_selects():
    patch = """@@ -1,2 +1,6 @@
+SELECT id FROM customers WHERE country = 'IN';
+
+SELECT id, total_cents
+FROM orders
+WHERE status = 'paid';
"""

    change = parse_unified_diff(
        file_path="queries/report.sql",
        patch=patch,
    )

    queries = extract_sql_queries(change)

    assert len(queries) == 2

    assert queries[0].sql == (
        "SELECT id FROM customers WHERE country = 'IN';"
    )

    assert queries[1].sql == (
        "SELECT id, total_cents FROM orders WHERE status = 'paid';"
    )


def test_ignore_non_sql_added_lines():
    patch = """@@ -1,3 +1,4 @@
+this is not sql
+print("hello")
+SELECT *
+FROM orders;
"""

    change = parse_unified_diff(
        file_path="queries/test.sql",
        patch=patch,
    )

    queries = extract_sql_queries(change)

    assert len(queries) == 1
    assert queries[0].sql == "SELECT * FROM orders;"

def test_detect_single_changed_query():
    baseline = """
    SELECT
        id,
        customer_id,
        status
    FROM orders
    WHERE customer_id = 12345;
    """

    candidate = """
    SELECT
        id,
        customer_id,
        status
    FROM orders
    WHERE LOWER(customer_id) = LOWER(12345);
    """

    changed = detect_changed_query(
        baseline_content=baseline,
        candidate_content=candidate,
        file_path="queries/customer_lookup.sql",
    )

    assert changed.file_path == "queries/customer_lookup.sql"

    assert changed.baseline_sql == (
        "SELECT id, customer_id, status "
        "FROM orders "
        "WHERE customer_id = 12345;"
    )

    assert changed.candidate_sql == (
        "SELECT id, customer_id, status "
        "FROM orders "
        "WHERE LOWER(customer_id) = LOWER(12345);"
    )


def test_detect_no_change():
    content = """
    SELECT *
    FROM orders
    WHERE customer_id = 12345;
    """

    try:
        detect_changed_query(
            baseline_content=content,
            candidate_content=content,
            file_path="queries/customer_lookup.sql",
        )
    except Exception:
        return

    raise AssertionError("Expected QueryExtractionError")


def test_reject_multiple_changed_queries():
    baseline = """
    SELECT * FROM customers;

    SELECT * FROM orders;
    """

    candidate = """
    SELECT * FROM customers WHERE country = 'IN';

    SELECT * FROM orders WHERE status = 'paid';
    """

    try:
        detect_changed_query(
            baseline_content=baseline,
            candidate_content=candidate,
            file_path="queries/report.sql",
        )
    except Exception:
        return

    raise AssertionError("Expected QueryExtractionError")

def test_detect_changed_query_unwraps_explain():
    baseline = """
    EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
    SELECT *
    FROM orders
    WHERE customer_id = 12345;
    """

    candidate = """
    EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
    SELECT *
    FROM orders
    WHERE customer_id::text = '12345';
    """

    changed = detect_changed_query(
        baseline,
        candidate,
        "customer_lookup.sql",
    )

    assert changed.baseline_sql.startswith("SELECT")
    assert changed.candidate_sql.startswith("SELECT")
    assert "customer_id = 12345" in changed.baseline_sql
    assert "customer_id::text = '12345'" in changed.candidate_sql