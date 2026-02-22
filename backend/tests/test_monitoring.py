"""Tests for monitoring endpoints — Sprint 24."""

import time

import pytest

from app.routes.monitoring import (
    APP_VERSION,
    _get_uptime,
    _start_time,
    router,
)


# ── Health Endpoint ──


class TestHealthEndpoint:
    @pytest.mark.anyio
    async def test_health_returns_dict(self):
        """monitoring_health should return a dict-like response."""
        from app.routes.monitoring import monitoring_health
        result = await monitoring_health()
        assert isinstance(result, dict)

    @pytest.mark.anyio
    async def test_health_has_status_key(self):
        from app.routes.monitoring import monitoring_health
        result = await monitoring_health()
        assert "status" in result

    @pytest.mark.anyio
    async def test_health_has_database_key(self):
        from app.routes.monitoring import monitoring_health
        result = await monitoring_health()
        assert "database" in result

    @pytest.mark.anyio
    async def test_health_has_redis_key(self):
        from app.routes.monitoring import monitoring_health
        result = await monitoring_health()
        assert "redis" in result

    @pytest.mark.anyio
    async def test_health_has_uptime_key(self):
        from app.routes.monitoring import monitoring_health
        result = await monitoring_health()
        assert "uptime_seconds" in result


# ── Metrics Endpoint ──


class TestMetricsEndpoint:
    @pytest.mark.anyio
    async def test_metrics_returns_dict(self):
        from app.routes.monitoring import monitoring_metrics
        result = await monitoring_metrics()
        assert isinstance(result, dict)

    @pytest.mark.anyio
    async def test_metrics_has_request_count(self):
        from app.routes.monitoring import monitoring_metrics
        result = await monitoring_metrics()
        assert "request_count" in result
        assert isinstance(result["request_count"], int)

    @pytest.mark.anyio
    async def test_metrics_has_uptime(self):
        from app.routes.monitoring import monitoring_metrics
        result = await monitoring_metrics()
        assert "uptime_seconds" in result
        assert result["uptime_seconds"] >= 0


# ── Version Endpoint ──


class TestVersionEndpoint:
    @pytest.mark.anyio
    async def test_version_returns_dict(self):
        from app.routes.monitoring import monitoring_version
        result = await monitoring_version()
        assert isinstance(result, dict)

    @pytest.mark.anyio
    async def test_version_has_app_version(self):
        from app.routes.monitoring import monitoring_version
        result = await monitoring_version()
        assert "app_version" in result

    @pytest.mark.anyio
    async def test_version_has_python_version(self):
        from app.routes.monitoring import monitoring_version
        result = await monitoring_version()
        assert "python_version" in result
        assert result["python_version"].startswith("3.")

    @pytest.mark.anyio
    async def test_version_app_version_is_3_0_0(self):
        from app.routes.monitoring import monitoring_version
        result = await monitoring_version()
        assert result["app_version"] == "3.0.0"


# ── Module-level checks ──


class TestMonitoringModule:
    def test_router_exists(self):
        assert router is not None

    def test_router_has_routes(self):
        assert len(router.routes) >= 3

    def test_start_time_is_set(self):
        assert _start_time > 0
        assert _start_time <= time.time()
