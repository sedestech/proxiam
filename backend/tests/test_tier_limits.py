"""Tests for tier_limits service — Sprint 17."""
import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from fastapi import HTTPException
from app.services.tier_limits import (
    get_tier_limits,
    check_quota,
    check_quota_or_raise,
    check_feature_access,
    TIER_LIMITS,
)


class TestGetTierLimits:
    def test_free_tier(self):
        limits = get_tier_limits("free")
        assert limits["max_projects"] == 3
        assert limits["pdf_export"] is False
        assert limits["batch"] is False

    def test_pro_tier(self):
        limits = get_tier_limits("pro")
        assert limits["max_projects"] == 50
        assert limits["pdf_export"] is True
        assert limits["batch"] is True

    def test_admin_tier(self):
        limits = get_tier_limits("admin")
        assert limits["max_projects"] == -1  # unlimited
        assert limits["pdf_export"] is True

    def test_unknown_tier_returns_free(self):
        limits = get_tier_limits("unknown")
        assert limits == TIER_LIMITS["free"]


class TestCheckQuota:
    @pytest.mark.asyncio
    async def test_admin_always_allowed(self):
        user = MagicMock()
        user.tier = "admin"
        db = AsyncMock()
        assert await check_quota(db, user, "enrich") is True

    @pytest.mark.asyncio
    async def test_free_under_limit(self):
        user = MagicMock()
        user.id = "test-id"
        user.tier = "free"
        db = AsyncMock()

        with patch("app.services.tier_limits.count_today_usage", return_value=2):
            assert await check_quota(db, user, "enrich") is True  # limit is 5

    @pytest.mark.asyncio
    async def test_free_over_limit(self):
        user = MagicMock()
        user.id = "test-id"
        user.tier = "free"
        db = AsyncMock()

        with patch("app.services.tier_limits.count_today_usage", return_value=5):
            assert await check_quota(db, user, "enrich") is False  # limit is 5

    @pytest.mark.asyncio
    async def test_unknown_action_allowed(self):
        user = MagicMock()
        user.tier = "free"
        db = AsyncMock()
        assert await check_quota(db, user, "unknown_action") is True


class TestCheckQuotaOrRaise:
    @pytest.mark.asyncio
    async def test_over_limit_raises_429(self):
        user = MagicMock()
        user.id = "test-id"
        user.tier = "free"
        db = AsyncMock()

        with patch("app.services.tier_limits.check_quota", return_value=False):
            with pytest.raises(HTTPException) as exc_info:
                await check_quota_or_raise(db, user, "enrich")
            assert exc_info.value.status_code == 429


class TestCheckFeatureAccess:
    @pytest.mark.asyncio
    async def test_free_no_pdf(self):
        user = MagicMock()
        user.tier = "free"
        with pytest.raises(HTTPException) as exc_info:
            await check_feature_access(user, "pdf_export")
        assert exc_info.value.status_code == 403

    @pytest.mark.asyncio
    async def test_pro_has_pdf(self):
        user = MagicMock()
        user.tier = "pro"
        # Should not raise
        await check_feature_access(user, "pdf_export")

    @pytest.mark.asyncio
    async def test_free_no_batch(self):
        user = MagicMock()
        user.tier = "free"
        with pytest.raises(HTTPException) as exc_info:
            await check_feature_access(user, "batch")
        assert exc_info.value.status_code == 403
