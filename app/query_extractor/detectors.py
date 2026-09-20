from __future__ import annotations

import re

import sqlparse
from app.query_extractor.python_sql_extractor import extract_sql_from_python

from app.domain.errors import QueryExtractionError
from app.domain.models import ChangedQuery


def _split_sql(content: str) -> list[str]:
    """
    Split a SQL file into complete SQL statements.

    Returned statements preserve SQL casing and include a trailing
    semicolon when the statement is complete.
    """
    statements: list[str] = []

    for statement in sqlparse.split(content):
        cleaned = statement.strip()

        if not cleaned:
            continue

        # Remove comments while preserving the actual SQL text.
        without_comments = sqlparse.format(
            cleaned,
            strip_comments=True,
            reindent=False,
        ).strip()

        if not without_comments:
            continue

        # Normalize whitespace for a stable representation,
        # but DO NOT lowercase or remove the semicolon.
        canonical = re.sub(r"\s+", " ", without_comments).strip()

        if not canonical.endswith(";"):
            canonical += ";"

        statements.append(canonical)

    return statements


def _normalize_sql(sql: str) -> str:
    """
    Normalize SQL ONLY for comparison.

    Case and trailing semicolon are intentionally ignored.
    """
    normalized = re.sub(r"\s+", " ", sql).strip()

    if normalized.endswith(";"):
        normalized = normalized[:-1].strip()

    return normalized.lower()

def _is_select(sql: str) -> bool:
    """
    MVP supports read-only SELECT/WITH statements.
    """
    normalized = sql.lstrip().lower()

    return normalized.startswith("select") or normalized.startswith("with")


def _extract_statements(content: str, file_path: str) -> list[str]:
    """
    Extract supported SQL statements according to the source file type.

    .py files use the narrow Python literal SQL extractor.
    Other files retain the existing SQL-file behavior.
    """
    if file_path.lower().endswith(".py"):
        return extract_sql_from_python(content)

    return _split_sql(content)

def detect_changed_query(
    baseline_content: str,
    candidate_content: str,
    file_path: str,
) -> ChangedQuery:
    """
    Detect exactly one modified SQL statement.

    MVP assumptions:
    - SQL file contains one or more complete SQL statements.
    - Exactly one existing statement is modified.
    - The statement remains a SELECT/WITH query.
    """

    baseline_statements = _extract_statements(baseline_content, file_path)
    candidate_statements = _extract_statements(candidate_content, file_path)

    if not baseline_statements:
        raise QueryExtractionError(
            f"No SQL statements found in baseline file: {file_path}"
        )

    if not candidate_statements:
        raise QueryExtractionError(
            f"No SQL statements found in candidate file: {file_path}"
        )

    if len(baseline_statements) != len(candidate_statements):
        raise QueryExtractionError(
            "MVP detector requires the same number of SQL statements "
            "in baseline and candidate files."
        )

    changed_pairs: list[tuple[str, str]] = []

    for baseline_sql, candidate_sql in zip(
        baseline_statements,
        candidate_statements,
    ):
        if _normalize_sql(baseline_sql) != _normalize_sql(candidate_sql):
            changed_pairs.append((baseline_sql, candidate_sql))

    if len(changed_pairs) == 0:
        raise QueryExtractionError(
            f"No SQL statement changed in: {file_path}"
        )

    if len(changed_pairs) > 1:
        raise QueryExtractionError(
            "MVP detector found multiple changed SQL statements. "
            "Analyze one changed query per PR for now."
        )

    baseline_sql, candidate_sql = changed_pairs[0]

    baseline_sql = _unwrap_explain(baseline_sql)
    candidate_sql = _unwrap_explain(candidate_sql)

    if not _is_select(baseline_sql):
        raise QueryExtractionError(
            "Baseline statement is not a supported SELECT/WITH query."
        )

    if not _is_select(candidate_sql):
        raise QueryExtractionError(
            "Candidate statement is not a supported SELECT/WITH query."
        )

    return ChangedQuery(
        baseline_sql=baseline_sql,
        candidate_sql=candidate_sql,
        file_path=file_path,
    )

def _unwrap_explain(sql: str) -> str:
    """
    Remove a PostgreSQL EXPLAIN wrapper and return the underlying query.

    Supports forms such as:
        EXPLAIN SELECT ...
        EXPLAIN ANALYZE SELECT ...
        EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) SELECT ...
    """
    pattern = re.compile(
        r"^\s*EXPLAIN"
        r"(?:\s*\([^)]*\))?"
        r"(?:\s+ANALYZE)?"
        r"\s+",
        re.IGNORECASE,
    )

    return pattern.sub("", sql, count=1).strip()