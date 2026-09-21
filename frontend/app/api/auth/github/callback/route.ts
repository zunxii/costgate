import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  backendFetch,
} from "@/lib/server/backend";

import {
  SESSION_COOKIE,
} from "@/lib/auth/session";

const STATE_COOKIE =
  "github_oauth_state";

const VERIFIER_COOKIE =
  "github_pkce_verifier";

export async function GET(
  request: NextRequest,
) {
  const url =
    new URL(request.url);

  const code =
    url.searchParams.get("code");

  const state =
    url.searchParams.get("state");

  const error =
    url.searchParams.get("error");

  if (error) {
    return NextResponse.redirect(
      new URL(
        `/signin?github_error=${encodeURIComponent(error)}`,
        request.url,
      ),
    );
  }

  const expectedState =
    request.cookies.get(
      STATE_COOKIE,
    )?.value;

  const verifier =
    request.cookies.get(
      VERIFIER_COOKIE,
    )?.value;

  if (
    !code ||
    !state ||
    !expectedState ||
    state !== expectedState ||
    !verifier
  ) {
    return NextResponse.redirect(
      new URL(
        "/signin?github_error=invalid_state",
        request.url,
      ),
    );
  }

  const clientId =
    process.env.GITHUB_CLIENT_ID;

  const clientSecret =
    process.env.GITHUB_CLIENT_SECRET;

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL;

  if (
    !clientId ||
    !clientSecret ||
    !siteUrl
  ) {
    return NextResponse.json(
      {
        error: {
          code:
            "GITHUB_OAUTH_NOT_CONFIGURED",
          message:
            "GitHub OAuth is not configured.",
        },
      },
      { status: 500 },
    );
  }

  const redirectUri =
    process.env.GITHUB_REDIRECT_URI ||
    `${siteUrl.replace(/\/$/, "")}/api/auth/github/callback`;

  try {
    const tokenResponse =
      await fetch(
        "https://github.com/login/oauth/access_token",
        {
          method: "POST",
          headers: {
            Accept:
              "application/json",
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            client_id: clientId,
            client_secret:
              clientSecret,
            code,
            redirect_uri:
              redirectUri,
            code_verifier:
              verifier,
          }),
          cache: "no-store",
        },
      );

    const tokenData =
      await tokenResponse.json();

    if (
      !tokenResponse.ok ||
      !tokenData.access_token
    ) {
      return NextResponse.redirect(
        new URL(
          "/signin?github_error=token_exchange_failed",
          request.url,
        ),
      );
    }

    const existingSession =
      request.cookies.get(SESSION_COOKIE)?.value;

    const backendResponse =
      await backendFetch(
        "/api/auth/github/callback",
        {
          method: "POST",
          headers: {
            Accept:
              "application/json",
            "Content-Type":
              "application/json",
            ...(existingSession
              ? { Authorization: `Bearer ${existingSession}` }
              : {}),
          },
          body: JSON.stringify({
            access_token:
              tokenData.access_token,
          }),
        },
      );


    const payload =
      await backendResponse.json();

    if (!backendResponse.ok) {
      return NextResponse.json(
        payload,
        {
          status:
            backendResponse.status,
        },
      );
    }

    const session =
      payload?.data?.session;

    if (!session) {
      return NextResponse.redirect(
        new URL(
          "/signin?github_error=session_missing",
          request.url,
        ),
      );
    }

    const response =
      NextResponse.redirect(
        new URL(
          "/onboarding?github=connected",
          request.url,
        ),
      );

    response.cookies.set(
      SESSION_COOKIE,
      session,
      {
        httpOnly: true,
        secure:
          process.env.NODE_ENV ===
          "production",
        sameSite: "lax",
        path: "/",
        maxAge:
          60 * 60 * 24 * 7,
      },
    );

    response.cookies.set(
      STATE_COOKIE,
      "",
      {
        expires: new Date(0),
        path: "/",
      },
    );

    response.cookies.set(
      VERIFIER_COOKIE,
      "",
      {
        expires: new Date(0),
        path: "/",
      },
    );

    return response;
  } catch (error) {
    console.error(
      "GitHub callback error:",
      error,
    );

    return NextResponse.redirect(
      new URL(
        "/signin?github_error=callback_failed",
        request.url,
      ),
    );
  }
}