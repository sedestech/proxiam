"""ML prediction service — Sprint 23.

Deterministic feature-weighted model for project success prediction
and market benchmarking. Uses pure Python (no sklearn dependency).
"""

from typing import Optional


class ProjectSuccessPredictor:
    """Predict project success probability using weighted feature scoring.

    Uses a deterministic heuristic model based on domain knowledge
    of French renewable energy project success factors.
    """

    # Feature weights (sum = 1.0)
    WEIGHTS = {
        "has_enrichment": 0.15,
        "has_score": 0.10,
        "score_value": 0.20,
        "distance_to_grid_km": 0.15,
        "has_regulatory": 0.10,
        "has_financial": 0.10,
        "irradiation_kwh": 0.20,
    }

    def predict_success(self, project_data: dict) -> dict:
        """Predict success probability for a project.

        Args:
            project_data: Dict with optional keys:
                - has_enrichment (bool)
                - has_score (bool)
                - score_value (int, 0-100)
                - distance_to_grid_km (float)
                - has_regulatory (bool)
                - has_financial (bool)
                - irradiation_kwh (float, annual kWh/m2)

        Returns:
            Dict with probability, confidence, factors, recommendation.
        """
        factors = []
        weighted_sum = 0.0

        # has_enrichment (bool) -> 0 or 1
        has_enrichment = bool(project_data.get("has_enrichment", False))
        score = 1.0 if has_enrichment else 0.0
        weighted_sum += score * self.WEIGHTS["has_enrichment"]
        factors.append({
            "feature": "has_enrichment",
            "value": has_enrichment,
            "contribution": round(score * self.WEIGHTS["has_enrichment"], 3),
            "impact": "positive" if has_enrichment else "negative",
        })

        # has_score (bool) -> 0 or 1
        has_score = bool(project_data.get("has_score", False))
        score = 1.0 if has_score else 0.0
        weighted_sum += score * self.WEIGHTS["has_score"]
        factors.append({
            "feature": "has_score",
            "value": has_score,
            "contribution": round(score * self.WEIGHTS["has_score"], 3),
            "impact": "positive" if has_score else "negative",
        })

        # score_value (0-100) -> normalized to 0-1
        score_value = project_data.get("score_value", 0)
        if score_value is None:
            score_value = 0
        normalized_score = min(max(score_value / 100.0, 0.0), 1.0)
        weighted_sum += normalized_score * self.WEIGHTS["score_value"]
        factors.append({
            "feature": "score_value",
            "value": score_value,
            "contribution": round(normalized_score * self.WEIGHTS["score_value"], 3),
            "impact": "positive" if score_value >= 60 else "negative" if score_value < 40 else "neutral",
        })

        # distance_to_grid_km -> closer is better (0km=1.0, 50km+=0.0)
        distance = project_data.get("distance_to_grid_km")
        if distance is not None and distance >= 0:
            dist_score = max(0.0, 1.0 - (distance / 50.0))
        else:
            dist_score = 0.5  # Unknown distance = neutral
        weighted_sum += dist_score * self.WEIGHTS["distance_to_grid_km"]
        factors.append({
            "feature": "distance_to_grid_km",
            "value": distance,
            "contribution": round(dist_score * self.WEIGHTS["distance_to_grid_km"], 3),
            "impact": "positive" if dist_score > 0.7 else "negative" if dist_score < 0.3 else "neutral",
        })

        # has_regulatory (bool)
        has_regulatory = bool(project_data.get("has_regulatory", False))
        score = 1.0 if has_regulatory else 0.0
        weighted_sum += score * self.WEIGHTS["has_regulatory"]
        factors.append({
            "feature": "has_regulatory",
            "value": has_regulatory,
            "contribution": round(score * self.WEIGHTS["has_regulatory"], 3),
            "impact": "positive" if has_regulatory else "negative",
        })

        # has_financial (bool)
        has_financial = bool(project_data.get("has_financial", False))
        score = 1.0 if has_financial else 0.0
        weighted_sum += score * self.WEIGHTS["has_financial"]
        factors.append({
            "feature": "has_financial",
            "value": has_financial,
            "contribution": round(score * self.WEIGHTS["has_financial"], 3),
            "impact": "positive" if has_financial else "negative",
        })

        # irradiation_kwh (annual kWh/m2, typical range 1000-1800 in France)
        irradiation = project_data.get("irradiation_kwh")
        if irradiation is not None and irradiation > 0:
            # Normalize: 1000 = 0.0, 1800 = 1.0
            irr_score = min(max((irradiation - 1000) / 800.0, 0.0), 1.0)
        else:
            irr_score = 0.0  # No irradiation data = 0
        weighted_sum += irr_score * self.WEIGHTS["irradiation_kwh"]
        factors.append({
            "feature": "irradiation_kwh",
            "value": irradiation,
            "contribution": round(irr_score * self.WEIGHTS["irradiation_kwh"], 3),
            "impact": "positive" if irr_score > 0.5 else "negative" if irr_score == 0 else "neutral",
        })

        # Clamp probability
        probability = round(min(max(weighted_sum, 0.0), 1.0), 3)

        # Determine confidence based on data completeness
        data_points = sum(1 for k in self.WEIGHTS if project_data.get(k) is not None)
        total_features = len(self.WEIGHTS)

        if data_points >= total_features - 1:
            confidence = "high"
        elif data_points >= total_features // 2:
            confidence = "medium"
        else:
            confidence = "low"

        # Generate recommendation
        recommendation = self._generate_recommendation(probability, factors)

        return {
            "probability": probability,
            "confidence": confidence,
            "factors": factors,
            "recommendation": recommendation,
        }

    def _generate_recommendation(self, probability: float, factors: list[dict]) -> str:
        """Generate actionable recommendation based on prediction."""
        if probability >= 0.75:
            return "Excellent project profile. Proceed with full development and permitting."
        elif probability >= 0.50:
            # Find weakest factor
            negative_factors = [f for f in factors if f["impact"] == "negative"]
            if negative_factors:
                weakest = min(negative_factors, key=lambda f: f["contribution"])
                return (
                    f"Good potential. Priority improvement: {weakest['feature']} "
                    f"(currently contributing {weakest['contribution']:.3f})."
                )
            return "Good potential. Continue data collection and enrichment."
        elif probability >= 0.25:
            return "Moderate risk. Additional due diligence recommended before investment."
        else:
            return "High risk profile. Consider alternative site or additional feasibility studies."


class MarketBenchmark:
    """Compare project metrics against French ENR market averages."""

    # French ENR market averages (2025-2026 data)
    MARKET_AVERAGES = {
        "solaire_sol": {
            "lcoe_eur_mwh": {"min": 45, "max": 55, "avg": 50},
            "capacity_factor_pct": {"min": 12, "max": 15, "avg": 13.5},
            "capex_eur_kwc": {"min": 600, "max": 900, "avg": 750},
            "irradiation_kwh": {"min": 1200, "max": 1700, "avg": 1400},
        },
        "eolien_onshore": {
            "lcoe_eur_mwh": {"min": 50, "max": 65, "avg": 57},
            "capacity_factor_pct": {"min": 20, "max": 30, "avg": 25},
            "capex_eur_kwc": {"min": 1100, "max": 1500, "avg": 1300},
            "irradiation_kwh": {"min": 0, "max": 0, "avg": 0},  # N/A for wind
        },
        "bess": {
            "lcoe_eur_mwh": {"min": 80, "max": 120, "avg": 100},
            "capacity_factor_pct": {"min": 15, "max": 25, "avg": 20},
            "capex_eur_kwc": {"min": 200, "max": 400, "avg": 300},
            "irradiation_kwh": {"min": 0, "max": 0, "avg": 0},  # N/A for BESS
        },
    }

    def benchmark_against_market(self, project: dict) -> dict:
        """Compare project metrics against market averages.

        Args:
            project: Dict with optional keys:
                - filiere (str): solaire_sol, eolien_onshore, bess
                - lcoe_eur_mwh (float)
                - capacity_factor_pct (float)
                - capex_eur_kwc (float)
                - irradiation_kwh (float)

        Returns:
            Dict with percentile, market_position, comparisons.
        """
        filiere = project.get("filiere", "solaire_sol")
        market = self.MARKET_AVERAGES.get(filiere, self.MARKET_AVERAGES["solaire_sol"])

        comparisons = []
        percentile_scores = []

        # LCOE comparison (lower is better)
        lcoe = project.get("lcoe_eur_mwh")
        if lcoe is not None:
            avg = market["lcoe_eur_mwh"]["avg"]
            range_size = market["lcoe_eur_mwh"]["max"] - market["lcoe_eur_mwh"]["min"]
            if range_size > 0:
                # Invert: lower LCOE = higher percentile
                pct = max(0, min(100, int(100 * (1 - (lcoe - market["lcoe_eur_mwh"]["min"]) / range_size))))
            else:
                pct = 50
            percentile_scores.append(pct)
            comparisons.append({
                "metric": "lcoe_eur_mwh",
                "project_value": lcoe,
                "market_avg": avg,
                "market_range": [market["lcoe_eur_mwh"]["min"], market["lcoe_eur_mwh"]["max"]],
                "percentile": pct,
                "verdict": "above_average" if lcoe < avg else "below_average",
            })

        # Capacity factor (higher is better)
        cf = project.get("capacity_factor_pct")
        if cf is not None:
            avg = market["capacity_factor_pct"]["avg"]
            range_size = market["capacity_factor_pct"]["max"] - market["capacity_factor_pct"]["min"]
            if range_size > 0:
                pct = max(0, min(100, int(100 * (cf - market["capacity_factor_pct"]["min"]) / range_size)))
            else:
                pct = 50
            percentile_scores.append(pct)
            comparisons.append({
                "metric": "capacity_factor_pct",
                "project_value": cf,
                "market_avg": avg,
                "market_range": [market["capacity_factor_pct"]["min"], market["capacity_factor_pct"]["max"]],
                "percentile": pct,
                "verdict": "above_average" if cf > avg else "below_average",
            })

        # CAPEX (lower is better)
        capex = project.get("capex_eur_kwc")
        if capex is not None:
            avg = market["capex_eur_kwc"]["avg"]
            range_size = market["capex_eur_kwc"]["max"] - market["capex_eur_kwc"]["min"]
            if range_size > 0:
                pct = max(0, min(100, int(100 * (1 - (capex - market["capex_eur_kwc"]["min"]) / range_size))))
            else:
                pct = 50
            percentile_scores.append(pct)
            comparisons.append({
                "metric": "capex_eur_kwc",
                "project_value": capex,
                "market_avg": avg,
                "market_range": [market["capex_eur_kwc"]["min"], market["capex_eur_kwc"]["max"]],
                "percentile": pct,
                "verdict": "above_average" if capex < avg else "below_average",
            })

        # Irradiation (higher is better, solar only)
        irr = project.get("irradiation_kwh")
        if irr is not None and market["irradiation_kwh"]["avg"] > 0:
            avg = market["irradiation_kwh"]["avg"]
            range_size = market["irradiation_kwh"]["max"] - market["irradiation_kwh"]["min"]
            if range_size > 0:
                pct = max(0, min(100, int(100 * (irr - market["irradiation_kwh"]["min"]) / range_size)))
            else:
                pct = 50
            percentile_scores.append(pct)
            comparisons.append({
                "metric": "irradiation_kwh",
                "project_value": irr,
                "market_avg": avg,
                "market_range": [market["irradiation_kwh"]["min"], market["irradiation_kwh"]["max"]],
                "percentile": pct,
                "verdict": "above_average" if irr > avg else "below_average",
            })

        # Overall percentile
        if percentile_scores:
            percentile = int(sum(percentile_scores) / len(percentile_scores))
        else:
            percentile = 50  # Default when no data

        # Market position label
        if percentile >= 75:
            market_position = "top_quartile"
        elif percentile >= 50:
            market_position = "above_average"
        elif percentile >= 25:
            market_position = "below_average"
        else:
            market_position = "bottom_quartile"

        return {
            "percentile": percentile,
            "market_position": market_position,
            "filiere": filiere,
            "comparisons": comparisons,
        }


# Singletons
predictor = ProjectSuccessPredictor()
benchmark = MarketBenchmark()
