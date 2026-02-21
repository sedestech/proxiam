"""Tests for Sprint 15 financial estimation service.

Tests the financial model that estimates CAPEX, OPEX, revenues,
LCOE, and TRI for French ENR projects based on market benchmarks.
Values updated for 2026-S1 financial constants (versioned JSON).
"""
import pytest
from app.services.financial import (
    estimate_financial,
    _calc_capex,
    _calc_opex,
    _calc_revenus,
    _calc_lcoe,
    _calc_tri,
    CAPEX_BENCHMARKS,
    LIFETIME,
    DISCOUNT_RATE,
)


# ─── CAPEX tests ──────────────────────────────────────────────


class TestCapex:
    """Test CAPEX calculation."""

    def test_solaire_capex_basic(self):
        result = _calc_capex("solaire_sol", 10.0, None)
        assert result["installation_eur"]["median"] == 700 * 10_000
        assert result["raccordement_eur"] > 0
        assert result["total_eur"] > result["installation_eur"]["median"]

    def test_eolien_capex(self):
        result = _calc_capex("eolien_onshore", 20.0, None)
        assert result["installation_eur"]["median"] == 1250 * 20_000

    def test_bess_capex_4h(self):
        """BESS CAPEX uses kWh (4h storage)."""
        result = _calc_capex("bess", 5.0, None)
        # 5 MW * 1000 kW/MW * 4h = 20,000 kWh
        expected = 300 * 20_000
        assert result["installation_eur"]["median"] == expected

    def test_raccordement_distance_surcharge(self):
        """Distance > 5km increases raccordement cost."""
        close = _calc_capex("solaire_sol", 10.0, 3.0)
        far = _calc_capex("solaire_sol", 10.0, 15.0)
        assert far["raccordement_eur"] > close["raccordement_eur"]

    def test_capex_has_tendance(self):
        result = _calc_capex("solaire_sol", 1.0, None)
        assert "tendance" in result
        assert "source" in result

    def test_unknown_filiere_defaults(self):
        result = _calc_capex("hydro", 5.0, None)
        # Falls back to solaire_sol
        assert result["installation_eur"]["median"] == 700 * 5_000


# ─── OPEX tests ────────────────────────────────────────────────


class TestOpex:
    """Test OPEX calculation."""

    def test_solaire_opex(self):
        result = _calc_opex("solaire_sol", 1_000_000)
        assert result["annuel_eur"] == 15_000  # 1.5% of 1M
        assert result["pct_capex"] == 1.5

    def test_eolien_opex_higher(self):
        result = _calc_opex("eolien_onshore", 1_000_000)
        assert result["annuel_eur"] == 30_000  # 3% of 1M

    def test_opex_lifetime_total(self):
        result = _calc_opex("solaire_sol", 1_000_000)
        assert result["lifetime_total_eur"] == 15_000 * 30  # 30 years


# ─── Revenue tests ─────────────────────────────────────────────


class TestRevenus:
    """Test revenue estimation."""

    def test_solaire_revenus_benchmark(self):
        """Without productible, uses benchmark facteur de charge."""
        result = _calc_revenus("solaire_sol", 10.0, None)
        assert result["annuel_eur"] > 0
        assert result["production_mwh_an"] > 0
        assert result["prix_moyen_mwh"] == 52  # CRE AO tariff 2026-S1

    def test_solaire_revenus_with_productible(self):
        """With productible from PVGIS, uses actual value."""
        result = _calc_revenus("solaire_sol", 10.0, 1300.0)
        # 1300 kWh/kWc * 10,000 kWc = 13,000,000 kWh = 13,000 MWh
        assert result["production_mwh_an"] == 13_000
        assert result["annuel_eur"] == 13_000 * 52  # CRE AO 2026-S1

    def test_eolien_revenus(self):
        result = _calc_revenus("eolien_onshore", 20.0, None)
        assert result["prix_moyen_mwh"] == 62  # Eolien CRE AO 2026-S1

    def test_bess_revenus_multi_flux(self):
        """BESS has multi-flux revenue model."""
        result = _calc_revenus("bess", 10.0, None)
        assert result["annuel_eur"] > 0
        assert result["detail"]["fcr"] > 0
        assert result["detail"]["arbitrage"] > 0
        assert result["detail"]["capacite"] > 0
        assert result["mecanisme"] == "multi-flux (FCR + arbitrage + capacite)"

    def test_revenus_detail_has_multiple_scenarios(self):
        result = _calc_revenus("solaire_sol", 10.0, None)
        assert "cre_ao" in result["detail"]
        assert "ppa" in result["detail"]
        assert "marche" in result["detail"]
        assert result["detail"]["cre_ao"] >= result["detail"]["ppa"]


# ─── LCOE tests ────────────────────────────────────────────────


class TestLCOE:
    """Test LCOE calculation."""

    def test_lcoe_positive(self):
        lcoe = _calc_lcoe(10_000_000, 150_000, 10_000, 25, 0.06)
        assert lcoe > 0

    def test_lcoe_zero_production(self):
        lcoe = _calc_lcoe(10_000_000, 150_000, 0, 25, 0.06)
        assert lcoe == 0.0

    def test_lcoe_reasonable_range(self):
        """Solar LCOE should be between 30-80 EUR/MWh."""
        # 10 MWc solar, CAPEX ~8.5M, OPEX ~127k/yr, production ~12,264 MWh/yr
        lcoe = _calc_lcoe(8_500_000, 127_500, 12_264, 30, 0.06)
        assert 30 < lcoe < 80

    def test_higher_capex_higher_lcoe(self):
        lcoe_low = _calc_lcoe(5_000_000, 100_000, 10_000, 25, 0.06)
        lcoe_high = _calc_lcoe(10_000_000, 100_000, 10_000, 25, 0.06)
        assert lcoe_high > lcoe_low


# ─── TRI tests ─────────────────────────────────────────────────


class TestTRI:
    """Test TRI (IRR) calculation."""

    def test_positive_cashflow(self):
        result = _calc_tri(10_000_000, 1_200_000, 200_000, 25)
        assert result["tri_pct"] > 0
        assert result["payback_years"] is not None
        assert result["cashflow_annuel_eur"] == 1_000_000

    def test_negative_cashflow(self):
        result = _calc_tri(10_000_000, 100_000, 200_000, 25)
        assert result["tri_pct"] == 0.0
        assert result["rentable"] is False

    def test_high_irr_is_rentable(self):
        result = _calc_tri(5_000_000, 1_500_000, 200_000, 25)
        assert result["rentable"] is True
        assert result["tri_pct"] > 6.0  # > WACC

    def test_payback_calculation(self):
        result = _calc_tri(10_000_000, 1_200_000, 200_000, 25)
        expected_payback = 10_000_000 / 1_000_000
        assert result["payback_years"] == expected_payback


# ─── Full estimation tests ─────────────────────────────────────


class TestEstimateFinancial:
    """Test complete financial estimation."""

    def test_solaire_10mwc(self):
        result = estimate_financial("solaire_sol", 10.0)
        assert "capex" in result
        assert "opex" in result
        assert "revenus" in result
        assert "lcoe_eur_mwh" in result
        assert "tri" in result
        assert "lifetime_years" in result
        assert "assumptions" in result
        assert "disclaimer" in result
        assert result["lifetime_years"] == 30

    def test_eolien_20mwc(self):
        result = estimate_financial("eolien_onshore", 20.0)
        assert result["lifetime_years"] == 25
        assert result["lcoe_eur_mwh"] > 0

    def test_bess_no_lcoe(self):
        """BESS: LCOE is set to 0 (not meaningful)."""
        result = estimate_financial("bess", 10.0)
        assert result["lcoe_eur_mwh"] == 0.0
        assert result["lifetime_years"] == 15

    def test_with_enrichment_data(self):
        enrichment = {
            "pvgis": {"productible_kwh_kwc_an": 1350},
            "nearest_postes": [{"distance_km": 3.5}],
        }
        result = estimate_financial("solaire_sol", 10.0, enrichment_data=enrichment)
        assert result["assumptions"]["productible_source"] == "pvgis"
        assert result["assumptions"]["distance_poste_km"] == 3.5

    def test_without_enrichment(self):
        result = estimate_financial("solaire_sol", 10.0)
        assert result["assumptions"]["productible_source"] == "benchmark"
        assert result["assumptions"]["distance_poste_km"] is None

    def test_discount_rate_in_assumptions(self):
        result = estimate_financial("solaire_sol", 10.0)
        assert result["assumptions"]["discount_rate_pct"] == DISCOUNT_RATE * 100

    def test_disclaimer_present(self):
        result = estimate_financial("solaire_sol", 10.0)
        assert "indicative" in result["disclaimer"]

    def test_capex_opex_revenue_consistency(self):
        """Revenue should exceed OPEX for a viable project."""
        result = estimate_financial("solaire_sol", 10.0)
        assert result["revenus"]["annuel_eur"] > result["opex"]["annuel_eur"]
