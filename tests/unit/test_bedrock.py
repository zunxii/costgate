from app.bedrock.explanation import CostGateExplainer
from app.bedrock.prompt_builder import build_explanation_prompt


ANALYSIS = {
    "monthly_delta": "0.80",
    "lower_bound": "0.64",
    "upper_bound": "0.96",
    "confidence": "low",
    "direction": "increase",
    "baseline_execution_ms": 64.511,
    "candidate_execution_ms": 136.434,
    "baseline_rows": 6,
    "candidate_rows": 74549,
    "baseline_scan_type": "Seq Scan",
    "candidate_scan_type": "Seq Scan",
    "resource_id": "costgate-db",
}


def test_prompt_contains_deterministic_facts():
    prompt = build_explanation_prompt(
        ANALYSIS,
        "SELECT * FROM orders WHERE id = 1",
        "SELECT * FROM orders WHERE LOWER(id::text) = '1'",
    )

    assert "$0.80" in prompt
    assert "$0.64" in prompt
    assert "$0.96" in prompt
    assert "64.511ms" in prompt
    assert "136.434ms" in prompt
    assert "6 -> 74549" in prompt
    assert "Seq Scan" in prompt


class FakeBedrockClient:
    def __init__(self):
        self.system_prompt = None
        self.user_prompt = None

    def generate(self, *, system_prompt, user_prompt):
        self.system_prompt = system_prompt
        self.user_prompt = user_prompt
        return "The candidate query increases work on the database."


def test_explainer_delegates_to_client():
    client = FakeBedrockClient()
    explainer = CostGateExplainer(client=client)

    result = explainer.explain(
        ANALYSIS,
        "SELECT 1",
        "SELECT 2",
    )

    assert result == (
        "The candidate query increases work on the database."
    )
    assert "$0.80" in client.user_prompt