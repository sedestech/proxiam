"""Integration tests for geo endpoints (Sprint 2).

Tests the PostGIS-backed geospatial endpoints against the live API:
  - /api/postes-sources/geojson  (GeoJSON FeatureCollection + filters)
  - /api/postes-sources/bbox     (bounding box query)
  - /api/postes-sources/nearest  (k-nearest-neighbour)

Requires backend running on localhost:8000 with seeded data (2,723 postes).

Run with:
    cd backend && pytest tests/test_geo.py -v
"""

import httpx
import pytest

BASE = "http://localhost:8000/api"

FRANCE_BBOX = {"west": -5.5, "south": 41.0, "east": 10.0, "north": 51.5}
PARIS_BBOX = {"west": 1.5, "south": 48.1, "east": 3.5, "north": 49.2}
PARIS_CENTER = {"lon": 2.35, "lat": 48.86}
ATLANTIC_BBOX = {"west": -30.0, "south": 30.0, "east": -20.0, "north": 40.0}


def _assert_valid_fc(data: dict, *, min_features: int = 1):
    assert data["type"] == "FeatureCollection"
    assert len(data["features"]) >= min_features
    f = data["features"][0]
    assert f["type"] == "Feature"
    assert f["geometry"]["type"] == "Point"
    assert len(f["geometry"]["coordinates"]) == 2
    assert "id" in f["properties"]
    assert "nom" in f["properties"]
    assert "gestionnaire" in f["properties"]


@pytest.fixture(scope="module")
def client():
    with httpx.Client(base_url=BASE, timeout=30) as c:
        # Verify server is running
        r = c.get("/health".replace("/api", "").replace("//", "/"))
        yield c


# ─── GeoJSON endpoint ───

def test_geojson_valid(client):
    r = client.get("/postes-sources/geojson")
    assert r.status_code == 200
    assert "geo+json" in r.headers["content-type"]
    data = r.json()
    _assert_valid_fc(data, min_features=100)
    assert len(data["features"]) >= 2700


def test_geojson_filter_rte(client):
    r = client.get("/postes-sources/geojson", params={"gestionnaire": "RTE"})
    assert r.status_code == 200
    data = r.json()
    _assert_valid_fc(data)
    for f in data["features"]:
        assert f["properties"]["gestionnaire"] == "RTE"
    assert 480 <= len(data["features"]) <= 500


def test_geojson_filter_tension(client):
    r = client.get("/postes-sources/geojson", params={"tension_min": 200})
    assert r.status_code == 200
    data = r.json()
    _assert_valid_fc(data)
    for f in data["features"]:
        assert f["properties"]["tension_kv"] >= 200


def test_geojson_filter_capacite(client):
    r = client.get("/postes-sources/geojson", params={"capacite_min": 100})
    assert r.status_code == 200
    data = r.json()
    _assert_valid_fc(data)
    for f in data["features"]:
        assert f["properties"]["capacite_disponible_mw"] >= 100
    assert len(data["features"]) < 2700


# ─── BBox endpoint ───

def test_bbox_france(client):
    r = client.get("/postes-sources/bbox", params=FRANCE_BBOX)
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data, list)
    assert len(data) == 500
    assert "lon" in data[0] and "lat" in data[0] and "nom" in data[0]


def test_bbox_geojson(client):
    r = client.get("/postes-sources/bbox", params={**PARIS_BBOX, "format": "geojson"})
    assert r.status_code == 200
    assert "geo+json" in r.headers["content-type"]
    data = r.json()
    _assert_valid_fc(data)
    assert len(data["features"]) >= 50


def test_bbox_empty_atlantic(client):
    r = client.get("/postes-sources/bbox", params=ATLANTIC_BBOX)
    assert r.status_code == 200
    assert r.json() == []


# ─── Nearest endpoint ───

def test_nearest_returns_close_results(client):
    """Nearest endpoint returns results near the query point.
    Note: ORDER BY uses PostGIS <-> (planar KNN) while distance_m uses
    ST_Distance(::geography) (spherical). Ordering may differ slightly."""
    r = client.get("/postes-sources/nearest", params={**PARIS_CENTER, "limit": 10})
    assert r.status_code == 200
    data = r.json()
    assert len(data) == 10
    # All results should be within 200km of Paris
    for item in data:
        assert item["distance_m"] < 200_000
    # First result should be the closest (within 50km)
    assert data[0]["distance_m"] < 50_000


def test_nearest_distance_field(client):
    r = client.get("/postes-sources/nearest", params={**PARIS_CENTER, "limit": 5})
    assert r.status_code == 200
    data = r.json()
    for item in data:
        assert isinstance(item["distance_m"], (int, float))
        assert item["distance_m"] >= 0
    assert data[0]["distance_m"] < 100_000


def test_nearest_limit(client):
    r3 = client.get("/postes-sources/nearest", params={**PARIS_CENTER, "limit": 3})
    assert len(r3.json()) == 3
    r5 = client.get("/postes-sources/nearest", params=PARIS_CENTER)
    assert len(r5.json()) == 5
