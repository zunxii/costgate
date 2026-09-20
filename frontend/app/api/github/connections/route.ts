import {
    NextRequest,
    NextResponse,
} from "next/server";

import {
    getSession,
} from "@/lib/auth/session";

import {
    backendFetch,
} from "@/lib/server/backend";

export async function POST(
    request: NextRequest
) {
    const token =
        await getSession();

    if (!token) {
        return NextResponse.json(
            {
                error: {
                    code: "UNAUTHORIZED",
                    message:
                        "Authentication required.",
                },
            },
            { status: 401 }
        );
    }

    const body =
        await request.text();

    const response =
        await backendFetch(
            "/api/github/connections",
            {
                method: "POST",

                headers: {
                    Authorization:
                        `Bearer ${token}`,
                    "Content-Type":
                        "application/json",
                },

                body,
            }
        );

    const responseBody =
        await response.text();

    return new NextResponse(
        responseBody,
        {
            status: response.status,
            headers: {
                "Content-Type":
                    "application/json",
            },
        }
    );
}