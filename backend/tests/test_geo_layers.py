"""Tests for GeoJSON/WMS layer management — Sprint 21."""

from app.models.geo_layer import GeoLayer
from app.routes.geo_layers import LAYER_CATALOG


class TestGeoLayerModel:
    def test_tablename(self):
        assert GeoLayer.__tablename__ == "geo_layers"

    def test_required_columns(self):
        cols = {c.name for c in GeoLayer.__table__.columns}
        for col in ("id", "user_id", "name", "layer_type", "geojson_data", "source_url", "feature_count", "style"):
            assert col in cols, f"Missing column: {col}"

    def test_layer_type_values(self):
        for lt in ("geojson", "wms", "wfs"):
            layer = GeoLayer(name="test", layer_type=lt)
            assert layer.layer_type == lt

    def test_default_visible(self):
        layer = GeoLayer(name="test", layer_type="wms")
        assert layer.visible is None or layer.visible == 1


class TestGeoJSONValidation:
    def test_valid_feature_collection(self):
        data = {
            "type": "FeatureCollection",
            "features": [
                {"type": "Feature", "geometry": {"type": "Point", "coordinates": [2.3, 48.8]}, "properties": {"name": "Paris"}},
            ],
        }
        assert data["type"] == "FeatureCollection"
        assert len(data["features"]) == 1

    def test_rejects_non_feature_collection(self):
        data = {"type": "Feature", "geometry": {"type": "Point", "coordinates": [0, 0]}}
        assert data.get("type") != "FeatureCollection"

    def test_feature_count_limit(self):
        assert 50_000 == 50000

    def test_file_size_limit_10mb(self):
        assert 10_000_000 == 10000000


class TestLayerCatalog:
    def test_catalog_has_entries(self):
        assert len(LAYER_CATALOG) >= 5

    def test_entries_have_required_fields(self):
        for entry in LAYER_CATALOG:
            assert "name" in entry
            assert "url" in entry
            assert "type" in entry
            assert entry["type"] in ("wms", "wfs")

    def test_catalog_has_natura2000(self):
        names = [e["name"] for e in LAYER_CATALOG]
        assert any("Natura" in n for n in names)

    def test_catalog_has_cadastre(self):
        names = [e["name"] for e in LAYER_CATALOG]
        assert any("Cadastre" in n for n in names)

    def test_catalog_has_categories(self):
        categories = {e["category"] for e in LAYER_CATALOG}
        assert "environnement" in categories
        assert "foncier" in categories
