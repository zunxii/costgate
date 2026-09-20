import { proxyBackend } from "@/lib/server-backend";
export const dynamic = "force-dynamic";
export async function GET(request: Request) { return proxyBackend(request, "/api/auth/session", { method: "GET" }); }
