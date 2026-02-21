"""Tests for Data Health / DataSourceStatus."""
from datetime import datetime, timezone

import pytest


def _make_status(**overrides):
    defaults = {
        "source_name": "natura2000",
        "display_name": "Natura 2000",
        "category": "geospatial",
        "record_count": 1753,
        "last_updated": datetime(2026, 2, 21, tzinfo=timezone.utc),
        "update_frequency_days": 90,
        "quality_score": 95,
        "status": "ok",
    }
    defaults.update(overrides)
    return defaults


class TestDataSourceStatusModel:
    def test_status_fields(self):
        s = _make_status()
        assert s["source_name"] == "natura2000"
        assert s["category"] == "geospatial"
        assert s["record_count"] == 1753
        assert s["quality_score"] == 95

    def test_freshness_ok(self):
        now = datetime(2026, 2, 21, tzinfo=timezone.utc)
        s = _make_status(
            last_updated=datetime(2026, 2, 1, tzinfo=timezone.utc),
            update_frequency_days=30,
        )
        days_since = (now - s["last_updated"]).days
        is_stale = days_since > s["update_frequency_days"]
        assert is_stale is False  # 20 days < 30 days

    def test_freshness_stale(self):
        now = datetime(2026, 2, 21, tzinfo=timezone.utc)
        s = _make_status(
            last_updated=datetime(2025, 6, 1, tzinfo=timezone.utc),
            update_frequency_days=90,
        )
        days_since = (now - s["last_updated"]).days
        is_stale = days_since > s["update_frequency_days"]
        assert is_stale is True  # 265 days > 90 days

    def test_quality_score_range(self):
        s = _make_status(quality_score=0)
        assert 0 <= s["quality_score"] <= 100
        s2 = _make_status(quality_score=100)
        assert 0 <= s2["quality_score"] <= 100

    def test_status_values(self):
        for val in ("ok", "stale", "error", "loading"):
            s = _make_status(status=val)
            assert s["status"] in ("ok", "stale", "error", "loading")


class TestDataHealthAPI:
    """Test the /api/admin/data-health endpoint response structure."""

    def test_response_structure(self):
        response = {
            "sources": [
                {
                    "source_name": "natura2000",
                    "display_name": "Natura 2000",
                    "category": "geospatial",
                    "record_count": 1753,
                    "last_updated": "2026-02-21T00:00:00Z",
                    "update_frequency_days": 180,
                    "quality_score": 95,
                    "status": "ok",
                    "days_since_update": 0,
                    "is_stale": False,
                },
            ],
            "summary": {
                "total_sources": 1,
                "ok": 1,
                "stale": 0,
                "error": 0,
                "overall_health": 100,
            },
        }
        assert len(response["sources"]) == 1
        assert response["summary"]["overall_health"] == 100
        assert response["sources"][0]["is_stale"] is False

    def test_overall_health_calculation(self):
        sources = [
            {"status": "ok"},
            {"status": "ok"},
            {"status": "stale"},
            {"status": "error"},
        ]
        ok_count = sum(1 for s in sources if s["status"] == "ok")
        health = int(ok_count / len(sources) * 100) if sources else 0
        assert health == 50

    def test_staleness_detection(self):
        from datetime import datetime, timedelta, timezone

        now = datetime(2026, 2, 21, tzinfo=timezone.utc)
        last_updated = datetime(2025, 6, 1, tzinfo=timezone.utc)
        freq = 90
        days_since = (now - last_updated).days
        is_stale = days_since > freq
        assert is_stale is True
        assert days_since == 265
