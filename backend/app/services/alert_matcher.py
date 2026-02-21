"""Alert matcher — Sprint 18.

Matches newly changed scraped content against user watches,
creating alerts for users who are watching matching sources/keywords.
"""
import logging

from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.scraped_content import ScrapedContent
from app.models.user_watch import Alert, UserWatch

logger = logging.getLogger("proxiam.alert_matcher")


async def match_alerts(db: AsyncSession) -> dict:
    """Match recently changed content with user watches. Create alerts.

    Checks:
    - source watches: content.source_id matches watch.watch_value
    - keyword watches: keyword in content.title or content.content_text
    - filiere watches: filiere tag in content.ai_tags
    """
    # Get recently changed content (not yet alert-matched)
    result = await db.execute(
        select(ScrapedContent)
        .where(ScrapedContent.last_changed.isnot(None))
        .where(ScrapedContent.status.in_(["new", "analyzed"]))
        .order_by(ScrapedContent.last_changed.desc())
        .limit(200)
    )
    contents = result.scalars().all()

    if not contents:
        return {"matched": 0}

    # Get all active watches
    watches_result = await db.execute(select(UserWatch))
    watches = watches_result.scalars().all()

    alerts_created = 0

    for content in contents:
        for watch in watches:
            matched = False

            if watch.watch_type == "source" and content.source_id:
                matched = str(content.source_id) == watch.watch_value

            elif watch.watch_type == "keyword":
                keyword = watch.watch_value.lower()
                title = (content.title or "").lower()
                text = (content.content_text or "").lower()
                matched = keyword in title or keyword in text

            elif watch.watch_type == "filiere" and content.ai_tags:
                tags = content.ai_tags.get("tags", []) if isinstance(content.ai_tags, dict) else []
                matched = watch.watch_value.lower() in [t.lower() for t in tags]

            elif watch.watch_type == "zone_geo":
                # Match on department or region in content
                text = (content.content_text or "").lower() + " " + (content.title or "").lower()
                matched = watch.watch_value.lower() in text

            if matched:
                # Check if alert already exists for this watch + content
                existing = await db.execute(
                    select(Alert).where(
                        and_(
                            Alert.watch_id == watch.id,
                            Alert.scraped_content_id == content.id,
                        )
                    )
                )
                if existing.scalar_one_or_none():
                    continue

                alert = Alert(
                    user_id=watch.user_id,
                    watch_id=watch.id,
                    scraped_content_id=content.id,
                    title=f"Veille: {content.title or 'Nouveau contenu'}",
                    message=content.ai_summary or (content.content_text or "")[:200],
                )
                db.add(alert)
                alerts_created += 1

    await db.commit()
    logger.info("Alert matching: %d alerts created from %d contents x %d watches", alerts_created, len(contents), len(watches))
    return {"matched": alerts_created, "contents_checked": len(contents), "watches_active": len(watches)}
