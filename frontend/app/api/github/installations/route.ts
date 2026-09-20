import {
    NextResponse,
} from "next/server";

import {
    getSession,
} from "@/lib/auth/session";

import {
    backendFetch,
} from "@/lib/server/backend";

export async function GET() {
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

    const response =
        await backendFetch(
            "/api/github/installations",
            {
                headers: {
                    Authorization:
                        `Bearer ${token}`,
                },
            }
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
            },
        }
    );
}