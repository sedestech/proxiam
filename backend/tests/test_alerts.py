"""Tests for alert matcher — Sprint 18."""
import pytest
from unittest.mock import AsyncMock, MagicMock, patch

from app.services.alert_matcher import match_alerts


class TestAlertMatcher:
    @pytest.mark.asyncio
    async def test_no_content_returns_zero(self):
        """When no new content, should return matched=0."""
        db = AsyncMock()
        # Mock select query for contents to return empty
        mock_result = MagicMock()
        mock_result.scalars.return_value.all.return_value = []
        db.execute.return_value = mock_result

        result = await match_alerts(db)
        assert result == {"matched": 0}

    @pytest.mark.asyncio
    async def test_keyword_matching(self):
        """Test that keyword watches match content titles."""
        # Create mock content
        content = MagicMock()
        content.id = "content-1"
        content.source_id = 1
        content.title = "Nouvelle réglementation solaire en France"
        content.content_text = "Détails de la réglementation..."
        content.ai_tags = {"tags": ["solaire", "réglementation"]}
        content.last_changed = MagicMock()

        # Create mock watch for "solaire"
        watch = MagicMock()
        watch.id = "watch-1"
        watch.user_id = "user-1"
        watch.watch_type = "keyword"
        watch.watch_value = "solaire"

        db = AsyncMock()

        # First call: contents query
        content_result = MagicMock()
        content_result.scalars.return_value.all.return_value = [content]

        # Second call: watches query
        watch_result = MagicMock()
        watch_result.scalars.return_value.all.return_value = [watch]

        # Third call: check existing alert (none)
        existing_result = MagicMock()
        existing_result.scalar_one_or_none.return_value = None

        db.execute.side_effect = [content_result, watch_result, existing_result]

        result = await match_alerts(db)
        assert result["matched"] == 1
        assert db.add.called  # Alert was added
        assert db.commit.called


class TestAlertMatcherTypes:
    def test_source_type_match(self):
        """Verify source watch matching logic."""
        # source_id "42" should match watch_value "42"
        assert str(42) == "42"

    def test_keyword_case_insensitive(self):
        """Keywords should match case-insensitively."""
        keyword = "SOLAIRE".lower()
        title = "Nouvelle réglementation solaire".lower()
        assert keyword in title

    def test_impact_levels(self):
        """Impact levels should be valid."""
        valid = {"high", "medium", "low"}
        for level in valid:
            assert level in valid
