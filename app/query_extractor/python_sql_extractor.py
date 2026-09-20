from __future__ import annotations

import ast
import re

import sqlparse


def extract_sql_from_python(source: str) -> list[str]:
    """
    Extract literal SQL SELECT/WITH statements from Python source code.

    Scope:
    - Parses Python AST for string constants.
    - Filters for string literals containing SELECT or WITH statements.
    - Handles multiline strings, leading SQL comments, and whitespace.
    - Safely handles SyntaxError in invalid/partial Python files.
    """
    try:
        tree = ast.parse(source)
    except SyntaxError:
        return []

    queries: list[str] = []

    for node in ast.walk(tree):
        if not isinstance(node, ast.Constant) or not isinstance(node.value, str):
            continue

        sql_text = node.value.strip()

        # Split into potential SQL statements if multiple exist in string
        for statement in sqlparse.split(sql_text):
            cleaned = statement.strip()

            if not cleaned:
                continue

            without_comments = sqlparse.format(
                cleaned,
                strip_comments=True,
                reindent=False,
            ).strip()

            if not without_comments:
                continue

            canonical = re.sub(r"\s+", " ", without_comments).strip()
            upper_canonical = canonical.upper()

            if upper_canonical.startswith("SELECT") or upper_canonical.startswith("WITH"):
                if not canonical.endswith(";"):
                    canonical += ";"

                queries.append(canonical)

    return queries