export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

export interface ApiResponse<T> {
  data: T | null;
  error: ApiError | null;
  request_id: string;
}

export interface DashboardSummary {
  prediction_count: number;
  reconciled_count: number;
  total_predicted_monthly: number;
  total_verified_monthly: number;
  mean_error_pct: number | null;
}

export interface PredictionItem {
  prediction_id: string;
  repository: string;
  pull_request_number: number;
  title?: string;
  author: string;
  created_at: string;
  status: "predicted" | "monitoring" | "verification_pending" | "reconciled" | "failed";
  predicted_monthly_delta: number;
  actual_monthly_delta: number | null;
  actual_error_pct: number | null;
  confidence: "high" | "medium" | "low";
  direction: "increase" | "decrease" | "neutral";
  scan_type?: string;
  runtime?: string;
  before_query?: string;
  after_query?: string;
  fixed_query?: string;
}

export interface AuthorStat {
  author: string;
  prs: number;
  predicted_monthly: number;
  verified_monthly: number;
  mean_error_pct: number | null;
}

export interface ConnectedRepo {
  id: string;
  name: string;
  status: "active" | "inactive" | "error";
  prs_analyzed: number;
  total_savings_usd: number;
  webhook_health: "healthy" | "degraded" | "unreachable";
  db_engine: string;
  installed_at: string;
}

export interface FinOpsPolicy {
  warn_usd: number;
  block_usd: number;
  min_confidence: string;
  enable_check: boolean;
  enable_comment: boolean;
  notification_webhook?: string;
}
