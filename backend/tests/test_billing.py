"""Tests for billing, API keys, and collaboration — Sprint 22."""

from app.models.subscription import ApiKey, ProjectShare, Subscription
from app.services.billing import (
    PLAN_FEATURES,
    PLAN_PRICES,
    generate_api_key,
)


class TestSubscriptionModel:
    def test_tablename(self):
        assert Subscription.__tablename__ == "subscriptions"

    def test_required_columns(self):
        cols = {c.name for c in Subscription.__table__.columns}
        for col in ("id", "user_id", "plan", "status", "stripe_customer_id"):
            assert col in cols

    def test_plan_values(self):
        for plan in ("free", "pro", "enterprise"):
            sub = Subscription(user_id="test", plan=plan)
            assert sub.plan == plan


class TestApiKeyModel:
    def test_tablename(self):
        assert ApiKey.__tablename__ == "api_keys"

    def test_required_columns(self):
        cols = {c.name for c in ApiKey.__table__.columns}
        for col in ("id", "user_id", "key_hash", "key_prefix", "name", "scopes", "rate_limit"):
            assert col in cols


class TestProjectShareModel:
    def test_tablename(self):
        assert ProjectShare.__tablename__ == "project_shares"

    def test_required_columns(self):
        cols = {c.name for c in ProjectShare.__table__.columns}
        for col in ("id", "project_id", "owner_id", "shared_with_id", "permission"):
            assert col in cols


class TestPlanConfig:
    def test_three_plans_exist(self):
        assert set(PLAN_PRICES.keys()) == {"free", "pro", "enterprise"}

    def test_free_is_zero(self):
        assert PLAN_PRICES["free"] == 0

    def test_pro_price(self):
        assert PLAN_PRICES["pro"] > 0

    def test_enterprise_highest(self):
        assert PLAN_PRICES["enterprise"] > PLAN_PRICES["pro"]

    def test_free_limits(self):
        f = PLAN_FEATURES["free"]
        assert f["max_projects"] == 3
        assert f["api_access"] is False
        assert f["collaboration"] is False

    def test_pro_features(self):
        p = PLAN_FEATURES["pro"]
        assert p["max_projects"] == 50
        assert p["api_access"] is True
        assert p["collaboration"] is True
        assert p["pdf_export"] is True

    def test_enterprise_unlimited(self):
        e = PLAN_FEATURES["enterprise"]
        assert e["max_projects"] == -1
        assert e["max_enrichments_day"] == -1


class TestApiKeyGeneration:
    def test_key_starts_with_prefix(self):
        full, key_hash, prefix = generate_api_key()
        assert full.startswith("pxm_")

    def test_key_hash_is_64_chars(self):
        _, key_hash, _ = generate_api_key()
        assert len(key_hash) == 64

    def test_prefix_is_12_chars(self):
        _, _, prefix = generate_api_key()
        assert len(prefix) == 12

    def test_keys_are_unique(self):
        keys = set()
        for _ in range(10):
            full, _, _ = generate_api_key()
            keys.add(full)
        assert len(keys) == 10

    def test_hash_is_deterministic(self):
        import hashlib
        full, key_hash, _ = generate_api_key()
        assert hashlib.sha256(full.encode()).hexdigest() == key_hash
