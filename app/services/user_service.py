import os
import uuid
from datetime import datetime, timezone

import boto3
from botocore.exceptions import ClientError

from app.services.password import (
    hash_password,
    verify_password,
)


_dynamodb = boto3.resource("dynamodb")


def _table():
    name = os.environ.get("USER_TABLE_NAME")

    if not name:
        raise RuntimeError(
            "USER_TABLE_NAME is not configured"
        )

    return _dynamodb.Table(name)


def normalize_email(email: str) -> str:
    return email.strip().lower()


def get_user_by_email(email: str):
    email = normalize_email(email)

    response = _table().get_item(
        Key={
            "email": email,
        }
    )

    return response.get("Item")


def create_user(
    email: str,
    password: str,
    name: str,
):
    email = normalize_email(email)

    if not email:
        raise ValueError("Email is required")

    if not password:
        raise ValueError("Password is required")

    if len(password) < 8:
        raise ValueError(
            "Password must be at least 8 characters"
        )

    existing = get_user_by_email(email)

    if existing:
        raise ValueError(
            "An account with this email already exists"
        )

    now = datetime.now(
        timezone.utc
    ).isoformat()

    user = {
        "email": email,
        "user_id": str(uuid.uuid4()),
        "name": name.strip() or email.split("@")[0],
        "password_hash": hash_password(password),
        "created_at": now,
        "updated_at": now,
    }

    try:
        _table().put_item(
            Item=user,
            ConditionExpression=(
                "attribute_not_exists(email)"
            ),
        )
    except ClientError as error:
        if (
            error.response["Error"]["Code"]
            == "ConditionalCheckFailedException"
        ):
            raise ValueError(
                "An account with this email already exists"
            ) from error

        raise

    return user


def authenticate_user(
    email: str,
    password: str,
):
    user = get_user_by_email(email)

    if not user:
        return None

    if not verify_password(
        password,
        user["password_hash"],
    ):
        return None

    return user