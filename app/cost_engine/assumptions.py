from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class CostAssumptions:
    """
    Workload and pricing assumptions used by CostGate.

    The resulting number is an estimated attributed infrastructure
    impact, not an exact AWS invoice delta.
    """

    monthly_requests: int

    db_instance_hourly_cost_usd: float

    # How many concurrent execution slots we attribute to a query.
    # For the MVP we keep this at 1.
    effective_parallelism: float = 1.0

    # Optional infrastructure billing multiplier, e.g. 2 for Multi-AZ
    # when the user explicitly wants the standby compute cost included.
    billing_multiplier: float = 1.0

    # Number of seconds per billing hour.
    seconds_per_hour: int = 3600

    def validate(self) -> None:
        if self.monthly_requests <= 0:
            raise ValueError("monthly_requests must be greater than 0.")

        if self.db_instance_hourly_cost_usd <= 0:
            raise ValueError(
                "db_instance_hourly_cost_usd must be greater than 0."
            )

        if self.effective_parallelism <= 0:
            raise ValueError(
                "effective_parallelism must be greater than 0."
            )

        if self.billing_multiplier <= 0:
            raise ValueError(
                "billing_multiplier must be greater than 0."
            )

        if self.seconds_per_hour <= 0:
            raise ValueError(
                "seconds_per_hour must be greater than 0."
            )