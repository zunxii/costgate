from __future__ import annotations

import os
import uuid
from datetime import datetime, timezone
from typing import Any

import boto3
from boto3.dynamodb.conditions import Key

from app.auth.session import hash_password, verify_password


USERS_TABLE = os.getenv("USER_TABLE_NAME", "costgate-users")
CONNECTIONS_TABLE = os.getenv("CONNECTION_TABLE_NAME", "costgate-connections")
POLICIES_TABLE = os.getenv("POLICY_TABLE_NAME", "costgate-policies")
REGION = os.getenv("AWS_REGION", "eu-north-1")


from decimal import Decimal


def _floats_to_decimals(obj: Any) -> Any:
    if isinstance(obj, float):
        return Decimal(str(obj))
    if isinstance(obj, dict):
        return {k: _floats_to_decimals(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [_floats_to_decimals(v) for v in obj]
    if isinstance(obj, tuple):
        return tuple(_floats_to_decimals(v) for v in obj)
    return obj


def _ddb():
    return boto3.resource("dynamodb", region_name=REGION)


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


class UserRepository:
    def __init__(self, table: Any | None = None) -> None:
        self.table = table or _ddb().Table(USERS_TABLE)

    def create_email_user(self, *, email: str, password: str, name: str) -> dict[str, Any]:
        email = email.strip().lower()
        existing = self.find_by_email(email)
        if existing:
            raise ValueError("An account with that email already exists.")
        user = {
            "user_id": str(uuid.uuid4()),
            "email": email,
            "name": name.strip() or email.split("@", 1)[0],
            "password_hash": hash_password(password),
            "created_at": _now(),
            "updated_at": _now(),
        }
        self.table.put_item(Item=user)
        return user

    def create_or_get_github_user(
        self,
        *,
        github_id: str,
        github_login: str,
        email: str | None,
        name: str | None,
        avatar_url: str | None,
    ) -> dict[str, Any]:
        existing = self.find_by_github_id(github_id)
        if existing:
            update = {
                "github_login": github_login,
                "name": name or existing.get("name") or github_login,
                "avatar_url": avatar_url or existing.get("avatar_url"),
                "updated_at": _now(),
            }
            if email and not existing.get("email"):
                update["email"] = email.lower()
            return self.update(existing["user_id"], update)

        # A verified GitHub email can safely link an account created through email/password.
        if email:
            by_email = self.find_by_email(email.lower())
            if by_email:
                return self.update(
                    by_email["user_id"],
                    {
                        "github_id": github_id,
                        "github_login": github_login,
                        "name": name or by_email.get("name") or github_login,
                        "avatar_url": avatar_url or by_email.get("avatar_url"),
                        "updated_at": _now(),
                    },
                )

        now = _now()
        user = {
            "user_id": str(uuid.uuid4()),
            "email": email.lower() if email else f"{github_login}@users.noreply.github.com",
            "name": name or github_login,
            "github_id": github_id,
            "github_login": github_login,
            "avatar_url": avatar_url or "",
            "created_at": now,
            "updated_at": now,
        }
        self.table.put_item(Item=user)
        return user

    def authenticate_email(self, *, email: str, password: str) -> dict[str, Any] | None:
        user = self.find_by_email(email.strip().lower())
        if not user or not user.get("password_hash"):
            return None
        return user if verify_password(password, user["password_hash"]) else None

    def get(self, user_id: str) -> dict[str, Any] | None:
        return self.table.get_item(Key={"user_id": user_id}).get("Item")

    def find_by_email(self, email: str) -> dict[str, Any] | None:
        response = self.table.query(
            IndexName="EmailIndex",
            KeyConditionExpression=Key("email").eq(email),
            Limit=1,
        )
        items = response.get("Items") or []
        return items[0] if items else None

    def find_by_github_id(self, github_id: str) -> dict[str, Any] | None:
        response = self.table.query(
            IndexName="GithubIdIndex",
            KeyConditionExpression=Key("github_id").eq(str(github_id)),
            Limit=1,
        )
        items = response.get("Items") or []
        return items[0] if items else None

    def update(self, user_id: str, values: dict[str, Any]) -> dict[str, Any]:
        names: dict[str, str] = {}
        value_map: dict[str, Any] = {}
        assignments = []
        for index, (key, value) in enumerate(values.items()):
            names[f"#k{index}"] = key
            value_map[f":v{index}"] = value
            assignments.append(f"#k{index} = :v{index}")
        response = self.table.update_item(
            Key={"user_id": user_id},
            UpdateExpression="SET " + ", ".join(assignments),
            ExpressionAttributeNames=names,
            ExpressionAttributeValues=value_map,
            ReturnValues="ALL_NEW",
        )
        return response["Attributes"]


class ConnectionRepository:
    def __init__(self, table: Any | None = None) -> None:
        self.table = table or _ddb().Table(CONNECTIONS_TABLE)

    

    def find_for_repo(self, user_id: str, repository: str) -> dict[str, Any] | None:
        for item in self.list_for_user(user_id):
            if item.get("repository") == repository:
                return item
        return None

    def list_for_user(self, user_id: str) -> list[dict[str, Any]]:
        response = self.table.query(
            IndexName="UserRepoIndex",
            KeyConditionExpression=Key("user_id").eq(user_id),
        )
        return response.get("Items", [])

    def find_by_installation_repo(self, installation_id: str, repository: str) -> dict[str, Any] | None:
        response = self.table.query(
            IndexName="InstallationRepoIndex",
            KeyConditionExpression=Key("installation_id").eq(str(installation_id)) & Key("repository").eq(repository),
            Limit=1,
        )
        items = response.get("Items") or []
        return items[0] if items else None
    def replace_for_user(self, user_id: str, repositories: list[dict[str, Any]]) -> list[dict[str, Any]]:
        existing = {item.get("repository"): item for item in self.list_for_user(user_id)}
        desired = {str(item["repository"]): item for item in repositories}

        # Delete deselected connections.
        with self.table.batch_writer() as batch:
            for repository, item in existing.items():
                if repository not in desired:
                    batch.delete_item(Key={"connection_id": item["connection_id"]})

        saved: list[dict[str, Any]] = []
        with self.table.batch_writer() as batch:
            for repository, data in desired.items():
                current = existing.get(repository)
                item = {
                    "connection_id": current.get("connection_id") if current else str(uuid.uuid4()),
                    "user_id": user_id,
                    "repository": repository,
                    "repo_id": str(data["repo_id"]),
                    "repo_name": data.get("repo_name", repository.rsplit("/", 1)[-1]),
                    "private": bool(data.get("private", False)),
                    "installation_id": str(data["installation_id"]),
                    "updated_at": _now(),
                }
                batch.put_item(Item=item)
                saved.append(item)
        return saved


class PolicyRepository:
    def __init__(self, table: Any | None = None) -> None:
        self.table = table or _ddb().Table(POLICIES_TABLE)

    def get(self, user_id: str) -> dict[str, Any]:
        item = self.table.get_item(Key={"user_id": user_id}).get("Item")
        if item:
            return {
                "warn_usd": float(item.get("warn_usd", 5)),
                "block_usd": float(item.get("block_usd", 25)),
                "db_instance": item.get("db_instance", "db.t4g.small"),
            }
        return {"warn_usd": 5.0, "block_usd": 25.0, "db_instance": "db.t4g.small"}

    def put(self, user_id: str, policy: dict[str, Any]) -> dict[str, Any]:
        item = {
            "user_id": user_id,
            "warn_usd": str(float(policy.get("warn_usd", 5))),
            "block_usd": str(float(policy.get("block_usd", 25))),
            "db_instance": str(policy.get("db_instance", "db.t4g.small")),
            "updated_at": _now(),
        }
        self.table.put_item(Item=item)
        return self.get(user_id)

class PRStudioJobRepository:
    """Persistence for asynchronous PR Studio analysis jobs."""

    def __init__(self, table: Any | None = None) -> None:
        self.table = table or _ddb().Table(os.getenv("PR_STUDIO_JOB_TABLE_NAME", "costgate-pr-studio-jobs"))

    def create(self, *, job_id: str, user_id: str, repository: str, pull_number: int) -> dict[str, Any]:
        created_at = _now()
        item = {
            "job_id": job_id,
            "user_id": user_id,
            "repository": repository,
            "pull_number": int(pull_number),
            "status": "queued",
            "created_at": created_at,
            "expires_at": int(datetime.now(timezone.utc).timestamp()) + 86400,
        }
        self.table.put_item(Item=item)
        return item

    def get_for_user(self, job_id: str, user_id: str) -> dict[str, Any] | None:
        item = self.table.get_item(Key={"job_id": job_id}).get("Item")
        if not item or item.get("user_id") != user_id:
            return None
        return item

    def update(self, job_id: str, **values: Any) -> dict[str, Any]:
        if not values:
            return self.table.get_item(Key={"job_id": job_id}).get("Item") or {}
        names: dict[str, str] = {}
        value_map: dict[str, Any] = {}
        assignments = []
        for index, (key, value) in enumerate(values.items()):
            names[f"#k{index}"] = key
            value_map[f":v{index}"] = _floats_to_decimals(value)
            assignments.append(f"#k{index} = :v{index}")
        response = self.table.update_item(
            Key={"job_id": job_id},
            UpdateExpression="SET " + ", ".join(assignments),
            ExpressionAttributeNames=names,
            ExpressionAttributeValues=value_map,
            ReturnValues="ALL_NEW",
        )
        return response["Attributes"]
