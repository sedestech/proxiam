"""Tests for auth module — Sprint 17."""
import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from fastapi import HTTPException
from app.auth import _extract_token, _decode_token, get_current_user, require_user, require_admin


class TestExtractToken:
    def test_valid_bearer(self):
        request = MagicMock()
        request.headers = {"Authorization": "Bearer abc123"}
        assert _extract_token(request) == "abc123"

    def test_no_auth_header(self):
        request = MagicMock()
        request.headers = {}
        assert _extract_token(request) is None

    def test_empty_bearer(self):
        request = MagicMock()
        request.headers = {"Authorization": "Bearer "}
        assert _extract_token(request) == ""

    def test_non_bearer(self):
        request = MagicMock()
        request.headers = {"Authorization": "Basic abc123"}
        assert _extract_token(request) is None


class TestDecodeToken:
    @pytest.mark.asyncio
    async def test_no_keys_returns_none(self):
        with patch("app.auth._get_jwks", return_value=[]):
            result = await _decode_token("fake.token.here")
            assert result is None

    @pytest.mark.asyncio
    async def test_invalid_jwt_returns_none(self):
        with patch("app.auth._get_jwks", return_value=[{"kid": "test", "kty": "RSA"}]):
            result = await _decode_token("invalid.jwt.token")
            assert result is None


class TestRequireUser:
    @pytest.mark.asyncio
    async def test_no_token_raises_401(self):
        request = MagicMock()
        request.headers = {}
        db = AsyncMock()

        with pytest.raises(HTTPException) as exc_info:
            await require_user(request, db)
        assert exc_info.value.status_code == 401

    @pytest.mark.asyncio
    async def test_inactive_user_raises_403(self):
        mock_user = MagicMock()
        mock_user.active = False

        with patch("app.auth.get_current_user", return_value=mock_user):
            request = MagicMock()
            request.headers = {"Authorization": "Bearer valid"}
            db = AsyncMock()

            with pytest.raises(HTTPException) as exc_info:
                await require_user(request, db)
            assert exc_info.value.status_code == 403


class TestRequireAdmin:
    @pytest.mark.asyncio
    async def test_non_admin_raises_403(self):
        mock_user = MagicMock()
        mock_user.active = True
        mock_user.tier = "free"

        with patch("app.auth.require_user", return_value=mock_user):
            request = MagicMock()
            db = AsyncMock()

            with pytest.raises(HTTPException) as exc_info:
                await require_admin(request, db)
            assert exc_info.value.status_code == 403

    @pytest.mark.asyncio
    async def test_admin_passes(self):
        mock_user = MagicMock()
        mock_user.active = True
        mock_user.tier = "admin"

        with patch("app.auth.require_user", return_value=mock_user):
            request = MagicMock()
            db = AsyncMock()

            result = await require_admin(request, db)
            assert result.tier == "admin"
