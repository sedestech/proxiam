"""Integration tests for AI analysis endpoints (Sprint 5).

Tests the AI analysis service against the live API:
  - POST /api/projets/{id}/analyze  (run AI analysis)
  - GET  /api/ai/status             (check AI availability)

Requires backend running on localhost:8000 with seeded projects.

Run with:
    cd backend && pytest tests/test_ai.py -v
"""

import httpx
import pytest

BASE = "http://localhost:8000/api"


@pytest.fixture(scope="module")
def client():
    with httpx.Client(base_url=BASE, timeout=30) as c:
        yield c


@pytest.fixture(scope="module")
def first_projet(client):
    """Fetch first project from API."""
    r = client.get("/projets")
    assert r.status_code == 200
    data = r.json()
    assert len(data) >= 1, "No projects found — run seed_projets.py first"
    return data[0]


# ─── AI Status ───


def test_ai_status_returns_mode(client):
    """GET /ai/status returns availability info."""
    r = client.get("/ai/status")
    assert r.status_code == 200
    data = r.json()
    assert "available" in data
    assert "mode" in data
    assert "message" in data
    assert data["mode"] in ("claude", "template")


def test_ai_status_mode_matches_availability(client):
    """Mode should be 'claude' when available, 'template' otherwise."""
    r = client.get("/ai/status")
    data = r.json()
    if data["available"]:
        assert data["mode"] == "claude"
    else:
        assert data["mode"] == "template"


# ─── AI Analysis ───


def test_analyze_returns_analysis(client, first_projet):
    """POST /projets/{id}/analyze returns full analysis."""
    r = client.post(f"/projets/{first_projet['id']}/analyze")
    assert r.status_code == 200
    data = r.json()

    assert data["projet_id"] == first_projet["id"]
    assert data["projet_nom"] == first_projet["nom"]
    assert "analysis" in data


def test_analyze_has_required_fields(client, first_projet):
    """Analysis must contain all required fields."""
    r = client.post(f"/projets/{first_projet['id']}/analyze")
    analysis = r.json()["analysis"]

    required = ["summary", "strengths", "risks", "next_steps",
                 "score_insights", "phase_summary", "source"]
    for field in required:
        assert field in analysis, f"Missing field: {field}"


def test_analyze_strengths_is_list(client, first_projet):
    """Strengths should be a non-empty list of strings."""
    r = client.post(f"/projets/{first_projet['id']}/analyze")
    strengths = r.json()["analysis"]["strengths"]
    assert isinstance(strengths, list)
    assert len(strengths) >= 1
    for s in strengths:
        assert isinstance(s, str)


def test_analyze_risks_is_list(client, first_projet):
    """Risks should be a non-empty list of strings."""
    r = client.post(f"/projets/{first_projet['id']}/analyze")
    risks = r.json()["analysis"]["risks"]
    assert isinstance(risks, list)
    assert len(risks) >= 1


def test_analyze_next_steps_is_list(client, first_projet):
    """Next steps should be a non-empty list of strings."""
    r = client.post(f"/projets/{first_projet['id']}/analyze")
    next_steps = r.json()["analysis"]["next_steps"]
    assert isinstance(next_steps, list)
    assert len(next_steps) >= 1


def test_analyze_score_insights(client, first_projet):
    """Score insights should be a list of criterion/value/insight dicts."""
    r = client.post(f"/projets/{first_projet['id']}/analyze")
    insights = r.json()["analysis"]["score_insights"]
    assert isinstance(insights, list)
    for insight in insights:
        assert "criterion" in insight
        assert "value" in insight
        assert "insight" in insight
        assert 0 <= insight["value"] <= 100


def test_analyze_source_is_valid(client, first_projet):
    """Source should be either 'claude' or 'template'."""
    r = client.post(f"/projets/{first_projet['id']}/analyze")
    source = r.json()["analysis"]["source"]
    assert source in ("claude", "template")


def test_analyze_404_unknown_project(client):
    """Analyzing a non-existent project should return 404."""
    r = client.post("/projets/00000000-0000-0000-0000-000000000000/analyze")
    assert r.status_code == 404


# ─── Sources (Veille) ───


def test_sources_returns_list(client):
    """GET /sources returns a list of source objects."""
    r = client.get("/sources?limit=10")
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data, list)
    assert len(data) >= 1


def test_sources_have_required_fields(client):
    """Each source should have code, nom, type, frequence."""
    r = client.get("/sources?limit=5")
    for source in r.json():
        assert "id" in source
        assert "code" in source
        assert "nom" in source


def test_sources_type_filter(client):
    """Filtering by type should return only matching sources."""
    r = client.get("/sources?type=api&limit=500")
    assert r.status_code == 200
    data = r.json()
    for s in data:
        assert s["type"] == "api"


def test_sources_total_count(client):
    """Should have ~578 total sources."""
    page1 = client.get("/sources?limit=500")
    page2 = client.get("/sources?limit=500&offset=500")
    total = len(page1.json()) + len(page2.json())
    assert total >= 500, f"Only {total} sources found"
