"""Tests for versioned financial constants JSON config.

Validates that the financial_constants.json file exists, is valid JSON,
contains all required metadata and filiere data, and values are in
reasonable ranges for French ENR market benchmarks.
"""
import json
from pathlib import Path

import pytest

CONSTANTS_PATH = Path(__file__).resolve().parent.parent / "data" / "config" / "financial_constants.json"

FILIERES = ["solaire_sol", "eolien_onshore", "bess"]


@pytest.fixture(scope="module")
def constants():
    """Load financial constants from JSON file."""
    with open(CONSTANTS_PATH, encoding="utf-8") as f:
        return json.load(f)


# ─── File and format tests ────────────────────────────────────


class TestFileValidity:
    """Test that the JSON file exists and is well-formed."""

    def test_json_file_exists(self):
        assert CONSTANTS_PATH.exists(), f"Financial constants file not found at {CONSTANTS_PATH}"

    def test_valid_json(self):
        with open(CONSTANTS_PATH, encoding="utf-8") as f:
            data = json.load(f)
        assert isinstance(data, dict)


# ─── Metadata tests ──────────────────────────────────────────


class TestMetadata:
    """Test version, date, and sources metadata."""

    def test_has_version(self, constants):
        assert "version" in constants
        assert isinstance(constants["version"], str)
        assert len(constants["version"]) > 0

    def test_has_date(self, constants):
        assert "date" in constants
        assert constants["date"].startswith("2026")

    def test_has_sources(self, constants):
        assert "sources" in constants
        assert isinstance(constants["sources"], list)
        assert len(constants["sources"]) >= 1


# ─── Structure tests — all 3 filieres present ────────────────


class TestFilierePresence:
    """Test that all 3 filieres exist in each section."""

    def test_capex_has_all_filieres(self, constants):
        for filiere in FILIERES:
            assert filiere in constants["capex"], f"Missing {filiere} in capex"

    def test_opex_has_all_filieres(self, constants):
        for filiere in FILIERES:
            assert filiere in constants["opex_pct"], f"Missing {filiere} in opex_pct"

    def test_lifetime_has_all_filieres(self, constants):
        for filiere in FILIERES:
            assert filiere in constants["lifetime"], f"Missing {filiere} in lifetime"

    def test_facteur_charge_has_all_filieres(self, constants):
        for filiere in FILIERES:
            assert filiere in constants["facteur_charge"], f"Missing {filiere} in facteur_charge"

    def test_prix_vente_has_all_filieres(self, constants):
        for filiere in FILIERES:
            assert filiere in constants["prix_vente"], f"Missing {filiere} in prix_vente"

    def test_raccordement_has_all_filieres(self, constants):
        for filiere in FILIERES:
            assert filiere in constants["raccordement"], f"Missing {filiere} in raccordement"


# ─── Value range tests ───────────────────────────────────────


class TestValueRanges:
    """Test that financial values are within reasonable ranges."""

    def test_capex_solaire_range(self, constants):
        capex = constants["capex"]["solaire_sol"]
        assert 400 <= capex["min"] <= 1000
        assert 500 <= capex["median"] <= 1200
        assert capex["min"] <= capex["median"] <= capex["max"]

    def test_capex_eolien_range(self, constants):
        capex = constants["capex"]["eolien_onshore"]
        assert 800 <= capex["min"] <= 2000
        assert 1000 <= capex["median"] <= 2500
        assert capex["min"] <= capex["median"] <= capex["max"]

    def test_capex_bess_range(self, constants):
        capex = constants["capex"]["bess"]
        assert 100 <= capex["min"] <= 600
        assert 150 <= capex["median"] <= 800
        assert capex["min"] <= capex["median"] <= capex["max"]

    def test_discount_rate_range(self, constants):
        assert 0.03 <= constants["discount_rate"] <= 0.12

    def test_lifetime_positive(self, constants):
        for filiere in FILIERES:
            assert constants["lifetime"][filiere] > 0

    def test_opex_pct_range(self, constants):
        for filiere in FILIERES:
            assert 0.5 <= constants["opex_pct"][filiere] <= 5.0

    def test_facteur_charge_range(self, constants):
        for filiere in FILIERES:
            assert 0.05 <= constants["facteur_charge"][filiere] <= 0.50
