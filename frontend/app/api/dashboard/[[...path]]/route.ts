import { NextRequest, NextResponse } from "next/server";
import { getSessionToken } from "@/lib/auth/session";
import { backendFetch } from "@/lib/server/backend";

export const dynamic = "force-dynamic";

async function handler(request: NextRequest) {
    const token = await getSessionToken();

    if (!token) {
        return NextResponse.json(
            { error: { code: "UNAUTHORIZED", message: "Authentication required." } },
            { status: 401 }
        );
    }

    const url = new URL(request.url);
    const backendPath = `/api/dashboard${url.pathname.replace(/^\/api\/dashboard/, "")}${url.search}`;

    const init: RequestInit = {
        method: request.method,
        headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
            "Content-Type": "application/json",
        },
    };

    if (request.method === "POST" || request.method === "PUT" || request.method === "PATCH") {
        init.body = await request.text();
    }

    const response = await backendFetch(backendPath, init);
    const body = await response.text();

    return new NextResponse(body, {
        status: response.status,
        headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-store",
        },
    });
}

export { handler as GET, handler as POST, handler as PUT, handler as PATCH, handler as DELETE };
