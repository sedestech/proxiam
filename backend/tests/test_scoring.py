"""Integration tests for scoring endpoints (Sprint 3).

Tests the scoring engine against the live API:
  - POST /api/projets/{id}/score  (calculate score)
  - GET  /api/projets/{id}/score  (retrieve persisted score)
  - GET  /api/scoring/weights     (weight configuration)

Requires backend running on localhost:8000 with seeded projects.

Run with:
    cd backend && pytest tests/test_scoring.py -v
"""

import httpx
import pytest

BASE = "http://localhost:8000/api"

CRITERIA = [
    "proximite_reseau",
    "urbanisme",
    "environnement",
    "irradiation",
    "accessibilite",
    "risques",
]


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
    assert len(data) >= 1, "No projects found — run seed_projets.py first"
    return data


@pytest.fixture(scope="module")
def first_projet(projets):
    return projets[0]


# ─── Weights endpoint ───


def test_weights_returns_filieres(client):
    r = client.get("/scoring/weights")
    assert r.status_code == 200
    data = r.json()
    assert "filieres" in data
    assert "default" in data
    assert "criteria" in data
    assert set(data["criteria"]) == set(CRITERIA)
    # Check filiere weights sum to ~1.0
    for filiere, weights in data["filieres"].items():
        total = sum(weights.values())
        assert abs(total - 1.0) < 0.01, f"{filiere} weights sum to {total}"


def test_weights_default_sum(client):
    r = client.get("/scoring/weights")
    data = r.json()
    total = sum(data["default"].values())
    assert abs(total - 1.0) < 0.01


# ─── Score calculation ───


def test_score_post_returns_valid_result(client, first_projet):
    """POST /projets/{id}/score returns 6 criteria + global score."""
    r = client.post(f"/projets/{first_projet['id']}/score")
    assert r.status_code == 200
    data = r.json()

    assert data["projet_id"] == first_projet["id"]
    assert 0 <= data["score"] <= 100
    assert "details" in data
    assert "weights" in data

    for criterion in CRITERIA:
        assert criterion in data["details"]
        assert 0 <= data["details"][criterion] <= 100


def test_score_post_persists(client, first_projet):
    """After POST, the score is persisted and GET returns it."""
    # Calculate
    r = client.post(f"/projets/{first_projet['id']}/score")
    score = r.json()["score"]

    # Verify persistence
    r2 = client.get(f"/projets/{first_projet['id']}/score")
    assert r2.status_code == 200
    assert r2.json()["score"] == score


def test_score_varies_by_filiere(client, projets):
    """Different filieres should produce different weight distributions."""
    scores = {}
    for p in projets[:4]:
        r = client.post(f"/projets/{p['id']}/score")
        assert r.status_code == 200
        data = r.json()
        scores[p["nom"]] = data
    # At least 2 different scores
    unique_scores = {s["score"] for s in scores.values()}
    assert len(unique_scores) >= 2, "All projects have the same score — unexpected"


def test_score_details_in_range(client, projets):
    """All criteria scores must be 0-100 for every project."""
    for p in projets:
        r = client.post(f"/projets/{p['id']}/score")
        assert r.status_code == 200
        data = r.json()
        for criterion in CRITERIA:
            val = data["details"][criterion]
            assert 0 <= val <= 100, f"{p['nom']}: {criterion}={val} out of range"


def test_score_global_is_weighted_average(client, first_projet):
    """Global score should equal the weighted sum of criteria."""
    r = client.post(f"/projets/{first_projet['id']}/score")
    data = r.json()
    computed = sum(
        data["details"][c] * data["weights"][c] for c in CRITERIA
    )
    assert abs(data["score"] - round(computed)) <= 1, (
        f"Global {data['score']} != computed {round(computed)}"
    )


# ─── Error cases ───


def test_score_404_unknown_project(client):
    r = client.post("/projets/00000000-0000-0000-0000-000000000000/score")
    assert r.status_code == 404


def test_score_get_404_unknown_project(client):
    r = client.get("/projets/00000000-0000-0000-0000-000000000000/score")
    assert r.status_code == 404


# ─── Projects endpoint (regression) ───


def test_projets_list_has_score_after_calculation(client, projets):
    """After scoring, the projects list should show score_global."""
    # Score first project
    client.post(f"/projets/{projets[0]['id']}/score")

    # Check list
    r = client.get("/projets")
    assert r.status_code == 200
    updated = r.json()
    scored = [p for p in updated if p["score_global"] is not None]
    assert len(scored) >= 1
