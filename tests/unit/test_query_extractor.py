from app.query_extractor.diff_parser import parse_unified_diff


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