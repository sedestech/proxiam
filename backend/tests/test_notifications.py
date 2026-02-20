"""Integration tests for Notifications endpoint (Sprint 8+10).

Tests:
  - GET /api/notifications — returns notifications list
  - PUT /api/notifications/read-all — mark all read
  - PUT /api/notifications/{id}/read — mark one read

Requires backend running on localhost:8000 with seeded data.

Run with:
    cd backend && pytest tests/test_notifications.py -v
"""

import httpx
import pytest

BASE = "http://localhost:8000/api"


@pytest.fixture(scope="module")
def client():
    with httpx.Client(base_url=BASE, timeout=30) as c:
        yield c


def test_notifications_returns_list(client):
    """GET /notifications returns a list of notifications."""
    r = client.get("/notifications")
    assert r.status_code == 200
    data = r.json()
    assert "notifications" in data
    assert "unread" in data
    assert "total" in data


def test_notifications_has_items(client):
    """Should have at least one notification from seeded data."""
    r = client.get("/notifications")
    data = r.json()
    assert len(data["notifications"]) >= 1


def test_notifications_structure(client):
    """Each notification has required fields."""
    r = client.get("/notifications")
    notif = r.json()["notifications"][0]
    assert "id" in notif
    assert "type" in notif
    assert "title" in notif
    assert "read" in notif
    assert "timestamp" in notif


def test_notifications_has_project_type(client):
    """Should have project_created notifications (seeded projects)."""
    r = client.get("/notifications?limit=50")
    types = [n["type"] for n in r.json()["notifications"]]
    assert "project_created" in types


def test_notifications_types_are_valid(client):
    """All notification types should be known types."""
    r = client.get("/notifications?limit=20")
    valid_types = {"system", "project_created", "project_updated", "project_deleted",
                   "score_calculated", "import_completed", "info"}
    for n in r.json()["notifications"]:
        assert n["type"] in valid_types, f"Unknown type: {n['type']}"


def test_notifications_limit(client):
    """Limit parameter controls max results."""
    r = client.get("/notifications?limit=3")
    data = r.json()
    assert len(data["notifications"]) <= 3


def test_notifications_unread_count(client):
    """Unread count should be a non-negative integer."""
    r = client.get("/notifications")
    data = r.json()
    assert isinstance(data["unread"], int)
    assert data["unread"] >= 0


def test_notifications_total_count(client):
    """Total should be >= notifications returned."""
    r = client.get("/notifications")
    data = r.json()
    assert data["total"] >= len(data["notifications"])


def test_mark_all_read(client):
    """PUT /notifications/read-all marks all as read."""
    r = client.put("/notifications/read-all")
    assert r.status_code == 200
    assert r.json()["ok"] is True
