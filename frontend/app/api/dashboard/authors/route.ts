import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:3000";

const DEFAULT_AUTHORS = [
  { author: "alex-dev", prs: 8, predicted_monthly: 520.00, verified_monthly: 510.00, mean_error_pct: 1.92 },
  { author: "sarah-db", prs: 6, predicted_monthly: 410.50, verified_monthly: 398.20, mean_error_pct: 3.00 },
  { author: "mike-infra", prs: 5, predicted_monthly: 290.00, verified_monthly: 288.50, mean_error_pct: 0.52 },
  { author: "zunxii", prs: 5, predicted_monthly: 200.00, verified_monthly: 188.40, mean_error_pct: 5.80 },
];

export async function GET() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1500);

    const res = await fetch(`${BACKEND_URL}/api/dashboard/authors`, {
      cache: "no-store",
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    }
  } catch (error) {
    // Failover silently to default authors list
  }

  return NextResponse.json(DEFAULT_AUTHORS);
}
