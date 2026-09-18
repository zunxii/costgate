from __future__ import annotations

from dataclasses import dataclass
from decimal import Decimal


@dataclass(frozen=True)
class RDSPricing:
    """
    Pricing assumptions for one RDS configuration.

    These are inputs to CostGate's estimation model.
    They are NOT a representation of the final AWS invoice.
    """

    region: str
    engine: str
    instance_class: str

    db_instance_hourly_usd: Decimal

    storage_gb_monthly_usd: Decimal = Decimal("0")
    million_io_requests_usd: Decimal = Decimal("0")

    @property
    def db_instance_monthly_usd(self) -> Decimal:
        """
        Approximate monthly instance cost using 730 hours/month.

        AWS bills actual DB instance usage by time; this is only
        a normalized monthly reference for CostGate's model.
        """
        return self.db_instance_hourly_usd * Decimal("730")


def get_rds_pricing(
    *,
    region: str,
    engine: str,
    instance_class: str,
    db_instance_hourly_usd: str | Decimal,
    storage_gb_monthly_usd: str | Decimal = "0",
    million_io_requests_usd: str | Decimal = "0",
) -> RDSPricing:
    """
    Create a validated RDS pricing configuration.

    We intentionally require the hourly rate as an input rather
    than hardcoding a potentially stale AWS price in application code.
    """

    pricing = RDSPricing(
        region=region,
        engine=engine,
        instance_class=instance_class,
        db_instance_hourly_usd=Decimal(str(db_instance_hourly_usd)),
        storage_gb_monthly_usd=Decimal(str(storage_gb_monthly_usd)),
        million_io_requests_usd=Decimal(str(million_io_requests_usd)),
    )

    if pricing.db_instance_hourly_usd <= 0:
        raise ValueError("RDS hourly price must be greater than zero.")

    if pricing.storage_gb_monthly_usd < 0:
        raise ValueError("Storage price cannot be negative.")

    if pricing.million_io_requests_usd < 0:
        raise ValueError("I/O price cannot be negative.")

    return pricing