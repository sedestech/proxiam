"""Integration tests for Notifications endpoint (Sprint 8).

Tests:
  - GET /api/notifications — returns notifications list

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
    """Should have at least one notification (system stats)."""
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
    assert "message" in notif
    assert "read" in notif


def test_notifications_has_system_type(client):
    """Should have a system notification."""
    r = client.get("/notifications")
    types = [n["type"] for n in r.json()["notifications"]]
    assert "system" in types


def test_notifications_has_project_type(client):
    """Should have project_created notifications (seeded projects)."""
    r = client.get("/notifications")
    types = [n["type"] for n in r.json()["notifications"]]
    assert "project_created" in types


def test_notifications_has_score_type(client):
    """Should have score_calculated notifications (scored projects)."""
    r = client.get("/notifications")
    types = [n["type"] for n in r.json()["notifications"]]
    assert "score_calculated" in types


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
