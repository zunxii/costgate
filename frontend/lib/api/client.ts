import { ApiResponse, ApiError } from "./types";
import { CostGateApiError } from "./errors";
interface RequestOptions extends RequestInit { timeoutMs?: number; maxRetries?: number; }
function generateRequestId(){ return `req-${Math.random().toString(36).substring(2,9)}`; }
export async function apiRequest<T>(endpoint:string, options:RequestOptions={}):Promise<ApiResponse<T>>{
 const { timeoutMs=12000, maxRetries=0, headers:customHeaders={}, ...fetchOptions }=options;
 const requestId=generateRequestId(); const headers=new Headers(customHeaders); headers.set("Content-Type", "application/json"); headers.set("X-Request-ID", requestId);
 let attempt=0; let lastError:unknown=null;
 while(attempt<=maxRetries){ const controller=new AbortController(); const timer=setTimeout(()=>controller.abort(),timeoutMs); try { const response=await fetch(endpoint,{...fetchOptions,headers,signal:controller.signal,cache:"no-store",credentials:"same-origin"}); const json=await response.json().catch(()=>({})); clearTimeout(timer); if(!response.ok||json.error){ const errObj:ApiError=json.error||{code:`HTTP_${response.status}`,message:response.statusText||"Backend server error"}; throw new CostGateApiError(errObj.code,errObj.message,response.status,json.request_id||requestId,errObj.details); } return {data:json.data!==undefined?json.data:json,error:null,request_id:json.request_id||requestId}; } catch(err:any){ clearTimeout(timer); lastError=err; if(err instanceof CostGateApiError && err.status<500) break; if(attempt>=maxRetries) break; attempt++; await new Promise(resolve=>setTimeout(resolve,Math.min(1000,200*2**attempt))); } }
 const message=lastError ? (lastError.name==="AbortError" ? "Request timed out." : (lastError as any).message || "Request failed.") : "Request failed.";
 return {data:null,error:{code:lastError instanceof CostGateApiError?lastError.code:"BACKEND_UNAVAILABLE",message},request_id:requestId};
}
