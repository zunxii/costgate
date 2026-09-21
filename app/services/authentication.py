from app.services.jwt_service import (
    verify_token,
)


class UnauthorizedError(Exception):
    pass


def authenticate_event(event):
    headers = event.get("headers") or {}

    normalized = {
        str(key).lower(): value
        for key, value in headers.items()
    }

    authorization = normalized.get(
        "authorization"
    )

    if not authorization:
        raise UnauthorizedError(
            "Authorization header is required"
        )

    if not authorization.lower().startswith(
        "bearer "
    ):
        raise UnauthorizedError(
            "Bearer token required"
        )

    token = authorization.split(
        " ",
        1,
    )[1].strip()

    if not token:
        raise UnauthorizedError(
            "Bearer token required"
        )

    try:
        return verify_token(token)
    except Exception as error:
        raise UnauthorizedError(
            "Invalid or expired session"
        ) from error