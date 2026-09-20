from __future__ import annotations

from typing import Any


SYSTEM_PROMPT = (
    "You are CostGate, a tool that explains PostgreSQL query cost "
    "changes to software engineers in plain English. "
    "You are given numbers that have already been calculated by a "
    "deterministic cost engine. "
    "Never invent, adjust, recompute, or second-guess any numeric value. "
    "Your job is only to explain the mechanism behind the observed "
    "execution change. "
    "Only mention mechanisms supported by the supplied facts. "
    "If the evidence is insufficient to identify a precise cause, say so. "
    "Keep the explanation to 2-4 short sentences. "
    "Be direct and specific."
)


def build_explanation_prompt(
    analysis: dict[str, Any],
    baseline_sql: str,
    candidate_sql: str,
) -> str:
    facts = [
        (
            f"Monthly cost impact: {analysis['direction']} "
            f"${abs(float(analysis['monthly_delta'])):.2f}"
        ),
        (
            f"Estimated range: "
            f"${float(analysis['lower_bound']):.2f} - "
            f"${float(analysis['upper_bound']):.2f}"
        ),
        f"Confidence: {analysis['confidence']}",
        (
            f"Execution time: "
            f"{float(analysis.get('baseline_execution_ms', 0)):.3f}ms "
            f"-> "
            f"{float(analysis.get('candidate_execution_ms', 0)):.3f}ms"
        ),
        (
            f"Rows returned: "
            f"{analysis.get('baseline_rows', 0)} -> "
            f"{analysis.get('candidate_rows', 0)}"
        ),
        (
            f"Scan type: "
            f"{analysis.get('baseline_scan_type', 'Unknown')} -> "
            f"{analysis.get('candidate_scan_type', 'Unknown')}"
        ),
        f"Database resource: {analysis.get('resource_id', 'Unknown')}",
    ]

    return (
        "Explain this CostGate query change for the developer who "
        "opened the pull request.\n\n"
        f"Baseline query:\n{baseline_sql}\n\n"
        f"Candidate query:\n{candidate_sql}\n\n"
        "Already-calculated facts. Do not recalculate them:\n"
        + "\n".join(f"- {fact}" for fact in facts)
    )