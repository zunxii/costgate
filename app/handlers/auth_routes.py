# Dead Code do NOT use this

import json

from app.services.jwt_service import (
    create_token,
)
from app.services.user_service import (
    authenticate_user,
    create_user,
)


def response(
    status_code: int,
    body: dict,
):
    return {
        "statusCode": status_code,
        "headers": {
            "Content-Type": "application/json",
            "Cache-Control": "no-store",
        },
        "body": json.dumps(body),
    }


def body_from_event(event):
    raw = event.get("body")

    if not raw:
        return {}

    if event.get("isBase64Encoded"):
        import base64

        raw = base64.b64decode(raw).decode(
            "utf-8"
        )

    return json.loads(raw)


def handle_auth_request(event):
    path = (
        event.get("rawPath")
        or event.get("path")
        or ""
    )

    method = (
        event.get("requestContext", {})
        .get("http", {})
        .get("method")
        or event.get("httpMethod")
        or ""
    ).upper()

    if path == "/api/auth/signup" and method == "POST":
        return _signup(event)

    if path == "/api/auth/signin" and method == "POST":
        return _signin(event)

    return None


def _signup(event):
    try:
        payload = body_from_event(event)

        email = str(
            payload.get("email", "")
        ).strip()

        password = str(
            payload.get("password", "")
        )

        name = str(
            payload.get("name", "")
        ).strip()

        if not email:
            return response(
                400,
                {
                    "error": {
                        "code": "EMAIL_REQUIRED",
                        "message": "Email is required",
                    }
                },
            )

        if len(password) < 8:
            return response(
                400,
                {
                    "error": {
                        "code": "PASSWORD_TOO_SHORT",
                        "message": (
                            "Password must be at least "
                            "8 characters"
                        ),
                    }
                },
            )

        user = create_user(
            email=email,
            password=password,
            name=name,
        )

        token = create_token(
            user_id=user["user_id"],
            email=user["email"],
            name=user["name"],
        )

        return response(
            201,
            {
                "token": token,
                "user": {
                    "user_id": user["user_id"],
                    "email": user["email"],
                    "name": user["name"],
                },
            },
        )

    except ValueError as error:
        return response(
            409,
            {
                "error": {
                    "code": "SIGNUP_FAILED",
                    "message": str(error),
                }
            },
        )

    except Exception:
        return response(
            500,
            {
                "error": {
                    "code": "SIGNUP_INTERNAL_ERROR",
                    "message": (
                        "Unable to create account"
                    ),
                }
            },
        )


def _signin(event):
    try:
        payload = body_from_event(event)

        email = str(
            payload.get("email", "")
        ).strip()

        password = str(
            payload.get("password", "")
        )

        if not email or not password:
            return response(
                400,
                {
                    "error": {
                        "code": "INVALID_CREDENTIALS",
                        "message": (
                            "Email and password are required"
                        ),
                    }
                },
            )

        user = authenticate_user(
            email,
            password,
        )

        if not user:
            return response(
                401,
                {
                    "error": {
                        "code": "INVALID_CREDENTIALS",
                        "message": (
                            "Invalid email or password"
                        ),
                    }
                },
            )

        token = create_token(
            user_id=user["user_id"],
            email=user["email"],
            name=user["name"],
        )

        return response(
            200,
            {
                "token": token,
                "user": {
                    "user_id": user["user_id"],
                    "email": user["email"],
                    "name": user["name"],
                },
            },
        )

    except Exception:
        return response(
            500,
            {
                "error": {
                    "code": "SIGNIN_INTERNAL_ERROR",
                    "message": "Unable to sign in",
                }
            },
        )