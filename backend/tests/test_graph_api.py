import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app


@pytest.mark.anyio
async def test_graph_requires_bloc():
    """Graph endpoint should return results even without bloc filter."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/knowledge/graph")
        assert response.status_code == 200
        data = response.json()
        assert "nodes" in data
        assert "edges" in data
        assert "stats" in data


@pytest.mark.anyio
async def test_graph_with_bloc():
    """Graph endpoint should return nodes and edges for a specific bloc."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/knowledge/graph?bloc=B1&limit=10")
        assert response.status_code == 200
        data = response.json()
        assert data["stats"]["total_nodes"] > 0
        assert data["stats"]["total_edges"] >= 0
        # Check node structure
        node = data["nodes"][0]
        assert "id" in node
        assert "type" in node
        assert "data" in node


@pytest.mark.anyio
async def test_graph_with_entity_types():
    """Graph endpoint should filter by entity types."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get(
            "/api/knowledge/graph?bloc=B1&entity_types=normes,risques&limit=5"
        )
        assert response.status_code == 200
        data = response.json()
        node_types = {n["type"] for n in data["nodes"]}
        # Should contain bloc, phase, norme, risque but not livrable/outil/competence
        assert "livrable" not in node_types
        assert "outil" not in node_types


@pytest.mark.anyio
async def test_search_returns_results():
    """Search endpoint should return results for a known term."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/search?q=solaire")
        assert response.status_code == 200
        data = response.json()
        assert data["query"] == "solaire"
        assert data["total"] > 0
        assert len(data["results"]) > 0
        assert "facets" in data


@pytest.mark.anyio
async def test_search_with_type_filter():
    """Search endpoint should accept type filter."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/search?q=solaire&types=normes")
        assert response.status_code == 200
        data = response.json()
        # All results should be normes
        for result in data["results"]:
            assert result["type"] == "norme"


@pytest.mark.anyio
async def test_search_min_length():
    """Search query must be at least 2 characters."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/search?q=a")
        assert response.status_code == 422
