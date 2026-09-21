import crypto from "crypto";
import { NextResponse } from "next/server";

const STATE_COOKIE = "github_oauth_state";
const VERIFIER_COOKIE = "github_pkce_verifier";

function base64Url(buffer: Buffer) {
  return buffer
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

export async function GET() {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

  if (!clientId || !siteUrl) {
    return NextResponse.json(
      {
        error: {
          code: "GITHUB_OAUTH_NOT_CONFIGURED",
          message: "GitHub OAuth is not configured.",
        },
      },
      { status: 500 },
    );
  }

  const state = base64Url(
    crypto.randomBytes(32),
  );

  const verifier = base64Url(
    crypto.randomBytes(32),
  );

  const challenge = base64Url(
    crypto
      .createHash("sha256")
      .update(verifier)
      .digest(),
  );

  const redirectUri =
    process.env.GITHUB_REDIRECT_URI ||
    `${siteUrl.replace(/\/$/, "")}/api/auth/github/callback`;

  const githubUrl = new URL(
    "https://github.com/login/oauth/authorize",
  );

  githubUrl.searchParams.set(
    "client_id",
    clientId,
  );

  githubUrl.searchParams.set(
    "redirect_uri",
    redirectUri,
  );

  githubUrl.searchParams.set(
    "state",
    state,
  );

  githubUrl.searchParams.set(
    "scope",
    "read:user user:email",
  );

  githubUrl.searchParams.set(
    "code_challenge",
    challenge,
  );

  githubUrl.searchParams.set(
    "code_challenge_method",
    "S256",
  );

  githubUrl.searchParams.set(
    "allow_signup",
    "true",
  );

  const response =
    NextResponse.redirect(githubUrl);

  const secure =
    process.env.NODE_ENV === "production";

  response.cookies.set(
    STATE_COOKIE,
    state,
    {
      httpOnly: true,
      secure,
      sameSite: "lax",
      path: "/",
      maxAge: 600,
    },
  );

  response.cookies.set(
    VERIFIER_COOKIE,
    verifier,
    {
      httpOnly: true,
      secure,
      sameSite: "lax",
      path: "/",
      maxAge: 600,
    },
  );

  return response;
}