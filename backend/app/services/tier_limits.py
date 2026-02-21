"""Tier-based quota management — Sprint 17.

Defines limits per subscription tier (free/pro/admin),
checks daily quotas via UsageLog, and logs each action.
"""
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.usage_log import UsageLog
from app.models.user import User

# -1 = unlimited
TIER_LIMITS: dict[str, dict] = {
    "free": {
        "max_projects": 3,
        "max_enrich_day": 5,
        "max_score_day": 10,
        "max_ai_day": 10,
        "max_search_day": 50,
        "pdf_export": False,
        "batch": False,
    },
    "pro": {
        "max_projects": 50,
        "max_enrich_day": 100,
        "max_score_day": 200,
        "max_ai_day": 200,
        "max_search_day": -1,
        "pdf_export": True,
        "batch": True,
    },
    "admin": {
        "max_projects": -1,
        "max_enrich_day": -1,
        "max_score_day": -1,
        "max_ai_day": -1,
        "max_search_day": -1,
        "pdf_export": True,
        "batch": True,
    },
}

# Map action names to their limit key
ACTION_LIMIT_MAP: dict[str, str] = {
    "enrich": "max_enrich_day",
    "score": "max_score_day",
    "ai_chat": "max_ai_day",
    "search": "max_search_day",
}


def get_tier_limits(tier: str) -> dict:
    """Return limits for a given tier."""
    return TIER_LIMITS.get(tier, TIER_LIMITS["free"])


async def count_today_usage(db: AsyncSession, user: User, action: str) -> int:
    """Count how many times user performed action today."""
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    result = await db.execute(
        select(func.count(UsageLog.id))
        .where(UsageLog.user_id == user.id)
        .where(UsageLog.action == action)
        .where(UsageLog.created_at >= today_start)
    )
    return result.scalar() or 0


async def check_quota(db: AsyncSession, user: User, action: str) -> bool:
    """Check if user has remaining quota for action. Returns True if OK."""
    limits = get_tier_limits(user.tier)

    limit_key = ACTION_LIMIT_MAP.get(action)
    if not limit_key:
        return True  # Unknown action, allow

    max_allowed = limits.get(limit_key, -1)
    if max_allowed == -1:
        return True  # Unlimited

    used = await count_today_usage(db, user, action)
    return used < max_allowed


async def check_quota_or_raise(db: AsyncSession, user: User, action: str):
    """Check quota and raise 429 if exceeded."""
    if not await check_quota(db, user, action):
        limits = get_tier_limits(user.tier)
        limit_key = ACTION_LIMIT_MAP.get(action, "")
        max_allowed = limits.get(limit_key, 0)
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Daily quota exceeded for '{action}'. "
                   f"Limit: {max_allowed}/day ({user.tier} tier). "
                   f"Upgrade to Pro for higher limits.",
        )


async def check_project_limit(db: AsyncSession, user: User):
    """Check if user can create a new project."""
    limits = get_tier_limits(user.tier)
    max_projects = limits["max_projects"]
    if max_projects == -1:
        return  # Unlimited

    from sqlalchemy import text
    result = await db.execute(
        text("SELECT COUNT(*) FROM projets WHERE user_id = :uid"),
        {"uid": str(user.id)},
    )
    count = result.scalar() or 0
    if count >= max_projects:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Project limit reached: {count}/{max_projects} ({user.tier} tier). "
                   f"Upgrade to Pro for more projects.",
        )


async def check_feature_access(user: User, feature: str):
    """Check if user tier allows access to a feature (pdf_export, batch)."""
    limits = get_tier_limits(user.tier)
    if not limits.get(feature, False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Feature '{feature}' requires Pro tier or above.",
        )


async def log_usage(
    db: AsyncSession,
    user: User,
    action: str,
    tokens_in: int = 0,
    tokens_out: int = 0,
    cost_eur: float = 0.0,
):
    """Record a usage event for quota tracking and cost monitoring."""
    log = UsageLog(
        user_id=user.id,
        action=action,
        tokens_in=tokens_in,
        tokens_out=tokens_out,
        cost_eur=cost_eur,
    )
    db.add(log)
    await db.commit()
