"""Import ODRE reference projects from CSV/JSON.

Usage:
    cd backend
    PYTHONPATH=. python -m app.commands.import_odre path/to/odre_projects.csv
    PYTHONPATH=. python -m app.commands.import_odre path/to/odre_projects.json --dry

Data source:
    https://odre.opendatasoft.com/explore/dataset/registre-national-installations-production-stockage-electricite-agrege
"""
import argparse
import csv
import json
import logging
import sys
from pathlib import Path
from uuid import uuid4

logging.basicConfig(level=logging.INFO, format="%(levelname)s | %(message)s")
logger = logging.getLogger(__name__)


def parse_record(record: dict) -> dict | None:
    """Parse an ODRE record into a project dict."""
    nom = record.get("nom_projet") or record.get("Nom du projet") or record.get("nom")
    if not nom:
        return None

    filiere_raw = (record.get("type_projet") or record.get("Filiere") or record.get("filiere") or "").lower()
    filiere_map = {
        "photovoltaique": "solaire_sol", "photovoltaique": "solaire_sol", "solaire": "solaire_sol",
        "eolien": "eolien_onshore", "eolien": "eolien_onshore", "eolien terrestre": "eolien_onshore",
        "stockage": "bess", "batterie": "bess",
    }
    filiere = filiere_map.get(filiere_raw, filiere_raw or "autre")

    puissance = record.get("puissance_mw") or record.get("Puissance (MW)") or record.get("puissance_mwc")
    try:
        puissance = float(puissance) if puissance else None
    except (ValueError, TypeError):
        puissance = None

    return {
        "id": str(uuid4()),
        "nom": str(nom).strip(),
        "filiere": filiere,
        "puissance_mwc": puissance,
        "commune": (record.get("commune") or record.get("Commune") or "").strip(),
        "departement": (record.get("departement") or record.get("Departement") or "").strip(),
        "statut": (record.get("statut_global") or record.get("Statut") or "en_instruction").strip().lower(),
        "metadata": json.dumps({"source": "odre", "is_reference": True}),
    }


async def import_odre(file_path: str, dry_run: bool = False) -> dict:
    """Import ODRE projects as reference data."""
    path = Path(file_path)
    if not path.exists():
        logger.error("File not found: %s", path)
        return {"status": "error", "error": f"File not found: {path}"}

    records = []
    if path.suffix == ".csv":
        with open(path, encoding="utf-8") as f:
            reader = csv.DictReader(f)
            records = list(reader)
    elif path.suffix == ".json":
        data = json.loads(path.read_text(encoding="utf-8"))
        records = data if isinstance(data, list) else data.get("records", data.get("results", []))
    else:
        return {"status": "error", "error": f"Unsupported format: {path.suffix}"}

    logger.info("Read %d records from %s", len(records), path.name)

    parsed = []
    skipped = 0
    for r in records:
        p = parse_record(r)
        if p:
            parsed.append(p)
        else:
            skipped += 1

    logger.info("Parsed: %d  |  Skipped: %d", len(parsed), skipped)

    if dry_run:
        logger.info("DRY RUN -- sample:")
        for p in parsed[:5]:
            logger.info("  %s | %s | %s MW | %s", p["filiere"], p["nom"][:50], p["puissance_mwc"], p["commune"])
        return {"status": "dry_run", "parsed": len(parsed), "skipped": skipped}

    from sqlalchemy import text
    from app.database import engine as async_engine

    inserted = 0
    async with async_engine.begin() as conn:
        for p in parsed:
            await conn.execute(
                text("""
                    INSERT INTO projets (id, nom, filiere, puissance_mwc, commune, departement, statut, metadata_)
                    VALUES (:id, :nom, :filiere, :puissance_mwc, :commune, :departement, :statut, :metadata::jsonb)
                    ON CONFLICT DO NOTHING
                """),
                p,
            )
            inserted += 1

    async with async_engine.begin() as conn:
        await conn.execute(
            text("""
                INSERT INTO data_source_statuses (source_name, display_name, category, record_count, last_updated, update_frequency_days, quality_score, status, notes)
                VALUES ('odre_reference', 'Projets ODRE (reference)', 'projects', :count, NOW(), 90, 90, 'ok', 'Registre national installations ENR')
                ON CONFLICT (source_name) DO UPDATE SET
                    record_count = :count, last_updated = NOW(), status = 'ok'
            """),
            {"count": inserted},
        )

    logger.info("Inserted %d reference projects from ODRE", inserted)
    return {"status": "ok", "inserted": inserted, "skipped": skipped}


if __name__ == "__main__":
    import asyncio

    parser = argparse.ArgumentParser(description="Import ODRE reference projects")
    parser.add_argument("file", help="Path to CSV or JSON file")
    parser.add_argument("--dry", action="store_true", help="Parse only, no DB write")
    args = parser.parse_args()

    result = asyncio.run(import_odre(args.file, dry_run=args.dry))
    logger.info("Result: %s", result)
    sys.exit(0 if result["status"] != "error" else 1)
