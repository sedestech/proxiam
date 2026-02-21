"""Tests for Natura 2000 GeoJSON import logic."""
import pytest

from app.commands.import_natura2000 import parse_feature


class TestNatura2000Parser:
    def test_parse_valid_feature(self):
        feature = {
            "type": "Feature",
            "properties": {
                "sitecode": "FR1100795",
                "sitename": "Forêt de Fontainebleau",
                "sitetype": "B",
                "areaha": 28137.5,
                "region": "Île-de-France",
                "departement": "77",
            },
            "geometry": {"type": "MultiPolygon", "coordinates": [[[[2.6, 48.4], [2.7, 48.4], [2.7, 48.5], [2.6, 48.4]]]]},
        }
        result = parse_feature(feature)
        assert result is not None
        assert result["site_code"] == "FR1100795"
        assert result["nom"] == "Forêt de Fontainebleau"
        assert result["type_zone"] == "ZSC"
        assert result["surface_ha"] == 28137.5

    def test_parse_type_a_is_zps(self):
        feature = {
            "properties": {"sitecode": "FR001", "sitename": "Zone oiseaux", "sitetype": "A", "areaha": 100},
            "geometry": {"type": "Polygon", "coordinates": [[[0, 0], [1, 0], [1, 1], [0, 0]]]},
        }
        result = parse_feature(feature)
        assert result["type_zone"] == "ZPS"

    def test_parse_missing_geometry_returns_none(self):
        feature = {"properties": {"sitecode": "FR001", "sitename": "Test"}, "geometry": None}
        assert parse_feature(feature) is None

    def test_parse_missing_sitecode_returns_none(self):
        feature = {
            "properties": {"sitename": "No code"},
            "geometry": {"type": "Polygon", "coordinates": [[[0, 0], [1, 0], [1, 1], [0, 0]]]},
        }
        assert parse_feature(feature) is None

    def test_parse_uppercase_keys(self):
        feature = {
            "properties": {"SITECODE": "FR002", "SITENAME": "Zone test", "SITETYPE": "C", "AREAHA": 500},
            "geometry": {"type": "MultiPolygon", "coordinates": [[[[0, 0], [1, 0], [1, 1], [0, 0]]]]},
        }
        result = parse_feature(feature)
        assert result["site_code"] == "FR002"
        assert result["type_zone"] == "ZPS+ZSC"
        assert result["surface_ha"] == 500
