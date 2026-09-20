import { apiRequest } from "./api/client";
export interface ConnectedRepo {repository:string; repo_name?:string; repo_id:string; private?:boolean; installation_id:string;}
export interface PullRequest {number:number; title:string; state:string; html_url?:string; user?:{login:string;avatar_url?:string}; head?:{sha?:string}; base?:{ref?:string}; created_at?:string; updated_at?:string; body?:string;}
export const prStudioApi={
  getRepositories:()=>apiRequest<{repositories:ConnectedRepo[]}>("/api/pr-studio"),
  getPullRequests:(repo:string)=>apiRequest<{repository:ConnectedRepo;pull_requests:PullRequest[]}>(`/api/pr-studio?repo=${encodeURIComponent(repo)}`),
  getPullRequest:(repo:string,number:number)=>apiRequest<{repository:ConnectedRepo;pull_request:PullRequest;files:any[]}>(`/api/pr-studio?repo=${encodeURIComponent(repo)}&pr=${number}`),
  analyze:(repo:string,number:number)=>apiRequest<{job_id:string;status:string}>("/api/pr-studio/analyze",{method:"POST",body:JSON.stringify({repository:repo,pull_number:number})}),
  getJob:(jobId:string)=>apiRequest<any>(`/api/pr-studio/jobs/${encodeURIComponent(jobId)}`),
};
