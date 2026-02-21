"""Tests for ODRE reference projects import."""
import json

import pytest

from app.commands.import_odre import parse_record


class TestOdreParser:
    def test_parse_pv_project(self):
        record = {
            "nom_projet": "Centrale PV Les Landes",
            "type_projet": "Photovoltaique",
            "puissance_mw": 12.5,
            "commune": "Mont-de-Marsan",
            "departement": "40",
            "statut_global": "en_service",
        }
        result = parse_record(record)
        assert result is not None
        assert result["nom"] == "Centrale PV Les Landes"
        assert result["filiere"] == "solaire_sol"
        assert result["puissance_mwc"] == 12.5
        metadata = json.loads(result["metadata"])
        assert metadata["is_reference"] is True

    def test_parse_wind_project(self):
        record = {"nom_projet": "Parc eolien du Nord", "type_projet": "Eolien terrestre", "puissance_mw": 24}
        result = parse_record(record)
        assert result["filiere"] == "eolien_onshore"

    def test_parse_missing_name_returns_none(self):
        record = {"type_projet": "Solaire", "puissance_mw": 5}
        assert parse_record(record) is None

    def test_parse_invalid_puissance(self):
        record = {"nom_projet": "Test", "puissance_mw": "N/A"}
        result = parse_record(record)
        assert result["puissance_mwc"] is None

    def test_parse_alternate_keys(self):
        record = {"Nom du projet": "Projet Alt", "Filiere": "Solaire", "Puissance (MW)": "8.0"}
        result = parse_record(record)
        assert result["nom"] == "Projet Alt"
        assert result["filiere"] == "solaire_sol"
        assert result["puissance_mwc"] == 8.0
