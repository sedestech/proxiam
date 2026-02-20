"""Notifications API — Sprint 10.

Persistent notifications stored in PostgreSQL.
Generates real events on project CRUD/scoring/import.
Supports mark-as-read and filtering.
"""
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db

router = APIRouter()


async def create_notification(
    db: AsyncSession,
    *,
    type: str,
    title: str,
    message: str = "",
    entity_type: Optional[str] = None,
    entity_id: Optional[str] = None,
):
    """Insert a notification row. Call from any route that generates events."""
    await db.execute(
        text("""
            INSERT INTO notifications (type, title, message, entity_type, entity_id)
            VALUES (:type, :title, :message, :entity_type, :entity_id)
        """),
        {
            "type": type,
            "title": title,
            "message": message,
            "entity_type": entity_type,
            "entity_id": entity_id,
        },
    )
    await db.commit()


@router.get("/notifications")
async def get_notifications(
    limit: int = Query(20, le=100),
    unread_only: bool = Query(False),
    db: AsyncSession = Depends(get_db),
):
    """Return notifications from the database."""
    where = "WHERE read = false" if unread_only else ""
    query = text(f"""
        SELECT id, type, title, message, entity_type, entity_id, read, created_at
        FROM notifications
        {where}
        ORDER BY created_at DESC
        LIMIT :limit
    """)
    result = await db.execute(query, {"limit": limit})
    rows = result.mappings().all()

    notifications = [
        {
            "id": row["id"],
            "type": row["type"],
            "title": row["title"],
            "message": row["message"],
            "entity_type": row["entity_type"],
            "entity_id": row["entity_id"],
            "read": row["read"],
            "timestamp": row["created_at"].isoformat() if row["created_at"] else None,
        }
        for row in rows
    ]

    # Counts
    unread_result = await db.execute(
        text("SELECT COUNT(*) FROM notifications WHERE read = false")
    )
    unread_count = unread_result.scalar()

    total_result = await db.execute(text("SELECT COUNT(*) FROM notifications"))
    total_count = total_result.scalar()

    return {
        "notifications": notifications,
        "unread": unread_count,
        "total": total_count,
    }


@router.put("/notifications/{notif_id}/read")
async def mark_as_read(notif_id: int, db: AsyncSession = Depends(get_db)):
    """Mark a single notification as read."""
    await db.execute(
        text("UPDATE notifications SET read = true WHERE id = :id"),
        {"id": notif_id},
    )
    await db.commit()
    return {"ok": True}


@router.put("/notifications/read-all")
async def mark_all_read(db: AsyncSession = Depends(get_db)):
    """Mark all notifications as read."""
    result = await db.execute(
        text("UPDATE notifications SET read = true WHERE read = false")
    )
    await db.commit()
    return {"ok": True, "updated": result.rowcount}
