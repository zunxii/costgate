import { NextRequest, NextResponse } from "next/server";
import { backendFetch } from "@/lib/server/backend";
import {
  SESSION_COOKIE,
} from "@/lib/auth/session";

const SESSION_MAX_AGE =
  60 * 60 * 24 * 7;

export async function POST(
  request: NextRequest
) {
  try {
    const body = await request.json();

    const backendResponse =
      await backendFetch(
        "/api/auth/signup",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(body),
        }
      );

    const payload =
      await backendResponse.json();

    if (!backendResponse.ok) {
      return NextResponse.json(
        payload,
        {
          status:
            backendResponse.status,
        }
      );
    }

    const session =
      payload?.data?.session;

    const user =
      payload?.data?.user;

    if (!session || !user) {
      console.error(
        "Signup response missing session/user",
        payload
      );

      return NextResponse.json(
        {
          error: {
            code: "INVALID_AUTH_RESPONSE",
            message:
              "Authentication server returned an invalid response.",
          },
        },
        { status: 502 }
      );
    }

    const response =
      NextResponse.json({
        data: {
          user,
        },
      });

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
        maxAge: SESSION_MAX_AGE,
      }
    );

    return response;
  } catch (error) {
    console.error(
      "Signup API error:",
      error
    );

    return NextResponse.json(
      {
        error: {
          code: "SIGNUP_REQUEST_FAILED",
          message:
            "Unable to create account.",
        },
      },
      { status: 503 }
    );
  }
}