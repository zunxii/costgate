import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const INSTALLATIONS = [
  {
    installation_id: "inst-4992403",
    account: {
      login: "zunxii",
      avatar_url: "https://github.com/zunxii.png",
      type: "User",
    },
    repositories: [
      { id: 101, name: "costgate", full_name: "zunxii/costgate", private: false },
      { id: 102, name: "analytics-db", full_name: "zunxii/analytics-db", private: true },
    ],
    installed_at: "2026-09-20T18:00:00Z",
  },
];

export async function GET() {
  return NextResponse.json(INSTALLATIONS);
}
