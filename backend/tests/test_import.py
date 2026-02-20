"""Integration tests for Project Import API (Sprint 9).

Tests:
  - POST /api/projets/import with CSV
  - POST /api/projets/import with JSON

Requires backend running.

Run with:
    cd backend && pytest tests/test_import.py -v
"""

import httpx
import pytest
import json

BASE = "http://localhost:8000/api"


@pytest.fixture(scope="module")
def client():
    with httpx.Client(base_url=BASE, timeout=30) as c:
        yield c


def test_import_csv(client):
    """Import CSV with 2 rows should create 2 projects."""
    csv_content = (
        "nom;filiere;puissance_mwc;commune;statut\n"
        "Import Test A;solaire_sol;25;Nice;prospection\n"
        "Import Test B;eolien_onshore;40;Lyon;ingenierie\n"
    )
    files = {"file": ("test.csv", csv_content.encode(), "text/csv")}
    r = client.post("/projets/import", files=files)
    assert r.status_code == 200
    data = r.json()
    assert data["imported"] == 2
    assert len(data["errors"]) == 0
    # Cleanup
    for p in data["projects"]:
        client.delete(f"/projets/{p['id']}")


def test_import_json(client):
    """Import JSON array should create projects."""
    payload = [
        {"nom": "JSON Test 1", "filiere": "bess", "puissance_mwc": 100},
        {"nom": "JSON Test 2", "filiere": "solaire_sol", "statut": "construction"},
    ]
    content = json.dumps(payload).encode()
    files = {"file": ("test.json", content, "application/json")}
    r = client.post("/projets/import", files=files)
    assert r.status_code == 200
    data = r.json()
    assert data["imported"] == 2
    # Cleanup
    for p in data["projects"]:
        client.delete(f"/projets/{p['id']}")


def test_import_csv_missing_nom(client):
    """Rows without nom should produce errors."""
    csv_content = (
        "nom;filiere;statut\n"
        ";solaire_sol;prospection\n"
        "Valid Name;eolien_onshore;ingenierie\n"
    )
    files = {"file": ("test.csv", csv_content.encode(), "text/csv")}
    r = client.post("/projets/import", files=files)
    data = r.json()
    assert data["imported"] == 1
    assert len(data["errors"]) == 1
    assert data["errors"][0]["row"] == 1
    # Cleanup
    for p in data["projects"]:
        client.delete(f"/projets/{p['id']}")


def test_import_empty_file(client):
    """Empty CSV should fail."""
    files = {"file": ("empty.csv", b"nom;filiere\n", "text/csv")}
    r = client.post("/projets/import", files=files)
    assert r.status_code == 400


def test_import_csv_with_coords(client):
    """CSV with lon/lat should create projects with geometry."""
    csv_content = (
        "nom;filiere;lon;lat\n"
        "Geo Test;solaire_sol;2.35;48.86\n"
    )
    files = {"file": ("test.csv", csv_content.encode(), "text/csv")}
    r = client.post("/projets/import", files=files)
    data = r.json()
    assert data["imported"] == 1
    # Check project has coords
    p = client.get(f"/projets/{data['projects'][0]['id']}").json()
    assert p["lon"] is not None
    # Cleanup
    client.delete(f"/projets/{data['projects'][0]['id']}")
