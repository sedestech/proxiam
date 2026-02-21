"""API REST scraper — Sprint 18.

Fetches JSON data from REST APIs (Capareseau RTE, data.gouv.fr, etc.).
"""
import logging
from typing import Optional

from app.scrapers.base import BaseScraper, ScrapedItem

logger = logging.getLogger("proxiam.scraper.api")


class ApiScraper(BaseScraper):
    """Scrape REST API endpoints returning JSON."""

    async def scrape(self, url: str, **kwargs) -> list[ScrapedItem]:
        """Fetch JSON API and extract items.

        kwargs:
            items_path: dot-separated path to items array (e.g. "data.records")
            title_field: field name for title (default: "title")
            content_field: field name for content (default: "description")
            url_field: field name for URL (default: "url")
        """
        resp = await self.fetch_with_retry(url)
        if not resp:
            return []

        try:
            data = resp.json()
        except Exception as e:
            logger.error("JSON parse error for %s: %s", url, e)
            return []

        # Navigate to items array via dot path
        items_path = kwargs.get("items_path", "")
        current = data
        if items_path:
            for key in items_path.split("."):
                if isinstance(current, dict):
                    current = current.get(key, [])
                else:
                    current = []
                    break

        if not isinstance(current, list):
            # Single object — wrap as list
            current = [current] if current else []

        title_field = kwargs.get("title_field", "title")
        content_field = kwargs.get("content_field", "description")
        url_field = kwargs.get("url_field", "url")

        items = []
        for record in current:
            if not isinstance(record, dict):
                continue

            title = str(record.get(title_field, ""))
            content = str(record.get(content_field, ""))
            item_url = str(record.get(url_field, url))

            items.append(ScrapedItem(
                url=item_url,
                title=title,
                content=content,
                metadata={"source_url": url},
            ))

        logger.info("API scrape %s: %d items", url, len(items))
        return items
