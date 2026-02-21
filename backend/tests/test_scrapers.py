"""Tests for scrapers — Sprint 18."""
import pytest
from unittest.mock import AsyncMock, MagicMock, patch

from app.scrapers.base import BaseScraper, ScrapedItem
from app.scrapers.rss_scraper import RssScraper
from app.scrapers.api_scraper import ApiScraper
from app.scrapers.html_scraper import HtmlScraper


class TestBaseScraper:
    def test_compute_hash(self):
        h1 = BaseScraper.compute_hash("hello world")
        h2 = BaseScraper.compute_hash("hello world")
        h3 = BaseScraper.compute_hash("different content")
        assert h1 == h2
        assert h1 != h3
        assert len(h1) == 64  # SHA256 hex length

    def test_compute_hash_empty(self):
        h = BaseScraper.compute_hash("")
        assert len(h) == 64


class TestRssScraper:
    @pytest.mark.asyncio
    async def test_scrape_valid_rss(self):
        scraper = RssScraper()
        mock_resp = MagicMock()
        mock_resp.text = """<?xml version="1.0"?>
        <rss version="2.0">
          <channel>
            <title>Test Feed</title>
            <item>
              <title>Article 1</title>
              <link>https://example.com/1</link>
              <description>Description 1</description>
            </item>
            <item>
              <title>Article 2</title>
              <link>https://example.com/2</link>
              <description>Description 2</description>
            </item>
          </channel>
        </rss>"""

        with patch.object(scraper, "fetch_with_retry", return_value=mock_resp):
            items = await scraper.scrape("https://example.com/feed")
            assert len(items) == 2
            assert items[0].title == "Article 1"
            assert items[0].url == "https://example.com/1"
            assert "Description 1" in items[0].content

    @pytest.mark.asyncio
    async def test_scrape_fetch_failure(self):
        scraper = RssScraper()
        with patch.object(scraper, "fetch_with_retry", return_value=None):
            items = await scraper.scrape("https://invalid.com/feed")
            assert items == []


class TestApiScraper:
    @pytest.mark.asyncio
    async def test_scrape_json_array(self):
        scraper = ApiScraper()
        mock_resp = MagicMock()
        mock_resp.json.return_value = [
            {"title": "Item 1", "description": "Desc 1", "url": "https://a.com/1"},
            {"title": "Item 2", "description": "Desc 2", "url": "https://a.com/2"},
        ]

        with patch.object(scraper, "fetch_with_retry", return_value=mock_resp):
            items = await scraper.scrape("https://api.example.com/data")
            assert len(items) == 2
            assert items[0].title == "Item 1"

    @pytest.mark.asyncio
    async def test_scrape_nested_path(self):
        scraper = ApiScraper()
        mock_resp = MagicMock()
        mock_resp.json.return_value = {
            "data": {
                "records": [
                    {"title": "Nested Item", "description": "Content"}
                ]
            }
        }

        with patch.object(scraper, "fetch_with_retry", return_value=mock_resp):
            items = await scraper.scrape("https://api.example.com", items_path="data.records")
            assert len(items) == 1
            assert items[0].title == "Nested Item"

    @pytest.mark.asyncio
    async def test_scrape_fetch_failure(self):
        scraper = ApiScraper()
        with patch.object(scraper, "fetch_with_retry", return_value=None):
            items = await scraper.scrape("https://api.invalid.com")
            assert items == []


class TestHtmlScraper:
    @pytest.mark.asyncio
    async def test_scrape_basic_html(self):
        scraper = HtmlScraper()
        mock_resp = MagicMock()
        mock_resp.text = """
        <html>
          <head><title>Test Page</title></head>
          <body>
            <main><p>Main content here</p></main>
            <footer>Footer</footer>
          </body>
        </html>"""

        with patch.object(scraper, "fetch_with_retry", return_value=mock_resp):
            items = await scraper.scrape("https://example.com/page")
            assert len(items) >= 1
            assert items[0].title == "Test Page"
            assert "Main content" in items[0].content

    @pytest.mark.asyncio
    async def test_scrape_fetch_failure(self):
        scraper = HtmlScraper()
        with patch.object(scraper, "fetch_with_retry", return_value=None):
            items = await scraper.scrape("https://invalid.com")
            assert items == []
