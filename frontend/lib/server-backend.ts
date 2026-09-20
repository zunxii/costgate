import { NextResponse } from "next/server";

const BACKEND_URL = process.env.COSTGATE_BACKEND_URL;

function requestId(request: Request): string {
  return request.headers.get("x-request-id") || `req-${crypto.randomUUID()}`;
}

export async function proxyBackend(request: Request, path: string, init: RequestInit = {}) {
  if (!BACKEND_URL) {
    return NextResponse.json({ error: { code: "BACKEND_NOT_CONFIGURED", message: "COSTGATE_BACKEND_URL is not configured." } }, { status: 503 });
  }
  const headers = new Headers(init.headers);
  const cookie = request.headers.get("cookie");
  if (cookie) headers.set("cookie", cookie);
  headers.set("x-request-id", requestId(request));
  if (init.body && !headers.has("content-type")) headers.set("content-type", "application/json");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), Number(process.env.COSTGATE_BACKEND_TIMEOUT_MS || 15000));
  try {
    const response = await fetch(`${BACKEND_URL.replace(/\/$/, "")}${path}`, {
      ...init,
      headers,
      signal: controller.signal,
      cache: "no-store",
    });
    const body = await response.text();
    return new NextResponse(body, {
      status: response.status,
      headers: {
        "content-type": response.headers.get("content-type") || "application/json; charset=utf-8",
        "cache-control": "no-store",
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: { code: "BACKEND_UNAVAILABLE", message: error?.name === "AbortError" ? "CostGate backend request timed out." : "CostGate backend is unreachable." } }, { status: 503 });
  } finally {
    clearTimeout(timeout);
  }
}

export async function backendJson(request: Request, path: string, init: RequestInit = {}) {
  return proxyBackend(request, path, init);
}
