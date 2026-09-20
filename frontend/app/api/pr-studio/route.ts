import {
    NextRequest,
    NextResponse,
} from "next/server";

import {
    getSessionToken,
} from "@/lib/auth/session";

import {
    backendFetch,
} from "@/lib/server/backend";

export async function GET(
    request: NextRequest,
) {
    const token =
        await getSessionToken();

    if (!token) {
        return NextResponse.json(
            {
                error: {
                    code: "UNAUTHORIZED",
                    message:
                        "Authentication required.",
                },
            },
            { status: 401 },
        );
    }

    const query =
        request.nextUrl.search;

    const response =
        await backendFetch(
            `/api/pr-studio${query}`,
            {
                headers: {
                    Authorization:
                        `Bearer ${token}`,
                    Accept:
                        "application/json",
                },
            },
        );

    const body =
        await response.text();

    return new NextResponse(
        body,
        {
            status: response.status,
            headers: {
                "Content-Type":
                    "application/json",
                "Cache-Control":
                    "no-store",
            },
        },
    );
}