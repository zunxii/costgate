import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const BACKEND_URL = process.env.COSTGATE_BACKEND_URL || "http://127.0.0.1:3000";

/**
 * GET /api/auth/github/user
 *
 * After GitHub OAuth redirects back with ?auth=success, the frontend calls this
 * endpoint to resolve the authenticated user's profile from the backend session.
 *
 * The backend at GET /api/auth/github/user is expected to read the active session
 * (cookie or JWT) and return the user's GitHub profile.
 */
export async function GET(req: Request) {
  const requestId =
    req.headers.get("X-Request-ID") || `req-${Math.random().toString(36).substring(2, 9)}`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(`${BACKEND_URL}/api/auth/github/user`, {
      cache: "no-store",
      headers: {
        "X-Request-ID": requestId,
        // Forward the session cookie so the backend can identify the user
        ...(req.headers.get("cookie") ? { cookie: req.headers.get("cookie")! } : {}),
      },
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
          message: `GitHub user profile API returned status ${res.status}`,
        },
        request_id: requestId,
      },
      { status: res.status }
    );
  } catch (error: any) {
    const isTimeout = error?.name === "AbortError";
    return NextResponse.json(
      {
        data: null,
        error: {
          code: "BACKEND_UNAVAILABLE",
          message: isTimeout
            ? "Request timed out contacting the CostGate backend."
            : "CostGate backend is unreachable. Ensure the backend server is running.",
        },
        request_id: requestId,
      },
      { status: 503 }
    );
  }
}
