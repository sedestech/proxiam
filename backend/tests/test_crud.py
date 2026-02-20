"""Integration tests for Project CRUD endpoints (Sprint 7).

Tests:
  - POST /api/projets       — create project
  - PUT  /api/projets/{id}  — update project
  - DELETE /api/projets/{id} — delete project

Requires backend running on localhost:8000.

Run with:
    cd backend && pytest tests/test_crud.py -v
"""

import httpx
import pytest

BASE = "http://localhost:8000/api"


@pytest.fixture(scope="module")
def client():
    with httpx.Client(base_url=BASE, timeout=30) as c:
        yield c


# ─── Create ───


def test_create_projet(client):
    """POST /projets creates a new project and returns it."""
    r = client.post("/projets", json={
        "nom": "Test Sprint7",
        "filiere": "solaire_sol",
        "puissance_mwc": 30,
        "commune": "TestVille",
        "departement": "99",
        "statut": "prospection",
    })
    assert r.status_code == 201
    data = r.json()
    assert data["nom"] == "Test Sprint7"
    assert data["filiere"] == "solaire_sol"
    assert data["puissance_mwc"] == 30.0
    # Store for later tests
    test_create_projet.created_id = data["id"]


def test_create_projet_has_id(client):
    """Created project should have a UUID id."""
    pid = test_create_projet.created_id
    assert pid is not None
    assert len(pid) == 36  # UUID format


def test_create_projet_with_coords(client):
    """POST /projets with lon/lat creates geom."""
    r = client.post("/projets", json={
        "nom": "Test Coords",
        "filiere": "bess",
        "lon": 2.35,
        "lat": 48.85,
        "statut": "ingenierie",
    })
    assert r.status_code == 201
    data = r.json()
    assert data["lon"] == 2.35
    assert data["lat"] == 48.85
    # Cleanup
    client.delete(f"/projets/{data['id']}")


def test_create_projet_nom_required(client):
    """POST /projets without nom should fail."""
    r = client.post("/projets", json={"filiere": "bess"})
    assert r.status_code == 422


# ─── Update ───


def test_update_projet_nom(client):
    """PUT /projets/{id} can update nom."""
    pid = test_create_projet.created_id
    r = client.put(f"/projets/{pid}", json={"nom": "Test Modifie"})
    assert r.status_code == 200
    assert r.json()["nom"] == "Test Modifie"


def test_update_projet_statut(client):
    """PUT /projets/{id} can update statut."""
    pid = test_create_projet.created_id
    r = client.put(f"/projets/{pid}", json={"statut": "construction"})
    assert r.status_code == 200
    assert r.json()["statut"] == "construction"


def test_update_projet_puissance(client):
    """PUT /projets/{id} can update puissance_mwc."""
    pid = test_create_projet.created_id
    r = client.put(f"/projets/{pid}", json={"puissance_mwc": 99.5})
    assert r.status_code == 200
    assert r.json()["puissance_mwc"] == 99.5


def test_update_projet_404(client):
    """PUT /projets/{unknown} returns 404."""
    r = client.put(
        "/projets/00000000-0000-0000-0000-000000000000",
        json={"nom": "Nope"},
    )
    assert r.status_code == 404


# ─── Delete ───


def test_delete_projet(client):
    """DELETE /projets/{id} removes the project."""
    pid = test_create_projet.created_id
    r = client.delete(f"/projets/{pid}")
    assert r.status_code == 200
    data = r.json()
    assert data["status"] == "deleted"
    assert data["id"] == pid


def test_delete_projet_gone(client):
    """Deleted project should not be found."""
    pid = test_create_projet.created_id
    r = client.get(f"/projets/{pid}")
    assert r.status_code == 404


def test_delete_projet_404(client):
    """DELETE /projets/{unknown} returns 404."""
    r = client.delete("/projets/00000000-0000-0000-0000-000000000000")
    assert r.status_code == 404
