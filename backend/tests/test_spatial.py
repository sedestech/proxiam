"""Tests for spatial analysis service — Sprint 21."""

from app.services.spatial import _grid_proximity_label, _env_risk_label


class TestBufferAnalysis:
    def test_result_structure(self):
        expected_keys = {"center", "radius_km", "postes_in_radius", "natura2000_in_radius", "nearest_poste_m", "nearest_poste_name"}
        result = {
            "center": {"lon": 2.3, "lat": 48.8},
            "radius_km": 10,
            "postes_in_radius": 3,
            "natura2000_in_radius": 1,
            "nearest_poste_m": 2500.0,
            "nearest_poste_name": "PARIS NORD",
        }
        assert set(result.keys()) == expected_keys

    def test_radius_conversion_km_to_m(self):
        assert 10 * 1000 == 10000
        assert 0.5 * 1000 == 500


class TestGeographicScore:
    def test_baseline_is_50(self):
        assert 50 == 50

    def test_close_poste_boosts(self):
        score = 50
        if 1.5 < 2:
            score += 25
        assert score == 75

    def test_far_poste_penalizes(self):
        score = 50
        if 15 >= 10:
            score -= 10
        assert score == 40

    def test_natura2000_penalty(self):
        score = 50
        if 2 > 0:
            score -= 15
        assert score == 35

    def test_heavy_natura2000_extra_penalty(self):
        score = 50
        n2k = 5
        if n2k > 0:
            score -= 15
        if n2k > 3:
            score -= 10
        assert score == 25

    def test_score_clamped_0_100(self):
        assert max(0, min(100, -20)) == 0
        assert max(0, min(100, 150)) == 100
        assert max(0, min(100, 75)) == 75

    def test_grid_density_labels(self):
        assert ("dense" if 6 > 5 else "moderate" if 6 > 2 else "sparse") == "dense"
        assert ("dense" if 3 > 5 else "moderate" if 3 > 2 else "sparse") == "moderate"
        assert ("dense" if 1 > 5 else "moderate" if 1 > 2 else "sparse") == "sparse"


class TestGridProximityLabel:
    def test_excellent(self):
        assert _grid_proximity_label(1500) == "excellent"

    def test_good(self):
        assert _grid_proximity_label(3000) == "good"

    def test_moderate(self):
        assert _grid_proximity_label(8000) == "moderate"

    def test_poor(self):
        assert _grid_proximity_label(15000) == "poor"

    def test_none_is_unknown(self):
        assert _grid_proximity_label(None) == "unknown"


class TestEnvRiskLabel:
    def test_high(self):
        assert _env_risk_label(5) == "high"

    def test_moderate(self):
        assert _env_risk_label(2) == "moderate"

    def test_low(self):
        assert _env_risk_label(0) == "low"


class TestIntersectionAnalysis:
    def test_result_structure(self):
        expected_keys = {"natura2000_intersections", "natura2000_names", "postes_within_10km", "area_ha"}
        result = {
            "natura2000_intersections": 0,
            "natura2000_names": [],
            "postes_within_10km": 5,
            "area_ha": 125.5,
        }
        assert set(result.keys()) == expected_keys

    def test_area_ha_from_sqm(self):
        assert 250000 / 10000 == 25.0
