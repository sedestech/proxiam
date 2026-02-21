"""AI service — Sprint 5 + Sprint 14 (expert consultant).

Provides project analysis using Anthropic Claude API.
Falls back to template-based analysis when no API key is configured.

Sprint 14: Enhanced to act as a senior ENR consultant with:
- Enrichment data context (PVGIS, constraints, postes)
- Regulatory analysis context
- Practical tips and field experience (AVEIL-style)

Functions:
  analyze_project  — full project analysis with recommendations
"""
from typing import Optional, Dict, Any, List

import logging

from app.config import settings

logger = logging.getLogger(__name__)

_client = None


def _get_client():
    """Lazy-init Anthropic client. Returns None if no API key."""
    global _client
    if _client is not None:
        return _client
    if not settings.anthropic_api_key:
        logger.info("No Anthropic API key — using template fallback")
        return None
    try:
        import anthropic
        _client = anthropic.Anthropic(api_key=settings.anthropic_api_key)
        return _client
    except Exception as e:
        logger.warning("Failed to init Anthropic client: %s", e)
        return None


# ─── Template fallback ───────────────────────────────────────────

FILIERE_RECOMMENDATIONS = {
    "solaire_sol": {
        "strengths": [
            "Filiere mature avec des couts en baisse continue",
            "Irradiation favorable dans le sud de la France",
            "Cadre reglementaire bien etabli (ICPE, PLU)",
        ],
        "risks": [
            "Saturation potentielle des postes sources dans certaines zones",
            "Concurrence fonciere avec l'agriculture",
            "Delais d'instruction des autorisations (12-24 mois)",
        ],
        "next_steps": [
            "Verifier la capacite d'accueil du poste source le plus proche",
            "Lancer l'etude d'impact environnemental",
            "Consulter le PLU/PLUi pour la compatibilite urbanistique",
            "Preparer le dossier ICPE si puissance > 250 kWc",
        ],
    },
    "eolien_onshore": {
        "strengths": [
            "Bon potentiel eolien dans le nord et les zones cotieres",
            "Technologie mature avec des rendements previsibles",
            "Contribution significative au mix energetique",
        ],
        "risks": [
            "Opposition locale frequente (nuisances visuelles et sonores)",
            "Contraintes radar militaire et aviation civile",
            "Etudes environnementales longues (chiropteres, avifaune)",
            "Raccordement reseau couteux en zones rurales",
        ],
        "next_steps": [
            "Realiser une etude de vent sur 12 mois minimum",
            "Consulter la DREAL pour les contraintes environnementales",
            "Verifier les servitudes aeronautiques (DGAC)",
            "Engager la concertation avec les elus locaux",
        ],
    },
    "bess": {
        "strengths": [
            "Marche en forte croissance (flexibilite reseau)",
            "Revenus multiples (reserves, arbitrage, capacite)",
            "Empreinte fonciere reduite",
        ],
        "risks": [
            "Technologie en evolution rapide (risque d'obsolescence)",
            "Reglementation ICPE en cours de clarification",
            "Dependance aux prix de l'electricite sur les marches",
            "Risque incendie necessitant des mesures de securite specifiques",
        ],
        "next_steps": [
            "Etudier les mecanismes de marche (FCR, aFRR, arbitrage)",
            "Verifier la proximite et capacite du poste source",
            "Analyser la rentabilite sur 15 ans avec scenarios de prix",
            "Consulter le SDIS pour les exigences incendie",
        ],
    },
}

DEFAULT_RECOMMENDATIONS = {
    "strengths": [
        "Secteur ENR en croissance soutenue en France",
        "Cadre reglementaire encourage le developpement",
        "Technologies matures et eprouvees",
    ],
    "risks": [
        "Delais administratifs potentiellement longs",
        "Contraintes environnementales a evaluer",
        "Capacite reseau a verifier",
    ],
    "next_steps": [
        "Definir la filiere et la puissance cible",
        "Realiser une etude de faisabilite",
        "Consulter les collectivites locales",
    ],
}


def _score_insight(criterion: str, value: int) -> str:
    """Generate a human-readable insight for a scoring criterion."""
    insights = {
        "proximite_reseau": {
            "high": "Excellente proximite au reseau electrique — raccordement facilite",
            "medium": "Distance au poste source acceptable — verifier les couts de raccordement",
            "low": "Eloignement du reseau — le raccordement representera un cout significatif",
        },
        "urbanisme": {
            "high": "Zone favorable du point de vue urbanistique",
            "medium": "Compatibilite urbanistique a verifier avec le PLU/PLUi",
            "low": "Contraintes urbanistiques fortes — etude approfondie necessaire",
        },
        "environnement": {
            "high": "Faible sensibilite environnementale — procedures simplifiees",
            "medium": "Sensibilite environnementale moderee — etude d'impact recommandee",
            "low": "Zone a forte sensibilite — etude environnementale approfondie obligatoire",
        },
        "irradiation": {
            "high": "Excellent potentiel de ressource pour cette filiere",
            "medium": "Potentiel de ressource correct — productible a affiner",
            "low": "Potentiel de ressource limite — etude de productible indispensable",
        },
        "accessibilite": {
            "high": "Site bien accessible — logistique de chantier facilitee",
            "medium": "Accessibilite correcte — verifier les acces pour le transport exceptionnel",
            "low": "Acces difficile — prevoir des amenagements routiers",
        },
        "risques": {
            "high": "Profil de risque faible — projet bien positionne",
            "medium": "Risques identifies et geres — surveillance recommandee",
            "low": "Plusieurs risques significatifs — plan de mitigation necessaire",
        },
    }

    level = "high" if value >= 75 else "medium" if value >= 50 else "low"
    return insights.get(criterion, {}).get(level, f"{criterion}: {value}/100")


def _build_enrichment_context(enrichment_data: Optional[Dict]) -> str:
    """Build context string from enrichment data for the AI prompt."""
    if not enrichment_data:
        return ""

    parts = []
    pvgis = enrichment_data.get("pvgis", {})
    if pvgis:
        ghi = pvgis.get("ghi_kwh_m2_an")
        prod = pvgis.get("productible_kwh_kwc_an")
        temp = pvgis.get("temperature_moyenne")
        source = pvgis.get("source", "inconnu")
        parts.append(f"\nDonnees solaires (source: {source}):")
        if ghi:
            parts.append(f"  - GHI: {ghi} kWh/m2/an")
        if prod:
            parts.append(f"  - Productible: {prod} kWh/kWc/an")
        if temp:
            parts.append(f"  - Temperature moyenne: {temp} C")

    constraints = enrichment_data.get("constraints", {})
    summary = constraints.get("summary", {})
    if summary:
        total = summary.get("total_constraints", 0)
        in_zone = summary.get("in_zone", 0)
        nearby = summary.get("nearby", 0)
        parts.append(f"\nContraintes environnementales:")
        parts.append(f"  - Total: {total} (en zone: {in_zone}, a proximite: {nearby})")

        for zone_type in ["natura2000", "znieff"]:
            zones = constraints.get(zone_type, [])
            for z in zones[:3]:
                status = "EN ZONE" if z.get("intersection") else f"a {z.get('distance_m', '?')}m"
                parts.append(f"  - {zone_type}: {z.get('nom', '?')} ({status})")

    postes = enrichment_data.get("nearest_postes", [])
    if postes:
        parts.append(f"\nPostes sources les plus proches:")
        for p in postes[:3]:
            parts.append(
                f"  - {p.get('nom', '?')} ({p.get('gestionnaire', '?')}) "
                f"a {p.get('distance_km', '?')} km, "
                f"{p.get('capacite_disponible_mw', '?')} MW disponibles"
            )

    return "\n".join(parts)


def _build_regulatory_context(regulatory_data: Optional[Dict]) -> str:
    """Build context string from regulatory analysis for the AI prompt."""
    if not regulatory_data:
        return ""

    parts = ["\nAnalyse reglementaire:"]
    parts.append(f"  Risque reglementaire: {regulatory_data.get('risk_level', '?')}")
    parts.append(f"  Zone sensible: {'Oui' if regulatory_data.get('zone_sensible') else 'Non'}")

    obligations = regulatory_data.get("obligations", [])
    if obligations:
        parts.append(f"  Obligations ({len(obligations)}):")
        for obl in obligations:
            parts.append(
                f"    - {obl.get('label', '?')} "
                f"(delai: ~{obl.get('delai_mois', '?')} mois)"
            )

    return "\n".join(parts)


def _template_analysis(
    project_data: Dict[str, Any],
    score_data: Optional[Dict[str, Any]] = None,
    phases_data: Optional[List[Dict[str, Any]]] = None,
    enrichment_data: Optional[Dict[str, Any]] = None,
    regulatory_data: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """Generate template-based analysis without calling Claude API.

    Sprint 14: Enhanced with enrichment and regulatory context.
    """
    filiere = project_data.get("filiere", "")
    recs = FILIERE_RECOMMENDATIONS.get(filiere, DEFAULT_RECOMMENDATIONS)

    # Score insights
    score_insights = []
    if score_data and "details" in score_data:
        for criterion, value in score_data["details"].items():
            score_insights.append({
                "criterion": criterion,
                "value": value,
                "insight": _score_insight(criterion, value),
            })

    # Phase insights
    phase_summary = ""
    if phases_data:
        completed = sum(1 for p in phases_data if p.get("statut") == "termine")
        in_progress = sum(1 for p in phases_data if p.get("statut") == "en_cours")
        total = len(phases_data)
        phase_summary = (
            f"{completed}/{total} blocs termines, "
            f"{in_progress} en cours"
        )

    # Enrich strengths/risks/next_steps with real data
    strengths = list(recs["strengths"])
    risks = list(recs["risks"])
    next_steps = list(recs["next_steps"])

    if enrichment_data:
        pvgis = enrichment_data.get("pvgis", {})
        ghi = pvgis.get("ghi_kwh_m2_an")
        if ghi and ghi >= 1400:
            strengths.insert(0, f"Excellent GHI de {ghi} kWh/m2/an — productible eleve")
        elif ghi and ghi < 1200:
            risks.insert(0, f"GHI de {ghi} kWh/m2/an en dessous de la moyenne — productible reduit")

        postes = enrichment_data.get("nearest_postes", [])
        if postes:
            p0 = postes[0]
            dist = p0.get("distance_km", "?")
            cap = p0.get("capacite_disponible_mw", 0)
            if cap and cap > 10:
                strengths.append(f"Poste source a {dist} km avec {cap} MW de capacite disponible")
            elif dist and float(str(dist)) > 20:
                risks.append(f"Poste source le plus proche a {dist} km — couts de raccordement eleves")

        constraints = enrichment_data.get("constraints", {}).get("summary", {})
        in_zone = constraints.get("in_zone", 0)
        if in_zone > 0:
            risks.insert(0, f"Projet EN ZONE protegee ({in_zone} intersection{'s' if in_zone > 1 else ''}) — risque reglementaire fort")

    if regulatory_data:
        risk_level = regulatory_data.get("risk_level", "medium")
        if risk_level == "high":
            risks.insert(0, "Risque reglementaire ELEVE — nombreuses obligations, delais longs")
        obligations = regulatory_data.get("obligations", [])
        for obl in obligations[:2]:
            tips = obl.get("tips", [])
            if tips:
                next_steps.insert(0, tips[0].replace("Astuce : ", "").replace("Critique : ", ""))

    # Overall summary
    score_val = score_data.get("score", 0) if score_data else 0
    if score_val >= 75:
        overall = "Ce projet presente un bon potentiel. Les indicateurs sont favorables dans l'ensemble."
    elif score_val >= 60:
        overall = "Ce projet a un potentiel correct avec quelques points d'attention a traiter."
    elif score_val >= 40:
        overall = "Ce projet necessite une attention particuliere sur plusieurs criteres avant de poursuivre."
    else:
        overall = "Ce projet presente des contraintes significatives. Une revision de la strategie est recommandee."

    # Add enrichment-aware summary if data available
    if enrichment_data and enrichment_data.get("pvgis", {}).get("ghi_kwh_m2_an"):
        ghi = enrichment_data["pvgis"]["ghi_kwh_m2_an"]
        overall += f" Irradiation mesuree: {ghi} kWh/m2/an."

    return {
        "summary": overall,
        "strengths": strengths[:5],
        "risks": risks[:5],
        "next_steps": next_steps[:6],
        "score_insights": score_insights,
        "phase_summary": phase_summary,
        "source": "template",
    }


# ─── Claude API ──────────────────────────────────────────────────

SYSTEM_PROMPT = """Tu es un consultant senior en energie renouvelable avec 15 ans d'experience
en developpement de projets solaires, eoliens et BESS en France. Tu connais parfaitement :

- Le cadre reglementaire francais (ICPE, Code de l'urbanisme, Code de l'environnement)
- Les procedures administratives (DREAL, DDT, MRAe, CRE, Capareseau)
- Les aspects techniques (raccordement, PVGIS, etudes de productible)
- Les aspects financiers (CAPEX/OPEX, LCOE, TRI, mecanismes de marche)
- Les retours d'experience terrain (pieges frequents, astuces, anticipation)

Tu donnes des conseils PRATIQUES, concrets et actionables — pas de la theorie generique.
Quand tu identifies un risque, tu donnes immediatement la solution ou l'anticipation.
Tu fonctionnes comme le site AVEIL : theorie + trucs et astuces d'expert.

Reponds TOUJOURS en francais. Sois direct et utile."""


async def _claude_analysis(
    project_data: Dict[str, Any],
    score_data: Optional[Dict[str, Any]] = None,
    phases_data: Optional[List[Dict[str, Any]]] = None,
    enrichment_data: Optional[Dict[str, Any]] = None,
    regulatory_data: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """Call Claude API for project analysis. Sprint 14: expert consultant mode."""
    client = _get_client()
    if not client:
        return _template_analysis(project_data, score_data, phases_data,
                                  enrichment_data, regulatory_data)

    prompt = f"""Analyse ce projet ENR et donne-moi un avis d'expert avec des conseils pratiques.

PROJET:
  Nom: {project_data.get('nom', 'Inconnu')}
  Filiere: {project_data.get('filiere', 'Non definie')}
  Puissance: {project_data.get('puissance_mwc', '?')} MWc
  Surface: {project_data.get('surface_ha', '?')} ha
  Commune: {project_data.get('commune', '?')} ({project_data.get('departement', '?')})
  Region: {project_data.get('region', '?')}
  Statut: {project_data.get('statut', '?')}
"""

    if score_data:
        prompt += f"\nSCORE GLOBAL: {score_data.get('score', 0)}/100\n"
        if "details" in score_data:
            for k, v in score_data["details"].items():
                prompt += f"  - {k}: {v}/100\n"
        data_sources = score_data.get("data_sources", {})
        if data_sources:
            prompt += f"  Sources de donnees: {data_sources}\n"

    prompt += _build_enrichment_context(enrichment_data)
    prompt += _build_regulatory_context(regulatory_data)

    if phases_data:
        prompt += "\nPROGRESSION:\n"
        for p in phases_data:
            prompt += f"  - {p['code']}: {p.get('completion_pct', 0)}% ({p.get('statut', '?')})\n"

    prompt += """

Reponds en JSON strict avec ces champs:
{
  "summary": "Resume expert en 3-4 phrases avec avis terrain",
  "strengths": ["Force 1 avec detail pratique", "Force 2", "Force 3"],
  "risks": ["Risque 1 + comment l'anticiper", "Risque 2 + solution", "Risque 3"],
  "next_steps": ["Action concrete 1 (avec qui, quand)", "Action 2", "Action 3", "Action 4"],
  "expert_tips": ["Astuce terrain 1", "Piege a eviter 1", "Retour d'experience 1"],
  "score_insights": [{"criterion": "nom", "value": N, "insight": "texte expert"}]
}
"""

    try:
        import json
        message = client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=2048,
            system=SYSTEM_PROMPT,
            messages=[{"role": "user", "content": prompt}],
        )
        text = message.content[0].text
        start = text.find("{")
        end = text.rfind("}") + 1
        if start >= 0 and end > start:
            result = json.loads(text[start:end])
            result["source"] = "claude_expert"
            result["phase_summary"] = ""
            if phases_data:
                completed = sum(1 for p in phases_data if p.get("statut") == "termine")
                result["phase_summary"] = f"{completed}/{len(phases_data)} blocs termines"
            # Ensure expert_tips exists
            if "expert_tips" not in result:
                result["expert_tips"] = []
            return result
    except Exception as e:
        logger.warning("Claude API error, falling back to template: %s", e)

    return _template_analysis(project_data, score_data, phases_data,
                              enrichment_data, regulatory_data)


# ─── Public API ──────────────────────────────────────────────────


async def analyze_project(
    project_data: Dict[str, Any],
    score_data: Optional[Dict[str, Any]] = None,
    phases_data: Optional[List[Dict[str, Any]]] = None,
    enrichment_data: Optional[Dict[str, Any]] = None,
    regulatory_data: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """Analyze a project as a senior ENR consultant.

    Uses Claude API if available with expert system prompt,
    otherwise falls back to enriched template analysis.

    Sprint 14: Now accepts enrichment and regulatory data for
    contextual expert advice.

    Returns:
        Dict with: summary, strengths, risks, next_steps, expert_tips,
        score_insights, phase_summary, source.
    """
    return await _claude_analysis(
        project_data, score_data, phases_data,
        enrichment_data, regulatory_data,
    )
