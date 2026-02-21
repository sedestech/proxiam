"""Import Natura 2000 zones from GeoJSON into PostGIS.

Usage:
    cd backend
    PYTHONPATH=. python -m app.commands.import_natura2000 path/to/natura2000.geojson
    PYTHONPATH=. python -m app.commands.import_natura2000 path/to/natura2000.geojson --dry

Data source:
    https://inpn.mnhn.fr/telechargement/cartes-et-information-geographique/nat/natura
    Download: "Natura 2000 - Périmètres" → GeoJSON or Shapefile
"""
import argparse
import json
import logging
import sys
from pathlib import Path

logging.basicConfig(level=logging.INFO, format="%(levelname)s | %(message)s")
logger = logging.getLogger(__name__)


def parse_feature(feature: dict) -> dict | None:
    """Parse a single GeoJSON feature into a Natura2000 row dict."""
    props = feature.get("properties", {})
    geom = feature.get("geometry")
    if not geom or not props:
        return None

    site_code = props.get("sitecode") or props.get("SITECODE") or props.get("site_code")
    nom = props.get("sitename") or props.get("SITENAME") or props.get("nom")
    type_zone = props.get("sitetype") or props.get("SITETYPE") or ""

    if not site_code or not nom:
        return None

    type_map = {"A": "ZPS", "B": "ZSC", "C": "ZPS+ZSC"}
    type_zone = type_map.get(type_zone, type_zone.upper()[:10])

    surface = props.get("areaha") or props.get("AREAHA") or props.get("surface_ha")

    return {
        "site_code": str(site_code).strip(),
        "nom": str(nom).strip(),
        "type_zone": type_zone,
        "surface_ha": float(surface) if surface else None,
        "region": (props.get("region") or props.get("REGION") or ""),
        "departement": (props.get("departement") or props.get("DEPARTEMENT") or ""),
        "geojson": json.dumps(geom),
    }


async def import_natura2000(geojson_path: str, dry_run: bool = False) -> dict:
    """Import GeoJSON features into natura2000 table."""
    path = Path(geojson_path)
    if not path.exists():
        logger.error("File not found: %s", path)
        return {"status": "error", "error": f"File not found: {path}"}

    logger.info("Reading %s ...", path)
    data = json.loads(path.read_text(encoding="utf-8"))
    features = data.get("features", [])
    logger.info("Found %d features", len(features))

    parsed = []
    skipped = 0
    for f in features:
        row = parse_feature(f)
        if row:
            parsed.append(row)
        else:
            skipped += 1

    logger.info("Parsed: %d  |  Skipped: %d", len(parsed), skipped)

    if dry_run:
        logger.info("DRY RUN — no database writes")
        for r in parsed[:5]:
            logger.info("  %s | %s | %s | %.0f ha", r["site_code"], r["type_zone"], r["nom"][:60], r["surface_ha"] or 0)
        return {"status": "dry_run", "parsed": len(parsed), "skipped": skipped}

    # Database insert
    from sqlalchemy import text

    from app.database import engine as async_engine

    inserted = 0
    async with async_engine.begin() as conn:
        for row in parsed:
            await conn.execute(
                text("""
                    INSERT INTO natura2000 (site_code, nom, type_zone, surface_ha, region, departement, geom)
                    VALUES (:site_code, :nom, :type_zone, :surface_ha, :region, :departement,
                            ST_SetSRID(ST_GeomFromGeoJSON(:geojson), 4326))
                    ON CONFLICT (site_code) DO UPDATE SET
                        nom = EXCLUDED.nom,
                        type_zone = EXCLUDED.type_zone,
                        surface_ha = EXCLUDED.surface_ha,
                        region = EXCLUDED.region,
                        departement = EXCLUDED.departement,
                        geom = EXCLUDED.geom
                """),
                row,
            )
            inserted += 1

    # Update DataSourceStatus
    async with async_engine.begin() as conn:
        await conn.execute(
            text("""
                INSERT INTO data_source_statuses (source_name, display_name, category, record_count, last_updated, update_frequency_days, quality_score, status)
                VALUES ('natura2000', 'Natura 2000 (INPN)', 'geospatial', :count, NOW(), 180, 95, 'ok')
                ON CONFLICT (source_name) DO UPDATE SET
                    record_count = :count, last_updated = NOW(), status = 'ok', quality_score = 95
            """),
            {"count": inserted},
        )

    logger.info("Inserted %d Natura 2000 zones", inserted)
    return {"status": "ok", "inserted": inserted, "skipped": skipped}


if __name__ == "__main__":
    import asyncio

    parser = argparse.ArgumentParser(description="Import Natura 2000 GeoJSON")
    parser.add_argument("file", help="Path to GeoJSON file")
    parser.add_argument("--dry", action="store_true", help="Parse only, no DB write")
    args = parser.parse_args()

    result = asyncio.run(import_natura2000(args.file, dry_run=args.dry))
    logger.info("Result: %s", result)
    sys.exit(0 if result["status"] != "error" else 1)
