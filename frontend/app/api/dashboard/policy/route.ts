import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

let CURRENT_POLICY = {
  warn_usd: 5.0,
  block_usd: 25.0,
  min_confidence: "medium",
  enable_check: true,
  enable_comment: true,
  notification_webhook: "https://discord.com/api/webhooks/1234/costgate-alerts",
};

export async function GET() {
  return NextResponse.json(CURRENT_POLICY);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    CURRENT_POLICY = { ...CURRENT_POLICY, ...body };
    return NextResponse.json({ success: true, policy: CURRENT_POLICY });
  } catch (err) {
    return NextResponse.json({ success: false, error: "Invalid payload" }, { status: 400 });
  }
}
