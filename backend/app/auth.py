"""Clerk JWT authentication — Sprint 17.

Validates JWT Bearer tokens from Clerk, caches JWKS keys,
and provides FastAPI dependencies for route protection.
"""
import json
import time
from typing import Optional

import httpx
import jwt
from jwt.exceptions import PyJWTError
from fastapi import Depends, HTTPException, Request, status
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.sql import func

from app.config import settings
from app.database import get_db
from app.models.user import User

# JWKS cache: {keys: [...], fetched_at: float}
_jwks_cache: dict = {"keys": [], "fetched_at": 0}
JWKS_CACHE_TTL = 3600  # 1 hour


async def _get_jwks() -> list[dict]:
    """Fetch and cache JWKS keys from Clerk."""
    now = time.time()
    if _jwks_cache["keys"] and (now - _jwks_cache["fetched_at"]) < JWKS_CACHE_TTL:
        return _jwks_cache["keys"]

    if not settings.clerk_domain:
        return []

    url = f"https://{settings.clerk_domain}/.well-known/jwks.json"
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(url)
            resp.raise_for_status()
            data = resp.json()
            _jwks_cache["keys"] = data.get("keys", [])
            _jwks_cache["fetched_at"] = now
            return _jwks_cache["keys"]
    except Exception:
        return _jwks_cache["keys"]  # Return stale cache on error


def _extract_token(request: Request) -> Optional[str]:
    """Extract Bearer token from Authorization header."""
    auth = request.headers.get("Authorization", "")
    if auth.startswith("Bearer "):
        return auth[7:]
    return None


async def _decode_token(token: str) -> Optional[dict]:
    """Decode and validate a Clerk JWT token."""
    keys = await _get_jwks()
    if not keys:
        return None

    try:
        # Clerk uses RS256
        unverified_header = jwt.get_unverified_header(token)
        kid = unverified_header.get("kid")

        # Find matching key
        rsa_key = None
        for key in keys:
            if key.get("kid") == kid:
                rsa_key = key
                break

        if not rsa_key:
            return None

        # Build RSA public key object from JWK (PyJWT requirement)
        rsa_key_obj = jwt.algorithms.RSAAlgorithm.from_jwk(json.dumps(rsa_key))

        payload = jwt.decode(
            token,
            rsa_key_obj,
            algorithms=["RS256"],
            options={"verify_aud": False},  # Clerk doesn't always set aud
            issuer=f"https://{settings.clerk_domain}",
        )
        return payload
    except PyJWTError:
        return None


async def _upsert_user(db: AsyncSession, clerk_id: str, email: str, name: Optional[str] = None) -> User:
    """Create or update user on login. Returns the User object."""
    result = await db.execute(
        select(User).where(User.clerk_id == clerk_id)
    )
    user = result.scalar_one_or_none()

    if user:
        # Update last_login
        await db.execute(
            update(User)
            .where(User.id == user.id)
            .values(last_login=func.now(), email=email)
        )
        await db.commit()
        await db.refresh(user)
        return user

    # Create new user
    user = User(
        clerk_id=clerk_id,
        email=email,
        nom=name,
        tier="free",
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


async def get_current_user(
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> Optional[User]:
    """Optional auth: returns User if authenticated, None otherwise.

    Use for routes that work both authenticated and unauthenticated
    (e.g., public knowledge base with personalized features).
    """
    token = _extract_token(request)
    if not token:
        return None

    payload = await _decode_token(token)
    if not payload:
        return None

    clerk_id = payload.get("sub")
    email = payload.get("email", payload.get("email_addresses", [{}])[0].get("email", "") if isinstance(payload.get("email_addresses"), list) else "")
    if not email:
        # Try alternate Clerk JWT structure
        email = payload.get("primary_email_address", "unknown@clerk.dev")

    if not clerk_id:
        return None

    return await _upsert_user(db, clerk_id, email, payload.get("name"))


async def require_user(
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> User:
    """Required auth: returns User or raises 401.

    Use for routes that require authentication (projects, enrichment, etc.).
    """
    user = await get_current_user(request, db)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account deactivated",
        )
    return user


async def require_admin(
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> User:
    """Admin auth: returns User if admin, raises 403 otherwise.

    Use for admin-only routes (user management, platform stats).
    """
    user = await require_user(request, db)
    if user.tier != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )
    return user
