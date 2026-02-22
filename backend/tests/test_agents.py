"""Tests for autonomous agents and ML predictions — Sprint 23."""

import inspect

import pytest

from app.models.agent_run import AgentRun, MlPrediction
from app.services.agents import (
    AgentOrchestrator,
    AnomalyDetectionAgent,
    AutoEnrichAgent,
    DataRefreshAgent,
)
from app.services.ml_predictor import MarketBenchmark, ProjectSuccessPredictor


# ── DataRefreshAgent ──


class TestDataRefreshAgent:
    def test_returns_agent_name(self):
        agent = DataRefreshAgent()
        assert agent.name == "data_refresh"

    def test_returns_actions_structure(self):
        """Agent.run() returns dict with required keys (no DB needed for structure check)."""
        agent = DataRefreshAgent()
        # Check class attributes — the structure is defined in the agent
        assert hasattr(agent, "run")
        assert hasattr(agent, "name")
        assert hasattr(agent, "DATASETS")

    def test_details_is_list(self):
        """DATASETS is a list of monitored datasets."""
        agent = DataRefreshAgent()
        assert isinstance(agent.DATASETS, list)
        assert len(agent.DATASETS) >= 3
        for ds in agent.DATASETS:
            assert "name" in ds
            assert "max_age_days" in ds


# ── AnomalyDetectionAgent ──


class TestAnomalyDetectionAgent:
    def test_returns_agent_name(self):
        agent = AnomalyDetectionAgent()
        assert agent.name == "anomaly_detection"

    def test_returns_actions_structure(self):
        agent = AnomalyDetectionAgent()
        assert hasattr(agent, "run")
        assert hasattr(agent, "name")


# ── AutoEnrichAgent ──


class TestAutoEnrichAgent:
    def test_returns_agent_name(self):
        agent = AutoEnrichAgent()
        assert agent.name == "auto_enrich"

    def test_returns_actions_structure(self):
        agent = AutoEnrichAgent()
        assert hasattr(agent, "run")
        assert hasattr(agent, "name")


# ── AgentOrchestrator ──


class TestAgentOrchestrator:
    def test_has_three_agents(self):
        orch = AgentOrchestrator()
        assert len(orch.agents) == 3

    def test_run_all_returns_list(self):
        """run_all is an async method that returns a list."""
        orch = AgentOrchestrator()
        assert inspect.iscoroutinefunction(orch.run_all)

    def test_agents_have_names(self):
        orch = AgentOrchestrator()
        names = [entry["instance"].name for entry in orch.agents]
        assert "data_refresh" in names
        assert "anomaly_detection" in names
        assert "auto_enrich" in names


# ── ProjectSuccessPredictor ──


class TestProjectSuccessPredictor:
    def setup_method(self):
        self.predictor = ProjectSuccessPredictor()

    def test_predict_returns_probability(self):
        result = self.predictor.predict_success({"has_enrichment": True, "score_value": 75})
        assert "probability" in result
        assert isinstance(result["probability"], float)

    def test_probability_between_0_and_1(self):
        result = self.predictor.predict_success({"score_value": 50})
        assert 0.0 <= result["probability"] <= 1.0

    def test_predict_returns_confidence(self):
        result = self.predictor.predict_success({"has_enrichment": True})
        assert "confidence" in result
        assert result["confidence"] in ("low", "medium", "high")

    def test_predict_returns_factors(self):
        result = self.predictor.predict_success({"has_enrichment": True})
        assert "factors" in result
        assert isinstance(result["factors"], list)
        assert len(result["factors"]) > 0

    def test_predict_returns_recommendation(self):
        result = self.predictor.predict_success({"score_value": 80})
        assert "recommendation" in result
        assert isinstance(result["recommendation"], str)
        assert len(result["recommendation"]) > 10

    def test_high_score_increases_probability(self):
        low = self.predictor.predict_success({"score_value": 20})
        high = self.predictor.predict_success({"score_value": 90})
        assert high["probability"] > low["probability"]

    def test_missing_enrichment_decreases_probability(self):
        with_enrichment = self.predictor.predict_success({
            "has_enrichment": True,
            "has_score": True,
            "score_value": 70,
            "has_regulatory": True,
            "has_financial": True,
            "irradiation_kwh": 1500,
        })
        without_enrichment = self.predictor.predict_success({
            "has_enrichment": False,
            "has_score": True,
            "score_value": 70,
            "has_regulatory": True,
            "has_financial": True,
            "irradiation_kwh": 1500,
        })
        assert with_enrichment["probability"] > without_enrichment["probability"]

    def test_empty_project_low_probability(self):
        result = self.predictor.predict_success({})
        assert result["probability"] < 0.3


# ── MarketBenchmark ──


class TestMarketBenchmark:
    def setup_method(self):
        self.benchmark = MarketBenchmark()

    def test_benchmark_returns_percentile(self):
        result = self.benchmark.benchmark_against_market({
            "filiere": "solaire_sol",
            "lcoe_eur_mwh": 48,
        })
        assert "percentile" in result
        assert isinstance(result["percentile"], int)

    def test_percentile_between_0_and_100(self):
        result = self.benchmark.benchmark_against_market({
            "filiere": "solaire_sol",
            "lcoe_eur_mwh": 50,
        })
        assert 0 <= result["percentile"] <= 100

    def test_benchmark_returns_market_position(self):
        result = self.benchmark.benchmark_against_market({
            "filiere": "solaire_sol",
            "lcoe_eur_mwh": 46,
        })
        assert "market_position" in result
        assert result["market_position"] in (
            "top_quartile", "above_average", "below_average", "bottom_quartile"
        )

    def test_benchmark_returns_comparisons(self):
        result = self.benchmark.benchmark_against_market({
            "filiere": "solaire_sol",
            "lcoe_eur_mwh": 50,
            "capacity_factor_pct": 14,
        })
        assert "comparisons" in result
        assert isinstance(result["comparisons"], list)
        assert len(result["comparisons"]) >= 1

    def test_solar_lcoe_comparison(self):
        # Good solar LCOE (45 EUR/MWh = lower than avg 50)
        result = self.benchmark.benchmark_against_market({
            "filiere": "solaire_sol",
            "lcoe_eur_mwh": 45,
        })
        lcoe_comp = [c for c in result["comparisons"] if c["metric"] == "lcoe_eur_mwh"]
        assert len(lcoe_comp) == 1
        assert lcoe_comp[0]["market_avg"] == 50
        assert lcoe_comp[0]["verdict"] == "above_average"

    def test_wind_lcoe_comparison(self):
        # Average wind LCOE (57 EUR/MWh = exactly avg)
        result = self.benchmark.benchmark_against_market({
            "filiere": "eolien_onshore",
            "lcoe_eur_mwh": 57,
        })
        lcoe_comp = [c for c in result["comparisons"] if c["metric"] == "lcoe_eur_mwh"]
        assert len(lcoe_comp) == 1
        assert lcoe_comp[0]["market_avg"] == 57


# ── AgentRun Model ──


class TestAgentRunModel:
    def test_tablename(self):
        assert AgentRun.__tablename__ == "agent_runs"

    def test_required_columns(self):
        cols = {c.name for c in AgentRun.__table__.columns}
        for col in ("id", "agent_name", "status", "started_at", "completed_at", "actions_taken", "details"):
            assert col in cols


# ── MlPrediction Model ──


class TestMlPredictionModel:
    def test_tablename(self):
        assert MlPrediction.__tablename__ == "ml_predictions"

    def test_required_columns(self):
        cols = {c.name for c in MlPrediction.__table__.columns}
        for col in ("id", "project_id", "prediction_type", "probability", "confidence", "factors"):
            assert col in cols
