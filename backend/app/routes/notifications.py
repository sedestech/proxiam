"""Notifications API — Sprint 8.

Generates notifications from recent database activity:
- Projects created/updated (from date_creation)
- Scores calculated (from score_global IS NOT NULL)
- System events (health status)
"""
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db

router = APIRouter()


@router.get("/notifications")
async def get_notifications(
    limit: int = Query(10, le=50),
    db: AsyncSession = Depends(get_db),
):
    """Return recent activity as notifications."""
    notifications = []

    # Recent projects (last 10)
    query = text("""
        SELECT id, nom, filiere, statut, score_global, date_creation
        FROM projets
        ORDER BY date_creation DESC
        LIMIT :limit
    """)
    result = await db.execute(query, {"limit": limit})
    rows = result.mappings().all()

    for row in rows:
        # Project created event
        notifications.append({
            "id": f"proj-{row['id']}",
            "type": "project_created",
            "title": f"Projet cree : {row['nom']}",
            "message": f"Filiere {row['filiere'] or 'inconnue'}, statut {row['statut']}",
            "timestamp": str(row["date_creation"]) if row["date_creation"] else None,
            "read": True,
        })

        # Score event if calculated
        if row["score_global"] is not None:
            notifications.append({
                "id": f"score-{row['id']}",
                "type": "score_calculated",
                "title": f"Score calcule : {row['nom']}",
                "message": f"Score global : {row['score_global']}/100",
                "timestamp": str(row["date_creation"]) if row["date_creation"] else None,
                "read": True,
            })

    # System notification: counts
    stats_query = text("""
        SELECT
            (SELECT COUNT(*) FROM projets) as projets,
            (SELECT COUNT(*) FROM phases) as phases,
            (SELECT COUNT(*) FROM normes) as normes,
            (SELECT COUNT(*) FROM risques) as risques
    """)
    stats_result = await db.execute(stats_query)
    stats = stats_result.mappings().first()

    notifications.insert(0, {
        "id": "system-stats",
        "type": "system",
        "title": "Base de donnees active",
        "message": f"{stats['projets']} projets, {stats['phases']} phases, {stats['normes']} normes, {stats['risques']} risques",
        "timestamp": None,
        "read": False,
    })

    # Separate system notification, sort the rest by timestamp
    system_notif = [n for n in notifications if n["type"] == "system"]
    other_notifs = [n for n in notifications if n["type"] != "system"]
    other_notifs.sort(
        key=lambda n: n["timestamp"] or "0000", reverse=True
    )

    # Always include system notification, then fill with others
    final = system_notif + other_notifs[: limit - len(system_notif)]

    unread = sum(1 for n in final if not n["read"])

    return {
        "notifications": final[:limit],
        "unread": unread,
        "total": len(system_notif) + len(other_notifs),
    }
