from __future__ import annotations

import os
from dataclasses import dataclass
from decimal import Decimal
from enum import Enum


class PolicyVerdict(str, Enum):
    PASS = "pass"
    WARN = "warn"
    BLOCK = "block"


_CONFIDENCE_RANK = {
    "low": 0,
    "medium": 1,
    "high": 2,
}


@dataclass(frozen=True)
class CostPolicy:
    warn_monthly_usd: Decimal = Decimal("5")
    block_monthly_usd: Decimal = Decimal("25")
    minimum_confidence: str = "medium"

    @classmethod
    def from_environment(cls) -> "CostPolicy":
        return cls(
            warn_monthly_usd=Decimal(
                os.getenv("COSTGATE_WARN_USD", "5")
            ),
            block_monthly_usd=Decimal(
                os.getenv("COSTGATE_BLOCK_USD", "25")
            ),
            minimum_confidence=os.getenv(
                "COSTGATE_MIN_CONFIDENCE",
                "medium",
            ).lower(),
        )

    def evaluate(
        self,
        *,
        monthly_delta: Decimal,
        direction: str,
        confidence: str,
    ) -> "PolicyDecision":
        confidence = confidence.lower()
        direction = direction.lower()

        if direction != "increase" or monthly_delta <= 0:
            return PolicyDecision(
                verdict=PolicyVerdict.PASS,
                title="CostGate: PASS",
                reason="No increase in estimated monthly infrastructure impact.",
            )

        if confidence not in _CONFIDENCE_RANK:
            confidence = "low"

        confidence_too_low = (
            _CONFIDENCE_RANK[confidence]
            < _CONFIDENCE_RANK.get(
                self.minimum_confidence,
                _CONFIDENCE_RANK["medium"],
            )
        )

        if (
            monthly_delta >= self.block_monthly_usd
            and not confidence_too_low
        ):
            return PolicyDecision(
                verdict=PolicyVerdict.BLOCK,
                title="CostGate: BLOCK",
                reason=(
                    f"Estimated monthly impact of "
                    f"${monthly_delta:.2f} exceeds the "
                    f"${self.block_monthly_usd:.2f} block threshold."
                ),
            )

        if (
            monthly_delta >= self.warn_monthly_usd
            or confidence_too_low
        ):
            reason_parts = []

            if monthly_delta >= self.warn_monthly_usd:
                reason_parts.append(
                    f"estimated monthly impact is "
                    f"${monthly_delta:.2f}"
                )

            if confidence_too_low:
                reason_parts.append(
                    f"confidence is {confidence}, below the "
                    f"{self.minimum_confidence} minimum"
                )

            return PolicyDecision(
                verdict=PolicyVerdict.WARN,
                title="CostGate: WARNING",
                reason="; ".join(reason_parts) + ".",
            )

        return PolicyDecision(
            verdict=PolicyVerdict.PASS,
            title="CostGate: PASS",
            reason=(
                f"Estimated monthly impact of "
                f"${monthly_delta:.2f} is below the "
                f"${self.warn_monthly_usd:.2f} warning threshold."
            ),
        )


@dataclass(frozen=True)
class PolicyDecision:
    verdict: PolicyVerdict
    title: str
    reason: str

    @property
    def github_conclusion(self) -> str:
        if self.verdict == PolicyVerdict.BLOCK:
            return "failure"

        if self.verdict == PolicyVerdict.WARN:
            return "neutral"

        return "success"