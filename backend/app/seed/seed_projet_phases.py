"""Seed project phase progression data for Sprint 4.

Creates projet_phases rows linking demo projects to representative phases
from each bloc (B1-B8), with realistic completion percentages based on
each project's statut.

Usage:
    cd backend && PYTHONPATH=. python3 -m app.seed.seed_projet_phases
"""
import asyncio

from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker

from app.config import settings
from app.database import Base

# Statut → which blocs are completed/in-progress
# Format: { bloc_index: completion_pct }
# B1=Prospection, B2=Environnement, B3=Genie Civil, B4=Electrique,
# B5=?, B6=Cybersecurite, B7=Commissioning, B8=Demantelement
STATUT_PROGRESSION = {
    "prospection": {0: 60, 1: 20},
    "ingenierie": {0: 100, 1: 80, 2: 30, 3: 10},
    "autorisation": {0: 100, 1: 100, 2: 80, 3: 60, 4: 20},
    "construction": {0: 100, 1: 100, 2: 100, 3: 100, 4: 80, 5: 40, 6: 10},
    "exploitation": {0: 100, 1: 100, 2: 100, 3: 100, 4: 100, 5: 100, 6: 100, 7: 20},
}


def _get_phase_statut(pct: int) -> str:
    if pct >= 100:
        return "termine"
    elif pct > 0:
        return "en_cours"
    return "a_faire"


async def seed_projet_phases():
    engine = create_async_engine(settings.database_url, echo=False)

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    session_factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with session_factory() as session:
        # Check if already seeded
        result = await session.execute(text("SELECT COUNT(*) FROM projet_phases"))
        count = result.scalar()
        if count and count > 0:
            print(f"  {count} projet_phases deja presentes — skip seed")
            await engine.dispose()
            return

        # Get all projects
        projets_result = await session.execute(
            text("SELECT id, statut FROM projets ORDER BY date_creation")
        )
        projets = projets_result.mappings().all()

        if not projets:
            print("  Aucun projet — lancer seed_projets.py d'abord")
            await engine.dispose()
            return

        # Get first phase of each bloc (one per bloc, ordered by bloc code)
        phases_result = await session.execute(text("""
            SELECT DISTINCT ON (b.code) p.id as phase_id, b.code as bloc_code, p.code as phase_code, p.titre
            FROM phases p
            JOIN blocs b ON b.id = p.bloc_id
            ORDER BY b.code, p.ordre
        """))
        phases = phases_result.mappings().all()

        if not phases:
            print("  Aucune phase avec bloc_id — verifier le seed")
            await engine.dispose()
            return

        total = 0
        for projet in projets:
            statut = projet["statut"]
            progression = STATUT_PROGRESSION.get(statut, {0: 30})

            for i, phase in enumerate(phases):
                pct = progression.get(i, 0)
                if pct == 0:
                    continue  # Don't create rows for phases not yet started

                phase_statut = _get_phase_statut(pct)
                await session.execute(
                    text("""
                        INSERT INTO projet_phases (projet_id, phase_id, statut, completion_pct)
                        VALUES (:projet_id, :phase_id, :statut, :pct)
                        ON CONFLICT DO NOTHING
                    """),
                    {
                        "projet_id": str(projet["id"]),
                        "phase_id": phase["phase_id"],
                        "statut": phase_statut,
                        "pct": pct,
                    },
                )
                total += 1

            print(f"  + {statut:15s} → {len([k for k in progression if progression[k] > 0])} blocs")

        await session.commit()
        print(f"\n  {total} projet_phases crees pour {len(projets)} projets.")

    await engine.dispose()


if __name__ == "__main__":
    print("=== Seed projet_phases ===")
    asyncio.run(seed_projet_phases())
    print("Done.")
