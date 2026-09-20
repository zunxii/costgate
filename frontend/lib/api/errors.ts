export class CostGateApiError extends Error {
  public readonly code: string;
  public readonly status: number;
  public readonly requestId: string;
  public readonly details?: Record<string, any>;

  constructor(code: string, message: string, status: number = 500, requestId: string = "unknown", details?: Record<string, any>) {
    super(message);
    this.name = "CostGateApiError";
    this.code = code;
    this.status = status;
    this.requestId = requestId;
    this.details = details;
  }
}
