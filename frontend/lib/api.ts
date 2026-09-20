export interface DashboardSummary {
  prediction_count: number;
  reconciled_count: number;
  total_predicted_monthly: number;
  total_verified_monthly: number;
  mean_error_pct: number | null;
}

export interface AuthorStat {
  author: string;
  prs: number;
  predicted_monthly: number;
  verified_monthly: number;
  mean_error_pct: number | null;
}

export interface PredictionItem {
  prediction_id: string;
  repository: string;
  pull_request_number: number;
  author: string;
  created_at: string;
  status: string;
  predicted_monthly_delta: number;
  actual_monthly_delta: number | null;
  actual_error_pct: number | null;
  confidence: string;
  direction: string;
}

const FALLBACK_SUMMARY: DashboardSummary = {
  prediction_count: 24,
  reconciled_count: 18,
  total_predicted_monthly: 1420.50,
  total_verified_monthly: 1385.10,
  mean_error_pct: 2.49,
};

const FALLBACK_AUTHORS: AuthorStat[] = [
  { author: "alex-dev", prs: 8, predicted_monthly: 520.00, verified_monthly: 510.00, mean_error_pct: 1.92 },
  { author: "sarah-db", prs: 6, predicted_monthly: 410.50, verified_monthly: 398.20, mean_error_pct: 3.00 },
  { author: "mike-infra", prs: 5, predicted_monthly: 290.00, verified_monthly: 288.50, mean_error_pct: 0.52 },
  { author: "zunxii", prs: 5, predicted_monthly: 200.00, verified_monthly: 188.40, mean_error_pct: 5.80 },
];

const FALLBACK_PREDICTIONS: PredictionItem[] = [
  {
    prediction_id: "pred-104928-aef1",
    repository: "zunxii/costgate",
    pull_request_number: 142,
    author: "alex-dev",
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    status: "reconciled",
    predicted_monthly_delta: 142.00,
    actual_monthly_delta: 139.50,
    actual_error_pct: 1.76,
    confidence: "high",
    direction: "increase",
  },
  {
    prediction_id: "pred-104927-bdf2",
    repository: "zunxii/costgate",
    pull_request_number: 141,
    author: "sarah-db",
    created_at: new Date(Date.now() - 3600000 * 8).toISOString(),
    status: "reconciled",
    predicted_monthly_delta: -85.50,
    actual_monthly_delta: -83.20,
    actual_error_pct: 2.69,
    confidence: "high",
    direction: "decrease",
  },
  {
    prediction_id: "pred-104926-cc73",
    repository: "zunxii/costgate",
    pull_request_number: 140,
    author: "mike-infra",
    created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
    status: "monitoring",
    predicted_monthly_delta: 310.00,
    actual_monthly_delta: null,
    actual_error_pct: null,
    confidence: "medium",
    direction: "increase",
  },
];

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";

export async function fetchDashboardSummary(): Promise<DashboardSummary> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/dashboard/summary`, {
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (error) {
    console.warn("Using fallback dashboard summary:", error);
    return FALLBACK_SUMMARY;
  }
}

export async function fetchDashboardAuthors(): Promise<AuthorStat[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/dashboard/authors`, {
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (error) {
    console.warn("Using fallback dashboard authors:", error);
    return FALLBACK_AUTHORS;
  }
}

export async function fetchDashboardPredictions(): Promise<PredictionItem[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/dashboard/predictions`, {
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (error) {
    console.warn("Using fallback dashboard predictions:", error);
    return FALLBACK_PREDICTIONS;
  }
}
