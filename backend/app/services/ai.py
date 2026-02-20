"""AI service — Sprint 5.

Provides project analysis using Anthropic Claude API.
Falls back to template-based analysis when no API key is configured.

Functions:
  analyze_project  — full project analysis with recommendations
  summarize_risks  — risk summary for a project
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


def _template_analysis(
    project_data: Dict[str, Any],
    score_data: Optional[Dict[str, Any]] = None,
    phases_data: Optional[List[Dict[str, Any]]] = None,
) -> Dict[str, Any]:
    """Generate template-based analysis without calling Claude API."""
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

    return {
        "summary": overall,
        "strengths": recs["strengths"],
        "risks": recs["risks"],
        "next_steps": recs["next_steps"],
        "score_insights": score_insights,
        "phase_summary": phase_summary,
        "source": "template",
    }


# ─── Claude API ──────────────────────────────────────────────────


async def _claude_analysis(
    project_data: Dict[str, Any],
    score_data: Optional[Dict[str, Any]] = None,
    phases_data: Optional[List[Dict[str, Any]]] = None,
) -> Dict[str, Any]:
    """Call Claude API for project analysis."""
    client = _get_client()
    if not client:
        return _template_analysis(project_data, score_data, phases_data)

    prompt = f"""Analyse ce projet d'energie renouvelable et fournis des recommandations.

Projet: {project_data.get('nom', 'Inconnu')}
Filiere: {project_data.get('filiere', 'Non definie')}
Puissance: {project_data.get('puissance_mwc', '?')} MWc
Surface: {project_data.get('surface_ha', '?')} ha
Commune: {project_data.get('commune', '?')} ({project_data.get('departement', '?')})
Region: {project_data.get('region', '?')}
Statut: {project_data.get('statut', '?')}
"""

    if score_data:
        prompt += f"\nScore global: {score_data.get('score', 0)}/100\n"
        if "details" in score_data:
            for k, v in score_data["details"].items():
                prompt += f"  - {k}: {v}/100\n"

    if phases_data:
        prompt += "\nProgression des blocs:\n"
        for p in phases_data:
            prompt += f"  - {p['code']}: {p.get('completion_pct', 0)}% ({p.get('statut', '?')})\n"

    prompt += """
Reponds en JSON strict avec ces champs:
{
  "summary": "Resume en 2-3 phrases",
  "strengths": ["Force 1", "Force 2", "Force 3"],
  "risks": ["Risque 1", "Risque 2", "Risque 3"],
  "next_steps": ["Action 1", "Action 2", "Action 3", "Action 4"],
  "score_insights": [{"criterion": "nom", "value": N, "insight": "texte"}]
}
"""

    try:
        import json
        message = client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=1024,
            messages=[{"role": "user", "content": prompt}],
        )
        text = message.content[0].text
        # Extract JSON from response
        start = text.find("{")
        end = text.rfind("}") + 1
        if start >= 0 and end > start:
            result = json.loads(text[start:end])
            result["source"] = "claude"
            result["phase_summary"] = ""
            if phases_data:
                completed = sum(1 for p in phases_data if p.get("statut") == "termine")
                result["phase_summary"] = f"{completed}/{len(phases_data)} blocs termines"
            return result
    except Exception as e:
        logger.warning("Claude API error, falling back to template: %s", e)

    return _template_analysis(project_data, score_data, phases_data)


# ─── Public API ──────────────────────────────────────────────────


async def analyze_project(
    project_data: Dict[str, Any],
    score_data: Optional[Dict[str, Any]] = None,
    phases_data: Optional[List[Dict[str, Any]]] = None,
) -> Dict[str, Any]:
    """Analyze a project and return recommendations.

    Uses Claude API if available, otherwise falls back to template-based
    analysis using filiere-specific knowledge.

    Returns:
        Dict with: summary, strengths, risks, next_steps, score_insights,
        phase_summary, source ("claude" or "template").
    """
    return await _claude_analysis(project_data, score_data, phases_data)
