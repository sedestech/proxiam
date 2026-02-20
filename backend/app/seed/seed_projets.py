"""Seed demo projects for scoring tests — Sprint 3.

Creates 8 realistic ENR projects across France with coordinates,
filieres, and metadata to test the scoring engine.

Usage:
    cd backend && PYTHONPATH=. python3 -m app.seed.seed_projets
"""
import asyncio
import uuid

from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker

from app.config import settings
from app.database import Base


DEMO_PROJECTS = [
    {
        "nom": "Centrale Solaire Crau",
        "filiere": "solaire_sol",
        "puissance_mwc": 30.0,
        "surface_ha": 45.0,
        "lon": 4.85,
        "lat": 43.55,
        "commune": "Saint-Martin-de-Crau",
        "departement": "13",
        "region": "Provence-Alpes-Cote d'Azur",
        "statut": "autorisation",
    },
    {
        "nom": "Parc Eolien Beauce Nord",
        "filiere": "eolien_onshore",
        "puissance_mwc": 24.0,
        "surface_ha": 120.0,
        "lon": 1.45,
        "lat": 48.15,
        "commune": "Chartres",
        "departement": "28",
        "region": "Centre-Val de Loire",
        "statut": "construction",
    },
    {
        "nom": "BESS Fos-sur-Mer",
        "filiere": "bess",
        "puissance_mwc": 50.0,
        "surface_ha": 2.5,
        "lon": 4.94,
        "lat": 43.43,
        "commune": "Fos-sur-Mer",
        "departement": "13",
        "region": "Provence-Alpes-Cote d'Azur",
        "statut": "prospection",
    },
    {
        "nom": "Solaire Landes Sud",
        "filiere": "solaire_sol",
        "puissance_mwc": 15.0,
        "surface_ha": 22.0,
        "lon": -0.77,
        "lat": 43.70,
        "commune": "Mont-de-Marsan",
        "departement": "40",
        "region": "Nouvelle-Aquitaine",
        "statut": "prospection",
    },
    {
        "nom": "Eolien Picardie",
        "filiere": "eolien_onshore",
        "puissance_mwc": 36.0,
        "surface_ha": 200.0,
        "lon": 2.80,
        "lat": 49.85,
        "commune": "Laon",
        "departement": "02",
        "region": "Hauts-de-France",
        "statut": "ingenierie",
    },
    {
        "nom": "Solaire Herault",
        "filiere": "solaire_sol",
        "puissance_mwc": 8.0,
        "surface_ha": 12.0,
        "lon": 3.37,
        "lat": 43.50,
        "commune": "Beziers",
        "departement": "34",
        "region": "Occitanie",
        "statut": "exploitation",
    },
    {
        "nom": "BESS Dunkerque",
        "filiere": "bess",
        "puissance_mwc": 100.0,
        "surface_ha": 5.0,
        "lon": 2.38,
        "lat": 51.03,
        "commune": "Dunkerque",
        "departement": "59",
        "region": "Hauts-de-France",
        "statut": "prospection",
    },
    {
        "nom": "Solaire Alpes",
        "filiere": "solaire_sol",
        "puissance_mwc": 5.0,
        "surface_ha": 8.0,
        "lon": 6.12,
        "lat": 44.56,
        "commune": "Gap",
        "departement": "05",
        "region": "Provence-Alpes-Cote d'Azur",
        "statut": "autorisation",
    },
]


async def seed_projects():
    engine = create_async_engine(settings.database_url, echo=False)

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    session_factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with session_factory() as session:
        # Check if projects already exist
        result = await session.execute(text("SELECT COUNT(*) FROM projets"))
        count = result.scalar()
        if count and count > 0:
            print(f"  {count} projets deja presents — skip seed")
            await engine.dispose()
            return

        for proj in DEMO_PROJECTS:
            projet_id = str(uuid.uuid4())
            await session.execute(
                text("""
                    INSERT INTO projets (id, nom, filiere, puissance_mwc, surface_ha,
                                        geom, commune, departement, region, statut)
                    VALUES (:id, :nom, :filiere, :puissance_mwc, :surface_ha,
                            ST_SetSRID(ST_MakePoint(:lon, :lat), 4326),
                            :commune, :departement, :region, :statut)
                """),
                {
                    "id": projet_id,
                    "nom": proj["nom"],
                    "filiere": proj["filiere"],
                    "puissance_mwc": proj["puissance_mwc"],
                    "surface_ha": proj["surface_ha"],
                    "lon": proj["lon"],
                    "lat": proj["lat"],
                    "commune": proj["commune"],
                    "departement": proj["departement"],
                    "region": proj["region"],
                    "statut": proj["statut"],
                },
            )
            print(f"  + {proj['nom']} ({proj['filiere']}) — {proj['commune']}")

        await session.commit()
        print(f"\n  {len(DEMO_PROJECTS)} projets demo crees.")

    await engine.dispose()


if __name__ == "__main__":
    print("=== Seed projets demo ===")
    asyncio.run(seed_projects())
    print("Done.")
