"""Enrich sources_veille with type and frequence based on name patterns."""
import asyncio
import random
import re

from sqlalchemy import text

from app.database import engine


# Classification rules by keyword patterns (checked in order)
TYPE_PATTERNS = [
    (r"\bAPI\b|\bREST\b|\bGraphQL\b|\bSDK\b|\bWebService\b", "api"),
    (r"\bRSS\b|\bflux\b|\bfeed\b|\bnewsletter\b|\balerte\b|\bmagazine\b|\bpresse\b|\bbulletin\b", "rss"),
    (r"\bBDD\b|\bbase\b|\bdonnees\b|\bdata\b|\bregistre\b|\bcadast\b|\bINSEE\b|\bSIRENE\b", "base_donnees"),
    (r"\.gouv\.fr\b|\bgouvernement\b|\bministe\b|\bprefectu\b|\bprefet\b", "base_donnees"),
    (r"\bportail\b|\bplateforme\b|\bobservatoire\b|\binventaire\b|\bschema\b|\bplan\b", "base_donnees"),
    (r"\bENTSO\b|\bACER\b|\bEurostat\b|\bSCoT\b|\bSRADDET\b|\bPPR\b|\bPCAET\b|\bPLU\b", "base_donnees"),
    (r"\bSentinel\b|\bPlanet\b|\bGoogle Earth\b|\bQGIS\b|\bGeoServer\b|\bPostGIS\b|\bHub\b", "api"),
    (r"\bEDF\b|\bSRD\b|\bGEG\b|\bSEI\b|\belectricity\b|\bGrid\b", "api"),
    (r"\bMap\b|\bSIG\b|\bGeo\b|\bSatellite\b|\bLiDAR\b|\bDTM\b|\bDEM\b", "api"),
]

FREQ_BY_TYPE = {
    "api": ["temps_reel", "quotidien", "quotidien", "quotidien"],
    "rss": ["quotidien", "quotidien", "hebdo"],
    "base_donnees": ["mensuel", "mensuel", "hebdo", "annuel"],
    "scraping": ["hebdo", "hebdo", "quotidien", "mensuel"],
}

# Some well-known sources get specific types
KNOWN_SOURCES = {
    "RTE": "api",
    "Enedis": "api",
    "ADEME": "base_donnees",
    "CRE": "base_donnees",
    "DREAL": "base_donnees",
    "INSEE": "base_donnees",
    "Legifrance": "base_donnees",
    "IRENA": "base_donnees",
    "IEA": "base_donnees",
    "INERIS": "base_donnees",
    "Geoportail": "api",
    "IGN": "api",
    "OpenStreetMap": "api",
    "BRGM": "api",
    "Meteoblue": "api",
    "Meteo France": "api",
    "Copernicus": "api",
    "PVGIS": "api",
    "SolarGIS": "api",
    "PV Magazine": "rss",
    "Actu-Environnement": "rss",
    "Connaissance des Energies": "rss",
    "GreenUnivers": "rss",
    "Enerpresse": "rss",
    "EurObserv": "rss",
    "Bloomberg": "rss",
    "Reuters": "rss",
    "Le Moniteur": "rss",
    "LinkedIn": "scraping",
    "Twitter": "scraping",
    "Avis MRAE": "scraping",
    "Journal Officiel": "scraping",
}


def classify_source(nom: str) -> tuple:
    """Return (type, frequence) for a source based on its name."""
    # Check known sources first
    for keyword, src_type in KNOWN_SOURCES.items():
        if keyword.lower() in nom.lower():
            freqs = FREQ_BY_TYPE.get(src_type, ["hebdo"])
            return src_type, random.choice(freqs)

    # Check pattern rules
    for pattern, src_type in TYPE_PATTERNS:
        if re.search(pattern, nom, re.IGNORECASE):
            freqs = FREQ_BY_TYPE.get(src_type, ["hebdo"])
            return src_type, random.choice(freqs)

    # Default: scraping
    return "scraping", random.choice(FREQ_BY_TYPE["scraping"])


async def main():
    async with engine.begin() as conn:
        result = await conn.execute(text("SELECT id, nom FROM sources_veille"))
        rows = result.mappings().all()

        counts = {"api": 0, "rss": 0, "scraping": 0, "base_donnees": 0}
        for row in rows:
            src_type, freq = classify_source(row["nom"])
            counts[src_type] += 1
            await conn.execute(
                text(
                    "UPDATE sources_veille SET type = :type, frequence = :freq WHERE id = :id"
                ),
                {"type": src_type, "freq": freq, "id": row["id"]},
            )

        print(f"Enriched {len(rows)} sources")
        for t, c in sorted(counts.items()):
            print(f"  {t}: {c}")


if __name__ == "__main__":
    asyncio.run(main())
