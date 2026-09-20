from decimal import Decimal

from app.policy.cost_policy import (
    CostPolicy,
    PolicyVerdict,
)


def test_small_increase_passes():
    policy = CostPolicy()

    decision = policy.evaluate(
        monthly_delta=Decimal("2"),
        direction="increase",
        confidence="high",
    )

    assert decision.verdict == PolicyVerdict.PASS
    assert decision.github_conclusion == "success"


def test_medium_increase_warns():
    policy = CostPolicy()

    decision = policy.evaluate(
        monthly_delta=Decimal("8"),
        direction="increase",
        confidence="high",
    )

    assert decision.verdict == PolicyVerdict.WARN
    assert decision.github_conclusion == "neutral"


def test_large_high_confidence_increase_blocks():
    policy = CostPolicy()

    decision = policy.evaluate(
        monthly_delta=Decimal("30"),
        direction="increase",
        confidence="high",
    )

    assert decision.verdict == PolicyVerdict.BLOCK
    assert decision.github_conclusion == "failure"


def test_low_confidence_warns():
    policy = CostPolicy()

    decision = policy.evaluate(
        monthly_delta=Decimal("1"),
        direction="increase",
        confidence="low",
    )

    assert decision.verdict == PolicyVerdict.WARN


def test_decrease_passes():
    policy = CostPolicy()

    decision = policy.evaluate(
        monthly_delta=Decimal("-20"),
        direction="decrease",
        confidence="high",
    )

    assert decision.verdict == PolicyVerdict.PASS