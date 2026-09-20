import { apiRequest } from "@/lib/api/client";
import type { DashboardPayload } from "@/lib/api/dashboard";

export type DashboardSummary = DashboardPayload["summary"];
export type AuthorStat = DashboardPayload["authors"][number];
export type PredictionItem = DashboardPayload["predictions"][number];

export async function fetchDashboardSummary(): Promise<DashboardSummary> {
  const response = await apiRequest<DashboardSummary>("/api/dashboard/summary");
  if (response.error || !response.data) throw new Error(response.error?.message || "Unable to load dashboard summary.");
  return response.data;
}

export async function fetchDashboardAuthors(): Promise<AuthorStat[]> {
  const response = await apiRequest<AuthorStat[]>("/api/dashboard/authors");
  if (response.error || !response.data) throw new Error(response.error?.message || "Unable to load dashboard authors.");
  return response.data;
}

export async function fetchDashboardPredictions(): Promise<PredictionItem[]> {
  const response = await apiRequest<PredictionItem[]>("/api/dashboard/predictions");
  if (response.error || !response.data) throw new Error(response.error?.message || "Unable to load dashboard predictions.");
  return response.data;
}
