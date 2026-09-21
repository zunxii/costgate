import { jwtVerify, SignJWT } from "jose";
import { cookies } from "next/headers";

export const SESSION_COOKIE = "costgate_session";

const secretValue = process.env.AUTH_JWT_SECRET;

if (!secretValue) {
    throw new Error("AUTH_JWT_SECRET is not configured");
}

if (secretValue.length < 32) {
    throw new Error(
        "AUTH_JWT_SECRET must be at least 32 characters"
    );
}

const secret = new TextEncoder().encode(secretValue);

const ISSUER = "costgate";
const AUDIENCE = "costgate-web";

export type Session = {
    userId: string;
    email: string;
    name: string;
};

export async function createSessionToken(
    session: Session
): Promise<string> {
    return new SignJWT({
        sub: session.userId,
        email: session.email,
        name: session.name,
    })
        .setProtectedHeader({
            alg: "HS256",
        })
        .setIssuedAt()
        .setExpirationTime("7d")
        .setIssuer(ISSUER)
        .setAudience(AUDIENCE)
        .sign(secret);
}

export async function verifySessionToken(
    token: string
): Promise<Session | null> {
    try {
        const { payload } = await jwtVerify(token, secret, {
            algorithms: ["HS256"],
        });

        if (typeof payload.sub !== "string" || !payload.sub) {
            return null;
        }

        return {
            userId: payload.sub,
            email: typeof payload.email === "string" ? payload.email : "",
            name: typeof payload.name === "string" ? payload.name : "",
        };
    } catch {
        return null;
    }
}

export async function getSession(): Promise<Session | null> {
    const cookieStore = await cookies();

    const token = cookieStore.get(
        SESSION_COOKIE
    )?.value;

    if (!token) {
        return null;
    }

    return verifySessionToken(token);
}

export async function getSessionToken() {
    const cookieStore =
        await cookies();

    return (
        cookieStore.get(
            SESSION_COOKIE,
        )?.value ?? null
    );
}