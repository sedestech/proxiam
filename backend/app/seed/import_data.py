"""Import parsed brainstorm data into PostgreSQL with relations.

Usage:
    python -m app.seed.import_data         # Full import
    python -m app.seed.import_data --dry   # Parse only, show counts
"""

import asyncio
import sys
from collections import defaultdict
from pathlib import Path

from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker

from app.config import settings
from app.database import Base
from app.models import (
    Bloc, Phase, Livrable, Norme, Risque,
    SourceVeille, Outil, Competence,
)
from app.models.relations import (
    PhaseNorme, PhaseRisque, PhaseLivrable,
    PhaseOutil, PhaseCompetence,
    RisqueNorme, NormeLivrable,
)
from app.seed.parser import parse_all, save_json


SEED_DIR = Path(__file__).resolve().parents[2] / ".." / "data" / "seed"

# Brainstorm phase codes (P0-P6) → bloc codes (B1-B6).
# P0 is pre-phase (prospection), mapped to B1 as fallback.
PHASE_TO_BLOC = {
    "P0": "B1",
    "P1": "B1",
    "P2": "B2",
    "P3": "B3",
    "P4": "B4",
    "P5": "B5",
    "P6": "B6",
}


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


def pick_phases(phase_ids: list[int], count: int = 3) -> list[int]:
    """Pick evenly spaced phases from a list."""
    if not phase_ids:
        return []
    if len(phase_ids) <= count:
        return phase_ids
    step = len(phase_ids) // count
    return [phase_ids[i * step] for i in range(count)]


async def import_data(dry_run: bool = False):
    """Parse brainstorm files and import into PostgreSQL."""
    print("=" * 60)
    print("Proxiam -- Brainstorm Data Import (with relations)")
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
        print("Dry run -- skipping database import.")
        return

    # Import to DB
    print("Connecting to database...")
    engine = create_async_engine(settings.database_url, echo=False)
    await create_tables(engine)
    session_factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with session_factory() as session:
        print("Clearing existing knowledge data...")
        await clear_tables(session)

        # ── 1. Import entities ──────────────────────────────────

        # Blocs
        bloc_map = {}  # code → id
        for item in data["blocs"]:
            bloc = Bloc(code=item["code"], titre=item["titre"], description=item.get("description"))
            session.add(bloc)
            await session.flush()
            bloc_map[item["code"]] = bloc.id
        print(f"  Blocs: {len(data['blocs'])} imported")

        # Phases
        phase_map = {}  # code → id
        bloc_phase_ids = defaultdict(list)  # bloc_code → [phase_id, ...]
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
            bloc_code = item.get("bloc_code")
            if bloc_code:
                bloc_phase_ids[bloc_code].append(phase.id)
        print(f"  Phases: {len(data['phases'])} imported")

        # Normes (deduplicate by code, track phase_code)
        norme_map = {}  # code → id
        norme_phase_codes = {}  # code → phase_code
        seen_normes = set()
        for item in data["normes"]:
            if item["code"] in seen_normes:
                continue
            seen_normes.add(item["code"])
            norme = Norme(code=item["code"], titre=item["titre"], description=item.get("description"))
            session.add(norme)
            await session.flush()
            norme_map[item["code"]] = norme.id
            norme_phase_codes[item["code"]] = item.get("phase_code")
        print(f"  Normes: {len(seen_normes)} imported")

        # Risques (track phase_code)
        risque_map = {}
        risque_phase_codes = {}
        for item in data["risques"]:
            risque = Risque(code=item["code"], titre=item["titre"], description=item.get("description"))
            session.add(risque)
            await session.flush()
            risque_map[item["code"]] = risque.id
            risque_phase_codes[item["code"]] = item.get("phase_code")
        print(f"  Risques: {len(data['risques'])} imported")

        # Livrables (track phase_code)
        livrable_map = {}
        livrable_phase_codes = {}
        for item in data["livrables"]:
            livrable = Livrable(code=item["code"], titre=item["titre"], description=item.get("description"))
            session.add(livrable)
            await session.flush()
            livrable_map[item["code"]] = livrable.id
            livrable_phase_codes[item["code"]] = item.get("phase_code")
        print(f"  Livrables: {len(data['livrables'])} imported")

        # Sources
        for item in data["sources"]:
            source = SourceVeille(code=item["code"], nom=item["titre"])
            session.add(source)
        print(f"  Sources: {len(data['sources'])} imported")

        # Outils
        outil_map = {}
        for item in data["outils"]:
            outil = Outil(code=item["code"], nom=item["titre"], description=item.get("description"))
            session.add(outil)
            await session.flush()
            outil_map[item["code"]] = outil.id
        print(f"  Outils: {len(data['outils'])} imported")

        # Competences
        comp_map = {}
        for item in data["competences"]:
            comp = Competence(code=item["code"], nom=item["titre"])
            session.add(comp)
            await session.flush()
            comp_map[item["code"]] = comp.id
        print(f"  Competences: {len(data['competences'])} imported")

        await session.flush()

        # ── 2. Create relations ─────────────────────────────────
        print()
        print("Creating relations...")
        rel_count = 0

        # Phase ↔ Norme: each norme linked to 3 phases from its bloc
        for code, norme_id in norme_map.items():
            pc = norme_phase_codes.get(code)
            bloc_code = PHASE_TO_BLOC.get(pc)
            if not bloc_code:
                continue
            for pid in pick_phases(bloc_phase_ids.get(bloc_code, []), 3):
                session.add(PhaseNorme(phase_id=pid, norme_id=norme_id))
                rel_count += 1
        print(f"  PhaseNorme: {rel_count} relations")

        # Phase ↔ Risque: each risque linked to 3 phases from its bloc
        prev = rel_count
        for code, risque_id in risque_map.items():
            pc = risque_phase_codes.get(code)
            bloc_code = PHASE_TO_BLOC.get(pc)
            if not bloc_code:
                continue
            for pid in pick_phases(bloc_phase_ids.get(bloc_code, []), 3):
                session.add(PhaseRisque(phase_id=pid, risque_id=risque_id))
                rel_count += 1
        print(f"  PhaseRisque: {rel_count - prev} relations")

        # Phase ↔ Livrable: each livrable linked to 3 phases from its bloc
        prev = rel_count
        for code, livrable_id in livrable_map.items():
            pc = livrable_phase_codes.get(code)
            bloc_code = PHASE_TO_BLOC.get(pc)
            if not bloc_code:
                continue
            for pid in pick_phases(bloc_phase_ids.get(bloc_code, []), 3):
                session.add(PhaseLivrable(phase_id=pid, livrable_id=livrable_id))
                rel_count += 1
        print(f"  PhaseLivrable: {rel_count - prev} relations")

        # Phase ↔ Outil: distribute outils across blocs (round-robin)
        prev = rel_count
        all_bloc_codes = sorted(bloc_phase_ids.keys())
        outil_codes = list(outil_map.keys())
        for i, code in enumerate(outil_codes):
            bloc_code = all_bloc_codes[i % len(all_bloc_codes)]
            for pid in pick_phases(bloc_phase_ids.get(bloc_code, []), 2):
                session.add(PhaseOutil(phase_id=pid, outil_id=outil_map[code]))
                rel_count += 1
        print(f"  PhaseOutil: {rel_count - prev} relations")

        # Phase ↔ Competence: distribute competences across blocs
        prev = rel_count
        comp_codes = list(comp_map.keys())
        for i, code in enumerate(comp_codes):
            bloc_code = all_bloc_codes[i % len(all_bloc_codes)]
            for pid in pick_phases(bloc_phase_ids.get(bloc_code, []), 2):
                session.add(PhaseCompetence(phase_id=pid, competence_id=comp_map[code]))
                rel_count += 1
        print(f"  PhaseCompetence: {rel_count - prev} relations")

        # Risque ↔ Norme: link risques and normes from same phase_code
        prev = rel_count
        phase_normes = defaultdict(list)
        for code, pc in norme_phase_codes.items():
            if pc:
                phase_normes[pc].append(norme_map[code])
        for code, risque_id in risque_map.items():
            pc = risque_phase_codes.get(code)
            if not pc or pc not in phase_normes:
                continue
            # Link to first 2 normes from same phase
            for nid in phase_normes[pc][:2]:
                session.add(RisqueNorme(risque_id=risque_id, norme_id=nid, relation="impose_par"))
                rel_count += 1
        print(f"  RisqueNorme: {rel_count - prev} relations")

        # Norme ↔ Livrable: link normes and livrables from same phase_code
        prev = rel_count
        phase_livrables = defaultdict(list)
        for code, pc in livrable_phase_codes.items():
            if pc:
                phase_livrables[pc].append(livrable_map[code])
        for code, norme_id in norme_map.items():
            pc = norme_phase_codes.get(code)
            if not pc or pc not in phase_livrables:
                continue
            # Link to first 2 livrables from same phase
            for lid in phase_livrables[pc][:2]:
                session.add(NormeLivrable(norme_id=norme_id, livrable_id=lid, relation="exige"))
                rel_count += 1
        print(f"  NormeLivrable: {rel_count - prev} relations")

        print(f"\n  Total relations: {rel_count}")

        await session.commit()

    await engine.dispose()
    print()
    print("Import complete!")


if __name__ == "__main__":
    dry = "--dry" in sys.argv
    asyncio.run(import_data(dry_run=dry))
