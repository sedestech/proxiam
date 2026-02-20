"""Tests for persistent notifications DB features (Sprint 10).

Tests mark-as-read, notification generation on project CRUD.

Requires backend running on localhost:8000.
Run with:
    cd backend && pytest tests/test_notifications_db.py -v
"""

import httpx
import pytest

BASE = "http://localhost:8000/api"


@pytest.fixture(scope="module")
def client():
    with httpx.Client(base_url=BASE, timeout=30) as c:
        yield c


def test_notifications_have_id_field(client):
    """Notifications should have integer IDs (from DB)."""
    r = client.get("/notifications?limit=5")
    data = r.json()
    if data["notifications"]:
        assert isinstance(data["notifications"][0]["id"], int)


def test_notifications_have_entity_fields(client):
    """DB notifications should have entity_type and entity_id."""
    r = client.get("/notifications?limit=5")
    data = r.json()
    if data["notifications"]:
        notif = data["notifications"][0]
        assert "entity_type" in notif
        assert "entity_id" in notif


def test_mark_single_read(client):
    """PUT /notifications/{id}/read marks a single notification."""
    r = client.get("/notifications?limit=1")
    if r.json()["notifications"]:
        nid = r.json()["notifications"][0]["id"]
        resp = client.put(f"/notifications/{nid}/read")
        assert resp.status_code == 200
        assert resp.json()["ok"] is True


def test_mark_all_read_returns_count(client):
    """PUT /notifications/read-all returns updated count."""
    r = client.put("/notifications/read-all")
    assert r.status_code == 200
    data = r.json()
    assert "updated" in data


def test_after_read_all_unread_zero(client):
    """After read-all, unread count should be 0."""
    client.put("/notifications/read-all")
    r = client.get("/notifications")
    assert r.json()["unread"] == 0


def test_create_project_generates_notification(client):
    """Creating a project should generate a project_created notification."""
    # Count before
    before = client.get("/notifications").json()["total"]

    # Create project
    resp = client.post("/projets", json={"nom": "Notif DB Test"})
    assert resp.status_code in (200, 201)
    pid = resp.json()["id"]

    # Count after
    after = client.get("/notifications").json()["total"]
    assert after > before

    # Check latest notification
    latest = client.get("/notifications?limit=1").json()["notifications"][0]
    assert latest["type"] == "project_created"
    assert "Notif DB Test" in latest["title"]

    # Cleanup
    client.delete(f"/projets/{pid}")


def test_delete_project_generates_notification(client):
    """Deleting a project should generate a project_deleted notification."""
    resp = client.post("/projets", json={"nom": "To Delete Notif"})
    pid = resp.json()["id"]

    client.delete(f"/projets/{pid}")

    # Check latest notification
    latest = client.get("/notifications?limit=1").json()["notifications"][0]
    assert latest["type"] == "project_deleted"
    assert "To Delete Notif" in latest["title"]
