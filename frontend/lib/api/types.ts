export interface ApiError { code:string; message:string; details?:Record<string,any>; }
export interface ApiResponse<T> { data:T|null; error:ApiError|null; request_id:string; }
export interface DashboardSummary { prediction_count:number; reconciled_count:number; total_predicted_monthly:number; total_verified_monthly:number; mean_error_pct:number|null; }
export interface PredictionItem { prediction_id:string; repository:string; pull_request_number:number; author:string; created_at:string; status:string; predicted_monthly_delta:number; actual_monthly_delta:number|null; actual_error_pct:number|null; confidence:string; direction:string; baseline_execution_ms?:number; candidate_execution_ms?:number; baseline_scan_type?:string; candidate_scan_type?:string; policy_verdict?:string|null; check_run_url?:string|null; }
export interface AuthorStat {author:string;prs:number;predicted_monthly:number;verified_monthly:number;mean_error_pct:number|null;}
export interface ConnectedRepo {id:string;name:string;private:boolean;status:string;prs_analyzed:number;total_savings_usd:number;installation_id:string;}
export interface FinOpsPolicy {warn_usd:number;block_usd:number;db_instance:string;}
