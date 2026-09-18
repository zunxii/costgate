from __future__ import annotations

import json
import os
from typing import Any

import psycopg

from app.domain.errors import DatabaseAnalysisError
from app.domain.models import PlanMetrics

from .plan_parser import parse_explain_json


class QueryAnalyzer:
    """
    Runs read-only SQL analysis against the CostGate shadow PostgreSQL DB.

    Flow:
        SQL
        -> EXPLAIN ANALYZE
        -> PostgreSQL JSON plan
        -> PlanMetrics
    """

    def __init__(self) -> None:
        self.host = os.getenv("RDSHOST")
        self.port = int(os.getenv("PGPORT", "5432"))
        self.database = os.getenv("PGDATABASE", "costgate")
        self.user = os.getenv("PGUSER", "postgres")
        self.sslmode = os.getenv("PGSSLMODE", "verify-full")
        self.sslrootcert = os.path.expanduser(
            os.getenv("PGSSLROOTCERT", "~/global-bundle.pem")
        )

        if not self.host:
            raise DatabaseAnalysisError(
                "RDSHOST environment variable is not set."
            )

        if not os.path.exists(self.sslrootcert):
            raise DatabaseAnalysisError(
                f"PostgreSQL CA certificate not found: {self.sslrootcert}"
            )

    def analyze(self, sql: str) -> PlanMetrics:
        """
        Execute a read-only SQL query with EXPLAIN ANALYZE and
        return structured PlanMetrics.
        """
        normalized_sql = sql.strip()

        if not normalized_sql:
            raise DatabaseAnalysisError("SQL query cannot be empty.")

        self._validate_query(normalized_sql)

        explain_sql = (
            "EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) "
            + normalized_sql
        )

        try:
            with psycopg.connect(
                host=self.host,
                port=self.port,
                dbname=self.database,
                user=self.user,
                sslmode=self.sslmode,
                sslrootcert=self.sslrootcert,
            ) as conn:
                with conn.transaction():
                    # Prevent accidental data modification.
                    conn.execute("SET TRANSACTION READ ONLY")

                    # Protect the shadow DB from pathological queries.
                    conn.execute("SET LOCAL statement_timeout = '10s'")
                    conn.execute("SET LOCAL lock_timeout = '2s'")

                    with conn.cursor() as cursor:
                        cursor.execute(explain_sql)

                        row = cursor.fetchone()

                        if row is None:
                            raise DatabaseAnalysisError(
                                "PostgreSQL returned no EXPLAIN result."
                            )

                        explain_result: Any = row[0]

                        # psycopg normally decodes JSON automatically,
                        # but handle string output as well.
                        if isinstance(explain_result, str):
                            explain_result = json.loads(explain_result)

                        return parse_explain_json(explain_result)

        except DatabaseAnalysisError:
            raise

        except (psycopg.Error, json.JSONDecodeError) as exc:
            raise DatabaseAnalysisError(
                f"Failed to analyze PostgreSQL query: {exc}"
            ) from exc

    @staticmethod
    def _validate_query(sql: str) -> None:
        """
        MVP safety restriction.

        CostGate executes EXPLAIN ANALYZE, so we only allow SELECT
        statements. We do not allow arbitrary INSERT/UPDATE/DELETE/
        DDL to reach the analyzer.
        """
        query = sql.strip()

        # Remove a single trailing semicolon for convenience.
        if query.endswith(";"):
            query = query[:-1].rstrip()

        if ";" in query:
            raise DatabaseAnalysisError(
                "Multiple SQL statements are not allowed."
            )

        if not query.lower().startswith("select"):
            raise DatabaseAnalysisError(
                "Only SELECT queries are supported by the MVP analyzer."
            )