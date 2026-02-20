"""Integration tests that run against a live server.

These tests require the backend to be running on localhost:8000.
Run with: pytest tests/test_integration.py -v
"""

import httpx
import pytest

BASE_URL = "http://localhost:8000"


def is_server_running() -> bool:
    try:
        r = httpx.get(f"{BASE_URL}/health", timeout=2)
        return r.status_code == 200
    except httpx.ConnectError:
        return False


pytestmark = pytest.mark.skipif(
    not is_server_running(),
    reason="Backend server not running on localhost:8000",
)


def test_health():
    r = httpx.get(f"{BASE_URL}/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


def test_stats():
    r = httpx.get(f"{BASE_URL}/api/stats")
    assert r.status_code == 200
    data = r.json()
    assert data["phases"] > 1000
    assert data["normes"] > 900


def test_graph_b1():
    r = httpx.get(f"{BASE_URL}/api/knowledge/graph?bloc=B1&limit=10")
    assert r.status_code == 200
    data = r.json()
    assert data["stats"]["total_nodes"] > 0
    assert data["stats"]["total_edges"] > 0
    node_types = {n["type"] for n in data["nodes"]}
    assert "bloc" in node_types
    assert "phase" in node_types


def test_graph_entity_filter():
    r = httpx.get(
        f"{BASE_URL}/api/knowledge/graph?bloc=B1&entity_types=normes&limit=5"
    )
    assert r.status_code == 200
    data = r.json()
    node_types = {n["type"] for n in data["nodes"]}
    assert "risque" not in node_types
    assert "livrable" not in node_types


def test_search_solaire():
    r = httpx.get(f"{BASE_URL}/api/search?q=solaire")
    assert r.status_code == 200
    data = r.json()
    assert data["total"] > 0
    assert "facets" in data
    assert "type" in data["facets"]


def test_search_type_filter():
    r = httpx.get(f"{BASE_URL}/api/search?q=solaire&types=normes")
    assert r.status_code == 200
    data = r.json()
    for result in data["results"]:
        assert result["type"] == "norme"


def test_phases_list():
    r = httpx.get(f"{BASE_URL}/api/phases?limit=5")
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data, list)
    assert len(data) > 0


def test_normes_list():
    r = httpx.get(f"{BASE_URL}/api/normes?limit=5")
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data, list)
    assert len(data) > 0
