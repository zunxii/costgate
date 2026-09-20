from __future__ import annotations

import base64
from datetime import datetime, timezone
import json
import os
import re
import urllib.parse
import urllib.request
import uuid

from decimal import Decimal
from typing import Any

from app.auth.repository import ConnectionRepository, PolicyRepository, PRStudioJobRepository, UserRepository
from app.auth.session import create_session_token, get_user_id_from_event
from app.cost_engine.assumptions import CostAssumptions
from app.cost_engine.calculator import calculate_cost_impact
from app.cost_engine.pricing import get_rds_pricing
from app.domain.enums import ScanType
from app.domain.models import PlanComparison, PlanMetrics
from app.github.app_auth import GitHubAppAuthenticator
from app.github.client import GitHubClient
from app.github.user_app import GitHubAppUserClient
from app.ledger.repository import PredictionLedger



PREDICTION_TABLE = os.getenv("PREDICTION_TABLE_NAME", "costgate-predictions")
AWS_REGION = os.getenv("AWS_REGION", "eu-north-1")
APP_SLUG = os.getenv("GITHUB_APP_SLUG", "costgate-bot")
DEFAULT_INSTANCE_RATES = {
    "db.t4g.small": {"hourly_usd": 0.04, "v_cpu": 2, "ram_gb": 2, "label": "Burstable"},
    "db.m6g.large": {"hourly_usd": 0.13, "v_cpu": 2, "ram_gb": 8, "label": "General Purpose"},
    "db.r6g.xlarge": {"hourly_usd": 0.52, "v_cpu": 4, "ram_gb": 32, "label": "Memory Optimized"},
    "db.r6g.4xlarge": {"hourly_usd": 2.08, "v_cpu": 16, "ram_gb": 128, "label": "High Throughput"},
}


def _response(body: Any, status: int = 200, *, headers: dict[str, str] | None = None) -> dict[str, Any]:
    merged = {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store",
    }
    if headers:
        merged.update(headers)
    return {
        "statusCode": status,
        "headers": merged,
        "body": json.dumps(body, default=_json_default),
    }


def _json_default(value: Any) -> Any:
    if isinstance(value, Decimal):
        return float(value)
    return str(value)


def _event_path(event: dict[str, Any]) -> str:
    return str(event.get("rawPath") or event.get("path") or "")


def _method(event: dict[str, Any]) -> str:
    request_context = event.get("requestContext") or {}
    http = request_context.get("http") or {}
    return str(event.get("requestContext", {}).get("http", {}).get("method") or event.get("httpMethod") or http.get("method") or "GET").upper()


def _body(event: dict[str, Any]) -> dict[str, Any]:
    raw = event.get("body") or "{}"
    if event.get("isBase64Encoded"):
        raw = base64.b64decode(raw).decode("utf-8")
    return json.loads(raw) if isinstance(raw, str) else raw


def _require_user(event: dict[str, Any]) -> tuple[dict[str, Any] | None, dict[str, Any] | None]:
    user_id = get_user_id_from_event(event)
    if not user_id:
        return None, _response({"error": {"code": "UNAUTHENTICATED", "message": "Authentication required."}}, 401)
    user = UserRepository().get(user_id)
    if not user:
        return None, _response({"error": {"code": "SESSION_INVALID", "message": "Session is no longer valid."}}, 401)
    return user, None


def _public_user(user: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": user.get("user_id"),
        "email": user.get("email"),
        "name": user.get("name"),
        "github": {
            "id": user.get("github_id"),
            "username": user.get("github_login"),
            "avatar": user.get("avatar_url"),
            "connected": bool(user.get("github_id")),
        },
    }


def _github_request(method: str, url: str, token: str, payload: dict[str, Any] | None = None) -> Any:
    data = json.dumps(payload).encode("utf-8") if payload is not None else None
    request = urllib.request.Request(
        url,
        data=data,
        method=method,
        headers={
            "Accept": "application/vnd.github+json",
            "Authorization": f"Bearer {token}",
            "X-GitHub-Api-Version": "2022-11-28",
            "Content-Type": "application/json",
        },
    )
    try:
        with urllib.request.urlopen(request, timeout=15) as response:
            raw = response.read()
            return json.loads(raw.decode("utf-8")) if raw else {}
    except Exception as exc:
        raise RuntimeError(f"GitHub API request failed: {exc}") from exc


def _github_user_from_token(access_token: str) -> dict[str, Any]:
    profile = _github_request("GET", "https://api.github.com/user", access_token)
    emails = _github_request("GET", "https://api.github.com/user/emails", access_token)
    verified = next(
        (
            email["email"]
            for email in emails
            if email.get("verified") and email.get("primary")
        ),
        None,
    )
    return {
        "id": str(profile.get("id")),
        "login": profile.get("login"),
        "name": profile.get("name") or profile.get("login"),
        "avatar_url": profile.get("avatar_url"),
        "email": verified or profile.get("email"),
    }


def _auth_signup(event: dict[str, Any]) -> dict[str, Any]:
    body = _body(event)
    email = str(body.get("email", "")).strip().lower()
    password = str(body.get("password", ""))
    name = str(body.get("name", "")).strip()
    if not re.fullmatch(r"[^@\s]+@[^@\s]+\.[^@\s]+", email):
        return _response({"error": {"code": "INVALID_EMAIL", "message": "Enter a valid email address."}}, 400)
    if len(password) < 10:
        return _response({"error": {"code": "INVALID_PASSWORD", "message": "Password must be at least 10 characters long."}}, 400)
    try:
        user = UserRepository().create_email_user(email=email, password=password, name=name)
    except ValueError as exc:
        return _response({"error": {"code": "SIGNUP_INVALID", "message": str(exc)}}, 400)
    return _response({"data": {"user": _public_user(user), "session": create_session_token(user_id=user["user_id"])}}, 201)


def _auth_signin(event: dict[str, Any]) -> dict[str, Any]:
    body = _body(event)
    email = str(body.get("email", "")).strip().lower()
    password = str(body.get("password", ""))
    user = UserRepository().authenticate_email(email=email, password=password)
    if not user:
        return _response({"error": {"code": "INVALID_CREDENTIALS", "message": "Email or password is incorrect."}}, 401)
    return _response({"data": {"user": _public_user(user), "session": create_session_token(user_id=user["user_id"])}}, 200)


def _auth_github(event: dict[str, Any]) -> dict[str, Any]:
    body = _body(event)
    access_token = str(body.get("access_token", "")).strip()
    if not access_token:
        return _response({"error": {"code": "MISSING_ACCESS_TOKEN", "message": "GitHub access token is required."}}, 400)
    try:
        profile = _github_user_from_token(access_token)
        if not profile.get("id") or not profile.get("login"):
            return _response({"error": {"code": "GITHUB_PROFILE_INVALID", "message": "GitHub did not return a usable profile."}}, 400)
        repo = UserRepository()
        current_user_id = get_user_id_from_event(event)
        current_user = repo.get(current_user_id) if current_user_id else None
        linked_user = repo.find_by_github_id(str(profile["id"]))
        if current_user and linked_user and linked_user.get("user_id") != current_user.get("user_id"):
            return _response({"error": {"code": "GITHUB_ACCOUNT_ALREADY_LINKED", "message": "This GitHub account is already linked to another CostGate account."}}, 409)
        if current_user:
            update = {
                "github_id": profile["id"],
                "github_login": profile["login"],
                "name": profile.get("name") or current_user.get("name") or profile["login"],
                "avatar_url": profile.get("avatar_url") or current_user.get("avatar_url") or "",
                "updated_at": datetime.now(timezone.utc).isoformat(),
            }
            if profile.get("email") and not current_user.get("email"):
                update["email"] = profile["email"].lower()
            user = repo.update(current_user["user_id"], update)
        else:
            user = repo.create_or_get_github_user(
                github_id=profile["id"],
                github_login=profile["login"],
                email=profile.get("email"),
                name=profile.get("name"),
                avatar_url=profile.get("avatar_url"),
            )
    except RuntimeError as exc:
        return _response({"error": {"code": "GITHUB_AUTH_FAILED", "message": str(exc)}}, 502)
    return _response({"data": {"user": _public_user(user), "session": create_session_token(user_id=user["user_id"])}}, 200)


def _auth_session(event: dict[str, Any]) -> dict[str, Any]:
    user, error = _require_user(event)
    if error:
        return error
    return _response({"data": {"user": _public_user(user)}})


def _github_installations(event: dict[str, Any]) -> dict[str, Any]:
    user, error = _require_user(event)
    if error:
        return error
    login = user.get("github_login")
    if not login:
        return _response({"data": {"installed": False, "installation": None, "repositories": []}})
    try:
        client = GitHubAppUserClient()
        installation = client.get_user_installation(login)
        if not installation:
            return _response({"data": {"installed": False, "installation": None, "repositories": []}})
        repositories = client.list_installation_repositories(str(installation["id"]))
        connected = {item.get("repository") for item in ConnectionRepository().list_for_user(user["user_id"])}
        result = [
            {
                "id": str(repo["id"]),
                "name": repo["name"],
                "full_name": repo["full_name"],
                "private": bool(repo.get("private")),
                "selected": repo["full_name"] in connected,
                "installation_id": str(installation["id"]),
                "default_branch": repo.get("default_branch"),
                "html_url": repo.get("html_url"),
            }
            for repo in repositories
        ]
        return _response({
            "data": {
                "installed": True,
                "installation": {
                    "id": str(installation["id"]),
                    "account": installation.get("account", {}),
                    "repository_selection": installation.get("repository_selection"),
                },
                "repositories": result,
            }
        })
    except Exception as exc:
        return _response({"error": {"code": "GITHUB_INSTALLATION_LOOKUP_FAILED", "message": str(exc)}}, 502)


def _github_connections(event: dict[str, Any]) -> dict[str, Any]:
    user, error = _require_user(event)
    if error:
        return error
    body = _body(event)
    selected = body.get("repositories") or []
    if not isinstance(selected, list):
        return _response({"error": {"code": "INVALID_REPOSITORIES", "message": "repositories must be an array."}}, 400)
    if not user.get("github_login"):
        return _response({"error": {"code": "GITHUB_REQUIRED", "message": "Connect GitHub before selecting repositories."}}, 400)
    try:
        client = GitHubAppUserClient()
        installation = client.get_user_installation(user["github_login"])
        if not installation:
            return _response({"error": {"code": "APP_NOT_INSTALLED", "message": "Install the CostGate GitHub App first."}}, 400)
        available = {str(repo["id"]): repo for repo in client.list_installation_repositories(str(installation["id"]))}
        normalized = []
        for repo in selected:
            repo_id = str(repo.get("repo_id") or repo.get("id") or "")
            if repo_id not in available:
                return _response({"error": {"code": "REPOSITORY_NOT_ACCESSIBLE", "message": f"Repository {repo_id} is not accessible through the CostGate GitHub App."}}, 403)
            source = available[repo_id]
            existing_owner = ConnectionRepository().find_by_installation_repo(str(installation["id"]), source["full_name"])
            if existing_owner and existing_owner.get("user_id") != user["user_id"]:
                return _response({"error": {"code": "REPOSITORY_ALREADY_CONNECTED", "message": "This repository is already connected to another CostGate account for this GitHub App installation."}}, 409)
            normalized.append({
                "repo_id": repo_id,
                "repository": source["full_name"],
                "repo_name": source["name"],
                "private": bool(source.get("private")),
                "installation_id": str(installation["id"]),
            })
        saved = ConnectionRepository().replace_for_user(user["user_id"], normalized)
        return _response({"data": {"repositories": saved}})
    except Exception as exc:
        return _response({"error": {"code": "GITHUB_CONNECTION_FAILED", "message": str(exc)}}, 502)


def _dashboard_data(user_id: str) -> dict[str, Any]:
    connections = ConnectionRepository().list_for_user(user_id)
    ledger = PredictionLedger(table_name=PREDICTION_TABLE, region=AWS_REGION)
    items = ledger.list_for_user(user_id)

    predicted = sum((Decimal(str(item.get("predicted_monthly_delta", 0))) for item in items), Decimal("0"))
    reconciled_items = [item for item in items if item.get("status") == "reconciled"]
    verified = sum((Decimal(str(item.get("actual_monthly_delta", 0))) for item in reconciled_items), Decimal("0"))
    errors = [Decimal(str(item["actual_error_pct"])) for item in reconciled_items if item.get("actual_error_pct") is not None]
    mean_error = sum(errors, Decimal("0")) / len(errors) if errors else None

    by_author: dict[str, dict[str, Any]] = {}
    for item in items:
        author = str(item.get("author", "unknown"))
        record = by_author.setdefault(author, {"author": author, "prs": 0, "predicted_monthly": Decimal("0"), "verified_monthly": Decimal("0"), "errors": []})
        record["prs"] += 1
        record["predicted_monthly"] += Decimal(str(item.get("predicted_monthly_delta", 0)))
        if item.get("status") == "reconciled":
            record["verified_monthly"] += Decimal(str(item.get("actual_monthly_delta", 0)))
            if item.get("actual_error_pct") is not None:
                record["errors"].append(Decimal(str(item["actual_error_pct"])))

    authors = []
    for record in by_author.values():
        author_errors = record["errors"]
        authors.append({
            "author": record["author"],
            "prs": record["prs"],
            "predicted_monthly": float(record["predicted_monthly"]),
            "verified_monthly": float(record["verified_monthly"]),
            "mean_error_pct": float(sum(author_errors, Decimal("0")) / len(author_errors)) if author_errors else None,
        })
    authors.sort(key=lambda row: row["predicted_monthly"], reverse=True)

    predictions = []
    for item in sorted(items, key=lambda row: str(row.get("created_at", "")), reverse=True)[:50]:
        predictions.append({
            "prediction_id": item.get("prediction_id"),
            "repository": item.get("repository"),
            "pull_request_number": item.get("pull_request_number"),
            "author": item.get("author"),
            "created_at": item.get("created_at"),
            "status": item.get("status"),
            "predicted_monthly_delta": float(item.get("predicted_monthly_delta", 0)),
            "actual_monthly_delta": float(item["actual_monthly_delta"]) if item.get("actual_monthly_delta") is not None else None,
            "actual_error_pct": float(item["actual_error_pct"]) if item.get("actual_error_pct") is not None else None,
            "confidence": item.get("confidence"),
            "direction": item.get("direction"),
            "baseline_execution_ms": item.get("baseline_execution_ms"),
            "candidate_execution_ms": item.get("candidate_execution_ms"),
            "baseline_scan_type": item.get("baseline_scan_type"),
            "candidate_scan_type": item.get("candidate_scan_type"),
            "policy_verdict": item.get("policy_verdict"),
            "check_run_url": item.get("check_run_url"),
        })

    repo_stats: dict[str, dict[str, Any]] = {}
    for item in items:
        repo = str(item.get("repository") or "")
        stats = repo_stats.setdefault(repo, {"prs_analyzed": 0, "total_savings_usd": Decimal("0")})
        stats["prs_analyzed"] += 1
        delta = Decimal(str(item.get("predicted_monthly_delta", 0)))
        if delta < 0:
            stats["total_savings_usd"] += -delta

    dashboard_repos = []
    for connection in connections:
        repo = str(connection.get("repository") or "")
        stats = repo_stats.get(repo, {"prs_analyzed": 0, "total_savings_usd": Decimal("0")})
        dashboard_repos.append({
            "id": connection.get("connection_id"),
            "name": repo,
            "private": bool(connection.get("private")),
            "status": "connected",
            "prs_analyzed": stats["prs_analyzed"],
            "total_savings_usd": float(stats["total_savings_usd"]),
            "installation_id": connection.get("installation_id"),
        })

    return {
        "summary": {
            "prediction_count": len(items),
            "reconciled_count": len(reconciled_items),
            "total_predicted_monthly": float(predicted),
            "total_verified_monthly": float(verified),
            "mean_error_pct": float(mean_error) if mean_error is not None else None,
        },
        "authors": authors,
        "predictions": predictions,
        "repos": dashboard_repos,
        "policy": PolicyRepository().get(user_id),
    }


def _dashboard(event: dict[str, Any]) -> dict[str, Any]:
    user, error = _require_user(event)
    if error:
        return error
    path = _event_path(event)
    data = _dashboard_data(user["user_id"])
    if path == "/api/dashboard/summary":
        return _response({"data": data["summary"]})
    if path == "/api/dashboard/authors":
        return _response({"data": data["authors"]})
    if path == "/api/dashboard/predictions":
        return _response({"data": data["predictions"]})
    if path == "/api/dashboard/repos":
        return _response({"data": data["repos"]})
    if path == "/api/dashboard/policy":
        if _method(event) == "POST":
            body = _body(event)
            warn_usd = float(body.get("warnUsd", body.get("warn_usd", 5)))
            block_usd = float(body.get("blockUsd", body.get("block_usd", 25)))
            db_instance = str(body.get("dbInstance", body.get("db_instance", "db.t4g.small")))
            if warn_usd < 0 or block_usd <= 0 or warn_usd > block_usd:
                return _response({"error": {"code": "INVALID_POLICY", "message": "Warning threshold must be >= 0 and <= block threshold."}}, 400)
            policy = PolicyRepository().put(user["user_id"], {"warn_usd": warn_usd, "block_usd": block_usd, "db_instance": db_instance})
            return _response({"data": {"success": True, "policy": policy}})
        return _response({"data": data["policy"]})
    return _response({"data": data})


def _pr_studio(event: dict[str, Any]) -> dict[str, Any]:
    user, error = _require_user(event)
    if error:
        return error
    connections = ConnectionRepository().list_for_user(user["user_id"])
    repository = str((event.get("queryStringParameters") or {}).get("repo") or "")
    pr_number = (event.get("queryStringParameters") or {}).get("pr")
    if not repository:
        return _response({"data": {"repositories": connections}})
    connection = next((row for row in connections if row.get("repository") == repository), None)
    if not connection:
        return _response({"error": {"code": "REPOSITORY_NOT_CONNECTED", "message": "Connect this repository in onboarding first."}}, 403)
    installation_id = str(connection["installation_id"])
    try:
        client = GitHubClient(authenticator=GitHubAppAuthenticator(installation_id=installation_id))
        owner, repo = repository.split("/", 1)
        if not pr_number:
            response = client.list_pull_requests(owner, repo, state="open", per_page=50)
            return _response({"data": {"repository": connection, "pull_requests": response}})
        pr = client.get_pull_request(owner, repo, int(pr_number))
        files = client.get_pull_request_files(owner, repo, int(pr_number))
        return _response({"data": {"repository": connection, "pull_request": pr, "files": files}})
    except Exception as exc:
        return _response({"error": {"code": "PR_STUDIO_GITHUB_FAILED", "message": str(exc)}}, 502)


def _pr_analysis(event: dict[str, Any]) -> dict[str, Any]:
    user, error = _require_user(event)
    if error:
        return error
    body = _body(event)
    repository = str(body.get("repository", ""))
    try:
        pull_number = int(body.get("pull_number", 0))
    except (TypeError, ValueError):
        pull_number = 0
    if not repository or pull_number <= 0:
        return _response({"error": {"code": "INVALID_PR", "message": "repository and pull_number are required."}}, 400)
    connection = ConnectionRepository().find_for_repo(user["user_id"], repository)
    if not connection:
        return _response({"error": {"code": "REPOSITORY_NOT_CONNECTED", "message": "Connect the repository before analyzing a PR."}}, 403)
    analysis_function = os.getenv("ANALYSIS_FUNCTION_NAME", "")
    processor_function = os.getenv("PROCESSOR_FUNCTION_NAME", "")
    if not processor_function or not analysis_function:
        return _response({"error": {"code": "ANALYSIS_BACKEND_NOT_CONFIGURED", "message": "CostGate analysis workers are not configured."}}, 503)

    job_id = str(uuid.uuid4())
    job_repo = PRStudioJobRepository()
    job_repo.create(
        job_id=job_id,
        user_id=user["user_id"],
        repository=repository,
        pull_number=pull_number,
    )
    try:
        import boto3
        boto3.client("lambda").invoke(
            FunctionName=processor_function,
            InvocationType="Event",
            Payload=json.dumps({
                "type": "pr_studio",
                "job_id": job_id,
                "user_id": user["user_id"],
                "repository": repository,
                "pull_number": pull_number,
                "installation_id": str(connection["installation_id"]),
            }).encode("utf-8"),
        )
    except Exception as exc:
        job_repo.update(job_id, status="failed", error=str(exc))
        return _response({"error": {"code": "ANALYSIS_QUEUE_FAILED", "message": "Could not start the PR analysis job."}}, 503)
    return _response({"data": {"job_id": job_id, "status": "queued"}}, 202)


def _pr_studio_job(event: dict[str, Any]) -> dict[str, Any]:
    user, error = _require_user(event)
    if error:
        return error
    job_id = str((event.get("pathParameters") or {}).get("job_id") or "")
    if not job_id:
        path = _event_path(event)
        job_id = path.rsplit("/", 1)[-1]
    job = PRStudioJobRepository().get_for_user(job_id, user["user_id"])
    if not job:
        return _response({"error": {"code": "JOB_NOT_FOUND", "message": "PR Studio job was not found."}}, 404)
    return _response({"data": job})


def _cost_simulator(event: dict[str, Any]) -> dict[str, Any]:
    user, error = _require_user(event)
    if error:
        return error
    if _method(event) == "GET":
        return _response({"data": {"region": AWS_REGION, "engine": "postgres", "instances": [{"id": key, **value} for key, value in DEFAULT_INSTANCE_RATES.items()], "formula": "(candidate_ms - baseline_ms) × monthly_requests ÷ 3,600,000 × hourly_rate × HA multiplier"}})
    body = _body(event)
    try:
        baseline_ms = float(body["baseline_ms"])
        candidate_ms = float(body["candidate_ms"])
        monthly_requests = int(body["monthly_requests"])
        instance_class = str(body.get("instance_class", "db.t4g.small"))
        hourly_rate = float(body.get("hourly_rate_usd") or DEFAULT_INSTANCE_RATES.get(instance_class, {}).get("hourly_usd", 0))
        multi_az = bool(body.get("multi_az", False))
        if baseline_ms < 0 or candidate_ms < 0:
            raise ValueError("Execution times cannot be negative.")
        if instance_class not in DEFAULT_INSTANCE_RATES and hourly_rate <= 0:
            raise ValueError("hourly_rate_usd is required for a custom instance class.")
        baseline = PlanMetrics(
            scan_type=ScanType.UNKNOWN,
            index_used=False,
            index_name=None,
            rows_returned=0,
            execution_time_ms=baseline_ms,
            planning_time_ms=0,
            shared_hit_blocks=0,
            shared_read_blocks=0,
            shared_dirtied_blocks=0,
            shared_written_blocks=0,
            estimated_plan_cost=0,
            raw_plan={},
        )
        candidate = PlanMetrics(
            scan_type=ScanType.UNKNOWN,
            index_used=False,
            index_name=None,
            rows_returned=0,
            execution_time_ms=candidate_ms,
            planning_time_ms=0,
            shared_hit_blocks=0,
            shared_read_blocks=0,
            shared_dirtied_blocks=0,
            shared_written_blocks=0,
            estimated_plan_cost=0,
            raw_plan={},
        )
        comparison = PlanComparison(
            baseline=baseline,
            candidate=candidate,
            execution_time_delta_ms=candidate_ms - baseline_ms,
            execution_time_ratio=(candidate_ms / baseline_ms) if baseline_ms > 0 else 0,
            shared_blocks_delta=0,
            index_usage_changed=False,
            scan_type_changed=False,
        )
        assumptions = CostAssumptions(
            monthly_requests=monthly_requests,
            db_instance_hourly_cost_usd=hourly_rate,
            effective_parallelism=1.0,
            billing_multiplier=2.0 if multi_az else 1.0,
        )
        pricing = get_rds_pricing(
            region=AWS_REGION,
            engine="postgres",
            instance_class=instance_class,
            db_instance_hourly_usd=hourly_rate,
        )
        result = calculate_cost_impact(comparison, assumptions, pricing)
        return _response({"data": {
            "monthly_delta_usd": float(result.monthly_delta),
            "lower_bound_usd": float(result.lower_bound),
            "upper_bound_usd": float(result.upper_bound),
            "annualized_delta_usd": float(result.monthly_delta * Decimal("12")),
            "direction": result.direction.value,
            "confidence": result.confidence.value,
            "assumptions": result.assumptions,
        }})
    except (KeyError, TypeError, ValueError) as exc:
        return _response({"error": {"code": "INVALID_SIMULATION", "message": str(exc)}}, 400)


def lambda_handler(event: dict[str, Any], context: Any) -> dict[str, Any]:
    path = _event_path(event)
    method = _method(event)

    try:
        if path == "/api/auth/signup" and method == "POST":
            return _auth_signup(event)
        if (
            path ==
            "/api/github/installation/complete"
            and method == "POST"
        ):
            return _github_installation_complete(
                event
            )
        if path == "/api/auth/signin" and method == "POST":
            return _auth_signin(event)
        if path == "/api/auth/github/callback" and method == "POST":
            return _auth_github(event)
        if path == "/api/auth/session" and method == "GET":
            return _auth_session(event)
        if path.startswith("/api/dashboard") and method in {"GET", "POST"}:
            return _dashboard(event)
        if path == "/api/github/installations" and method == "GET":
            return _github_installations(event)
        if path == "/api/github/connections" and method == "POST":
            return _github_connections(event)
        if path == "/api/pr-studio" and method == "GET":
            return _pr_studio(event)
        if path == "/api/pr-studio/analyze" and method == "POST":
            return _pr_analysis(event)
        if path.startswith("/api/pr-studio/jobs/") and method == "GET":
            return _pr_studio_job(event)
        if path == "/api/cost-simulator/config" and method == "GET":
            return _cost_simulator(event)
        if path == "/api/cost-simulator/calculate" and method == "POST":
            return _cost_simulator(event)
        return _response({"error": {"code": "NOT_FOUND", "message": f"No API route for {method} {path}"}}, 404)
    except Exception as exc:
        print(f"Unhandled CostGate API error on {method} {path}: {exc}")
        return _response({"error": {"code": "INTERNAL_ERROR", "message": "CostGate API failed to process the request."}}, 500)

def _github_installation_complete(
    event: dict[str, Any],
) -> dict[str, Any]:
    user, error = _require_user(event)

    if error:
        return error

    body = _body(event)

    installation_id = str(
        body.get("installation_id", "")
    ).strip()

    if not installation_id:
        return _response(
            {
                "error": {
                    "code":
                        "INSTALLATION_ID_REQUIRED",
                    "message":
                        "GitHub installation ID is required.",
                }
            },
            400,
        )

    github_login = user.get(
        "github_login"
    )

    if not github_login:
        return _response(
            {
                "error": {
                    "code":
                        "GITHUB_NOT_CONNECTED",
                    "message":
                        "Connect your GitHub account first.",
                }
            },
            400,
        )

    try:
        client = GitHubAppUserClient()

        installation = client.get_user_installation(
                github_login
            )

        if not installation:
            return _response(
                {
                    "error": {
                        "code":
                            "INSTALLATION_NOT_FOUND",
                        "message":
                            "No GitHub App installation was found for this GitHub account.",
                    }
                },
                404,
            )

        actual_id = str(
            installation.get("id")
        )

        if actual_id != installation_id:
            return _response(
                {
                    "error": {
                        "code":
                            "INSTALLATION_MISMATCH",
                        "message":
                            "This GitHub installation does not belong to the connected GitHub account.",
                    }
                },
                403,
            )

        UserRepository().update(
            user["user_id"],
            {
                "github_installation_id":
                    actual_id,
                "updated_at":
                    datetime.now(
                        timezone.utc
                    ).isoformat(),
            },
        )

        return _response(
            {
                "data": {
                    "installed": True,
                    "installation_id":
                        actual_id,
                }
            }
        )

    except Exception as exc:
        return _response(
            {
                "error": {
                    "code":
                        "INSTALLATION_VERIFICATION_FAILED",
                    "message": str(exc),
                }
            },
            502,
        )