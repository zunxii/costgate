from __future__ import annotations

import base64
import hashlib
import hmac
import os
import time
from typing import Any

import jwt


SESSION_COOKIE = "costgate_session"
SESSION_TTL_SECONDS = int(os.getenv("SESSION_TTL_SECONDS", str(60 * 60 * 24 * 7)))


def _secret() -> str:
    secret = os.getenv("AUTH_JWT_SECRET")
    if not secret or len(secret) < 32:
        raise RuntimeError("AUTH_JWT_SECRET must be configured with at least 32 characters.")
    return secret


def create_session_token(*, user_id: str) -> str:
    now = int(time.time())
    payload = {
        "sub": user_id,
        "iat": now,
        "exp": now + SESSION_TTL_SECONDS,
    }
    return jwt.encode(payload, _secret(), algorithm="HS256")


def verify_session_token(token: str) -> dict[str, Any] | None:
    try:
        return jwt.decode(token, _secret(), algorithms=["HS256"])
    except jwt.PyJWTError:
        return None


def parse_cookie_header(cookie_header: str | None, name: str = SESSION_COOKIE) -> str | None:
    if not cookie_header:
        return None
    for pair in cookie_header.split(";"):
        key, _, value = pair.strip().partition("=")
        if key == name and value:
            return value
    return None


def get_user_id_from_event(event: dict[str, Any]) -> str | None:
    headers = {str(k).lower(): str(v) for k, v in (event.get("headers") or {}).items()}
    authorization = headers.get("authorization", "")
    token = authorization.removeprefix("Bearer ").strip() if authorization else ""
    if not token:
        token = parse_cookie_header(headers.get("cookie")) or ""
    if not token:
        return None
    claims = verify_session_token(token)
    subject = claims.get("sub") if claims else None
    return str(subject) if subject else None


def hash_password(password: str) -> str:
    if len(password) < 10:
        raise ValueError("Password must be at least 10 characters long.")
    salt = os.urandom(16)
    derived = hashlib.scrypt(
        password.encode("utf-8"),
        salt=salt,
        n=2**14,
        r=8,
        p=1,
        dklen=64,
    )
    return "scrypt$16384$8$1$" + _b64(salt) + "$" + _b64(derived)


def verify_password(password: str, encoded: str) -> bool:
    try:
        scheme, n, r, p, salt_b64, hash_b64 = encoded.split("$", 5)
        if scheme != "scrypt":
            return False
        derived = hashlib.scrypt(
            password.encode("utf-8"),
            salt=_unb64(salt_b64),
            n=int(n),
            r=int(r),
            p=int(p),
            dklen=len(_unb64(hash_b64)),
        )
        return hmac.compare_digest(derived, _unb64(hash_b64))
    except (ValueError, TypeError):
        return False


def _b64(value: bytes) -> str:
    return base64.urlsafe_b64encode(value).decode("ascii").rstrip("=")


def _unb64(value: str) -> bytes:
    return base64.urlsafe_b64decode(value + "=" * (-len(value) % 4))
