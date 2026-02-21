"""Veille & Alerts API routes — Sprint 18.

Scraped content, user watches, alerts, and admin scraping controls.
"""
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import and_, func, select, text, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_user, require_admin, require_user
from app.database import get_db
from app.models.scraped_content import ScrapedContent
from app.models.user import User
from app.models.user_watch import Alert, UserWatch

router = APIRouter()


# ─── Scraped Content (public) ───


@router.get("/veille/latest")
async def veille_latest(
    limit: int = Query(30, le=100),
    offset: int = Query(0, ge=0),
    source_type: Optional[str] = None,
    status: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    """Latest scraped content, paginated."""
    conditions = ["1=1"]
    params: dict = {"limit": limit, "offset": offset}

    if source_type:
        conditions.append("""
            sc.source_id IN (SELECT id FROM sources_veille WHERE type_source = :source_type)
        """)
        params["source_type"] = source_type

    if status:
        conditions.append("sc.status = :status")
        params["status"] = status

    where = " AND ".join(conditions)
    query = text(f"""
        SELECT sc.id, sc.url, sc.title, sc.ai_summary, sc.ai_tags,
               sc.status, sc.first_seen, sc.last_checked, sc.last_changed,
               sv.nom as source_nom, sv.type_source
        FROM scraped_contents sc
        LEFT JOIN sources_veille sv ON sv.id = sc.source_id
        WHERE {where}
        ORDER BY sc.last_changed DESC NULLS LAST
        LIMIT :limit OFFSET :offset
    """)
    result = await db.execute(query, params)
    rows = result.mappings().all()

    # Total count
    count_q = text(f"SELECT COUNT(*) FROM scraped_contents sc WHERE {where}")
    total = (await db.execute(count_q, params)).scalar() or 0

    return {
        "total": total,
        "items": [
            {
                "id": str(r["id"]),
                "url": r["url"],
                "title": r["title"],
                "ai_summary": r["ai_summary"],
                "ai_tags": r["ai_tags"],
                "status": r["status"],
                "first_seen": r["first_seen"].isoformat() if r["first_seen"] else None,
                "last_checked": r["last_checked"].isoformat() if r["last_checked"] else None,
                "last_changed": r["last_changed"].isoformat() if r["last_changed"] else None,
                "source_nom": r["source_nom"],
                "source_type": r["type_source"],
            }
            for r in rows
        ],
    }


@router.get("/veille/search")
async def veille_search(
    q: str = Query(..., min_length=2, max_length=200),
    limit: int = Query(20, le=100),
    db: AsyncSession = Depends(get_db),
):
    """Search in scraped content (title + summary)."""
    query = text("""
        SELECT id, url, title, ai_summary, ai_tags, status, last_changed
        FROM scraped_contents
        WHERE (title ILIKE :pattern OR ai_summary ILIKE :pattern OR content_text ILIKE :pattern)
        ORDER BY last_changed DESC NULLS LAST
        LIMIT :limit
    """)
    result = await db.execute(query, {"pattern": f"%{q}%", "limit": limit})
    rows = result.mappings().all()

    return [
        {
            "id": str(r["id"]),
            "url": r["url"],
            "title": r["title"],
            "ai_summary": r["ai_summary"],
            "ai_tags": r["ai_tags"],
            "status": r["status"],
            "last_changed": r["last_changed"].isoformat() if r["last_changed"] else None,
        }
        for r in rows
    ]


# ─── Alerts (authenticated) ───


@router.get("/alerts")
async def list_alerts(
    limit: int = Query(30, le=100),
    unread_only: bool = Query(False),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_user),
):
    """List alerts for the current user."""
    conditions = ["a.user_id = :user_id"]
    params: dict = {"user_id": str(user.id), "limit": limit}

    if unread_only:
        conditions.append("a.read = false")

    where = " AND ".join(conditions)
    query = text(f"""
        SELECT a.id, a.title, a.message, a.read, a.created_at,
               sc.url as content_url, sc.ai_tags
        FROM alerts a
        LEFT JOIN scraped_contents sc ON sc.id = a.scraped_content_id
        WHERE {where}
        ORDER BY a.created_at DESC
        LIMIT :limit
    """)
    result = await db.execute(query, params)
    rows = result.mappings().all()

    # Unread count
    unread_q = text("SELECT COUNT(*) FROM alerts WHERE user_id = :uid AND read = false")
    unread_count = (await db.execute(unread_q, {"uid": str(user.id)})).scalar() or 0

    return {
        "unread_count": unread_count,
        "alerts": [
            {
                "id": str(r["id"]),
                "title": r["title"],
                "message": r["message"],
                "read": r["read"],
                "created_at": r["created_at"].isoformat() if r["created_at"] else None,
                "content_url": r["content_url"],
                "ai_tags": r["ai_tags"],
            }
            for r in rows
        ],
    }


@router.patch("/alerts/{alert_id}/read")
async def mark_alert_read(
    alert_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_user),
):
    """Mark an alert as read."""
    result = await db.execute(
        text("UPDATE alerts SET read = true WHERE id = :id AND user_id = :uid"),
        {"id": alert_id, "uid": str(user.id)},
    )
    await db.commit()
    if result.rowcount == 0:
        raise HTTPException(status_code=404, detail="Alert not found")
    return {"status": "read"}


# ─── User Watches (authenticated) ───


class WatchCreate(BaseModel):
    watch_type: str  # source | keyword | zone_geo | filiere
    watch_value: str


@router.get("/watches")
async def list_watches(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_user),
):
    """List current user's active watches."""
    result = await db.execute(
        select(UserWatch)
        .where(UserWatch.user_id == user.id)
        .order_by(UserWatch.created_at.desc())
    )
    watches = result.scalars().all()

    return [
        {
            "id": str(w.id),
            "watch_type": w.watch_type,
            "watch_value": w.watch_value,
            "created_at": w.created_at.isoformat() if w.created_at else None,
        }
        for w in watches
    ]


@router.post("/watches", status_code=201)
async def create_watch(
    body: WatchCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_user),
):
    """Create a new watch."""
    if body.watch_type not in ("source", "keyword", "zone_geo", "filiere"):
        raise HTTPException(status_code=400, detail="Invalid watch_type")

    watch = UserWatch(
        user_id=user.id,
        watch_type=body.watch_type,
        watch_value=body.watch_value,
    )
    db.add(watch)
    await db.commit()
    await db.refresh(watch)

    return {
        "id": str(watch.id),
        "watch_type": watch.watch_type,
        "watch_value": watch.watch_value,
    }


@router.delete("/watches/{watch_id}")
async def delete_watch(
    watch_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_user),
):
    """Delete a watch."""
    result = await db.execute(
        text("DELETE FROM user_watches WHERE id = :id AND user_id = :uid"),
        {"id": watch_id, "uid": str(user.id)},
    )
    await db.commit()
    if result.rowcount == 0:
        raise HTTPException(status_code=404, detail="Watch not found")
    return {"status": "deleted"}


# ─── Admin Scraping Controls ───


@router.get("/admin/scraping/status")
async def scraping_status(
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """Get scraping status: total content, last scrape time, errors."""
    query = text("""
        SELECT
            COUNT(*) as total,
            COUNT(*) FILTER (WHERE status = 'new') as new,
            COUNT(*) FILTER (WHERE status = 'analyzed') as analyzed,
            COUNT(*) FILTER (WHERE status = 'error') as errors,
            MAX(last_checked) as last_scrape,
            MIN(first_seen) as first_scrape
        FROM scraped_contents
    """)
    result = await db.execute(query)
    row = result.mappings().first()

    return {
        "total_content": row["total"],
        "new": row["new"],
        "analyzed": row["analyzed"],
        "errors": row["errors"],
        "last_scrape": row["last_scrape"].isoformat() if row["last_scrape"] else None,
        "first_scrape": row["first_scrape"].isoformat() if row["first_scrape"] else None,
    }


@router.post("/admin/scraping/run")
async def trigger_scraping(
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """Manually trigger a scraping run (admin only)."""
    from app.scrapers.orchestrator import run_scraping
    stats = await run_scraping(db)
    return {"status": "completed", "stats": stats}
