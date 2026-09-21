import { apiRequest } from "./client";
import type { DashboardSummary, PredictionItem, AuthorStat, ConnectedRepo, FinOpsPolicy } from "./types";

export interface DashboardPayload { summary: DashboardSummary; authors: AuthorStat[]; predictions: PredictionItem[]; repos: ConnectedRepo[]; policy: FinOpsPolicy; }
export const dashboardApi = {
  getAll: () => apiRequest<DashboardPayload>("/api/dashboard"),
  getSummary: () => apiRequest<DashboardSummary>("/api/dashboard/summary"),
  getPredictions: () => apiRequest<PredictionItem[]>("/api/dashboard/predictions"),
  getAuthors: () => apiRequest<AuthorStat[]>("/api/dashboard/authors"),
  getRepos: () => apiRequest<ConnectedRepo[]>("/api/dashboard/repos"),
  getPolicy: () => apiRequest<FinOpsPolicy>("/api/dashboard/policy"),
  updatePolicy: (policy: Partial<FinOpsPolicy> & {warn_usd?:number;block_usd?:number;db_instance?:string;notification_webhook?:string}) => apiRequest<{success:boolean;policy:FinOpsPolicy}>("/api/dashboard/policy", {method:"POST",body:JSON.stringify(policy)})
};
