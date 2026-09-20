import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "crypto";
import { redirect } from "next/navigation";

const COOKIE_NAME = "costgate_session";
const SESSION_SECRET = process.env.AUTH_JWT_SECRET || "";

function b64urlDecode(value: string): Buffer {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  return Buffer.from(normalized, "base64");
}

export interface SessionUser {
  id: string;
  exp: number;
  iat: number;
}

export function verifySessionToken(token: string): SessionUser | null {
  if (!SESSION_SECRET) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [encodedHeader, encodedPayload, encodedSignature] = parts;
  try {
    const expected = createHmac("sha256", SESSION_SECRET)
      .update(`${encodedHeader}.${encodedPayload}`)
      .digest();
    const received = b64urlDecode(encodedSignature);
    if (received.length !== expected.length || !timingSafeEqual(received, expected)) return null;
    const payload = JSON.parse(b64urlDecode(encodedPayload).toString("utf8")) as SessionUser;
    if (!payload?.exp || payload.exp <= Math.floor(Date.now() / 1000)) return null;
    const subject = (payload as any).sub || (payload as any).id;
    if (!subject) return null;
    return { id: String(subject), exp: Number(payload.exp), iat: Number((payload as any).iat || 0) };
  } catch {
    return null;
  }
}

export async function getServerUser(): Promise<SessionUser | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  return token ? verifySessionToken(token) : null;
}

export async function requireServerUser(): Promise<SessionUser> {
  const user = await getServerUser();
  if (!user) redirect("/signin");
  return user;
}

function b64urlEncode(value: string): string {
  return Buffer.from(value).toString("base64url");
}

export function createGitHubState(userId: string): string {
  if (!SESSION_SECRET) throw new Error("AUTH_JWT_SECRET is not configured");
  const payload = `${userId}:${Math.floor(Date.now() / 1000)}`;
  const encoded = b64urlEncode(payload);
  const signature = createHmac("sha256", SESSION_SECRET).update(encoded).digest("base64url");
  return `${encoded}.${signature}`;
}

export function verifyGitHubState(state: string, expectedUserId?: string): boolean {
  if (!SESSION_SECRET) return false;
  const parts = state.split(".");
  if (parts.length !== 2) return false;
  const [encoded, signature] = parts;
  try {
    const expected = createHmac("sha256", SESSION_SECRET).update(encoded).digest();
    const received = b64urlDecode(signature);
    if (received.length !== expected.length || !timingSafeEqual(received, expected)) return false;
    const [userId, issuedAtRaw] = b64urlDecode(encoded).toString("utf8").split(":");
    const issuedAt = Number(issuedAtRaw);
    if (!userId || !Number.isFinite(issuedAt) || Math.floor(Date.now() / 1000) - issuedAt > 600) return false;
    return !expectedUserId || userId === expectedUserId;
  } catch {
    return false;
  }
}

export { COOKIE_NAME };
