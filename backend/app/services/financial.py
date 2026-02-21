"""Service d'estimation financiere — Sprint 15.

Modele simplifie de business case pour projets ENR en France.
Benchmarks marche charges depuis data/config/financial_constants.json (versionne).

Sources benchmarks :
- CRE AO S1 2026, ADEME Couts ENR 2025, Bloomberg NEF 2025
- FEE Observatoire eolien 2025, RTE Bilan Previsionnel 2025

Note : Ce n'est PAS un business plan complet. C'est une estimation
rapide pour le screening de sites (precision +/- 20%).
"""
import json
import logging
from pathlib import Path
from typing import Any, Dict, Optional

logger = logging.getLogger(__name__)

# ─── Chargement des constantes financieres versionnees ────────────

_CONSTANTS_PATH = Path(__file__).resolve().parent.parent.parent / "data" / "config" / "financial_constants.json"
_constants_cache: Optional[Dict[str, Any]] = None


def _load_constants() -> Dict[str, Any]:
    """Load financial constants from versioned JSON config.

    Uses a module-level cache to avoid re-reading the file on every call.
    """
    global _constants_cache
    if _constants_cache is not None:
        return _constants_cache
    with open(_CONSTANTS_PATH, encoding="utf-8") as f:
        _constants_cache = json.load(f)
    logger.info("Financial constants loaded: version=%s, date=%s", _constants_cache["version"], _constants_cache["date"])
    return _constants_cache


def get_financial_version() -> Dict[str, Any]:
    """Return metadata about the loaded financial constants."""
    c = _load_constants()
    return {"version": c["version"], "date": c["date"], "sources": c["sources"]}


# ─── Benchmarks marche France (depuis JSON versionne) ─────────────

CAPEX_BENCHMARKS = _load_constants()["capex"]
OPEX_PCT = _load_constants()["opex_pct"]
LIFETIME = _load_constants()["lifetime"]
FACTEUR_CHARGE = _load_constants()["facteur_charge"]
PRIX_VENTE = _load_constants()["prix_vente"]
RACCORDEMENT_COST = _load_constants()["raccordement"]
DISCOUNT_RATE = _load_constants()["discount_rate"]


# ─── Calculs financiers ──────────────────────────────────────────

def _calc_capex(filiere: str, puissance_mwc: float, distance_poste_km: Optional[float]) -> Dict:
    """Estimate CAPEX (installation + raccordement)."""
    bench = CAPEX_BENCHMARKS.get(filiere, CAPEX_BENCHMARKS["solaire_sol"])
    puissance_kwc = puissance_mwc * 1000

    if filiere == "bess":
        # BESS: CAPEX en EUR/kWh, on assume 4h de stockage
        heures_stockage = 4
        capacite_kwh = puissance_kwc * heures_stockage
        capex_min = bench["min"] * capacite_kwh
        capex_median = bench["median"] * capacite_kwh
        capex_max = bench["max"] * capacite_kwh
    else:
        capex_min = bench["min"] * puissance_kwc
        capex_median = bench["median"] * puissance_kwc
        capex_max = bench["max"] * puissance_kwc

    # Raccordement
    racc = RACCORDEMENT_COST.get(filiere, RACCORDEMENT_COST["solaire_sol"])
    racc_cost = racc["median"] * puissance_kwc
    if distance_poste_km and distance_poste_km > 5:
        racc_cost *= 1 + (distance_poste_km - 5) * 0.1  # +10% par km > 5km

    return {
        "installation_eur": {
            "min": round(capex_min),
            "median": round(capex_median),
            "max": round(capex_max),
        },
        "raccordement_eur": round(racc_cost),
        "total_eur": round(capex_median + racc_cost),
        "eur_par_kwc": round(bench["median"] + racc["median"]),
        "tendance": bench["tendance"],
        "source": ", ".join(_load_constants()["sources"]),
    }


def _calc_opex(filiere: str, capex_total: float) -> Dict:
    """Estimate annual OPEX."""
    pct = OPEX_PCT.get(filiere, 2.0)
    annual = capex_total * pct / 100
    return {
        "annuel_eur": round(annual),
        "pct_capex": pct,
        "lifetime_total_eur": round(annual * LIFETIME.get(filiere, 25)),
    }


def _calc_revenus(
    filiere: str, puissance_mwc: float, productible_kwh_kwc: Optional[float],
) -> Dict:
    """Estimate annual revenues."""
    puissance_kwc = puissance_mwc * 1000

    if filiere == "bess":
        # BESS revenues = multi-flux
        prix = PRIX_VENTE["bess"]
        heures_an = 8760
        # Simplification : FCR 8h/jour + arbitrage 4h/jour
        revenu_fcr = puissance_mwc * prix["fcr"] * 8 * 365
        revenu_arbitrage = puissance_mwc * prix["arbitrage"] * 4 * 365
        revenu_capacite = puissance_mwc * prix["capacite"] * heures_an
        total = revenu_fcr + revenu_arbitrage + revenu_capacite
        return {
            "annuel_eur": round(total),
            "detail": {
                "fcr": round(revenu_fcr),
                "arbitrage": round(revenu_arbitrage),
                "capacite": round(revenu_capacite),
            },
            "prix_moyen_mwh": None,
            "mecanisme": "multi-flux (FCR + arbitrage + capacite)",
        }

    # Solar / Wind
    if productible_kwh_kwc:
        production_kwh = productible_kwh_kwc * puissance_kwc
    else:
        fc = FACTEUR_CHARGE.get(filiere, 0.14)
        production_kwh = puissance_kwc * fc * 8760

    production_mwh = production_kwh / 1000
    prix = PRIX_VENTE.get(filiere, PRIX_VENTE["solaire_sol"])

    return {
        "annuel_eur": round(production_mwh * prix["cre_ao"]),
        "production_mwh_an": round(production_mwh),
        "detail": {
            "cre_ao": round(production_mwh * prix["cre_ao"]),
            "ppa": round(production_mwh * prix["ppa"]),
            "marche": round(production_mwh * prix["marche"]),
        },
        "prix_moyen_mwh": prix["cre_ao"],
        "mecanisme": "tarif CRE AO (scenario de base)",
    }


def _calc_lcoe(
    capex_total: float, opex_annuel: float, production_mwh_an: float,
    lifetime: int, discount_rate: float,
) -> float:
    """Calculate Levelized Cost of Energy (EUR/MWh)."""
    if production_mwh_an <= 0:
        return 0.0

    # Sum of discounted costs / sum of discounted production
    total_cost = capex_total
    total_prod = 0.0
    for year in range(1, lifetime + 1):
        factor = 1 / (1 + discount_rate) ** year
        total_cost += opex_annuel * factor
        total_prod += production_mwh_an * factor

    if total_prod <= 0:
        return 0.0
    return round(total_cost / total_prod, 1)


def _calc_tri(
    capex_total: float, revenu_annuel: float, opex_annuel: float,
    lifetime: int,
) -> Dict:
    """Estimate TRI (IRR) and payback period."""
    cashflow_annuel = revenu_annuel - opex_annuel
    if cashflow_annuel <= 0:
        return {"tri_pct": 0.0, "payback_years": None, "rentable": False}

    payback = capex_total / cashflow_annuel if cashflow_annuel > 0 else None

    # Newton-Raphson for IRR
    irr = 0.05  # initial guess
    for _ in range(100):
        npv = -capex_total
        d_npv = 0.0
        for year in range(1, lifetime + 1):
            factor = (1 + irr) ** year
            npv += cashflow_annuel / factor
            d_npv -= year * cashflow_annuel / (factor * (1 + irr))
        if abs(d_npv) < 1e-10:
            break
        irr = irr - npv / d_npv
        if irr < -0.5:
            irr = -0.5
            break
        if irr > 1.0:
            irr = 1.0
            break

    return {
        "tri_pct": round(irr * 100, 1),
        "payback_years": round(payback, 1) if payback else None,
        "rentable": irr > DISCOUNT_RATE,
        "cashflow_annuel_eur": round(cashflow_annuel),
    }


# ─── API publique ─────────────────────────────────────────────────

def estimate_financial(
    filiere: str,
    puissance_mwc: float,
    surface_ha: Optional[float] = None,
    enrichment_data: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """Estimate financial parameters for a project.

    Uses enrichment data (PVGIS productible, nearest poste distance)
    when available, otherwise falls back to benchmarks.

    Returns: capex, opex, revenus, lcoe, tri, benchmarks, assumptions.
    """
    # Extract enrichment values
    productible = None
    distance_poste_km = None
    if enrichment_data:
        pvgis = enrichment_data.get("pvgis", {})
        productible = pvgis.get("productible_kwh_kwc_an")
        postes = enrichment_data.get("nearest_postes", [])
        if postes:
            distance_poste_km = postes[0].get("distance_km")

    lifetime = LIFETIME.get(filiere, 25)

    # CAPEX
    capex = _calc_capex(filiere, puissance_mwc, distance_poste_km)

    # OPEX
    opex = _calc_opex(filiere, capex["total_eur"])

    # Revenus
    revenus = _calc_revenus(filiere, puissance_mwc, productible)

    # LCOE
    production_mwh = revenus.get("production_mwh_an", 0)
    if filiere == "bess":
        # For BESS, LCOE is less meaningful — use cost per cycle
        lcoe = 0.0
    else:
        lcoe = _calc_lcoe(
            capex["total_eur"], opex["annuel_eur"],
            production_mwh, lifetime, DISCOUNT_RATE,
        )

    # TRI
    tri = _calc_tri(
        capex["total_eur"], revenus["annuel_eur"],
        opex["annuel_eur"], lifetime,
    )

    return {
        "capex": capex,
        "opex": opex,
        "revenus": revenus,
        "lcoe_eur_mwh": lcoe,
        "tri": tri,
        "lifetime_years": lifetime,
        "assumptions": {
            "discount_rate_pct": DISCOUNT_RATE * 100,
            "productible_source": "pvgis" if productible else "benchmark",
            "distance_poste_km": distance_poste_km,
            "bess_heures_stockage": 4 if filiere == "bess" else None,
        },
        "disclaimer": (
            "Estimation indicative (+/- 20%) pour le screening de sites. "
            "Ne remplace pas un business plan detaille."
        ),
    }
