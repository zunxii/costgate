import { NextResponse } from "next/server";
import { getServerUser, createGitHubState } from "@/lib/server-auth";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const user = await getServerUser();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin;
  const slug = process.env.GITHUB_APP_SLUG;
  if (!user) return NextResponse.json({ error: { code: "UNAUTHENTICATED", message: "Authentication required." } }, { status: 401 });
  if (!slug) return NextResponse.json({ error: { code: "GITHUB_APP_NOT_CONFIGURED", message: "GITHUB_APP_SLUG is not configured." } }, { status: 503 });
  const state = createGitHubState(user.id);
  const store = await cookies();
  store.set("costgate_github_setup_state", state, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 600 });
  const install = new URL(`https://github.com/apps/${slug}/installations/new`);
  install.searchParams.set("state", state);
  const setup = new URL("/api/auth/github/setup", siteUrl).toString();
  return NextResponse.json({ data: { url: install.toString(), setup_url: setup } });
}
