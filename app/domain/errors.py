class CostGateError(Exception):
    """Base exception for CostGate."""


class DatabaseAnalysisError(CostGateError):
    """Raised when a query cannot be analyzed by PostgreSQL."""


class PlanParseError(CostGateError):
    """Raised when PostgreSQL's EXPLAIN JSON cannot be parsed."""


class QueryExtractionError(CostGateError):
    """Raised when a query cannot be extracted from a code change."""


class CostCalculationError(CostGateError):
    """Raised when a cost estimate cannot be calculated."""


class GitHubIntegrationError(CostGateError):
    """Raised when a GitHub operation fails."""


class BedrockError(CostGateError):
    """Raised when Bedrock explanation generation fails."""