import crypto from "crypto";
import { NextResponse } from "next/server";

import {
  getSession,
} from "@/lib/auth/session";

const STATE_COOKIE =
  "github_install_state";

export async function GET() {
  const token =
    await getSession();

  if (!token) {
    return NextResponse.redirect(
      new URL(
        "/signin?next=/onboarding",
        process.env.NEXT_PUBLIC_SITE_URL!
      )
    );
  }

  const slug =
    process.env.GITHUB_APP_SLUG;

  if (!slug) {
    return NextResponse.json(
      {
        error: {
          code:
            "GITHUB_APP_NOT_CONFIGURED",
          message:
            "GitHub App is not configured.",
        },
      },
      { status: 500 }
    );
  }

  const state =
    crypto.randomUUID();

  const installUrl =
    new URL(
      `https://github.com/apps/${slug}/installations/new`
    );

  installUrl.searchParams.set(
    "state",
    state
  );

  const response =
    NextResponse.redirect(
      installUrl
    );

  response.cookies.set(
    STATE_COOKIE,
    state,
    {
      httpOnly: true,
      secure:
        process.env.NODE_ENV ===
        "production",
      sameSite: "lax",
      path: "/",
      maxAge: 10 * 60,
    }
  );

  return response;
}