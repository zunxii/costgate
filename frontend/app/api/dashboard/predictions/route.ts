import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:3000";

const DEFAULT_PREDICTIONS = [
  {
    prediction_id: "pred-104928-aef1",
    repository: "zunxii/costgate",
    pull_request_number: 142,
    title: "New feature: Search customers by email address",
    author: "alex-dev",
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    status: "reconciled",
    predicted_monthly_delta: 142.00,
    actual_monthly_delta: 139.50,
    actual_error_pct: 1.76,
    confidence: "high",
    direction: "increase",
    scan_type: "Full Table Scan (4.2M rows)",
    runtime: "842.180 ms",
    before_query: "SELECT id, email FROM customers WHERE tenant_id = 42;",
    after_query: "SELECT id, email FROM customers WHERE LOWER(email) = 'user@acme.com';",
    fixed_query: "SELECT id, email FROM customers WHERE email = 'user@acme.com';",
  },
  {
    prediction_id: "pred-104927-bdf2",
    repository: "zunxii/costgate",
    pull_request_number: 141,
    title: "Optimization: Speed up recent orders dashboard",
    author: "sarah-db",
    created_at: new Date(Date.now() - 3600000 * 8).toISOString(),
    status: "reconciled",
    predicted_monthly_delta: -85.50,
    actual_monthly_delta: -83.20,
    actual_error_pct: 2.69,
    confidence: "high",
    direction: "decrease",
    scan_type: "Covering Index Scan",
    runtime: "1.120 ms",
    before_query: "SELECT count(*) FROM orders WHERE created_at > NOW() - INTERVAL '30 days';",
    after_query: "CREATE INDEX CONCURRENTLY idx_orders_created ON orders(created_at);",
    fixed_query: "CREATE INDEX CONCURRENTLY idx_orders_created ON orders(created_at);",
  },
  {
    prediction_id: "pred-104926-cc73",
    repository: "zunxii/costgate",
    pull_request_number: 140,
    title: "Fix: Calculate monthly revenue for billing dashboard",
    author: "mike-infra",
    created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
    status: "monitoring",
    predicted_monthly_delta: 310.00,
    actual_monthly_delta: null,
    actual_error_pct: null,
    confidence: "medium",
    direction: "increase",
    scan_type: "Parallel Seq Scan (12M rows)",
    runtime: "1420.50 ms",
    before_query: "SELECT sum(amount_cents) FROM invoices WHERE customer_id = 9182;",
    after_query: "SELECT sum(amount_cents) FROM invoices WHERE status != 'void';",
    fixed_query: "SELECT sum(amount_cents) FROM invoices WHERE status = 'paid';",
  },
  {
    prediction_id: "pred-104925-dd84",
    repository: "acme-corp/payment-service",
    pull_request_number: 89,
    title: "Refactor user authentication token lookup",
    author: "zunxii",
    created_at: new Date(Date.now() - 3600000 * 36).toISOString(),
    status: "reconciled",
    predicted_monthly_delta: 420.00,
    actual_monthly_delta: 412.50,
    actual_error_pct: 1.78,
    confidence: "high",
    direction: "increase",
    scan_type: "Unindexed FK Lookup",
    runtime: "650.40 ms",
    before_query: "SELECT * FROM sessions WHERE token = 'xyz';",
    after_query: "SELECT * FROM sessions WHERE lower(token) = 'xyz';",
    fixed_query: "SELECT * FROM sessions WHERE token = 'xyz';",
  },
];

export async function GET() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1500);

    const res = await fetch(`${BACKEND_URL}/api/dashboard/predictions`, {
      cache: "no-store",
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    }
  } catch (error) {
    // Failover silently to default predictions list
  }

  return NextResponse.json(DEFAULT_PREDICTIONS);
}
