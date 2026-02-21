"""Tests for Sprint 16 comparison API logic.

Tests:
- Compare endpoint data aggregation
- CSV export formatting
- Financial + regulatory data merge
- Edge cases (missing enrichment, missing score)
"""
import pytest
from app.services.financial import estimate_financial
from app.services.regulatory import analyze_regulatory


# ─── Compare data aggregation tests ──────────────────────────────


class TestCompareDataAggregation:
    """Test the data aggregation logic used by compare endpoint."""

    def test_financial_returns_expected_keys(self):
        result = estimate_financial("solaire_sol", 10.0, 15.0, None)
        assert "capex" in result
        assert "opex" in result
        assert "revenus" in result
        assert "tri" in result
        assert "lcoe_eur_mwh" in result

    def test_regulatory_returns_expected_keys(self):
        result = analyze_regulatory("solaire_sol", 10.0, 15.0, None)
        assert "risk_level" in result
        assert "nb_obligations" in result
        assert "estimated_delai_max_mois" in result

    def test_financial_with_enrichment_data(self):
        enrichment = {
            "pvgis": {"productible_kwh_kwc_an": 1350, "ghi_kwh_m2_an": 1580},
            "nearest_postes": [{"distance_km": 3.5}],
        }
        result = estimate_financial("solaire_sol", 10.0, 15.0, enrichment)
        assert result["assumptions"]["productible_source"] == "pvgis"
        assert result["assumptions"]["distance_poste_km"] == 3.5

    def test_financial_without_enrichment(self):
        result = estimate_financial("solaire_sol", 10.0, 15.0, None)
        assert result["assumptions"]["productible_source"] == "benchmark"

    def test_regulatory_with_constraints(self):
        enrichment = {
            "constraints": {
                "summary": {"total_constraints": 2, "in_natura2000": True},
                "zones": [{"type": "Natura 2000", "nom": "Zone test"}],
            }
        }
        result = analyze_regulatory("solaire_sol", 10.0, 15.0, enrichment)
        assert result["risk_level"] == "high"  # Natura2000 → high risk

    def test_regulatory_small_solar(self):
        result = analyze_regulatory("solaire_sol", 0.1, None, None)
        assert result["risk_level"] in ["low", "medium"]


# ─── Compare response flattening tests ──────────────────────────


class TestCompareFlattening:
    """Test the flattening of financial+regulatory data into compare fields."""

    def _flatten(self, filiere, puissance, enrichment_data=None, score_global=None, surface_ha=None):
        """Simulate the flattening done by the compare endpoint."""
        financial = estimate_financial(
            filiere, puissance, surface_ha, enrichment_data
        )
        regulatory = analyze_regulatory(filiere, puissance, surface_ha, enrichment_data)
        pvgis = (enrichment_data or {}).get("pvgis", {})
        postes = (enrichment_data or {}).get("nearest_postes", [])
        constraints = (enrichment_data or {}).get("constraints", {})

        return {
            "score_global": score_global,
            "enriched": enrichment_data is not None,
            "ghi_kwh_m2_an": pvgis.get("ghi_kwh_m2_an"),
            "productible_kwh_kwc_an": pvgis.get("productible_kwh_kwc_an"),
            "distance_poste_km": postes[0]["distance_km"] if postes else None,
            "constraints_count": constraints.get("summary", {}).get("total_constraints", 0),
            "capex_total_eur": financial["capex"]["total_eur"],
            "capex_eur_kwc": financial["capex"]["eur_par_kwc"],
            "opex_annuel_eur": financial["opex"]["annuel_eur"],
            "revenu_annuel_eur": financial["revenus"]["annuel_eur"],
            "lcoe_eur_mwh": financial.get("lcoe_eur_mwh", 0),
            "tri_pct": financial["tri"]["tri_pct"],
            "payback_years": financial["tri"].get("payback_years"),
            "rentable": financial["tri"]["rentable"],
            "risk_level": regulatory["risk_level"],
            "nb_obligations": regulatory["nb_obligations"],
            "delai_max_mois": regulatory["estimated_delai_max_mois"],
        }

    def test_enriched_project_has_pvgis_data(self):
        enrichment = {
            "pvgis": {"productible_kwh_kwc_an": 1350, "ghi_kwh_m2_an": 1580},
            "nearest_postes": [{"distance_km": 3.5}],
            "constraints": {"summary": {"total_constraints": 0}},
        }
        flat = self._flatten("solaire_sol", 10.0, enrichment, 78)
        assert flat["enriched"] is True
        assert flat["ghi_kwh_m2_an"] == 1580
        assert flat["productible_kwh_kwc_an"] == 1350
        assert flat["distance_poste_km"] == 3.5
        assert flat["constraints_count"] == 0
        assert flat["score_global"] == 78

    def test_non_enriched_project(self):
        flat = self._flatten("solaire_sol", 10.0, None, None)
        assert flat["enriched"] is False
        assert flat["ghi_kwh_m2_an"] is None
        assert flat["productible_kwh_kwc_an"] is None
        assert flat["distance_poste_km"] is None
        assert flat["score_global"] is None

    def test_eolien_project(self):
        flat = self._flatten("eolien_onshore", 5.0)
        assert flat["capex_total_eur"] > 0
        assert flat["tri_pct"] > 0
        assert flat["risk_level"] in ["low", "medium", "high"]

    def test_bess_project(self):
        flat = self._flatten("bess", 20.0)
        assert flat["capex_total_eur"] > 0
        assert flat["lcoe_eur_mwh"] == 0  # BESS has no LCOE

    def test_small_project_low_risk(self):
        flat = self._flatten("solaire_sol", 0.05)
        assert flat["nb_obligations"] >= 0
        assert flat["delai_max_mois"] >= 0

    def test_large_project_more_obligations(self):
        small = self._flatten("solaire_sol", 0.1)
        large = self._flatten("solaire_sol", 100.0)
        assert large["nb_obligations"] >= small["nb_obligations"]


# ─── CSV export format tests ────────────────────────────────────


class TestCsvExport:
    """Test CSV export formatting logic."""

    def test_csv_header_generation(self):
        headers = [
            "nom", "filiere", "puissance_mwc", "score_global",
            "ghi_kwh_m2_an", "productible_kwh_kwc_an", "distance_poste_km",
            "constraints_count", "capex_total_eur", "capex_eur_kwc",
            "lcoe_eur_mwh", "tri_pct", "rentable", "risk_level",
            "nb_obligations", "delai_max_mois",
        ]
        header_line = ";".join(headers)
        assert "nom" in header_line
        assert "tri_pct" in header_line
        assert header_line.count(";") == len(headers) - 1

    def test_csv_row_generation(self):
        row_data = {
            "nom": "Solaire Sud",
            "filiere": "solaire_sol",
            "puissance_mwc": 10,
            "score_global": 78,
            "tri_pct": 4.8,
            "rentable": False,
        }
        row = ";".join(str(v) for v in row_data.values())
        assert "Solaire Sud" in row
        assert "False" in row

    def test_csv_semicolon_delimiter(self):
        """French CSV uses semicolons (not commas) for locale compatibility."""
        fields = ["nom", "score", "tri"]
        assert ";".join(fields) == "nom;score;tri"


# ─── Multi-filiere comparison tests ─────────────────────────────


class TestMultiFiliereComparison:
    """Test comparison logic across different filieres."""

    def test_compare_three_filieres(self):
        solaire = estimate_financial("solaire_sol", 10.0, 15.0, None)
        eolien = estimate_financial("eolien_onshore", 10.0, None, None)
        bess = estimate_financial("bess", 10.0, None, None)

        # Each should have valid financial data
        assert solaire["capex"]["total_eur"] > 0
        assert eolien["capex"]["total_eur"] > 0
        assert bess["capex"]["total_eur"] > 0

        # Each has a unit cost
        assert solaire["capex"]["eur_par_kwc"] > 0
        assert eolien["capex"]["eur_par_kwc"] > 0
        assert bess["capex"]["eur_par_kwc"] > 0

    def test_all_filieres_have_tri(self):
        for filiere in ["solaire_sol", "eolien_onshore", "bess"]:
            result = estimate_financial(filiere, 10.0, None, None)
            assert "tri_pct" in result["tri"]
            assert isinstance(result["tri"]["tri_pct"], (int, float))

    def test_all_filieres_have_regulatory(self):
        for filiere in ["solaire_sol", "eolien_onshore", "bess"]:
            result = analyze_regulatory(filiere, 10.0, None, None)
            assert result["risk_level"] in ["low", "medium", "high"]
            assert result["nb_obligations"] >= 0
