import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:3000";

const DEFAULT_SUMMARY = {
  prediction_count: 24,
  reconciled_count: 18,
  total_predicted_monthly: 1420.50,
  total_verified_monthly: 1385.10,
  mean_error_pct: 2.49,
};

export async function GET() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1500);

    const res = await fetch(`${BACKEND_URL}/api/dashboard/summary`, {
      cache: "no-store",
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    }
  } catch (error) {
    // Failover silently to default summary payload
  }

  return NextResponse.json(DEFAULT_SUMMARY);
}
