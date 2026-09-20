import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  verifySessionToken,
  SESSION_COOKIE,
} from "@/lib/auth/session";

const PUBLIC_PAGE_PREFIXES = [
  "/",
  "/signin",
  "/signup",
  "/architecture",
  "/security",
];

function isPublicPath(
  pathname: string
) {
  if (
    pathname.startsWith("/api/auth/")
  ) {
    return true;
  }

  if (
    pathname.startsWith("/_next/")
  ) {
    return true;
  }

  if (
    pathname === "/favicon.ico"
  ) {
    return true;
  }

  return PUBLIC_PAGE_PREFIXES.some(
    (prefix) => {
      if (prefix === "/") {
        return pathname === "/";
      }

      return (
        pathname === prefix ||
        pathname.startsWith(
          `${prefix}/`
        )
      );
    }
  );
}

function isProtectedPath(
  pathname: string
) {
  return (
    pathname === "/dashboard" ||
    pathname.startsWith("/dashboard/") ||
    pathname === "/demo" ||
    pathname.startsWith("/demo/") ||
    pathname === "/calculator" ||
    pathname.startsWith("/calculator/") ||
    pathname === "/onboarding" ||
    pathname.startsWith("/onboarding/") ||
    pathname.startsWith("/api/dashboard") ||
    pathname.startsWith("/api/github") ||
    pathname.startsWith("/api/pr-studio") ||
    pathname.startsWith("/api/cost-simulator")
  );
}

export async function middleware(
  request: NextRequest
) {
  const pathname =
    request.nextUrl.pathname;

  if (
    isPublicPath(pathname) ||
    !isProtectedPath(pathname)
  ) {
    return NextResponse.next();
  }

  const token =
    request.cookies.get(
      SESSION_COOKIE
    )?.value;

  if (!token) {
    if (
      pathname.startsWith("/api/")
    ) {
      return NextResponse.json(
        {
          error: {
            code: "UNAUTHORIZED",
            message:
              "Authentication required",
          },
        },
        { status: 401 }
      );
    }

    const signin =
      new URL(
        "/signin",
        request.url
      );

    signin.searchParams.set(
      "next",
      pathname
    );

    return NextResponse.redirect(
      signin
    );
  }

  const session =
    await verifySessionToken(token);

  if (!session) {
    if (
      pathname.startsWith("/api/")
    ) {
      const response =
        NextResponse.json(
          {
            error: {
              code: "UNAUTHORIZED",
              message:
                "Session expired",
            },
          },
          { status: 401 }
        );

      response.cookies.set(
        SESSION_COOKIE,
        "",
        {
          expires: new Date(0),
          path: "/",
        }
      );

      return response;
    }

    const signin =
      new URL(
        "/signin",
        request.url
      );

    signin.searchParams.set(
      "next",
      pathname
    );

    const response =
      NextResponse.redirect(
        signin
      );

    response.cookies.set(
      SESSION_COOKIE,
      "",
      {
        expires: new Date(0),
        path: "/",
      }
    );

    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};