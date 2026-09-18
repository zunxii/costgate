from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class DiffChange:
    """
    Represents the added and removed lines from one changed file.
    """

    file_path: str
    added_lines: list[str]
    removed_lines: list[str]


def parse_unified_diff(
    file_path: str,
    patch: str,
) -> DiffChange:
    """
    Parse a unified Git diff patch.

    We intentionally keep this parser simple for the MVP.
    It extracts added and removed lines while ignoring:
    - diff metadata
    - hunk headers
    - unchanged lines
    """
    added_lines: list[str] = []
    removed_lines: list[str] = []

    for line in patch.splitlines():
        # Hunk metadata.
        if line.startswith("@@"):
            continue

        # Git metadata.
        if line.startswith("+++"):
            continue

        if line.startswith("---"):
            continue

        if line.startswith("diff --git"):
            continue

        if line.startswith("index "):
            continue

        if line.startswith("+"):
            added_lines.append(line[1:])

        elif line.startswith("-"):
            removed_lines.append(line[1:])

    return DiffChange(
        file_path=file_path,
        added_lines=added_lines,
        removed_lines=removed_lines,
    )