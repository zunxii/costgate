export async function backendFetch(
    path: string,
    init: RequestInit = {}
): Promise<Response> {
    const base =
        process.env.COSTGATE_BACKEND_URL;

    if (!base) {
        throw new Error(
            "COSTGATE_BACKEND_URL is not configured"
        );
    }

    const controller = new AbortController();

    const timeout = setTimeout(() => {
        controller.abort();
    }, Number(
        process.env.COSTGATE_BACKEND_TIMEOUT_MS ?? "15000"
    ));

    try {
        return await fetch(
            `${base.replace(/\/$/, "")}${path}`,
            {
                ...init,
                signal: controller.signal,
                cache: "no-store",
            }
        );
    } finally {
        clearTimeout(timeout);
    }
}