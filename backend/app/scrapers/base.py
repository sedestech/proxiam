"""Base scraper — Sprint 18.

Abstract base class for all scrapers with retry, hashing, and rate limiting.
"""
import hashlib
import ipaddress
import logging
import socket
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Optional
from urllib.parse import urlparse

import httpx

logger = logging.getLogger("proxiam.scraper")


@dataclass
class ScrapedItem:
    """A single scraped content item."""
    url: str
    title: str = ""
    content: str = ""
    metadata: dict = field(default_factory=dict)


class BaseScraper(ABC):
    """Abstract base for all scrapers."""

    def __init__(self, timeout: int = 30, max_retries: int = 3):
        self.timeout = timeout
        self.max_retries = max_retries

    # Private/internal IP ranges to block (SSRF protection)
    _BLOCKED_NETWORKS = [
        ipaddress.ip_network("10.0.0.0/8"),
        ipaddress.ip_network("172.16.0.0/12"),
        ipaddress.ip_network("192.168.0.0/16"),
        ipaddress.ip_network("127.0.0.0/8"),
        ipaddress.ip_network("169.254.0.0/16"),  # Link-local + cloud metadata
        ipaddress.ip_network("0.0.0.0/8"),
    ]

    _BLOCKED_HOSTNAMES = {
        "metadata.google.internal",
        "metadata.internal",
    }

    @staticmethod
    def _validate_url(url: str) -> None:
        """Validate URL to prevent SSRF attacks.

        Blocks non-http(s) schemes, private/internal IPs,
        link-local addresses, and cloud metadata endpoints.

        Raises ValueError if the URL is unsafe.
        """
        parsed = urlparse(url)

        # Block non-http(s) schemes
        if parsed.scheme not in ("http", "https"):
            raise ValueError(f"Unsupported URL scheme: {parsed.scheme}")

        hostname = parsed.hostname
        if not hostname:
            raise ValueError("URL has no hostname")

        # Block known dangerous hostnames
        if hostname.lower() in BaseScraper._BLOCKED_HOSTNAMES:
            raise ValueError(f"Blocked hostname: {hostname}")

        # Resolve hostname to IP and check against blocked ranges
        try:
            resolved_ips = socket.getaddrinfo(hostname, None)
            for _, _, _, _, sockaddr in resolved_ips:
                ip = ipaddress.ip_address(sockaddr[0])
                for network in BaseScraper._BLOCKED_NETWORKS:
                    if ip in network:
                        raise ValueError(
                            f"URL resolves to blocked IP range: {ip}"
                        )
        except socket.gaierror:
            raise ValueError(f"Cannot resolve hostname: {hostname}")

    @abstractmethod
    async def scrape(self, url: str, **kwargs) -> list[ScrapedItem]:
        """Scrape a source URL and return items."""
        ...

    async def fetch_with_retry(self, url: str) -> Optional[httpx.Response]:
        """Fetch URL with exponential backoff retry."""
        # SSRF protection: validate URL before making any request
        try:
            self._validate_url(url)
        except ValueError as e:
            logger.warning("SSRF protection blocked URL %s: %s", url, e)
            return None

        for attempt in range(self.max_retries):
            try:
                async with httpx.AsyncClient(
                    timeout=self.timeout,
                    follow_redirects=True,
                    headers={"User-Agent": "Proxiam-ENR-Bot/1.0 (+https://proxiam.fr)"},
                ) as client:
                    resp = await client.get(url)
                    resp.raise_for_status()
                    return resp
            except httpx.HTTPStatusError as e:
                if e.response.status_code == 429:
                    # Rate limited — wait longer
                    import asyncio
                    wait = (attempt + 1) * 5
                    logger.warning("Rate limited on %s, waiting %ds", url, wait)
                    await asyncio.sleep(wait)
                    continue
                logger.error("HTTP %d for %s (attempt %d)", e.response.status_code, url, attempt + 1)
                if attempt == self.max_retries - 1:
                    return None
            except Exception as e:
                logger.error("Fetch error for %s: %s (attempt %d)", url, e, attempt + 1)
                if attempt == self.max_retries - 1:
                    return None
                import asyncio
                await asyncio.sleep((attempt + 1) * 2)
        return None

    @staticmethod
    def compute_hash(content: str) -> str:
        """SHA256 hash of content for change detection."""
        return hashlib.sha256(content.encode("utf-8")).hexdigest()
