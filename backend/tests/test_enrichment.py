"""Tests for Sprint 13 enrichment services.

Unit tests for PVGIS service, constraint logic, and scoring improvements.
Uses mocks for external APIs and database calls.
"""
import json
import pytest
from unittest.mock import AsyncMock, MagicMock, patch

from app.services.pvgis import get_pvgis_data, _fallback_by_latitude
from app.services.scoring import (
    _score_irradiation,
    _score_environnement,
    _score_urbanisme,
    _score_accessibilite,
)


# ─── PVGIS fallback tests ─────────────────────────────────────


class TestPvgisFallback:
    """Test latitude-based fallback when PVGIS API is unavailable."""

    def test_fallback_south_france(self):
        result = _fallback_by_latitude(43.0)
        assert result["ghi_kwh_m2_an"] == 1700
        assert result["productible_kwh_kwc_an"] == 1400
        assert result["temperature_moyenne"] == 15.0
        assert result["source"] == "fallback_latitude"

    def test_fallback_center_france(self):
        result = _fallback_by_latitude(46.0)
        assert result["ghi_kwh_m2_an"] == 1350
        assert result["productible_kwh_kwc_an"] == 1150

    def test_fallback_north_france(self):
        result = _fallback_by_latitude(49.0)
        assert result["ghi_kwh_m2_an"] == 1150
        assert result["productible_kwh_kwc_an"] == 1000

    def test_fallback_returns_all_keys(self):
        result = _fallback_by_latitude(45.0)
        expected_keys = {
            "ghi_kwh_m2_an",
            "dni_kwh_m2_an",
            "dhi_kwh_m2_an",
            "productible_kwh_kwc_an",
            "temperature_moyenne",
            "source",
        }
        assert set(result.keys()) == expected_keys


# ─── PVGIS API mock tests ────────────────────────────────────


class TestPvgisService:
    """Test PVGIS API integration with mocked HTTP and Redis."""

    @pytest.mark.anyio
    async def test_pvgis_api_success(self):
        """PVGIS returns valid data — should parse and cache."""
        mock_response = {
            "outputs": {
                "totals": {
                    "fixed": {
                        "E_y": 1350.5,
                        "H(i)_y": 1650.3,
                    }
                },
                "monthly": {
                    "fixed": [
                        {"H(i)_m": m, "T2m": 10 + i}
                        for i, m in enumerate([80, 95, 130, 150, 170, 180, 190, 175, 145, 115, 85, 70])
                    ]
                },
            }
        }

        with (
            patch("app.services.pvgis._get_cached", new_callable=AsyncMock, return_value=None),
            patch("app.services.pvgis._set_cached", new_callable=AsyncMock),
            patch("app.services.pvgis.httpx.AsyncClient") as mock_client_cls,
        ):
            mock_client = AsyncMock()
            mock_resp = MagicMock()
            mock_resp.status_code = 200
            mock_resp.json.return_value = mock_response
            mock_resp.raise_for_status = MagicMock()
            mock_client.get = AsyncMock(return_value=mock_resp)
            mock_client.__aenter__ = AsyncMock(return_value=mock_client)
            mock_client.__aexit__ = AsyncMock(return_value=False)
            mock_client_cls.return_value = mock_client

            result = await get_pvgis_data(43.6, 3.87)

        assert result["source"] == "pvgis_api"
        assert result["productible_kwh_kwc_an"] == 1350.5
        assert result["ghi_kwh_m2_an"] is not None
        assert result["temperature_moyenne"] is not None

    @pytest.mark.anyio
    async def test_pvgis_cache_hit(self):
        """Should return cached data when available."""
        cached = {
            "ghi_kwh_m2_an": 1600,
            "productible_kwh_kwc_an": 1350,
            "temperature_moyenne": 14.5,
            "source": "pvgis_api",
        }

        with patch("app.services.pvgis._get_cached", new_callable=AsyncMock, return_value=cached):
            result = await get_pvgis_data(43.6, 3.87)

        assert result == cached

    @pytest.mark.anyio
    async def test_pvgis_api_failure_uses_fallback(self):
        """When PVGIS API fails, should use latitude fallback."""
        with (
            patch("app.services.pvgis._get_cached", new_callable=AsyncMock, return_value=None),
            patch("app.services.pvgis.httpx.AsyncClient") as mock_client_cls,
        ):
            mock_client = AsyncMock()
            mock_client.get = AsyncMock(side_effect=Exception("API timeout"))
            mock_client.__aenter__ = AsyncMock(return_value=mock_client)
            mock_client.__aexit__ = AsyncMock(return_value=False)
            mock_client_cls.return_value = mock_client

            result = await get_pvgis_data(43.6, 3.87)

        assert result["source"] == "fallback_latitude"
        assert result["ghi_kwh_m2_an"] == 1500  # lat 43.6 → center-south (43-45 band)


# ─── Scoring with enrichment data ─────────────────────────────


class TestScoringWithEnrichment:
    """Test that scoring uses real data when enrichment is available."""

    def test_irradiation_with_pvgis_data_high_ghi(self):
        """High GHI (>1600) should score 95+."""
        enrichment = {"pvgis": {"ghi_kwh_m2_an": 1700}}
        score = _score_irradiation(lat=43.6, filiere="solaire_sol", enrichment_data=enrichment)
        assert score >= 95

    def test_irradiation_with_pvgis_data_medium_ghi(self):
        """Medium GHI (1200-1400) should score 55-75."""
        enrichment = {"pvgis": {"ghi_kwh_m2_an": 1300}}
        score = _score_irradiation(lat=48.0, filiere="solaire_sol", enrichment_data=enrichment)
        assert 55 <= score <= 75

    def test_irradiation_with_pvgis_data_low_ghi(self):
        """Low GHI (<1000) should score < 35."""
        enrichment = {"pvgis": {"ghi_kwh_m2_an": 900}}
        score = _score_irradiation(lat=50.0, filiere="solaire_sol", enrichment_data=enrichment)
        assert score < 35

    def test_irradiation_without_enrichment_uses_latitude(self):
        """Without enrichment data, falls back to latitude proxy."""
        score_south = _score_irradiation(lat=43.0, filiere="solaire_sol")
        score_north = _score_irradiation(lat=49.0, filiere="solaire_sol")
        assert score_south > score_north

    def test_irradiation_bess_ignores_ghi(self):
        """BESS always returns 70 regardless of GHI."""
        enrichment = {"pvgis": {"ghi_kwh_m2_an": 1700}}
        score = _score_irradiation(lat=43.6, filiere="bess", enrichment_data=enrichment)
        assert score == 70

    def test_irradiation_wind_ignores_ghi(self):
        """Wind uses latitude proxy even when GHI available."""
        enrichment = {"pvgis": {"ghi_kwh_m2_an": 1700}}
        score = _score_irradiation(lat=49.0, filiere="eolien_onshore", enrichment_data=enrichment)
        # Should use latitude fallback (49 → high for wind)
        assert score >= 60

    def test_environnement_with_constraints_no_zones(self):
        """No intersecting zones → high score."""
        enrichment = {
            "constraints": {
                "summary": {"total_constraints": 2, "in_zone": 0, "nearby": 2}
            }
        }
        score = _score_environnement(
            departement="34", filiere="solaire_sol", enrichment_data=enrichment
        )
        assert score >= 70  # 90 - 2*5 = 80

    def test_environnement_with_constraints_in_zone(self):
        """Inside protected zone → heavy penalty."""
        enrichment = {
            "constraints": {
                "summary": {"total_constraints": 1, "in_zone": 1, "nearby": 0}
            }
        }
        score = _score_environnement(
            departement="34", filiere="solaire_sol", enrichment_data=enrichment
        )
        assert score <= 65  # 90 - 25 = 65

    def test_environnement_without_enrichment_uses_departement(self):
        """Without enrichment, falls back to departement heuristic."""
        score_mountain = _score_environnement(departement="73", filiere="solaire_sol")
        score_plains = _score_environnement(departement="28", filiere="solaire_sol")
        assert score_plains > score_mountain

    def test_environnement_eolien_penalty(self):
        """Wind projects get extra penalty."""
        enrichment = {
            "constraints": {
                "summary": {"total_constraints": 0, "in_zone": 0, "nearby": 0}
            }
        }
        score_solar = _score_environnement("34", "solaire_sol", enrichment)
        score_wind = _score_environnement("34", "eolien_onshore", enrichment)
        assert score_solar > score_wind


# ─── Scoring functions (existing behavior preservation) ───────


class TestScoringPreservation:
    """Ensure existing scoring functions still work correctly."""

    def test_urbanisme_small_site(self):
        score = _score_urbanisme("34", "Montpellier", 3.0)
        assert 60 <= score <= 100

    def test_urbanisme_no_data(self):
        score = _score_urbanisme(None, None, None)
        assert score == 60

    def test_accessibilite_small_site(self):
        score = _score_accessibilite(5.0, 10.0)
        assert score > 65

    def test_accessibilite_large_site(self):
        score = _score_accessibilite(150.0, 5.0)
        assert score < 65

    def test_irradiation_none_lat(self):
        score = _score_irradiation(None, "solaire_sol")
        assert score == 50
