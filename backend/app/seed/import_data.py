"""Import parsed brainstorm data into PostgreSQL.

Usage:
    python -m app.seed.import_data         # Full import
    python -m app.seed.import_data --dry   # Parse only, show counts
"""

import asyncio
import json
import sys
from pathlib import Path

from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker

from app.config import settings
from app.database import Base
from app.models import (
    Bloc, Phase, Livrable, Norme, Risque,
    SourceVeille, Outil, Competence,
)
from app.seed.parser import parse_all, save_json


SEED_DIR = Path(__file__).resolve().parents[2] / ".." / "data" / "seed"


async def create_tables(engine):
    """Create all tables if they don't exist."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def clear_tables(session: AsyncSession):
    """Clear all knowledge base tables (not projects/postes)."""
    tables = [
        "phase_livrables", "phase_normes", "phase_risques",
        "phase_outils", "phase_competences",
        "risque_normes", "risque_outils", "norme_livrables", "outil_competences",
        "competences", "outils", "sources_veille",
        "risques", "normes", "livrables", "phases", "blocs",
    ]
    for table in tables:
        await session.execute(text(f"DELETE FROM {table}"))
    await session.commit()


async def import_data(dry_run: bool = False):
    """Parse brainstorm files and import into PostgreSQL."""
    print("=" * 60)
    print("Proxiam — Brainstorm Data Import")
    print("=" * 60)
    print()

    # Parse
    data = parse_all()

    print("Parsed data:")
    for key, items in data.items():
        print(f"  {key}: {len(items)} items")
    print()

    # Save JSON
    save_json(data, SEED_DIR)

    if dry_run:
        print("Dry run — skipping database import.")
        return

    # Import to DB
    print("Connecting to database...")
    engine = create_async_engine(settings.database_url, echo=False)
    await create_tables(engine)
    session_factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with session_factory() as session:
        print("Clearing existing knowledge data...")
        await clear_tables(session)

        # Blocs
        bloc_map = {}
        for item in data["blocs"]:
            bloc = Bloc(code=item["code"], titre=item["titre"], description=item.get("description"))
            session.add(bloc)
            await session.flush()
            bloc_map[item["code"]] = bloc.id
        print(f"  Blocs: {len(data['blocs'])} imported")

        # Phases
        phase_map = {}
        for item in data["phases"]:
            phase = Phase(
                code=item["code"],
                bloc_id=bloc_map.get(item.get("bloc_code")),
                titre=item["titre"],
                description=item.get("description"),
                ordre=item.get("ordre"),
            )
            session.add(phase)
            await session.flush()
            phase_map[item["code"]] = phase.id
        print(f"  Phases: {len(data['phases'])} imported")

        # Normes
        for item in data["normes"]:
            norme = Norme(code=item["code"], titre=item["titre"], description=item.get("description"))
            session.add(norme)
        print(f"  Normes: {len(data['normes'])} imported")

        # Risques
        for item in data["risques"]:
            risque = Risque(code=item["code"], titre=item["titre"], description=item.get("description"))
            session.add(risque)
        print(f"  Risques: {len(data['risques'])} imported")

        # Livrables
        for item in data["livrables"]:
            livrable = Livrable(code=item["code"], titre=item["titre"], description=item.get("description"))
            session.add(livrable)
        print(f"  Livrables: {len(data['livrables'])} imported")

        # Sources
        for item in data["sources"]:
            source = SourceVeille(code=item["code"], nom=item["titre"])
            session.add(source)
        print(f"  Sources: {len(data['sources'])} imported")

        # Outils
        for item in data["outils"]:
            outil = Outil(code=item["code"], nom=item["titre"], description=item.get("description"))
            session.add(outil)
        print(f"  Outils: {len(data['outils'])} imported")

        # Competences
        for item in data["competences"]:
            comp = Competence(code=item["code"], nom=item["titre"])
            session.add(comp)
        print(f"  Competences: {len(data['competences'])} imported")

        await session.commit()

    await engine.dispose()
    print()
    print("Import complete!")


if __name__ == "__main__":
    dry = "--dry" in sys.argv
    asyncio.run(import_data(dry_run=dry))
