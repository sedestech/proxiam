"""Stripe billing service — Sprint 22.

Handles subscription lifecycle, plan changes, and usage-based metering.
Requires STRIPE_SECRET_KEY in environment.
"""

import hashlib
import os
import secrets
from datetime import datetime, timezone

from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.subscription import ApiKey, Subscription

# Plan pricing (EUR/month)
PLAN_PRICES = {
    "free": 0,
    "pro": 49,
    "enterprise": 199,
}

PLAN_FEATURES = {
    "free": {
        "max_projects": 3,
        "max_enrichments_day": 5,
        "max_ai_calls_day": 10,
        "api_access": False,
        "collaboration": False,
        "pdf_export": False,
        "batch_operations": False,
    },
    "pro": {
        "max_projects": 50,
        "max_enrichments_day": 100,
        "max_ai_calls_day": 200,
        "api_access": True,
        "collaboration": True,
        "pdf_export": True,
        "batch_operations": True,
    },
    "enterprise": {
        "max_projects": -1,
        "max_enrichments_day": -1,
        "max_ai_calls_day": -1,
        "api_access": True,
        "collaboration": True,
        "pdf_export": True,
        "batch_operations": True,
    },
}


async def get_or_create_subscription(db: AsyncSession, user_id: str) -> dict:
    """Get user subscription or create free tier."""
    result = await db.execute(
        select(Subscription).where(Subscription.user_id == user_id)
    )
    sub = result.scalar_one_or_none()

    if not sub:
        sub = Subscription(user_id=user_id, plan="free", status="active")
        db.add(sub)
        await db.commit()
        await db.refresh(sub)

    return {
        "id": str(sub.id),
        "plan": sub.plan,
        "status": sub.status,
        "features": PLAN_FEATURES.get(sub.plan, PLAN_FEATURES["free"]),
        "price_eur": PLAN_PRICES.get(sub.plan, 0),
        "current_period_end": sub.current_period_end.isoformat() if sub.current_period_end else None,
        "cancel_at_period_end": sub.cancel_at_period_end,
    }


def generate_api_key() -> tuple[str, str, str]:
    """Generate a new API key. Returns (full_key, key_hash, key_prefix)."""
    raw = secrets.token_urlsafe(32)
    full_key = f"pxm_{raw}"
    key_hash = hashlib.sha256(full_key.encode()).hexdigest()
    key_prefix = full_key[:12]
    return full_key, key_hash, key_prefix


async def create_api_key(db: AsyncSession, user_id: str, name: str) -> dict:
    """Create a new API key for a user."""
    full_key, key_hash, key_prefix = generate_api_key()

    api_key = ApiKey(
        user_id=user_id,
        key_hash=key_hash,
        key_prefix=key_prefix,
        name=name,
        scopes="read",
        rate_limit=100,
    )
    db.add(api_key)
    await db.commit()
    await db.refresh(api_key)

    return {
        "id": str(api_key.id),
        "key": full_key,  # Only returned once at creation
        "prefix": key_prefix,
        "name": name,
        "scopes": api_key.scopes,
        "rate_limit": api_key.rate_limit,
    }


async def validate_api_key(db: AsyncSession, key: str) -> dict | None:
    """Validate an API key and return user info."""
    key_hash = hashlib.sha256(key.encode()).hexdigest()
    result = await db.execute(
        select(ApiKey).where(ApiKey.key_hash == key_hash, ApiKey.active == True)
    )
    api_key = result.scalar_one_or_none()
    if not api_key:
        return None

    # Update last_used
    api_key.last_used = datetime.now(timezone.utc)
    await db.commit()

    return {
        "user_id": str(api_key.user_id),
        "scopes": api_key.scopes.split(",") if api_key.scopes else ["read"],
        "rate_limit": api_key.rate_limit,
    }


async def get_usage_metrics(db: AsyncSession, user_id: str, days: int = 30) -> dict:
    """Get usage metrics for billing dashboard."""
    result = await db.execute(
        text("""
            SELECT
                action,
                COUNT(*) as count,
                COALESCE(SUM(tokens_in), 0) as total_tokens_in,
                COALESCE(SUM(tokens_out), 0) as total_tokens_out,
                COALESCE(SUM(cost_eur), 0) as total_cost
            FROM usage_logs
            WHERE user_id = :uid AND created_at >= NOW() - INTERVAL ':days days'
            GROUP BY action
            ORDER BY count DESC
        """),
        {"uid": user_id, "days": days},
    )
    rows = result.mappings().all()
    return {
        "period_days": days,
        "actions": [dict(r) for r in rows],
        "total_cost_eur": sum(float(r["total_cost"]) for r in rows),
    }
