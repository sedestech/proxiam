"""Integration tests for Admin and Export endpoints (Sprint 6).

Tests:
  - GET  /api/admin/health   — detailed health check
  - GET  /api/projets/export/csv  — CSV export

Requires backend running on localhost:8000 with seeded data.

Run with:
    cd backend && pytest tests/test_admin.py -v
"""

import httpx
import pytest

BASE = "http://localhost:8000/api"


@pytest.fixture(scope="module")
def client():
    with httpx.Client(base_url=BASE, timeout=30) as c:
        yield c


# ─── Admin Health ───


def test_admin_health_returns_services(client):
    """GET /admin/health returns service statuses."""
    r = client.get("/admin/health")
    assert r.status_code == 200
    data = r.json()
    assert "status" in data
    assert "services" in data
    assert data["status"] in ("ok", "degraded")


def test_admin_health_has_postgresql(client):
    """PostgreSQL service must be present and OK."""
    r = client.get("/admin/health")
    services = r.json()["services"]
    assert "postgresql" in services
    pg = services["postgresql"]
    assert pg["status"] == "ok"
    assert "latency_ms" in pg
    assert pg["latency_ms"] < 5000
    assert "db_size_mb" in pg
    assert pg["db_size_mb"] > 0


def test_admin_health_has_redis(client):
    """Redis service should be checked."""
    r = client.get("/admin/health")
    services = r.json()["services"]
    assert "redis" in services


def test_admin_health_has_meilisearch(client):
    """Meilisearch service should be checked."""
    r = client.get("/admin/health")
    services = r.json()["services"]
    assert "meilisearch" in services


def test_admin_health_has_ai(client):
    """AI service status should be present."""
    r = client.get("/admin/health")
    services = r.json()["services"]
    assert "ai" in services
    assert services["ai"]["mode"] in ("claude", "template")


def test_admin_health_pg_counts(client):
    """PostgreSQL should report data counts."""
    r = client.get("/admin/health")
    pg = r.json()["services"]["postgresql"]
    assert "counts" in pg
    assert pg["counts"]["projets"] >= 1
    assert pg["counts"]["phases"] >= 1


# ─── CSV Export ───


def test_csv_export_returns_csv(client):
    """GET /projets/export/csv returns CSV data."""
    r = client.get("/projets/export/csv")
    assert r.status_code == 200
    assert "text/csv" in r.headers.get("content-type", "")


def test_csv_export_has_header(client):
    """CSV should have header row with expected columns."""
    r = client.get("/projets/export/csv")
    lines = r.text.strip().split("\n")
    assert len(lines) >= 2  # header + at least 1 row
    header = lines[0]
    assert "nom" in header
    assert "filiere" in header
    assert "score_global" in header


def test_csv_export_has_data_rows(client):
    """CSV should contain project data rows."""
    r = client.get("/projets/export/csv")
    lines = r.text.strip().split("\n")
    assert len(lines) >= 3  # header + at least 2 projects
    # Check a data row has semicolons (CSV delimiter)
    assert ";" in lines[1]


def test_csv_export_semicolon_delimiter(client):
    """CSV uses semicolons as delimiter (French convention)."""
    r = client.get("/projets/export/csv")
    header = r.text.split("\n")[0]
    # Count semicolons — should be 12 (13 columns - 1)
    assert header.count(";") == 12


def test_csv_export_content_disposition(client):
    """CSV should have download filename in Content-Disposition header."""
    r = client.get("/projets/export/csv")
    cd = r.headers.get("content-disposition", "")
    assert "proxiam-projets.csv" in cd
