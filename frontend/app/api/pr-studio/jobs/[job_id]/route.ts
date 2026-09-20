import {
    NextResponse,
} from "next/server";

import {
    getSessionToken,
} from "@/lib/auth/session";

import {
    backendFetch,
} from "@/lib/server/backend";

export async function GET(
    request: Request,
    {
        params,
    }: {
        params: Promise<{
            job_id: string;
        }>;
    },
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

    const {
        job_id,
    } = await params;

    const response =
        await backendFetch(
            `/api/pr-studio/jobs/${encodeURIComponent(job_id)}`,
            {
                headers: {
                    Authorization:
                        `Bearer ${token}`,
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