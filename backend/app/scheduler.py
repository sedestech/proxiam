"""APScheduler — Sprint 18 (veille active).

Lightweight async scheduler integrated into FastAPI lifespan.
Jobs:
  - scrape_all: daily at 02:00 — scrape all monitored sources
  - batch_analyze: daily at 03:00 — AI analysis of new content
  - cleanup_logs: Monday at 04:00 — purge old logs (>90 days)
"""
import logging
from datetime import datetime, timedelta, timezone

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from sqlalchemy import text

from app.database import async_session

logger = logging.getLogger("proxiam.scheduler")

scheduler = AsyncIOScheduler(timezone="Europe/Paris")


async def job_scrape_all():
    """Daily scraping of all active sources."""
    logger.info("[SCHEDULER] Starting scrape_all job at %s", datetime.now(timezone.utc))
    try:
        from app.scrapers.orchestrator import run_scraping
        async with async_session() as db:
            stats = await run_scraping(db)
            logger.info("[SCHEDULER] scrape_all completed: %s", stats)
    except Exception as e:
        logger.error("[SCHEDULER] scrape_all failed: %s", e)


async def job_batch_analyze():
    """Nightly AI analysis of newly scraped content."""
    logger.info("[SCHEDULER] Starting batch_analyze job at %s", datetime.now(timezone.utc))
    try:
        from app.services.batch_analyzer import run_batch_analysis
        async with async_session() as db:
            stats = await run_batch_analysis(db)
            logger.info("[SCHEDULER] batch_analyze completed: %s", stats)
    except Exception as e:
        logger.error("[SCHEDULER] batch_analyze failed: %s", e)


async def job_cleanup_logs():
    """Weekly cleanup of old usage logs (>90 days)."""
    logger.info("[SCHEDULER] Starting cleanup_logs job at %s", datetime.now(timezone.utc))
    try:
        cutoff = datetime.now(timezone.utc) - timedelta(days=90)
        async with async_session() as db:
            result = await db.execute(
                text("DELETE FROM usage_logs WHERE created_at < :cutoff"),
                {"cutoff": cutoff},
            )
            await db.commit()
            logger.info("[SCHEDULER] cleanup_logs: deleted %d old records", result.rowcount)
    except Exception as e:
        logger.error("[SCHEDULER] cleanup_logs failed: %s", e)


def setup_scheduler():
    """Register all scheduled jobs."""
    # Daily at 02:00 Paris time — scraping
    scheduler.add_job(
        job_scrape_all,
        CronTrigger(hour=2, minute=0),
        id="scrape_all",
        name="Scrape all sources",
        replace_existing=True,
    )

    # Daily at 03:00 Paris time — AI analysis
    scheduler.add_job(
        job_batch_analyze,
        CronTrigger(hour=3, minute=0),
        id="batch_analyze",
        name="Batch AI analysis",
        replace_existing=True,
    )

    # Monday at 04:00 Paris time — cleanup
    scheduler.add_job(
        job_cleanup_logs,
        CronTrigger(day_of_week="mon", hour=4, minute=0),
        id="cleanup_logs",
        name="Cleanup old logs",
        replace_existing=True,
    )

    logger.info("[SCHEDULER] Jobs registered: scrape_all(02:00), batch_analyze(03:00), cleanup_logs(Mon 04:00)")


def start_scheduler():
    """Setup and start the scheduler."""
    setup_scheduler()
    scheduler.start()
    logger.info("[SCHEDULER] Started")


def stop_scheduler():
    """Gracefully stop the scheduler."""
    if scheduler.running:
        scheduler.shutdown(wait=False)
        logger.info("[SCHEDULER] Stopped")
