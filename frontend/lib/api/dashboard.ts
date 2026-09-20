import { apiRequest } from "./client";
import { 
  DashboardSummary, 
  PredictionItem, 
  AuthorStat, 
  ConnectedRepo, 
  FinOpsPolicy, 
  ApiResponse 
} from "./types";

export const dashboardApi = {
  getSummary: (): Promise<ApiResponse<DashboardSummary>> => {
    return apiRequest<DashboardSummary>("/api/dashboard/summary");
  },

  getPredictions: (): Promise<ApiResponse<PredictionItem[]>> => {
    return apiRequest<PredictionItem[]>("/api/dashboard/predictions");
  },

  getAuthors: (): Promise<ApiResponse<AuthorStat[]>> => {
    return apiRequest<AuthorStat[]>("/api/dashboard/authors");
  },

  getRepos: (): Promise<ApiResponse<ConnectedRepo[]>> => {
    return apiRequest<ConnectedRepo[]>("/api/dashboard/repos");
  },

  getPolicy: (): Promise<ApiResponse<FinOpsPolicy>> => {
    return apiRequest<FinOpsPolicy>("/api/dashboard/policy");
  },

  updatePolicy: (policy: Partial<FinOpsPolicy>): Promise<ApiResponse<{ success: boolean; policy: FinOpsPolicy }>> => {
    return apiRequest<{ success: boolean; policy: FinOpsPolicy }>("/api/dashboard/policy", {
      method: "POST",
      body: JSON.stringify(policy),
    });
  },
};
