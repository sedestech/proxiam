"""HTML scraper — Sprint 18.

Scrapes HTML pages using BeautifulSoup, extracts main content.
"""
import logging
import re

from bs4 import BeautifulSoup

from app.scrapers.base import BaseScraper, ScrapedItem

logger = logging.getLogger("proxiam.scraper.html")


class HtmlScraper(BaseScraper):
    """Scrape HTML pages and extract text content."""

    async def scrape(self, url: str, **kwargs) -> list[ScrapedItem]:
        """Fetch HTML page and extract main content.

        kwargs:
            selector: CSS selector for main content (default: auto-detect)
            link_selector: CSS selector for links to follow (optional)
        """
        resp = await self.fetch_with_retry(url)
        if not resp:
            return []

        soup = BeautifulSoup(resp.text, "html.parser")

        # Remove scripts, styles, nav, footer
        for tag in soup(["script", "style", "nav", "footer", "header", "aside"]):
            tag.decompose()

        selector = kwargs.get("selector", "")
        if selector:
            main = soup.select_one(selector)
            if main:
                text = main.get_text(separator="\n", strip=True)
            else:
                text = soup.get_text(separator="\n", strip=True)
        else:
            # Auto-detect main content
            main = (
                soup.find("main")
                or soup.find("article")
                or soup.find("div", {"class": re.compile(r"content|main|article", re.I)})
                or soup.find("body")
            )
            text = main.get_text(separator="\n", strip=True) if main else ""

        title = ""
        title_tag = soup.find("title")
        if title_tag:
            title = title_tag.get_text(strip=True)

        # Clean up excessive whitespace
        text = re.sub(r"\n{3,}", "\n\n", text)
        text = text[:50000]  # Limit to 50k chars

        items = [ScrapedItem(
            url=url,
            title=title,
            content=text,
        )]

        # Optionally extract links from page
        link_selector = kwargs.get("link_selector", "")
        if link_selector:
            links = soup.select(link_selector)
            for link in links[:50]:  # Max 50 sub-links
                href = link.get("href", "")
                if href and not href.startswith("#"):
                    # Resolve relative URLs
                    if href.startswith("/"):
                        from urllib.parse import urlparse
                        parsed = urlparse(url)
                        href = f"{parsed.scheme}://{parsed.netloc}{href}"
                    link_title = link.get_text(strip=True)
                    items.append(ScrapedItem(
                        url=href,
                        title=link_title,
                        content="",  # Content fetched in sub-scrape
                        metadata={"parent_url": url},
                    ))

        logger.info("HTML scrape %s: %d items", url, len(items))
        return items
