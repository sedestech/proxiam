"""Tests for Sprint 14 regulatory analysis service.

Tests the rules engine that determines applicable regulations
for French ENR projects based on filiere, puissance, and constraints.
"""
import pytest
from app.services.regulatory import (
    analyze_regulatory,
    _check_icpe,
    _check_etude_impact,
    _check_permis_construire,
    _check_autorisation_env,
)


# ─── ICPE classification tests ──────────────────────────────────


class TestICPE:
    """Test ICPE regime determination."""

    def test_solaire_below_threshold(self):
        result = _check_icpe("solaire_sol", 0.2)
        assert result is None

    def test_solaire_declaration(self):
        result = _check_icpe("solaire_sol", 0.25)
        assert result is not None
        assert result["regime"] == "declaration"
        assert result["rubrique"] == "2980"

    def test_solaire_enregistrement(self):
        result = _check_icpe("solaire_sol", 50.0)
        assert result["regime"] == "enregistrement"

    def test_eolien_always_autorisation(self):
        result = _check_icpe("eolien_onshore", 0.01)
        assert result is not None
        assert result["regime"] == "autorisation"

    def test_bess_declaration(self):
        result = _check_icpe("bess", 5.0)
        assert result["regime"] == "declaration"

    def test_bess_enregistrement(self):
        result = _check_icpe("bess", 10.0)
        assert result["regime"] == "enregistrement"

    def test_unknown_filiere(self):
        result = _check_icpe("hydro", 10.0)
        assert result is None

    def test_icpe_has_tips(self):
        result = _check_icpe("solaire_sol", 1.0)
        assert len(result["tips"]) > 0


# ─── EIE tests ───────────────────────────────────────────────────


class TestEtudeImpact:
    """Test EIE requirement determination."""

    def test_solaire_above_threshold(self):
        result = _check_etude_impact("solaire_sol", 0.5, 3.0, False)
        assert result is not None
        assert "Impact" in result["label"]

    def test_solaire_below_threshold_no_zone(self):
        result = _check_etude_impact("solaire_sol", 0.1, 1.0, False)
        assert result is None

    def test_solaire_below_threshold_with_zone(self):
        result = _check_etude_impact("solaire_sol", 0.1, 1.0, True)
        assert result is not None
        assert result["zone_sensible"] is True

    def test_eolien_always_required(self):
        result = _check_etude_impact("eolien_onshore", 0.01, 0.5, False)
        assert result is not None

    def test_bess_below_threshold(self):
        result = _check_etude_impact("bess", 5.0, 1.0, False)
        assert result is None

    def test_bess_above_threshold(self):
        result = _check_etude_impact("bess", 15.0, 1.0, False)
        assert result is not None


# ─── Permis de construire tests ──────────────────────────────────


class TestPermisConstruire:
    """Test PC/DP requirement."""

    def test_solaire_above_mwc_threshold(self):
        result = _check_permis_construire("solaire_sol", 1.5, 2.0)
        assert result is not None
        assert "Permis" in result["label"]

    def test_solaire_above_ha_threshold(self):
        result = _check_permis_construire("solaire_sol", 0.5, 3.0)
        assert result is not None

    def test_solaire_below_both_thresholds(self):
        result = _check_permis_construire("solaire_sol", 0.5, 1.0)
        assert result is None

    def test_eolien_always_required(self):
        result = _check_permis_construire("eolien_onshore", 0.01, 0.5)
        assert result is not None


# ─── Autorisation environnementale tests ─────────────────────────


class TestAutorisationEnv:
    """Test AE requirement."""

    def test_eolien_always_required(self):
        result = _check_autorisation_env("eolien_onshore", False)
        assert result is not None
        assert "environnementale" in result["label"]

    def test_solaire_no_zone(self):
        result = _check_autorisation_env("solaire_sol", False)
        assert result is None

    def test_solaire_with_zone(self):
        result = _check_autorisation_env("solaire_sol", True)
        assert result is not None

    def test_bess_no_zone(self):
        result = _check_autorisation_env("bess", False)
        assert result is None


# ─── Full analysis tests ─────────────────────────────────────────


class TestAnalyzeRegulatory:
    """Test complete regulatory analysis."""

    def test_solaire_30mwc(self):
        """Typical large solar project."""
        result = analyze_regulatory("solaire_sol", 30.0, 45.0)
        assert "obligations" in result
        assert "timeline" in result
        assert "expert_tips" in result
        assert result["nb_obligations"] >= 3  # ICPE + EIE + PC + raccordement
        assert result["risk_level"] in ("low", "medium", "high")
        assert result["estimated_delai_max_mois"] > 0

    def test_eolien_always_high_complexity(self):
        """Wind always has many obligations."""
        result = analyze_regulatory("eolien_onshore", 20.0, 10.0)
        assert result["nb_obligations"] >= 4  # ICPE + EIE + PC + AE + raccordement

    def test_bess_small(self):
        """Small BESS: fewer obligations."""
        result = analyze_regulatory("bess", 5.0, 1.0)
        assert result["nb_obligations"] >= 2  # ICPE + raccordement

    def test_with_enrichment_zone_sensible(self):
        """Enrichment data with Natura2000 intersection triggers AE."""
        enrichment = {
            "constraints": {
                "summary": {"total_constraints": 1, "in_zone": 1, "nearby": 0}
            }
        }
        result = analyze_regulatory("solaire_sol", 10.0, 15.0, enrichment)
        assert result["zone_sensible"] is True
        assert result["risk_level"] == "high"
        # Should include autorisation environnementale
        labels = [o["label"] for o in result["obligations"]]
        assert any("environnementale" in l for l in labels)

    def test_without_enrichment(self):
        """Without enrichment, no zone sensible detected."""
        result = analyze_regulatory("solaire_sol", 10.0, 15.0)
        assert result["zone_sensible"] is False

    def test_timeline_exists(self):
        """Timeline should have phases for each filiere."""
        for filiere in ["solaire_sol", "eolien_onshore", "bess"]:
            result = analyze_regulatory(filiere, 10.0, 5.0)
            assert len(result["timeline"]) >= 8

    def test_expert_tips_exist(self):
        """General expert tips should be populated."""
        for filiere in ["solaire_sol", "eolien_onshore", "bess"]:
            result = analyze_regulatory(filiere, 10.0, 5.0)
            assert len(result["expert_tips"]) >= 2

    def test_raccordement_always_present(self):
        """Raccordement is always in obligations."""
        result = analyze_regulatory("solaire_sol", 0.1, 0.5)
        labels = [o["obligation"] for o in result["obligations"]]
        assert "raccordement" in labels
