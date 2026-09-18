from __future__ import annotations

import re

from app.domain.errors import QueryExtractionError
from app.domain.models import QueryCandidate

from .diff_parser import DiffChange


_SQL_START_PATTERN = re.compile(
    r"^\s*(SELECT|WITH)\b",
    re.IGNORECASE,
)


def extract_sql_queries(change: DiffChange) -> list[QueryCandidate]:
    """
    Extract SQL SELECT/WITH statements from added lines of a diff.

    MVP scope:
    - SELECT statements
    - WITH ... SELECT statements
    - SQL contained directly in the changed lines
    - statements separated by semicolons

    This deliberately does not try to understand ORM syntax yet.
    """

    statements = _collect_sql_statements(change.added_lines)

    return [
        QueryCandidate(
            sql=statement,
            file_path=change.file_path,
            source="diff",
        )
        for statement in statements
    ]


def _collect_sql_statements(lines: list[str]) -> list[str]:
    statements: list[str] = []
    current: list[str] = []
    collecting = False

    for line in lines:
        stripped = line.strip()

        # Ignore empty lines.
        if not stripped:
            if collecting:
                current.append("")
            continue

        # Ignore SQL comments.
        if stripped.startswith("--"):
            continue

        # Start a SQL statement when we see SELECT or WITH.
        if not collecting:
            if not _SQL_START_PATTERN.match(stripped):
                continue

            collecting = True

        current.append(stripped)

        # One statement finished.
        if ";" in stripped:
            statement = _finalize_statement(current)

            if statement:
                statements.append(statement)

            current = []
            collecting = False

    # Handle a final statement without a trailing semicolon.
    if current:
        statement = _finalize_statement(current)

        if statement:
            statements.append(statement)

    return statements


def _finalize_statement(lines: list[str]) -> str:
    """
    Normalize one extracted SQL statement.
    """
    sql = " ".join(
        line.strip()
        for line in lines
        if line.strip()
    )

    # Keep only the first statement if multiple semicolons appear.
    if ";" in sql:
        sql = sql.split(";", 1)[0]

    sql = sql.strip()

    if not sql:
        raise QueryExtractionError(
            "Extracted SQL statement is empty."
        )

    return sql + ";"