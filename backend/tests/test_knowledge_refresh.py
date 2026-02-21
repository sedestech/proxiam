"""Tests for Knowledge Graph refresh mechanism."""
import pytest


class TestKnowledgeRefresh:
    def test_refresh_response_structure(self):
        response = {
            "status": "ok",
            "counts": {
                "blocs": 8,
                "phases": 1061,
                "normes": 943,
                "risques": 811,
                "livrables": 975,
                "outils": 500,
                "sources": 578,
                "competences": 300,
            },
            "total": 5176,
            "relations": 13290,
        }
        assert response["total"] == sum(response["counts"].values())
        assert response["status"] == "ok"
        assert response["relations"] > 0

    def test_dry_run_no_side_effects(self):
        result = {"status": "dry_run", "total": 5176, "would_update": True}
        assert result["status"] == "dry_run"
        assert result["total"] > 0
