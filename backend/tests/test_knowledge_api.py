import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app


@pytest.mark.anyio
async def test_list_phases():
    """Phases endpoint should return a list."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/phases")
        assert response.status_code == 200
        assert isinstance(response.json(), list)


@pytest.mark.anyio
async def test_list_normes():
    """Normes endpoint should return a list."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/normes")
        assert response.status_code == 200
        assert isinstance(response.json(), list)


@pytest.mark.anyio
async def test_list_risques():
    """Risques endpoint should return a list."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/risques")
        assert response.status_code == 200
        assert isinstance(response.json(), list)


@pytest.mark.anyio
async def test_list_outils():
    """Outils endpoint should return a list."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/outils")
        assert response.status_code == 200
        assert isinstance(response.json(), list)


@pytest.mark.anyio
async def test_list_sources():
    """Sources endpoint should return a list."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/sources")
        assert response.status_code == 200
        assert isinstance(response.json(), list)


@pytest.mark.anyio
async def test_list_competences():
    """Competences endpoint should return a list."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/competences")
        assert response.status_code == 200
        assert isinstance(response.json(), list)


@pytest.mark.anyio
async def test_search_requires_query():
    """Search endpoint should require a query parameter."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/search")
        assert response.status_code == 422  # Validation error
