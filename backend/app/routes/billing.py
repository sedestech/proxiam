"""Billing & subscription routes — Sprint 22."""

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import require_user
from app.database import get_db
from app.models.subscription import ApiKey, ProjectShare, Subscription
from app.models.user import User
from app.services.billing import (
    create_api_key,
    get_or_create_subscription,
    get_usage_metrics,
    validate_api_key,
    PLAN_FEATURES,
    PLAN_PRICES,
)

router = APIRouter()


# ── Plans & Subscription ──


@router.get("/billing/plans")
async def list_plans():
    """List available plans with pricing and features."""
    return [
        {"plan": plan, "price_eur": PLAN_PRICES[plan], "features": features}
        for plan, features in PLAN_FEATURES.items()
    ]


@router.get("/billing/subscription")
async def get_subscription(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_user),
):
    """Get current user's subscription."""
    return await get_or_create_subscription(db, str(user.id))


@router.post("/billing/subscribe")
async def subscribe(
    plan: str = Query(..., pattern="^(free|pro|enterprise)$"),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_user),
):
    """Change subscription plan.

    In production, this would create a Stripe Checkout session.
    For now, directly updates the plan (demo mode).
    """
    result = await db.execute(
        select(Subscription).where(Subscription.user_id == user.id)
    )
    sub = result.scalar_one_or_none()

    if not sub:
        sub = Subscription(user_id=user.id, plan=plan, status="active")
        db.add(sub)
    else:
        sub.plan = plan
        sub.status = "active"

    # Update user tier to match
    user.tier = "admin" if plan == "enterprise" else plan
    await db.commit()

    return {"plan": plan, "status": "active", "message": f"Switched to {plan} plan"}


@router.get("/billing/usage")
async def billing_usage(
    days: int = Query(30, ge=1, le=365),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_user),
):
    """Get usage metrics for billing."""
    return await get_usage_metrics(db, str(user.id), days)


# ── API Keys ──


@router.get("/billing/api-keys")
async def list_api_keys(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_user),
):
    """List user's API keys (prefix only, not full key)."""
    result = await db.execute(
        select(ApiKey).where(ApiKey.user_id == user.id).order_by(ApiKey.created_at.desc())
    )
    keys = result.scalars().all()
    return [
        {
            "id": str(k.id),
            "prefix": k.key_prefix,
            "name": k.name,
            "scopes": k.scopes,
            "rate_limit": k.rate_limit,
            "last_used": k.last_used.isoformat() if k.last_used else None,
            "active": k.active,
            "created_at": k.created_at.isoformat() if k.created_at else None,
        }
        for k in keys
    ]


@router.post("/billing/api-keys")
async def create_key(
    name: str = Query(..., min_length=1, max_length=100),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_user),
):
    """Create a new API key. The full key is only shown once."""
    # Check plan allows API access
    sub = await get_or_create_subscription(db, str(user.id))
    if not sub["features"].get("api_access"):
        raise HTTPException(403, "API access requires Pro plan or above")

    return await create_api_key(db, str(user.id), name)


@router.delete("/billing/api-keys/{key_id}")
async def revoke_key(
    key_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_user),
):
    """Revoke an API key."""
    result = await db.execute(
        select(ApiKey).where(ApiKey.id == key_id, ApiKey.user_id == user.id)
    )
    key = result.scalar_one_or_none()
    if not key:
        raise HTTPException(404, "API key not found")
    key.active = False
    await db.commit()
    return {"revoked": True}


# ── Project Sharing ──


@router.get("/projects/{project_id}/shares")
async def list_shares(
    project_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_user),
):
    """List users a project is shared with."""
    result = await db.execute(
        select(ProjectShare).where(
            ProjectShare.project_id == project_id,
            ProjectShare.owner_id == user.id,
        )
    )
    shares = result.scalars().all()
    return [
        {
            "id": str(s.id),
            "shared_with_id": str(s.shared_with_id),
            "permission": s.permission,
            "created_at": s.created_at.isoformat() if s.created_at else None,
        }
        for s in shares
    ]


@router.post("/projects/{project_id}/share")
async def share_project(
    project_id: str,
    email: str = Query(...),
    permission: str = Query("read", pattern="^(read|write)$"),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_user),
):
    """Share a project with another user by email."""
    # Check collaboration is enabled
    sub = await get_or_create_subscription(db, str(user.id))
    if not sub["features"].get("collaboration"):
        raise HTTPException(403, "Collaboration requires Pro plan or above")

    # Find target user
    from app.models.user import User as UserModel
    result = await db.execute(select(UserModel).where(UserModel.email == email))
    target = result.scalar_one_or_none()
    if not target:
        raise HTTPException(404, "User not found")
    if str(target.id) == str(user.id):
        raise HTTPException(400, "Cannot share with yourself")

    share = ProjectShare(
        project_id=project_id,
        owner_id=user.id,
        shared_with_id=target.id,
        permission=permission,
    )
    db.add(share)
    await db.commit()
    return {"shared": True, "with": email, "permission": permission}


@router.delete("/projects/{project_id}/share/{share_id}")
async def unshare_project(
    project_id: str,
    share_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_user),
):
    """Remove a project share."""
    result = await db.execute(
        select(ProjectShare).where(
            ProjectShare.id == share_id,
            ProjectShare.owner_id == user.id,
        )
    )
    share = result.scalar_one_or_none()
    if not share:
        raise HTTPException(404, "Share not found")
    await db.delete(share)
    await db.commit()
    return {"unshared": True}
