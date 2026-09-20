import { ApiResponse, ApiError } from "./types";
import { CostGateApiError } from "./errors";

interface RequestOptions extends RequestInit {
  timeoutMs?: number;
  maxRetries?: number;
}

function generateRequestId(): string {
  return `req-${Math.random().toString(36).substring(2, 9)}`;
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<ApiResponse<T>> {
  const {
    timeoutMs = 8000,
    maxRetries = options.method === "GET" || !options.method ? 2 : 0,
    headers: customHeaders = {},
    ...fetchOptions
  } = options;

  const requestId = generateRequestId();
  const headers = new Headers(customHeaders);
  headers.set("Content-Type", "application/json");
  headers.set("X-Request-ID", requestId);

  let attempt = 0;
  let lastError: Error | null = null;

  while (attempt <= maxRetries) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(endpoint, {
        ...fetchOptions,
        headers,
        signal: controller.signal,
        cache: "no-store",
      });
      clearTimeout(timeoutId);

      const json = await response.json();

      if (!response.ok || json.error) {
        const errObj: ApiError = json.error || {
          code: `HTTP_${response.status}`,
          message: response.statusText || "Backend server error",
        };
        throw new CostGateApiError(
          errObj.code,
          errObj.message,
          response.status,
          json.request_id || requestId,
          errObj.details
        );
      }

      return {
        data: json.data !== undefined ? json.data : json,
        error: null,
        request_id: json.request_id || requestId,
      };
    } catch (err: any) {
      clearTimeout(timeoutId);
      lastError = err;

      if (err instanceof CostGateApiError && err.status < 500) {
        // Do not retry 4xx user errors
        break;
      }

      attempt++;
      if (attempt <= maxRetries) {
        const backoffMs = Math.min(1000, 200 * Math.pow(2, attempt));
        await new Promise((resolve) => setTimeout(resolve, backoffMs));
      }
    }
  }

  const message = lastError
    ? lastError.name === "AbortError"
      ? "Request timed out while connecting to CostGate backend."
      : lastError.message
    : "Failed to connect to CostGate backend.";

  return {
    data: null,
    error: {
      code: "BACKEND_UNAVAILABLE",
      message,
    },
    request_id: requestId,
  };
}
