import os
import time

import jwt


ISSUER = "costgate"
AUDIENCE = "costgate-web"

TOKEN_LIFETIME_SECONDS = 60 * 60 * 24 * 7


def get_secret() -> str:
    secret = os.environ.get("AUTH_JWT_SECRET")

    if not secret:
        raise RuntimeError(
            "AUTH_JWT_SECRET is not configured"
        )

    if len(secret) < 32:
        raise RuntimeError(
            "AUTH_JWT_SECRET must be at least 32 characters"
        )

    return secret


def create_token(
    user_id: str,
    email: str,
    name: str,
) -> str:
    now = int(time.time())

    payload = {
        "sub": user_id,
        "email": email,
        "name": name,
        "iat": now,
        "exp": now + TOKEN_LIFETIME_SECONDS,
        "iss": ISSUER,
        "aud": AUDIENCE,
    }

    return jwt.encode(
        payload,
        get_secret(),
        algorithm="HS256",
    )


def verify_token(token: str) -> dict:
    return jwt.decode(
        token,
        get_secret(),
        algorithms=["HS256"],
        issuer=ISSUER,
        audience=AUDIENCE,
    )