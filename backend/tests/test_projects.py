"""Integration tests for project endpoints (Sprint 4).

Tests the projects API against the live backend:
  - GET /api/projets                (list with filters)
  - GET /api/projets/{id}           (detail)
  - GET /api/projets/{id}/phases    (bloc-level progression)
  - GET /api/projets/stats/summary  (portfolio stats)

Requires backend running on localhost:8000 with seeded projects.

Run with:
    cd backend && pytest tests/test_projects.py -v
"""

import httpx
import pytest

BASE = "http://localhost:8000/api"


@pytest.fixture(scope="module")
def client():
    with httpx.Client(base_url=BASE, timeout=30) as c:
        yield c


@pytest.fixture(scope="module")
def projets(client):
    r = client.get("/projets")
    assert r.status_code == 200
    return r.json()


@pytest.fixture(scope="module")
def first_projet(projets):
    return projets[0]


# ─── List projets ───


def test_list_returns_array(client, projets):
    assert isinstance(projets, list)
    assert len(projets) >= 8


def test_list_has_required_fields(projets):
    p = projets[0]
    for field in ["id", "nom", "filiere", "commune", "statut", "score_global", "lon", "lat"]:
        assert field in p, f"Missing field: {field}"


def test_list_filter_by_filiere(client):
    r = client.get("/projets", params={"filiere": "solaire_sol"})
    assert r.status_code == 200
    data = r.json()
    assert len(data) >= 1
    for p in data:
        assert p["filiere"] == "solaire_sol"


def test_list_filter_by_statut(client):
    r = client.get("/projets", params={"statut": "prospection"})
    assert r.status_code == 200
    data = r.json()
    for p in data:
        assert p["statut"] == "prospection"


# ─── Detail ───


def test_detail_returns_project(client, first_projet):
    r = client.get(f"/projets/{first_projet['id']}")
    assert r.status_code == 200
    data = r.json()
    assert data["id"] == first_projet["id"]
    assert data["nom"] == first_projet["nom"]


def test_detail_404_unknown(client):
    r = client.get("/projets/00000000-0000-0000-0000-000000000000")
    assert r.status_code == 404


# ─── Phases ───


def test_phases_returns_8_blocs(client, first_projet):
    r = client.get(f"/projets/{first_projet['id']}/phases")
    assert r.status_code == 200
    data = r.json()
    assert len(data) == 8
    codes = [p["code"] for p in data]
    assert codes == ["B1", "B2", "B3", "B4", "B5", "B6", "B7", "B8"]


def test_phases_have_completion(client, first_projet):
    r = client.get(f"/projets/{first_projet['id']}/phases")
    data = r.json()
    for phase in data:
        assert "statut" in phase
        assert "completion_pct" in phase
        assert phase["statut"] in ("termine", "en_cours", "a_faire")
        assert 0 <= phase["completion_pct"] <= 100


def test_phases_404_unknown(client):
    r = client.get("/projets/00000000-0000-0000-0000-000000000000/phases")
    assert r.status_code == 404


# ─── Stats ───


def test_stats_summary(client):
    r = client.get("/projets/stats/summary")
    assert r.status_code == 200
    data = r.json()
    assert data["total"] >= 8
    assert "by_statut" in data
    assert data["total_mwc"] > 0
    assert data["nb_filieres"] >= 2
