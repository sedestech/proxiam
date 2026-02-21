"""RSS/Atom scraper — Sprint 18.

Parses RSS/Atom feeds using feedparser.
"""
import logging

import feedparser

from app.scrapers.base import BaseScraper, ScrapedItem

logger = logging.getLogger("proxiam.scraper.rss")


class RssScraper(BaseScraper):
    """Scrape RSS/Atom feeds."""

    async def scrape(self, url: str, **kwargs) -> list[ScrapedItem]:
        resp = await self.fetch_with_retry(url)
        if not resp:
            return []

        # Truncate to 500KB to prevent memory issues with very large feeds
        feed = feedparser.parse(resp.text[:500_000])
        items = []

        for entry in feed.entries:
            # Extract content from different RSS/Atom fields
            content = ""
            if hasattr(entry, "content") and entry.content:
                content = entry.content[0].get("value", "")
            elif hasattr(entry, "summary"):
                content = entry.summary or ""
            elif hasattr(entry, "description"):
                content = entry.description or ""

            link = entry.get("link", url)
            title = entry.get("title", "")

            items.append(ScrapedItem(
                url=link,
                title=title,
                content=content,
                metadata={
                    "published": entry.get("published", ""),
                    "author": entry.get("author", ""),
                    "feed_title": feed.feed.get("title", ""),
                },
            ))

        logger.info("RSS scrape %s: %d items", url, len(items))
        return items
