"""Scraping orchestrator — Sprint 18.

Dispatches each source to the appropriate scraper, manages concurrency,
stores results with change detection, and triggers alerts.
"""
import asyncio
import logging
from datetime import datetime, timezone

from sqlalchemy import select, text, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import async_session
from app.models.scraped_content import ScrapedContent
from app.scrapers.base import BaseScraper
from app.scrapers.rss_scraper import RssScraper
from app.scrapers.api_scraper import ApiScraper
from app.scrapers.html_scraper import HtmlScraper

logger = logging.getLogger("proxiam.scraper.orchestrator")

# Scraper registry by source type
SCRAPERS: dict[str, BaseScraper] = {
    "rss": RssScraper(),
    "api": ApiScraper(),
    "scraping": HtmlScraper(),
}

# Max concurrent scraping tasks
MAX_CONCURRENT = 5


async def _scrape_source(source_id: int, url: str, source_type: str, semaphore: asyncio.Semaphore) -> dict:
    """Scrape a single source and store results.

    Each task gets its own DB session to avoid concurrent session usage issues.
    """
    async with semaphore, async_session() as db:
        scraper = SCRAPERS.get(source_type)
        if not scraper:
            return {"source_id": source_id, "status": "skipped", "reason": f"no scraper for {source_type}"}

        if not url:
            return {"source_id": source_id, "status": "skipped", "reason": "no URL"}

        try:
            items = await scraper.scrape(url)
        except Exception as e:
            logger.error("Scraper error for source %d (%s): %s", source_id, url, e)
            return {"source_id": source_id, "status": "error", "error": str(e)}

        now = datetime.now(timezone.utc)
        new_count = 0
        changed_count = 0

        for item in items:
            if not item.content and not item.title:
                continue

            content_hash = BaseScraper.compute_hash(item.content or item.title)

            # Check if we already have this URL
            existing = await db.execute(
                select(ScrapedContent).where(ScrapedContent.url == item.url)
            )
            record = existing.scalar_one_or_none()

            if record:
                # Update last_checked
                record.last_checked = now
                if record.content_hash != content_hash:
                    # Content changed — update and mark for re-analysis
                    record.content_text = item.content
                    record.content_hash = content_hash
                    record.title = item.title or record.title
                    record.last_changed = now
                    record.status = "new"
                    changed_count += 1
            else:
                # New content
                new_record = ScrapedContent(
                    source_id=source_id,
                    url=item.url,
                    title=item.title,
                    content_text=item.content,
                    content_hash=content_hash,
                    last_checked=now,
                    last_changed=now,
                    status="new",
                )
                db.add(new_record)
                new_count += 1

        await db.commit()
        return {
            "source_id": source_id,
            "status": "ok",
            "items_found": len(items),
            "new": new_count,
            "changed": changed_count,
        }


async def run_scraping(db: AsyncSession) -> dict:
    """Run scraping for all active sources.

    Returns stats: total sources, scraped, errors, new items, changed items.
    """
    # Get all sources with URLs
    result = await db.execute(
        text("SELECT id, url, type_source FROM sources_veille WHERE url IS NOT NULL AND url != '' LIMIT 500")
    )
    sources = result.mappings().all()

    semaphore = asyncio.Semaphore(MAX_CONCURRENT)
    tasks = []

    for source in sources:
        source_type = source["type_source"] or "scraping"
        tasks.append(
            _scrape_source(source["id"], source["url"], source_type, semaphore)
        )

    results = await asyncio.gather(*tasks, return_exceptions=True)

    stats = {
        "total_sources": len(sources),
        "scraped": 0,
        "errors": 0,
        "skipped": 0,
        "new_items": 0,
        "changed_items": 0,
    }

    for r in results:
        if isinstance(r, Exception):
            stats["errors"] += 1
            continue
        if r["status"] == "ok":
            stats["scraped"] += 1
            stats["new_items"] += r.get("new", 0)
            stats["changed_items"] += r.get("changed", 0)
        elif r["status"] == "error":
            stats["errors"] += 1
        else:
            stats["skipped"] += 1

    # Trigger alert matching after scraping
    try:
        from app.services.alert_matcher import match_alerts
        await match_alerts(db)
    except Exception as e:
        logger.error("Alert matching failed: %s", e)

    logger.info("Scraping completed: %s", stats)
    return stats
