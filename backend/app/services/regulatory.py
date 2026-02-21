"""Service d'analyse réglementaire — Sprint 14.

Moteur de règles expert pour déterminer les obligations réglementaires
applicables à un projet ENR en France, avec conseils pratiques issus
de l'expérience terrain.

Seuils basés sur :
- Code de l'environnement (ICPE, rubrique 2980/3110/2920)
- Code de l'urbanisme (permis de construire, déclaration préalable)
- Loi sur l'eau (IOTA)
- Raccordement (Code de l'énergie, CRE)
"""
import logging
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)


# ─── Seuils réglementaires français ──────────────────────────────

ICPE_THRESHOLDS = {
    "solaire_sol": [
        {
            "seuil_mwc": 0.25,
            "regime": "declaration",
            "rubrique": "2980",
            "label": "Déclaration ICPE",
            "delai_mois": 3,
            "description": "Installation photovoltaïque au sol > 250 kWc",
        },
        {
            "seuil_mwc": 50.0,
            "regime": "enregistrement",
            "rubrique": "2980",
            "label": "Enregistrement ICPE",
            "delai_mois": 6,
            "description": "Installation photovoltaïque au sol > 50 MWc",
        },
    ],
    "eolien_onshore": [
        {
            "seuil_mwc": 0.0,
            "regime": "autorisation",
            "rubrique": "2980",
            "label": "Autorisation environnementale (ICPE)",
            "delai_mois": 18,
            "description": "Éolienne > 50 m de hauteur : autorisation ICPE obligatoire",
        },
    ],
    "bess": [
        {
            "seuil_mwc": 0.0,
            "regime": "declaration",
            "rubrique": "2920/3110",
            "label": "Déclaration ICPE (stockage énergie)",
            "delai_mois": 3,
            "description": "Batterie lithium-ion : classement ICPE selon capacité",
        },
        {
            "seuil_mwc": 10.0,
            "regime": "enregistrement",
            "rubrique": "2920/3110",
            "label": "Enregistrement ICPE (BESS > 10 MW)",
            "delai_mois": 8,
            "description": "Installation de stockage significative",
        },
    ],
}

# ─── Règles détaillées par obligation ─────────────────────────────

OBLIGATION_RULES = {
    "etude_impact": {
        "solaire_sol": {
            "seuil_mwc": 0.3,
            "seuil_ha": None,
            "label": "Étude d'Impact Environnementale (EIE)",
            "delai_mois": 6,
            "cout_eur_indicatif": "15 000 – 50 000 €",
            "description": "Obligatoire pour les centrales > 300 kWc au sol ou en zone sensible",
        },
        "eolien_onshore": {
            "seuil_mwc": 0.0,
            "seuil_ha": None,
            "label": "Étude d'Impact Environnementale (EIE)",
            "delai_mois": 12,
            "cout_eur_indicatif": "50 000 – 150 000 €",
            "description": "Toujours obligatoire pour l'éolien (avifaune, chiroptères, paysage)",
        },
        "bess": {
            "seuil_mwc": 10.0,
            "seuil_ha": None,
            "label": "Étude d'Impact Environnementale (EIE)",
            "delai_mois": 4,
            "cout_eur_indicatif": "10 000 – 30 000 €",
            "description": "Pour les installations BESS > 10 MW ou en zone sensible",
        },
    },
    "permis_construire": {
        "solaire_sol": {
            "seuil_mwc": 1.0,
            "seuil_ha": 2.5,
            "label": "Permis de construire",
            "delai_mois": 4,
            "cout_eur_indicatif": "5 000 – 15 000 €",
            "description": "PC obligatoire si puissance > 1 MWc ou emprise > 2,5 ha",
        },
        "eolien_onshore": {
            "seuil_mwc": 0.0,
            "seuil_ha": None,
            "label": "Permis de construire",
            "delai_mois": 4,
            "cout_eur_indicatif": "10 000 – 25 000 €",
            "description": "Toujours obligatoire pour les éoliennes",
        },
        "bess": {
            "seuil_mwc": 1.0,
            "seuil_ha": None,
            "label": "Permis de construire ou déclaration préalable",
            "delai_mois": 3,
            "cout_eur_indicatif": "3 000 – 10 000 €",
            "description": "Selon la taille de l'installation et les règles locales",
        },
    },
    "autorisation_environnementale": {
        "solaire_sol": {
            "condition": "zone_sensible",
            "label": "Autorisation environnementale (AE)",
            "delai_mois": 12,
            "cout_eur_indicatif": "20 000 – 80 000 €",
            "description": "Si le projet est en zone Natura2000, ZNIEFF I, ou zone humide",
        },
        "eolien_onshore": {
            "condition": "always",
            "label": "Autorisation environnementale (AE)",
            "delai_mois": 18,
            "cout_eur_indicatif": "50 000 – 200 000 €",
            "description": "Toujours requise — inclut l'ICPE, le défrichement, la loi sur l'eau",
        },
        "bess": {
            "condition": "zone_sensible",
            "label": "Autorisation environnementale (AE)",
            "delai_mois": 10,
            "cout_eur_indicatif": "15 000 – 50 000 €",
            "description": "Si le projet est en zone sensible",
        },
    },
    "raccordement": {
        "solaire_sol": {
            "label": "Demande de raccordement (PTF)",
            "delai_mois": 18,
            "cout_eur_indicatif": "Variable (50 – 200 €/kW selon distance)",
            "description": "Proposition Technique et Financière auprès du gestionnaire de réseau",
        },
        "eolien_onshore": {
            "label": "Demande de raccordement (PTF)",
            "delai_mois": 24,
            "cout_eur_indicatif": "Variable (souvent > 1 M€ pour les parcs)",
            "description": "Raccordement HTA/HTB selon puissance, file d'attente fréquente",
        },
        "bess": {
            "label": "Demande de raccordement bidirectionnel",
            "delai_mois": 12,
            "cout_eur_indicatif": "Variable selon capacité et distance",
            "description": "Raccordement injection + soutirage, souvent couplé au site existant",
        },
    },
}


# ─── Conseils experts (style AVEIL) ──────────────────────────────

EXPERT_TIPS = {
    "icpe": {
        "solaire_sol": [
            "Astuce : Déposez le dossier ICPE en même temps que le permis de construire — les instructions peuvent avancer en parallèle.",
            "Piège fréquent : Oublier de consulter la DDT sur la compatibilité avec le SDAGE/SAGE avant le dépôt.",
            "Retour terrain : Prévoyez un plan de remise en état du site dès le début — c'est souvent demandé en complément.",
        ],
        "eolien_onshore": [
            "Critique : L'étude chiroptères doit couvrir 1 cycle complet (mars→octobre). Ne commencez pas l'hiver.",
            "Anticipez : Consultez la DGAC et l'armée dès la phase de prospection pour les servitudes aéronautiques.",
            "Retour terrain : Les mesures de bruit résiduelles prennent du temps — lancez-les tôt dans le développement.",
            "Piège fréquent : Les ZDE n'existent plus depuis 2013, mais certains élus l'ignorent encore.",
        ],
        "bess": [
            "Conseil : Consultez le SDIS (pompiers) très tôt — les exigences de sécurité incendie peuvent impacter le design.",
            "Retour terrain : La réglementation BESS évolue vite — vérifiez les dernières circulaires DGPR.",
            "Astuce : Si possible, colocaliser le BESS avec un site ENR existant simplifie les procédures.",
        ],
    },
    "etude_impact": {
        "solaire_sol": [
            "Astuce : Commandez la pré-analyse écologique (4 saisons) dès la signature du foncier — c'est le chemin critique.",
            "Retour terrain : Privilégiez les terrains anthropisés (friches, anciennes carrières) pour simplifier l'EIE.",
            "Piège : L'inventaire faune-flore doit couvrir les 4 saisons. Si vous ratez le printemps, c'est 1 an de retard.",
        ],
        "eolien_onshore": [
            "Critique : L'étude avifaune et chiroptères est LE point bloquant. Budget 80-150 k€ et 12+ mois.",
            "Retour terrain : Impliquez un écologue dès la prospection pour éviter les surprises (espèces protégées).",
            "Astuce : Les données existantes (atlas de biodiversité, ZNIEFF) ne suffisent pas — l'inventaire terrain est requis.",
        ],
        "bess": [
            "Conseil : L'EIE est souvent plus légère pour le BESS — focalisez sur le risque chimique et incendie.",
        ],
    },
    "raccordement": {
        "solaire_sol": [
            "Critique : Consultez Capareseau AVANT d'acheter le foncier — la capacité réseau conditionne tout.",
            "Retour terrain : La PTF d'Enedis prend 3-6 mois. Celle de RTE peut prendre 12+ mois.",
            "Piège : La file d'attente S3REnR est un FIFO — si vous arrivez après la saturation, c'est bloqué.",
            "Astuce : Le schéma de raccordement en « bouclage » peut réduire les coûts vs le raccordement direct.",
            "Donnée clé : Le coût moyen de raccordement solaire est de 50-150 €/kW installé.",
        ],
        "eolien_onshore": [
            "Critique : Le raccordement éolien est souvent en HTB (>= 63 kV) — coûts et délais importants.",
            "Retour terrain : Anticipez les travaux de renforcement réseau qui peuvent prendre 2-3 ans.",
            "Conseil : Demandez un devis indicatif au gestionnaire avant la PTF officielle pour calibrer le budget.",
        ],
        "bess": [
            "Astuce : Un BESS colocalisé avec une centrale ENR peut partager le raccordement existant.",
            "Retour terrain : Le raccordement bidirectionnel coûte ~20-30% de plus qu'un raccordement simple.",
        ],
    },
    "permis_construire": {
        "solaire_sol": [
            "Conseil : Soignez le volet paysager — c'est la première cause de refus des commissions.",
            "Retour terrain : Intégrez les haies de masquage dès le plan masse initial.",
            "Astuce : Déposez en mairie avec un mot d'accompagnement au maire — ça change tout pour l'instruction.",
        ],
        "eolien_onshore": [
            "Critique : Le volet paysager de l'éolien est crucial — photomontages depuis tous les points sensibles.",
            "Piège : Les recours tiers sont fréquents. Prévoyez un budget juridique dès le départ.",
        ],
        "bess": [
            "Conseil : L'esthétique des conteneurs BESS peut être améliorée avec un bardage adapté au site.",
        ],
    },
    "general": {
        "solaire_sol": [
            "Calendrier idéal : Foncier (J0) → EIE (J+30) → ICPE+PC (J+180) → Raccordement (J+180) → CRE/PPA (J+360) → Construction (J+540)",
            "Budget dev typique : 30-50 k€/MWc pour le développement complet (hors CAPEX construction)",
            "Benchmark : Le taux de conversion prospection→construction est d'environ 10-15%",
        ],
        "eolien_onshore": [
            "Calendrier typique : Prospection (18 mois) → Développement (36-48 mois) → Construction (12-18 mois)",
            "Budget dev : 100-200 k€ par éolienne en phase de développement",
            "Benchmark : Le taux de conversion prospection→autorisation est d'environ 20-30%, mais post-recours < 60%",
        ],
        "bess": [
            "Calendrier : Le BESS est le plus rapide (12-24 mois du dev à la mise en service)",
            "Astuce : Les revenus BESS sont multi-flux — modélisez FCR + aFRR + arbitrage + capacité",
            "Tendance : Les prix des cellules LFP baissent de 15-20% par an — anticipez dans votre business plan",
        ],
    },
}

# ─── Timeline standard par phase ─────────────────────────────────

TIMELINE_PHASES = {
    "solaire_sol": [
        {"phase": "Prospection foncière", "duree_mois": "2-6", "ordre": 1},
        {"phase": "Études environnementales (EIE)", "duree_mois": "6-12", "ordre": 2},
        {"phase": "Dépôt ICPE + Permis de construire", "duree_mois": "1", "ordre": 3},
        {"phase": "Instruction ICPE + PC", "duree_mois": "4-12", "ordre": 4},
        {"phase": "Purge des recours", "duree_mois": "2-4", "ordre": 5},
        {"phase": "Demande de raccordement (PTF)", "duree_mois": "3-18", "ordre": 6},
        {"phase": "Appel d'offres CRE / PPA", "duree_mois": "3-6", "ordre": 7},
        {"phase": "Financement", "duree_mois": "2-4", "ordre": 8},
        {"phase": "Construction", "duree_mois": "6-12", "ordre": 9},
        {"phase": "Mise en service + exploitation", "duree_mois": "ongoing", "ordre": 10},
    ],
    "eolien_onshore": [
        {"phase": "Prospection + études de vent", "duree_mois": "12-18", "ordre": 1},
        {"phase": "Études environnementales", "duree_mois": "12-24", "ordre": 2},
        {"phase": "Concertation publique", "duree_mois": "3-6", "ordre": 3},
        {"phase": "Dépôt autorisation environnementale", "duree_mois": "1", "ordre": 4},
        {"phase": "Instruction AE", "duree_mois": "12-18", "ordre": 5},
        {"phase": "Purge des recours (TA)", "duree_mois": "12-24", "ordre": 6},
        {"phase": "Raccordement (PTF + travaux)", "duree_mois": "18-36", "ordre": 7},
        {"phase": "Complément de prix / CRE", "duree_mois": "3-6", "ordre": 8},
        {"phase": "Construction", "duree_mois": "12-18", "ordre": 9},
        {"phase": "Mise en service", "duree_mois": "ongoing", "ordre": 10},
    ],
    "bess": [
        {"phase": "Prospection site + étude réseau", "duree_mois": "1-3", "ordre": 1},
        {"phase": "Études réglementaires (ICPE)", "duree_mois": "2-4", "ordre": 2},
        {"phase": "Dépôt déclaration/enregistrement", "duree_mois": "1", "ordre": 3},
        {"phase": "Instruction", "duree_mois": "3-8", "ordre": 4},
        {"phase": "Raccordement (PTF)", "duree_mois": "3-12", "ordre": 5},
        {"phase": "Contrats marché (FCR, aFRR)", "duree_mois": "2-4", "ordre": 6},
        {"phase": "Financement", "duree_mois": "2-3", "ordre": 7},
        {"phase": "Construction + commissioning", "duree_mois": "6-9", "ordre": 8},
        {"phase": "Mise en service", "duree_mois": "ongoing", "ordre": 9},
    ],
}


# ─── Moteur de règles ─────────────────────────────────────────────

def _check_icpe(filiere: str, puissance_mwc: float) -> Optional[Dict]:
    """Determine ICPE classification for a project."""
    thresholds = ICPE_THRESHOLDS.get(filiere, [])
    applicable = None
    for t in thresholds:
        if puissance_mwc >= t["seuil_mwc"]:
            applicable = t
    if not applicable:
        return None
    return {
        "obligation": "icpe",
        "regime": applicable["regime"],
        "rubrique": applicable["rubrique"],
        "label": applicable["label"],
        "delai_mois": applicable["delai_mois"],
        "description": applicable["description"],
        "statut": "a_verifier",
        "tips": EXPERT_TIPS.get("icpe", {}).get(filiere, []),
    }


def _check_etude_impact(
    filiere: str, puissance_mwc: float, surface_ha: float,
    has_zone_sensible: bool,
) -> Optional[Dict]:
    """Determine if EIE is required."""
    rule = OBLIGATION_RULES["etude_impact"].get(filiere)
    if not rule:
        return None

    required = False
    if rule.get("seuil_mwc") is not None and puissance_mwc >= rule["seuil_mwc"]:
        required = True
    if has_zone_sensible:
        required = True

    if not required:
        return None

    return {
        "obligation": "etude_impact",
        "label": rule["label"],
        "delai_mois": rule["delai_mois"],
        "cout_indicatif": rule["cout_eur_indicatif"],
        "description": rule["description"],
        "zone_sensible": has_zone_sensible,
        "statut": "a_verifier",
        "tips": EXPERT_TIPS.get("etude_impact", {}).get(filiere, []),
    }


def _check_permis_construire(
    filiere: str, puissance_mwc: float, surface_ha: float,
) -> Optional[Dict]:
    """Determine PC/DP requirement."""
    rule = OBLIGATION_RULES["permis_construire"].get(filiere)
    if not rule:
        return None

    required = False
    if rule.get("seuil_mwc") is not None and puissance_mwc >= rule["seuil_mwc"]:
        required = True
    if rule.get("seuil_ha") is not None and surface_ha and surface_ha >= rule["seuil_ha"]:
        required = True

    if not required:
        return None

    return {
        "obligation": "permis_construire",
        "label": rule["label"],
        "delai_mois": rule["delai_mois"],
        "cout_indicatif": rule["cout_eur_indicatif"],
        "description": rule["description"],
        "statut": "a_verifier",
        "tips": EXPERT_TIPS.get("permis_construire", {}).get(filiere, []),
    }


def _check_autorisation_env(
    filiere: str, has_zone_sensible: bool,
) -> Optional[Dict]:
    """Determine autorisation environnementale requirement."""
    rule = OBLIGATION_RULES["autorisation_environnementale"].get(filiere)
    if not rule:
        return None

    condition = rule.get("condition", "zone_sensible")
    required = condition == "always" or (condition == "zone_sensible" and has_zone_sensible)

    if not required:
        return None

    return {
        "obligation": "autorisation_environnementale",
        "label": rule["label"],
        "delai_mois": rule["delai_mois"],
        "cout_indicatif": rule["cout_eur_indicatif"],
        "description": rule["description"],
        "statut": "a_verifier",
        "tips": [],
    }


def _get_raccordement_info(filiere: str) -> Dict:
    """Return raccordement info (always applicable)."""
    rule = OBLIGATION_RULES["raccordement"].get(filiere, {})
    return {
        "obligation": "raccordement",
        "label": rule.get("label", "Raccordement réseau"),
        "delai_mois": rule.get("delai_mois", 12),
        "cout_indicatif": rule.get("cout_eur_indicatif", "Variable"),
        "description": rule.get("description", ""),
        "statut": "a_verifier",
        "tips": EXPERT_TIPS.get("raccordement", {}).get(filiere, []),
    }


# ─── API publique ─────────────────────────────────────────────────

def analyze_regulatory(
    filiere: str,
    puissance_mwc: float,
    surface_ha: Optional[float],
    enrichment_data: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """Analyze regulatory requirements for a project.

    Returns a comprehensive regulatory assessment with:
    - obligations: list of applicable regulatory requirements
    - timeline: estimated timeline phases
    - expert_tips: practical advice from field experience
    - risk_level: overall regulatory risk (low/medium/high)
    - estimated_delai_total_mois: total estimated delay
    """
    surface = surface_ha or 0.0

    # Determine if project is in sensitive zone from enrichment
    has_zone_sensible = False
    constraints_summary = {}
    if enrichment_data:
        constraints = enrichment_data.get("constraints", {})
        constraints_summary = constraints.get("summary", {})
        in_zone = constraints_summary.get("in_zone", 0)
        nearby = constraints_summary.get("nearby", 0)
        if in_zone > 0:
            has_zone_sensible = True

    # Check each obligation
    obligations = []

    icpe = _check_icpe(filiere, puissance_mwc)
    if icpe:
        obligations.append(icpe)

    eie = _check_etude_impact(filiere, puissance_mwc, surface, has_zone_sensible)
    if eie:
        obligations.append(eie)

    pc = _check_permis_construire(filiere, puissance_mwc, surface)
    if pc:
        obligations.append(pc)

    ae = _check_autorisation_env(filiere, has_zone_sensible)
    if ae:
        obligations.append(ae)

    raccordement = _get_raccordement_info(filiere)
    obligations.append(raccordement)

    # Calculate timeline
    timeline = TIMELINE_PHASES.get(filiere, TIMELINE_PHASES.get("solaire_sol", []))

    # Estimate total delay (max of parallel + sequential critical path)
    max_delai = 0
    for obl in obligations:
        d = obl.get("delai_mois", 0)
        if d > max_delai:
            max_delai = d

    # Risk level based on complexity
    nb_obligations = len(obligations)
    if has_zone_sensible or nb_obligations >= 4:
        risk_level = "high"
    elif nb_obligations >= 3:
        risk_level = "medium"
    else:
        risk_level = "low"

    # General expert tips
    general_tips = EXPERT_TIPS.get("general", {}).get(filiere, [])

    return {
        "obligations": obligations,
        "timeline": timeline,
        "expert_tips": general_tips,
        "risk_level": risk_level,
        "nb_obligations": nb_obligations,
        "zone_sensible": has_zone_sensible,
        "constraints_summary": constraints_summary,
        "estimated_delai_max_mois": max_delai,
    }
