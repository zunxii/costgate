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

const STATE_COOKIE =
    "github_install_state";

export async function GET(
    request: NextRequest
) {
    const url =
        new URL(request.url);

    const installationId =
        url.searchParams.get(
            "installation_id"
        );

    const state =
        url.searchParams.get(
            "state"
        );

    const expectedState =
        request.cookies.get(
            STATE_COOKIE
        )?.value;

    const token =
        await getSession();

    if (
        !token ||
        !installationId ||
        !state ||
        !expectedState ||
        state !== expectedState
    ) {
        return NextResponse.redirect(
            new URL(
                "/onboarding?github_installation=failed",
                request.url
            )
        );
    }

    try {
        const response =
            await backendFetch(
                "/api/github/installation/complete",
                {
                    method: "POST",

                    headers: {
                        Authorization:
                            `Bearer ${token}`,
                        "Content-Type":
                            "application/json",
                    },

                    body: JSON.stringify({
                        installation_id:
                            installationId,
                    }),
                }
            );

        if (!response.ok) {
            console.error(
                "GitHub installation verification failed",
                await response.text()
            );

            return NextResponse.redirect(
                new URL(
                    "/onboarding?github_installation=failed",
                    request.url
                )
            );
        }

        const result =
            NextResponse.redirect(
                new URL(
                    "/onboarding?github_installation=connected",
                    request.url
                )
            );

        result.cookies.set(
            STATE_COOKIE,
            "",
            {
                expires: new Date(0),
                path: "/",
            }
        );

        return result;

    } catch (error) {
        console.error(
            error
        );

        return NextResponse.redirect(
            new URL(
                "/onboarding?github_installation=failed",
                request.url
            )
        );
    }
}