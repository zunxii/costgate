from decimal import Decimal

from app.billing.source import MockCURBillingSource


def test_mock_cur_calculates_monthly_delta(tmp_path):
    path = tmp_path / "cur.json"

    path.write_text(
        """
        {
          "resource_id": "costgate-db",
          "baseline_window": {
            "daily_cost_usd": "1.9200"
          },
          "candidate_window": {
            "daily_cost_usd": "1.9480"
          }
        }
        """
    )

    source = MockCURBillingSource(path)

    result = source.get_actual_monthly_delta(
        resource_id="costgate-db"
    )

    assert result == Decimal("0.8400")