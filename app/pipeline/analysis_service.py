from __future__ import annotations

from app.analyzer.comparator import compare_plans
from app.analyzer.query_analyzer import QueryAnalyzer
from app.cost_engine.assumptions import CostAssumptions
from app.cost_engine.calculator import calculate_cost_impact
from app.cost_engine.pricing import RDSPricing
from app.domain.models import AnalysisResult, ChangedQuery


class AnalysisService:
    """
    Orchestrates the complete CostGate analysis for one changed query.

    It intentionally contains orchestration only.
    Individual components own their own logic.
    """

    def __init__(
        self,
        analyzer: QueryAnalyzer,
        assumptions: CostAssumptions,
        pricing: RDSPricing,
    ) -> None:
        self.analyzer = analyzer
        self.assumptions = assumptions
        self.pricing = pricing

    def analyze(self, changed_query: ChangedQuery) -> AnalysisResult:
        """
        Analyze baseline and candidate queries and calculate
        the resulting estimated cost impact.
        """

        baseline_metrics = self.analyzer.analyze(
            changed_query.baseline_sql
        )

        candidate_metrics = self.analyzer.analyze(
            changed_query.candidate_sql
        )

        comparison = compare_plans(
            baseline_metrics,
            candidate_metrics,
        )

        cost_estimate = calculate_cost_impact(
            comparison,
            self.assumptions,
            self.pricing,
        )

        return AnalysisResult(
            query=changed_query,
            baseline=baseline_metrics,
            candidate=candidate_metrics,
            comparison=comparison,
            cost_estimate=cost_estimate,
        )