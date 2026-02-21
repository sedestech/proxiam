"""Import environmental constraint data — Sprint 13.

Downloads and imports Natura 2000 and ZNIEFF zones from data.gouv.fr
into PostGIS tables. Uses streaming + batch inserts to handle large files.

Usage:
    PYTHONPATH=. python3 -m app.seed.import_constraints [--dry]
"""
import argparse
import json
import logging
import sys
from pathlib import Path

import httpx

logger = logging.getLogger(__name__)

# Data source URLs (simplified GeoJSON from INPN via data.gouv.fr)
NATURA2000_URL = "https://inpn.mnhn.fr/docs/natura2000/fxx_inpn.geojson"
ZNIEFF_URL = "https://inpn.mnhn.fr/docs/znieff/fxx_znieff1_inpn.geojson"

DATA_DIR = Path(__file__).parent / "data" / "constraints"


def download_if_needed(url: str, filename: str) -> Path:
    """Download a file if not already cached locally."""
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    filepath = DATA_DIR / filename

    if filepath.exists():
        logger.info("Using cached file: %s", filepath)
        return filepath

    logger.info("Downloading %s ...", url)
    try:
        with httpx.stream("GET", url, timeout=120, follow_redirects=True) as resp:
            resp.raise_for_status()
            with open(filepath, "wb") as f:
                for chunk in resp.iter_bytes(chunk_size=8192):
                    f.write(chunk)
        logger.info("Downloaded: %s (%.1f MB)", filepath, filepath.stat().st_size / 1e6)
    except Exception as exc:
        logger.error("Download failed: %s", exc)
        logger.info(
            "To use constraint data, manually place GeoJSON files in %s/",
            DATA_DIR,
        )
        return filepath

    return filepath


def parse_natura2000_feature(feat: dict) -> dict | None:
    """Parse a single Natura 2000 GeoJSON feature."""
    props = feat.get("properties", {})
    geom = feat.get("geometry")
    if not geom or not props.get("SITECODE"):
        return None

    return {
        "site_code": props.get("SITECODE", ""),
        "nom": props.get("SITENAME", props.get("NOM", "")),
        "type_zone": props.get("SITETYPE", ""),
        "surface_ha": props.get("AREAHA"),
        "region": props.get("REGION", ""),
        "departement": props.get("DEPARTEMENT", ""),
        "geom_geojson": json.dumps(geom),
    }


def parse_znieff_feature(feat: dict) -> dict | None:
    """Parse a single ZNIEFF GeoJSON feature."""
    props = feat.get("properties", {})
    geom = feat.get("geometry")
    if not geom or not props.get("ID_MNHN"):
        return None

    return {
        "code_mnhn": props.get("ID_MNHN", ""),
        "nom": props.get("NOM", ""),
        "type_zone": props.get("TYPE", ""),
        "surface_ha": props.get("SUPERFICIE"),
        "region": props.get("REGION", ""),
        "departement": props.get("DEPARTEMENT", ""),
        "geom_geojson": json.dumps(geom),
    }


async def import_natura2000(filepath: Path, db, dry: bool = False) -> int:
    """Import Natura 2000 zones from GeoJSON file."""
    from sqlalchemy import text

    if not filepath.exists():
        logger.warning("Natura 2000 file not found: %s", filepath)
        return 0

    logger.info("Parsing Natura 2000 from %s ...", filepath)
    with open(filepath) as f:
        data = json.load(f)

    features = data.get("features", [])
    logger.info("Found %d Natura 2000 features", len(features))

    if dry:
        return len(features)

    count = 0
    batch_size = 100
    for i in range(0, len(features), batch_size):
        batch = features[i:i + batch_size]
        for feat in batch:
            parsed = parse_natura2000_feature(feat)
            if not parsed:
                continue
            try:
                await db.execute(
                    text("""
                        INSERT INTO natura2000 (site_code, nom, type_zone, surface_ha, region, departement, geom)
                        VALUES (:site_code, :nom, :type_zone, :surface_ha, :region, :departement,
                                ST_SetSRID(ST_GeomFromGeoJSON(:geom), 4326))
                        ON CONFLICT (site_code) DO UPDATE SET
                            nom = EXCLUDED.nom,
                            geom = EXCLUDED.geom
                    """),
                    {
                        "site_code": parsed["site_code"],
                        "nom": parsed["nom"],
                        "type_zone": parsed["type_zone"],
                        "surface_ha": parsed["surface_ha"],
                        "region": parsed["region"],
                        "departement": parsed["departement"],
                        "geom": parsed["geom_geojson"],
                    },
                )
                count += 1
            except Exception as exc:
                logger.debug("Skip Natura 2000 feature: %s", exc)

        await db.commit()
        logger.info("Natura 2000: %d/%d imported", count, len(features))

    # Create spatial index
    try:
        await db.execute(text(
            "CREATE INDEX IF NOT EXISTS idx_natura2000_geom ON natura2000 USING GIST (geom)"
        ))
        await db.commit()
    except Exception:
        pass

    return count


async def import_znieff(filepath: Path, db, dry: bool = False) -> int:
    """Import ZNIEFF zones from GeoJSON file."""
    from sqlalchemy import text

    if not filepath.exists():
        logger.warning("ZNIEFF file not found: %s", filepath)
        return 0

    logger.info("Parsing ZNIEFF from %s ...", filepath)
    with open(filepath) as f:
        data = json.load(f)

    features = data.get("features", [])
    logger.info("Found %d ZNIEFF features", len(features))

    if dry:
        return len(features)

    count = 0
    batch_size = 100
    for i in range(0, len(features), batch_size):
        batch = features[i:i + batch_size]
        for feat in batch:
            parsed = parse_znieff_feature(feat)
            if not parsed:
                continue
            try:
                await db.execute(
                    text("""
                        INSERT INTO znieff (code_mnhn, nom, type_zone, surface_ha, region, departement, geom)
                        VALUES (:code_mnhn, :nom, :type_zone, :surface_ha, :region, :departement,
                                ST_SetSRID(ST_GeomFromGeoJSON(:geom), 4326))
                        ON CONFLICT (code_mnhn) DO UPDATE SET
                            nom = EXCLUDED.nom,
                            geom = EXCLUDED.geom
                    """),
                    {
                        "code_mnhn": parsed["code_mnhn"],
                        "nom": parsed["nom"],
                        "type_zone": parsed["type_zone"],
                        "surface_ha": parsed["surface_ha"],
                        "region": parsed["region"],
                        "departement": parsed["departement"],
                        "geom": parsed["geom_geojson"],
                    },
                )
                count += 1
            except Exception as exc:
                logger.debug("Skip ZNIEFF feature: %s", exc)

        await db.commit()
        logger.info("ZNIEFF: %d/%d imported", count, len(features))

    # Create spatial index
    try:
        await db.execute(text(
            "CREATE INDEX IF NOT EXISTS idx_znieff_geom ON znieff USING GIST (geom)"
        ))
        await db.commit()
    except Exception:
        pass

    return count


async def main(dry: bool = False):
    """Main import function."""
    import asyncio
    from app.database import engine, Base, async_session

    logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")

    # Create tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # Download files
    natura_file = download_if_needed(NATURA2000_URL, "natura2000.geojson")
    znieff_file = download_if_needed(ZNIEFF_URL, "znieff.geojson")

    async with async_session() as db:
        n2000_count = await import_natura2000(natura_file, db, dry=dry)
        znieff_count = await import_znieff(znieff_file, db, dry=dry)

    action = "Found" if dry else "Imported"
    logger.info("%s: %d Natura 2000 zones, %d ZNIEFF zones", action, n2000_count, znieff_count)


if __name__ == "__main__":
    import asyncio

    parser = argparse.ArgumentParser(description="Import environmental constraint data")
    parser.add_argument("--dry", action="store_true", help="Dry run (parse only)")
    args = parser.parse_args()

    asyncio.run(main(dry=args.dry))
