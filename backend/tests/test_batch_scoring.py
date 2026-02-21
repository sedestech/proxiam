"""Integration tests for batch scoring endpoint (Sprint 12).

Tests the batch scoring API:
  - POST /api/projets/batch-score  (score multiple projects)

Also tests score range filters on:
  - GET /api/projets?score_min=X&score_max=Y

Requires backend running on localhost:8000 with seeded projects.

Run with:
    cd backend && pytest tests/test_batch_scoring.py -v
"""

import httpx
import pytest

BASE = "http://localhost:8000/api"


def is_server_running() -> bool:
    try:
        r = httpx.get(f"{BASE.replace('/api', '')}/health", timeout=2)
        return r.status_code == 200
    except httpx.ConnectError:
        return False


pytestmark = pytest.mark.skipif(
    not is_server_running(),
    reason="Backend server not running on localhost:8000",
)


@pytest.fixture(scope="module")
def client():
    with httpx.Client(base_url=BASE, timeout=30) as c:
        yield c


@pytest.fixture(scope="module")
def projets(client):
    """Fetch all projects from the API."""
    r = client.get("/projets")
    assert r.status_code == 200
    data = r.json()
    assert len(data) >= 2, "Need at least 2 projects for batch tests"
    return data


# ─── Batch scoring: success cases ───


def test_batch_score_two_projects(client, projets):
    """POST /projets/batch-score with 2 valid IDs returns scored results."""
    ids = [p["id"] for p in projets[:2]]
    r = client.post("/projets/batch-score", json={"projet_ids": ids})
    assert r.status_code == 200
    data = r.json()

    assert "scored" in data
    assert "results" in data
    assert data["scored"] == 2
    assert len(data["results"]) == 2

    for result in data["results"]:
        assert "projet_id" in result
        assert "nom" in result
        assert "score" in result
        assert 0 <= result["score"] <= 100


def test_batch_score_single_project(client, projets):
    """Batch scoring with a single project works."""
    r = client.post("/projets/batch-score", json={"projet_ids": [projets[0]["id"]]})
    assert r.status_code == 200
    data = r.json()
    assert data["scored"] == 1


def test_batch_score_all_projects(client, projets):
    """Batch scoring all available projects (up to 20)."""
    ids = [p["id"] for p in projets[:20]]
    r = client.post("/projets/batch-score", json={"projet_ids": ids})
    assert r.status_code == 200
    data = r.json()
    assert data["scored"] == len(ids)


# ─── Batch scoring: error cases ───


def test_batch_score_unknown_id(client, projets):
    """Unknown project IDs return 'not found' in results."""
    ids = [projets[0]["id"], "00000000-0000-0000-0000-000000000000"]
    r = client.post("/projets/batch-score", json={"projet_ids": ids})
    assert r.status_code == 200
    data = r.json()

    assert data["scored"] == 1
    errors = [r for r in data["results"] if r.get("error")]
    assert len(errors) == 1
    assert errors[0]["error"] == "not found"


def test_batch_score_empty_list(client):
    """Empty project_ids list returns 422 (Pydantic validation)."""
    r = client.post("/projets/batch-score", json={"projet_ids": []})
    assert r.status_code == 422


def test_batch_score_exceeds_max(client, projets):
    """More than 20 IDs returns 422 (Pydantic validation)."""
    ids = [projets[0]["id"]] * 21  # 21 items
    r = client.post("/projets/batch-score", json={"projet_ids": ids})
    assert r.status_code == 422


def test_batch_score_duplicates_rejected(client, projets):
    """Duplicate IDs in the list are rejected by validation."""
    pid = projets[0]["id"]
    r = client.post("/projets/batch-score", json={"projet_ids": [pid, pid]})
    assert r.status_code == 422


def test_batch_score_missing_body(client):
    """Missing body returns 422."""
    r = client.post("/projets/batch-score")
    assert r.status_code == 422


# ─── Score range filters ───


def test_score_filter_min(client, projets):
    """GET /projets?score_min=50 returns only projects with score >= 50."""
    # First score all projects
    ids = [p["id"] for p in projets[:5]]
    client.post("/projets/batch-score", json={"projet_ids": ids})

    r = client.get("/projets?score_min=50")
    assert r.status_code == 200
    data = r.json()
    for p in data:
        if p["score_global"] is not None:
            assert p["score_global"] >= 50


def test_score_filter_max(client):
    """GET /projets?score_max=60 returns only projects with score <= 60."""
    r = client.get("/projets?score_max=60")
    assert r.status_code == 200
    data = r.json()
    for p in data:
        if p["score_global"] is not None:
            assert p["score_global"] <= 60


def test_score_filter_range(client):
    """GET /projets?score_min=30&score_max=80 returns projects in range."""
    r = client.get("/projets?score_min=30&score_max=80")
    assert r.status_code == 200
    data = r.json()
    for p in data:
        if p["score_global"] is not None:
            assert 30 <= p["score_global"] <= 80


def test_score_filter_invalid_min(client):
    """score_min > 100 returns 422."""
    r = client.get("/projets?score_min=101")
    assert r.status_code == 422


def test_score_filter_invalid_max(client):
    """score_max < 0 returns 422."""
    r = client.get("/projets?score_max=-1")
    assert r.status_code == 422
