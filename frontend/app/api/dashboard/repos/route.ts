import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const CONNECTED_REPOS = [
  {
    id: "repo-1",
    name: "zunxii/costgate",
    status: "active",
    prs_analyzed: 142,
    total_savings_usd: 4820.00,
    webhook_health: "healthy",
    db_engine: "PostgreSQL 16 (AWS RDS Aurora)",
    installed_at: "2026-08-15T10:30:00Z",
  },
  {
    id: "repo-2",
    name: "acme-corp/payment-service",
    status: "active",
    prs_analyzed: 89,
    total_savings_usd: 2450.50,
    webhook_health: "healthy",
    db_engine: "PostgreSQL 15 (RDS Multi-AZ)",
    installed_at: "2026-09-01T14:20:00Z",
  },
  {
    id: "repo-3",
    name: "fintech/billing-engine",
    status: "active",
    prs_analyzed: 34,
    total_savings_usd: 1280.00,
    webhook_health: "healthy",
    db_engine: "PostgreSQL 14 (RDS Single-AZ)",
    installed_at: "2026-09-10T09:15:00Z",
  },
];

export async function GET() {
  return NextResponse.json(CONNECTED_REPOS);
}
