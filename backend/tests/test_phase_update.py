"""Integration tests for Phase Update API (Sprint 9).

Tests:
  - PUT /api/projets/{id}/phases/{bloc_code}

Requires backend running with seeded data.

Run with:
    cd backend && pytest tests/test_phase_update.py -v
"""

import httpx
import pytest

BASE = "http://localhost:8000/api"


@pytest.fixture(scope="module")
def client():
    with httpx.Client(base_url=BASE, timeout=30) as c:
        yield c


@pytest.fixture(scope="module")
def first_project(client):
    """Get the first project ID."""
    r = client.get("/projets?limit=1")
    return r.json()[0]["id"]


def test_update_phase_b1(client, first_project):
    """Update B1 completion should return new percentage."""
    r = client.put(f"/projets/{first_project}/phases/B1?completion_pct=85")
    assert r.status_code == 200
    data = r.json()
    assert data["bloc_code"] == "B1"
    assert data["completion_pct"] == 85
    assert data["statut"] == "en_cours"


def test_update_phase_100(client, first_project):
    """100% should set statut to termine."""
    r = client.put(f"/projets/{first_project}/phases/B1?completion_pct=100")
    assert r.status_code == 200
    assert r.json()["statut"] == "termine"


def test_update_phase_0(client, first_project):
    """0% should set statut to a_faire."""
    r = client.put(f"/projets/{first_project}/phases/B8?completion_pct=0")
    assert r.status_code == 200
    assert r.json()["statut"] == "a_faire"


def test_update_phase_reflected(client, first_project):
    """Updated completion should be reflected in GET phases."""
    client.put(f"/projets/{first_project}/phases/B5?completion_pct=60")
    r = client.get(f"/projets/{first_project}/phases")
    blocs = {b["code"]: b for b in r.json()}
    assert blocs["B5"]["completion_pct"] == 60


def test_update_phase_404_project(client):
    """Unknown project should return 404."""
    r = client.put("/projets/00000000-0000-0000-0000-000000000000/phases/B1?completion_pct=50")
    assert r.status_code == 404


def test_update_phase_404_bloc(client, first_project):
    """Unknown bloc code should return 404."""
    r = client.put(f"/projets/{first_project}/phases/B99?completion_pct=50")
    assert r.status_code == 404
