"""Monitoring endpoints — Sprint 24.

Extended health checks, Prometheus-style metrics, and version info
for production observability.
"""

import os
import platform
import sys
import time
from datetime import datetime, timezone

from fastapi import APIRouter, Depends

from app.auth import require_admin
from app.config import settings

router = APIRouter(prefix="/api/monitoring", tags=["monitoring"])

# ── In-memory counters (no prometheus dependency) ──
_start_time = time.time()
_request_count = 0
_error_count = 0

APP_VERSION = "3.0.0"


def _get_uptime() -> float:
    """Return seconds since app started."""
    return round(time.time() - _start_time, 2)


def _check_disk() -> dict:
    """Return disk usage info (optional — needs psutil or os.statvfs)."""
    try:
        import psutil
        disk = psutil.disk_usage("/")
        return {
            "total_gb": round(disk.total / (1024 ** 3), 1),
            "used_gb": round(disk.used / (1024 ** 3), 1),
            "free_gb": round(disk.free / (1024 ** 3), 1),
            "percent": disk.percent,
        }
    except ImportError:
        try:
            stat = os.statvfs("/")
            total = stat.f_blocks * stat.f_frsize
            free = stat.f_bavail * stat.f_frsize
            used = total - free
            return {
                "total_gb": round(total / (1024 ** 3), 1),
                "used_gb": round(used / (1024 ** 3), 1),
                "free_gb": round(free / (1024 ** 3), 1),
                "percent": round((used / total) * 100, 1) if total > 0 else 0,
            }
        except Exception:
            return {"status": "unavailable"}


def _check_memory() -> dict:
    """Return memory usage info (optional — needs psutil)."""
    try:
        import psutil
        mem = psutil.virtual_memory()
        return {
            "total_gb": round(mem.total / (1024 ** 3), 1),
            "used_gb": round(mem.used / (1024 ** 3), 1),
            "available_gb": round(mem.available / (1024 ** 3), 1),
            "percent": mem.percent,
        }
    except ImportError:
        return {"status": "unavailable (psutil not installed)"}


async def _ping_database() -> str:
    """Ping PostgreSQL."""
    try:
        from sqlalchemy import text
        from app.database import async_session
        async with async_session() as session:
            await session.execute(text("SELECT 1"))
        return "ok"
    except Exception as e:
        return f"error: {str(e)[:100]}"


async def _ping_redis() -> str:
    """Ping Redis."""
    try:
        import redis as redis_lib
        r = redis_lib.Redis(
            host=settings.redis_host,
            port=settings.redis_port,
            password=settings.redis_password or None,
            socket_timeout=2,
        )
        r.ping()
        r.close()
        return "ok"
    except Exception as e:
        return f"error: {str(e)[:100]}"


@router.get("/health")
async def monitoring_health():
    """Extended health check with database, Redis, disk, memory, uptime."""
    db_status = await _ping_database()
    redis_status = await _ping_redis()

    return {
        "status": "ok" if db_status == "ok" else "degraded",
        "database": db_status,
        "redis": redis_status,
        "disk": _check_disk(),
        "memory": _check_memory(),
        "uptime_seconds": _get_uptime(),
    }


@router.get("/metrics")
async def monitoring_metrics():
    """Prometheus-style metrics (simple in-memory counters)."""
    global _request_count
    _request_count += 1

    return {
        "request_count": _request_count,
        "error_count": _error_count,
        "uptime_seconds": _get_uptime(),
        "python_version": platform.python_version(),
        "app_version": APP_VERSION,
    }


@router.get("/version")
async def monitoring_version():
    """Application version and build info."""
    return {
        "app_version": APP_VERSION,
        "git_sha": os.environ.get("GIT_SHA", "dev"),
        "python_version": platform.python_version(),
        "deploy_time": os.environ.get(
            "DEPLOY_TIME",
            datetime.now(timezone.utc).isoformat(),
        ),
        "platform": platform.platform(),
        "fastapi_docs": "/api/docs",
    }
