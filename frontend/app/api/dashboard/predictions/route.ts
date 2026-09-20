import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const BACKEND_URL = process.env.COSTGATE_BACKEND_URL || "http://127.0.0.1:3000";

export async function GET(req: Request) {
  const requestId = req.headers.get("X-Request-ID") || `req-${Math.random().toString(36).substring(2, 9)}`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(`${BACKEND_URL}/api/dashboard/predictions`, {
      cache: "no-store",
      headers: { "X-Request-ID": requestId },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const body = await res.json();
      return NextResponse.json({
        data: body,
        error: null,
        request_id: requestId,
      });
    }

    return NextResponse.json(
      {
        data: null,
        error: {
          code: `BACKEND_HTTP_${res.status}`,
          message: `Backend API returned status ${res.status}`,
        },
        request_id: requestId,
      },
      { status: res.status }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        data: null,
        error: {
          code: "BACKEND_UNAVAILABLE",
          message: "CostGate backend server is unreachable. Ensure python/sam backend is running.",
        },
        request_id: requestId,
      },
      { status: 503 }
    );
  }
}
