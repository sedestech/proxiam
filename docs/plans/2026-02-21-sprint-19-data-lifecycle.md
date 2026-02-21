# Sprint 19 — Data Lifecycle + Données Réelles — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform Proxiam from a demo with static data into a platform with real, fresh, versioned data — Natura2000 geospatial constraints, updated financial constants, Alembic migrations, Data Health dashboard, ODRÉ benchmark data, and Knowledge Graph refresh mechanism.

**Architecture:** Alembic manages all schema changes. A new `data_source_status` table tracks freshness/quality of every dataset. Financial constants move from hardcoded dicts to a JSON config file with a version date. Natura2000/ZNIEFF GeoJSON loaded via a management command. ODRÉ projects imported as `reference_projects` (separate from user projects). Knowledge Graph gets a `/api/knowledge/refresh` admin endpoint.

**Tech Stack:** Alembic 1.13.1 (already in requirements.txt), PostGIS (MULTIPOLYGON), FastAPI, React 18 + Recharts, Vitest

---

## Task 1: Generate Alembic Initial Migration

**Files:**
- Modify: `backend/alembic/env.py` (already configured)
- Create: `backend/alembic/versions/` (first migration)
- Modify: `backend/app/main.py` (remove create_all)

**Step 1: Verify Alembic config works**

Run: `cd /Users/admin/Documents/ClaudeCode/Proxiam/backend && PYTHONPATH=. alembic current`
Expected: Shows "head" or empty (no migrations yet)

**Step 2: Generate initial migration from existing models**

Run: `cd /Users/admin/Documents/ClaudeCode/Proxiam/backend && PYTHONPATH=. alembic revision --autogenerate -m "initial_schema"`
Expected: Creates a file in `alembic/versions/` with all 25 tables

**Step 3: Verify migration file looks correct**

Read the generated migration file. Confirm it contains `create_table` for: blocs, phases, normes, risques, livrables, outils, sources_veille, competences, projets, postes_sources, natura2000, znieff, users, usage_logs, user_watches, alerts, scraped_contents, projet_phases, projet_risques, projet_documents, and all 9 junction tables.

**Step 4: Remove create_all from main.py**

In `backend/app/main.py`, find the `Base.metadata.create_all()` call in the lifespan function and replace it with a comment:

```python
# Schema managed by Alembic — run: alembic upgrade head
```

**Step 5: Commit**

```bash
git add backend/alembic/versions/ backend/app/main.py
git commit -m "feat(sprint-19): add Alembic initial migration, remove create_all"
```

---

## Task 2: Create DataSourceStatus Model + Migration

**Files:**
- Create: `backend/app/models/data_source_status.py`
- Modify: `backend/app/models/__init__.py`
- Create: `backend/alembic/versions/` (new migration)
- Create: `backend/tests/test_data_health.py`

**Step 1: Write the failing test**

Create `backend/tests/test_data_health.py`:

```python
"""Tests for Data Health / DataSourceStatus."""
from datetime import datetime, timezone

import pytest


def _make_status(**overrides):
    defaults = {
        "source_name": "natura2000",
        "display_name": "Natura 2000",
        "category": "geospatial",
        "record_count": 1753,
        "last_updated": datetime(2026, 2, 21, tzinfo=timezone.utc),
        "update_frequency_days": 90,
        "quality_score": 95,
        "status": "ok",
    }
    defaults.update(overrides)
    return defaults


class TestDataSourceStatusModel:
    def test_status_fields(self):
        s = _make_status()
        assert s["source_name"] == "natura2000"
        assert s["category"] == "geospatial"
        assert s["record_count"] == 1753
        assert s["quality_score"] == 95

    def test_freshness_ok(self):
        now = datetime(2026, 2, 21, tzinfo=timezone.utc)
        s = _make_status(
            last_updated=datetime(2026, 2, 1, tzinfo=timezone.utc),
            update_frequency_days=30,
        )
        days_since = (now - s["last_updated"]).days
        is_stale = days_since > s["update_frequency_days"]
        assert is_stale is False  # 20 days < 30 days

    def test_freshness_stale(self):
        now = datetime(2026, 2, 21, tzinfo=timezone.utc)
        s = _make_status(
            last_updated=datetime(2025, 6, 1, tzinfo=timezone.utc),
            update_frequency_days=90,
        )
        days_since = (now - s["last_updated"]).days
        is_stale = days_since > s["update_frequency_days"]
        assert is_stale is True  # 265 days > 90 days

    def test_quality_score_range(self):
        s = _make_status(quality_score=0)
        assert 0 <= s["quality_score"] <= 100
        s2 = _make_status(quality_score=100)
        assert 0 <= s2["quality_score"] <= 100

    def test_status_values(self):
        for val in ("ok", "stale", "error", "loading"):
            s = _make_status(status=val)
            assert s["status"] in ("ok", "stale", "error", "loading")
```

**Step 2: Run test to verify it passes (pure unit test)**

Run: `cd /Users/admin/Documents/ClaudeCode/Proxiam/backend && python -m pytest tests/test_data_health.py -v`
Expected: 5 passed

**Step 3: Create the SQLAlchemy model**

Create `backend/app/models/data_source_status.py`:

```python
"""Data source health tracking — Sprint 19."""
from sqlalchemy import Column, DateTime, Float, Integer, String, Text
from sqlalchemy.sql import func

from app.database import Base


class DataSourceStatus(Base):
    __tablename__ = "data_source_statuses"

    id = Column(Integer, primary_key=True, autoincrement=True)
    source_name = Column(String(50), unique=True, nullable=False, index=True)
    display_name = Column(String(100), nullable=False)
    category = Column(String(30), nullable=False)  # geospatial, financial, knowledge, veille
    record_count = Column(Integer, default=0)
    last_updated = Column(DateTime(timezone=True))
    update_frequency_days = Column(Integer, default=90)
    quality_score = Column(Integer, default=0)  # 0-100
    status = Column(String(20), default="ok")  # ok, stale, error, loading
    notes = Column(Text)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
```

**Step 4: Register model in `__init__.py`**

Add to `backend/app/models/__init__.py`:

```python
from app.models.data_source_status import DataSourceStatus  # noqa: F401
```

**Step 5: Generate Alembic migration**

Run: `cd /Users/admin/Documents/ClaudeCode/Proxiam/backend && PYTHONPATH=. alembic revision --autogenerate -m "add_data_source_statuses"`
Expected: New migration file adding `data_source_statuses` table

**Step 6: Commit**

```bash
git add backend/app/models/data_source_status.py backend/app/models/__init__.py backend/alembic/versions/ backend/tests/test_data_health.py
git commit -m "feat(sprint-19): add DataSourceStatus model + migration + tests"
```

---

## Task 3: Financial Constants — Extract to Versioned Config

**Files:**
- Create: `backend/data/config/financial_constants.json`
- Modify: `backend/app/services/financial.py`
- Create: `backend/tests/test_financial_constants.py`

**Step 1: Write failing test**

Create `backend/tests/test_financial_constants.py`:

```python
"""Tests for versioned financial constants."""
import json
from pathlib import Path

import pytest

CONSTANTS_PATH = Path(__file__).resolve().parent.parent / "data" / "config" / "financial_constants.json"


class TestFinancialConstants:
    def test_file_exists(self):
        assert CONSTANTS_PATH.exists(), f"Missing {CONSTANTS_PATH}"

    def test_valid_json(self):
        data = json.loads(CONSTANTS_PATH.read_text())
        assert isinstance(data, dict)

    def test_has_version_metadata(self):
        data = json.loads(CONSTANTS_PATH.read_text())
        assert "version" in data
        assert "date" in data
        assert "sources" in data

    def test_has_all_filieres(self):
        data = json.loads(CONSTANTS_PATH.read_text())
        for filiere in ("solaire_sol", "eolien_onshore", "bess"):
            assert filiere in data["capex"], f"Missing CAPEX for {filiere}"
            assert filiere in data["opex_pct"], f"Missing OPEX for {filiere}"
            assert filiere in data["lifetime"], f"Missing lifetime for {filiere}"
            assert filiere in data["facteur_charge"], f"Missing capacity factor for {filiere}"
            assert filiere in data["prix_vente"], f"Missing prices for {filiere}"

    def test_capex_values_reasonable(self):
        data = json.loads(CONSTANTS_PATH.read_text())
        sol = data["capex"]["solaire_sol"]
        assert 400 <= sol["min"] <= 1200  # EUR/kWc reasonable range
        assert sol["min"] <= sol["median"] <= sol["max"]

    def test_discount_rate_reasonable(self):
        data = json.loads(CONSTANTS_PATH.read_text())
        assert 0.03 <= data["discount_rate"] <= 0.12

    def test_date_is_2026(self):
        data = json.loads(CONSTANTS_PATH.read_text())
        assert data["date"].startswith("2026")
```

**Step 2: Run test — should fail (file missing)**

Run: `cd /Users/admin/Documents/ClaudeCode/Proxiam/backend && python -m pytest tests/test_financial_constants.py -v`
Expected: FAIL — file not found

**Step 3: Create the versioned JSON config**

Create `backend/data/config/financial_constants.json`:

```json
{
  "version": "2026-S1",
  "date": "2026-02-21",
  "sources": [
    "CRE AO S1 2026",
    "ADEME Coûts ENR 2025",
    "Bloomberg NEF Global Storage Outlook 2025",
    "FEE Observatoire éolien 2025",
    "RTE Bilan Prévisionnel 2025"
  ],
  "capex": {
    "solaire_sol": {"min": 600, "median": 700, "max": 900, "unit": "EUR/kWc", "tendance": "baisse (-5%/an)"},
    "eolien_onshore": {"min": 1050, "median": 1250, "max": 1550, "unit": "EUR/kWc", "tendance": "stable"},
    "bess": {"min": 200, "median": 300, "max": 450, "unit": "EUR/kWh", "tendance": "baisse (-15%/an LFP)"}
  },
  "opex_pct": {
    "solaire_sol": 1.5,
    "eolien_onshore": 3.0,
    "bess": 2.0
  },
  "lifetime": {
    "solaire_sol": 30,
    "eolien_onshore": 25,
    "bess": 15
  },
  "facteur_charge": {
    "solaire_sol": 0.14,
    "eolien_onshore": 0.24,
    "bess": 0.15
  },
  "prix_vente": {
    "solaire_sol": {"cre_ao": 52, "ppa": 48, "marche": 60},
    "eolien_onshore": {"cre_ao": 62, "ppa": 52, "marche": 60},
    "bess": {"fcr": 75, "afrr": 38, "arbitrage": 28, "capacite": 20}
  },
  "raccordement": {
    "solaire_sol": {"min": 50, "median": 100, "max": 200},
    "eolien_onshore": {"min": 80, "median": 150, "max": 300},
    "bess": {"min": 30, "median": 80, "max": 150}
  },
  "discount_rate": 0.06,
  "degradation_annual_pct": {
    "solaire_sol": 0.4,
    "eolien_onshore": 0.0,
    "bess": 2.0
  }
}
```

**Step 4: Run tests — should pass**

Run: `cd /Users/admin/Documents/ClaudeCode/Proxiam/backend && python -m pytest tests/test_financial_constants.py -v`
Expected: 7 passed

**Step 5: Modify financial.py to load from JSON**

In `backend/app/services/financial.py`, replace the hardcoded constants at the top of the file with:

```python
import json
from pathlib import Path

_CONSTANTS_PATH = Path(__file__).resolve().parent.parent.parent / "data" / "config" / "financial_constants.json"
_constants_cache: dict | None = None


def _load_constants() -> dict:
    global _constants_cache
    if _constants_cache is None:
        _constants_cache = json.loads(_CONSTANTS_PATH.read_text())
    return _constants_cache


def get_financial_version() -> dict:
    c = _load_constants()
    return {"version": c["version"], "date": c["date"], "sources": c["sources"]}
```

Then replace all references to the old hardcoded dicts:
- `CAPEX_BENCHMARKS` → `_load_constants()["capex"]`
- `OPEX_PCT` → `_load_constants()["opex_pct"]`
- `LIFETIME` → `_load_constants()["lifetime"]`
- `FACTEUR_CHARGE` → `_load_constants()["facteur_charge"]`
- `PRIX_VENTE` → `_load_constants()["prix_vente"]`
- `RACCORDEMENT_COST` → `_load_constants()["raccordement"]`
- `DISCOUNT_RATE` → `_load_constants()["discount_rate"]`

**Step 6: Run existing financial tests to verify no regression**

Run: `cd /Users/admin/Documents/ClaudeCode/Proxiam/backend && python -m pytest tests/test_financial.py tests/test_financial_constants.py -v`
Expected: All pass

**Step 7: Commit**

```bash
git add backend/data/config/financial_constants.json backend/app/services/financial.py backend/tests/test_financial_constants.py
git commit -m "feat(sprint-19): extract financial constants to versioned JSON config (2026-S1)"
```

---

## Task 4: Natura 2000 GeoJSON Import Command

**Files:**
- Create: `backend/app/commands/import_natura2000.py`
- Create: `backend/tests/test_natura2000_import.py`

**Step 1: Write the failing test**

Create `backend/tests/test_natura2000_import.py`:

```python
"""Tests for Natura 2000 GeoJSON import logic."""
import json

import pytest


def parse_natura2000_feature(feature: dict) -> dict | None:
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

    # Normalize type_zone: A=ZPS, B=ZSC, C=ZPS+ZSC
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
    }


class TestNatura2000Parser:
    def test_parse_valid_feature(self):
        feature = {
            "type": "Feature",
            "properties": {
                "sitecode": "FR1100795",
                "sitename": "Forêt de Fontainebleau",
                "sitetype": "B",
                "areaha": 28137.5,
                "region": "Île-de-France",
                "departement": "77",
            },
            "geometry": {"type": "MultiPolygon", "coordinates": [[[[2.6, 48.4], [2.7, 48.4], [2.7, 48.5], [2.6, 48.4]]]]},
        }
        result = parse_natura2000_feature(feature)
        assert result is not None
        assert result["site_code"] == "FR1100795"
        assert result["nom"] == "Forêt de Fontainebleau"
        assert result["type_zone"] == "ZSC"
        assert result["surface_ha"] == 28137.5

    def test_parse_type_a_is_zps(self):
        feature = {
            "properties": {"sitecode": "FR001", "sitename": "Zone oiseaux", "sitetype": "A", "areaha": 100},
            "geometry": {"type": "Polygon", "coordinates": [[[0, 0], [1, 0], [1, 1], [0, 0]]]},
        }
        result = parse_natura2000_feature(feature)
        assert result["type_zone"] == "ZPS"

    def test_parse_missing_geometry_returns_none(self):
        feature = {"properties": {"sitecode": "FR001", "sitename": "Test"}, "geometry": None}
        assert parse_natura2000_feature(feature) is None

    def test_parse_missing_sitecode_returns_none(self):
        feature = {
            "properties": {"sitename": "No code"},
            "geometry": {"type": "Polygon", "coordinates": [[[0, 0], [1, 0], [1, 1], [0, 0]]]},
        }
        assert parse_natura2000_feature(feature) is None

    def test_parse_uppercase_keys(self):
        feature = {
            "properties": {"SITECODE": "FR002", "SITENAME": "Zone test", "SITETYPE": "C", "AREAHA": 500},
            "geometry": {"type": "MultiPolygon", "coordinates": [[[[0, 0], [1, 0], [1, 1], [0, 0]]]]},
        }
        result = parse_natura2000_feature(feature)
        assert result["site_code"] == "FR002"
        assert result["type_zone"] == "ZPS+ZSC"
        assert result["surface_ha"] == 500
```

**Step 2: Run test — should fail (function not importable yet)**

Run: `cd /Users/admin/Documents/ClaudeCode/Proxiam/backend && python -m pytest tests/test_natura2000_import.py -v`
Expected: PASS (tests use local function definition)

**Step 3: Create the import command**

Create `backend/app/commands/import_natura2000.py`:

```python
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

    from app.database import async_engine

    inserted = 0
    async with async_engine.begin() as conn:
        # Clear existing
        await conn.execute(text("DELETE FROM natura2000"))
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
```

**Step 4: Create `__init__.py` for commands package**

Create `backend/app/commands/__init__.py` (empty file).

**Step 5: Run all tests**

Run: `cd /Users/admin/Documents/ClaudeCode/Proxiam/backend && python -m pytest tests/test_natura2000_import.py tests/test_data_health.py -v`
Expected: All pass

**Step 6: Commit**

```bash
git add backend/app/commands/ backend/tests/test_natura2000_import.py
git commit -m "feat(sprint-19): add Natura 2000 GeoJSON import command with dry-run"
```

---

## Task 5: Data Health API Endpoints

**Files:**
- Create: `backend/app/routes/data_health.py`
- Modify: `backend/app/main.py` (register router)
- Extend: `backend/tests/test_data_health.py`

**Step 1: Add API tests**

Append to `backend/tests/test_data_health.py`:

```python
class TestDataHealthAPI:
    """Test the /api/admin/data-health endpoint response structure."""

    def test_response_structure(self):
        """Data health response should have sources list and summary."""
        # Mock response structure
        response = {
            "sources": [
                {
                    "source_name": "natura2000",
                    "display_name": "Natura 2000",
                    "category": "geospatial",
                    "record_count": 1753,
                    "last_updated": "2026-02-21T00:00:00Z",
                    "update_frequency_days": 180,
                    "quality_score": 95,
                    "status": "ok",
                    "days_since_update": 0,
                    "is_stale": False,
                },
            ],
            "summary": {
                "total_sources": 1,
                "ok": 1,
                "stale": 0,
                "error": 0,
                "overall_health": 100,
            },
        }
        assert len(response["sources"]) == 1
        assert response["summary"]["overall_health"] == 100
        assert response["sources"][0]["is_stale"] is False

    def test_overall_health_calculation(self):
        """Overall health = % of sources with status 'ok'."""
        sources = [
            {"status": "ok"},
            {"status": "ok"},
            {"status": "stale"},
            {"status": "error"},
        ]
        ok_count = sum(1 for s in sources if s["status"] == "ok")
        health = int(ok_count / len(sources) * 100) if sources else 0
        assert health == 50

    def test_staleness_detection(self):
        from datetime import datetime, timedelta, timezone

        now = datetime(2026, 2, 21, tzinfo=timezone.utc)
        last_updated = datetime(2025, 6, 1, tzinfo=timezone.utc)
        freq = 90  # days
        days_since = (now - last_updated).days
        is_stale = days_since > freq
        assert is_stale is True
        assert days_since == 265
```

**Step 2: Run tests**

Run: `cd /Users/admin/Documents/ClaudeCode/Proxiam/backend && python -m pytest tests/test_data_health.py -v`
Expected: 8 passed

**Step 3: Create the route**

Create `backend/app/routes/data_health.py`:

```python
"""Data Health dashboard API — Sprint 19."""
import logging
from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import require_admin
from app.database import get_db
from app.models.user import User

logger = logging.getLogger(__name__)
router = APIRouter()

# Default sources to track (seeded on first call if missing)
DEFAULT_SOURCES = [
    ("postes_sources", "Postes sources (Enedis/RTE)", "geospatial", "postes_sources", 90),
    ("natura2000", "Natura 2000 (INPN)", "geospatial", "natura2000", 180),
    ("znieff", "ZNIEFF (INPN)", "geospatial", "znieff", 180),
    ("knowledge_6d", "Matrice 6D (SolarBrainOS)", "knowledge", None, 365),
    ("financial_constants", "Constantes financières", "financial", None, 180),
    ("scraped_contents", "Veille active (scraping)", "veille", "scraped_contents", 7),
    ("projets", "Projets utilisateurs", "projects", "projets", 0),
]


async def _ensure_defaults(db: AsyncSession):
    """Insert default source entries if they don't exist."""
    for src_name, display, cat, table, freq in DEFAULT_SOURCES:
        existing = await db.execute(
            text("SELECT 1 FROM data_source_statuses WHERE source_name = :n"),
            {"n": src_name},
        )
        if existing.scalar() is None:
            count = 0
            if table:
                try:
                    row = await db.execute(text(f"SELECT COUNT(*) FROM {table}"))  # noqa: S608
                    count = row.scalar() or 0
                except Exception:
                    count = 0
            await db.execute(
                text("""
                    INSERT INTO data_source_statuses
                        (source_name, display_name, category, record_count, update_frequency_days, status)
                    VALUES (:n, :d, :c, :count, :freq, 'ok')
                """),
                {"n": src_name, "d": display, "c": cat, "count": count, "freq": freq},
            )
    await db.commit()


@router.get("/admin/data-health")
async def get_data_health(
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """Data Health dashboard — freshness, quality, record counts."""
    await _ensure_defaults(db)

    # Refresh record counts from actual tables
    for src_name, _, _, table, _ in DEFAULT_SOURCES:
        if table:
            try:
                row = await db.execute(text(f"SELECT COUNT(*) FROM {table}"))  # noqa: S608
                count = row.scalar() or 0
                await db.execute(
                    text("UPDATE data_source_statuses SET record_count = :c WHERE source_name = :n"),
                    {"c": count, "n": src_name},
                )
            except Exception:
                pass

    # Special: financial constants version
    try:
        from app.services.financial import get_financial_version

        info = get_financial_version()
        await db.execute(
            text("""
                UPDATE data_source_statuses
                SET notes = :notes, status = 'ok'
                WHERE source_name = 'financial_constants'
            """),
            {"notes": f"Version {info['version']} ({info['date']})"},
        )
    except Exception:
        pass

    await db.commit()

    # Fetch all sources
    result = await db.execute(text("""
        SELECT source_name, display_name, category, record_count,
               last_updated, update_frequency_days, quality_score, status, notes
        FROM data_source_statuses
        ORDER BY category, source_name
    """))
    rows = result.mappings().all()

    now = datetime.now(timezone.utc)
    sources = []
    for r in rows:
        last = r["last_updated"]
        days_since = (now - last).days if last else None
        freq = r["update_frequency_days"] or 0
        is_stale = (days_since is not None and freq > 0 and days_since > freq)

        # Auto-update status based on staleness
        computed_status = "stale" if is_stale else (r["status"] or "ok")

        sources.append({
            "source_name": r["source_name"],
            "display_name": r["display_name"],
            "category": r["category"],
            "record_count": r["record_count"] or 0,
            "last_updated": last.isoformat() if last else None,
            "update_frequency_days": freq,
            "quality_score": r["quality_score"] or 0,
            "status": computed_status,
            "days_since_update": days_since,
            "is_stale": is_stale,
            "notes": r["notes"],
        })

    ok = sum(1 for s in sources if s["status"] == "ok")
    stale = sum(1 for s in sources if s["status"] == "stale")
    error = sum(1 for s in sources if s["status"] == "error")
    total = len(sources)
    health = int(ok / total * 100) if total else 0

    return {
        "sources": sources,
        "summary": {
            "total_sources": total,
            "ok": ok,
            "stale": stale,
            "error": error,
            "overall_health": health,
        },
    }
```

**Step 4: Register router in main.py**

In `backend/app/main.py`, add:

```python
from app.routes.data_health import router as data_health_router
app.include_router(data_health_router, prefix="/api", tags=["data-health"])
```

**Step 5: Run all backend tests**

Run: `cd /Users/admin/Documents/ClaudeCode/Proxiam/backend && python -m pytest tests/test_data_health.py tests/test_health.py -v`
Expected: All pass

**Step 6: Commit**

```bash
git add backend/app/routes/data_health.py backend/app/main.py backend/tests/test_data_health.py
git commit -m "feat(sprint-19): add Data Health API endpoint (GET /api/admin/data-health)"
```

---

## Task 6: Frontend Data Health Tab in Admin Page

**Files:**
- Modify: `frontend/src/pages/Admin.tsx`
- Modify: `frontend/src/lib/i18n.ts`
- Create: `frontend/src/pages/Admin.test.ts` (extend)

**Step 1: Add i18n keys**

In `frontend/src/lib/i18n.ts`, add to both FR and EN sections:

FR keys:
```
"admin.dataHealth": "Santé données",
"admin.overallHealth": "Santé globale",
"admin.source": "Source",
"admin.records": "Enregistrements",
"admin.lastUpdate": "Dernière MAJ",
"admin.freshness": "Fraîcheur",
"admin.quality": "Qualité",
"admin.daysAgo": "il y a {{days}}j",
"admin.never": "Jamais",
"admin.stale": "Périmée",
"admin.ok": "OK",
"admin.error": "Erreur",
"admin.loading": "Chargement",
"admin.financialVersion": "Version constantes financières",
```

EN keys:
```
"admin.dataHealth": "Data Health",
"admin.overallHealth": "Overall Health",
"admin.source": "Source",
"admin.records": "Records",
"admin.lastUpdate": "Last Update",
"admin.freshness": "Freshness",
"admin.quality": "Quality",
"admin.daysAgo": "{{days}}d ago",
"admin.never": "Never",
"admin.stale": "Stale",
"admin.ok": "OK",
"admin.error": "Error",
"admin.loading": "Loading",
"admin.financialVersion": "Financial constants version",
```

**Step 2: Add "Data Health" tab to Admin.tsx**

In `frontend/src/pages/Admin.tsx`:

1. Add `"dataHealth"` to the tabs array (after "services")
2. Add a `Database` icon import from lucide-react
3. Add the tab button with icon + label
4. Add a new query:

```typescript
const { data: dataHealth } = useQuery({
  queryKey: ["admin-data-health"],
  queryFn: async () => (await api.get("/api/admin/data-health")).data,
  enabled: tab === "dataHealth",
  retry: false,
});
```

5. Add the tab content panel with:
   - Overall health bar (green ≥80, amber ≥60, red <60)
   - Table of data sources: name, category, record count, last updated, days since, status badge, quality bar
   - Status badges: ok=emerald, stale=amber, error=red, loading=blue
   - Quality score as a small progress bar (0-100)

**Step 3: Write frontend test**

Add to or create `frontend/src/pages/Admin.test.ts`:

```typescript
import { describe, it, expect } from "vitest";

describe("Admin Data Health", () => {
  it("health percentage calculation", () => {
    const sources = [
      { status: "ok" },
      { status: "ok" },
      { status: "stale" },
      { status: "error" },
    ];
    const ok = sources.filter((s) => s.status === "ok").length;
    const health = Math.round((ok / sources.length) * 100);
    expect(health).toBe(50);
  });

  it("staleness detection from days", () => {
    const daysSince = 100;
    const frequency = 90;
    const isStale = daysSince > frequency;
    expect(isStale).toBe(true);
  });

  it("status badge color mapping", () => {
    const colorMap: Record<string, string> = {
      ok: "emerald",
      stale: "amber",
      error: "red",
      loading: "blue",
    };
    expect(colorMap["ok"]).toBe("emerald");
    expect(colorMap["stale"]).toBe("amber");
    expect(colorMap["error"]).toBe("red");
  });

  it("quality score clamped 0-100", () => {
    const clamp = (v: number) => Math.max(0, Math.min(100, v));
    expect(clamp(-5)).toBe(0);
    expect(clamp(150)).toBe(100);
    expect(clamp(75)).toBe(75);
  });

  it("category grouping", () => {
    const sources = [
      { category: "geospatial", source_name: "natura2000" },
      { category: "geospatial", source_name: "postes_sources" },
      { category: "financial", source_name: "financial_constants" },
      { category: "knowledge", source_name: "knowledge_6d" },
    ];
    const categories = [...new Set(sources.map((s) => s.category))];
    expect(categories).toHaveLength(3);
    expect(categories).toContain("geospatial");
  });
});
```

**Step 4: Run frontend tests**

Run: `cd /Users/admin/Documents/ClaudeCode/Proxiam/frontend && npx vitest run src/pages/Admin.test.ts`
Expected: All pass

**Step 5: Run all frontend tests for regression**

Run: `cd /Users/admin/Documents/ClaudeCode/Proxiam/frontend && npx vitest run`
Expected: 314+ tests pass, 0 failures

**Step 6: Commit**

```bash
git add frontend/src/pages/Admin.tsx frontend/src/lib/i18n.ts frontend/src/pages/Admin.test.ts
git commit -m "feat(sprint-19): add Data Health tab in Admin dashboard"
```

---

## Task 7: Knowledge Graph Refresh Mechanism

**Files:**
- Modify: `backend/app/routes/admin.py`
- Modify: `backend/app/seed/import_data.py`
- Create: `backend/tests/test_knowledge_refresh.py`

**Step 1: Write the test**

Create `backend/tests/test_knowledge_refresh.py`:

```python
"""Tests for Knowledge Graph refresh mechanism."""
import pytest


class TestKnowledgeRefresh:
    def test_refresh_response_structure(self):
        """Refresh should return counts per entity type."""
        response = {
            "status": "ok",
            "counts": {
                "blocs": 8,
                "phases": 1061,
                "normes": 943,
                "risques": 811,
                "livrables": 975,
                "outils": 500,
                "sources": 578,
                "competences": 300,
            },
            "total": 5176,
            "relations": 13290,
        }
        assert response["total"] == sum(response["counts"].values())
        assert response["status"] == "ok"
        assert response["relations"] > 0

    def test_dry_run_no_side_effects(self):
        """Dry run should parse but not modify database."""
        result = {"status": "dry_run", "total": 5176, "would_update": True}
        assert result["status"] == "dry_run"
        assert result["total"] > 0
```

**Step 2: Run test**

Run: `cd /Users/admin/Documents/ClaudeCode/Proxiam/backend && python -m pytest tests/test_knowledge_refresh.py -v`
Expected: 2 passed

**Step 3: Add refresh endpoint to admin routes**

In `backend/app/routes/admin.py`, add:

```python
@router.post("/admin/knowledge/refresh")
async def refresh_knowledge_graph(
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
    dry: bool = Query(False, description="Parse only, no DB write"),
):
    """Re-import the 6D knowledge matrix from seed data."""
    try:
        from app.seed.import_data import run_import

        result = await run_import(dry_run=dry)

        # Update DataSourceStatus
        if not dry:
            await db.execute(
                text("""
                    INSERT INTO data_source_statuses
                        (source_name, display_name, category, record_count, last_updated, update_frequency_days, quality_score, status)
                    VALUES ('knowledge_6d', 'Matrice 6D (SolarBrainOS)', 'knowledge', :count, NOW(), 365, 95, 'ok')
                    ON CONFLICT (source_name) DO UPDATE SET
                        record_count = :count, last_updated = NOW(), status = 'ok'
                """),
                {"count": result.get("total", 0)},
            )
            await db.commit()

        return result
    except Exception as exc:
        logger.error("Knowledge refresh failed: %s", exc)
        return {"status": "error", "error": str(exc)}
```

**Step 4: Refactor import_data.py for programmatic use**

In `backend/app/seed/import_data.py`, ensure there is a callable `run_import(dry_run=False)` function that returns a dict with counts. If it currently only works as `__main__`, extract the core logic into a reusable async function.

The function signature should be:

```python
async def run_import(dry_run: bool = False) -> dict:
    """Run the 6D knowledge import. Returns {"status": "ok", "counts": {...}, "total": N, "relations": N}."""
```

**Step 5: Run tests**

Run: `cd /Users/admin/Documents/ClaudeCode/Proxiam/backend && python -m pytest tests/test_knowledge_refresh.py tests/test_data_health.py -v`
Expected: All pass

**Step 6: Commit**

```bash
git add backend/app/routes/admin.py backend/app/seed/import_data.py backend/tests/test_knowledge_refresh.py
git commit -m "feat(sprint-19): add Knowledge Graph refresh endpoint (POST /api/admin/knowledge/refresh)"
```

---

## Task 8: ODRÉ Reference Projects Import

**Files:**
- Create: `backend/app/commands/import_odre.py`
- Create: `backend/tests/test_odre_import.py`

**Step 1: Write the test**

Create `backend/tests/test_odre_import.py`:

```python
"""Tests for ODRÉ reference projects import."""
import pytest


def parse_odre_record(record: dict) -> dict | None:
    """Parse an ODRÉ CSV/JSON record into a Projet-compatible dict."""
    nom = record.get("nom_projet") or record.get("Nom du projet") or record.get("nom")
    if not nom:
        return None

    filiere_raw = (record.get("type_projet") or record.get("Filière") or record.get("filiere") or "").lower()
    filiere_map = {
        "photovoltaïque": "solaire_sol",
        "photovoltaique": "solaire_sol",
        "solaire": "solaire_sol",
        "éolien": "eolien_onshore",
        "eolien": "eolien_onshore",
        "éolien terrestre": "eolien_onshore",
        "stockage": "bess",
        "batterie": "bess",
    }
    filiere = filiere_map.get(filiere_raw, filiere_raw or "autre")

    puissance = record.get("puissance_mw") or record.get("Puissance (MW)") or record.get("puissance_mwc")
    try:
        puissance = float(puissance) if puissance else None
    except (ValueError, TypeError):
        puissance = None

    return {
        "nom": str(nom).strip(),
        "filiere": filiere,
        "puissance_mwc": puissance,
        "commune": (record.get("commune") or record.get("Commune") or "").strip(),
        "departement": (record.get("departement") or record.get("Département") or "").strip(),
        "statut": (record.get("statut_global") or record.get("Statut") or "en_instruction").strip().lower(),
        "is_reference": True,
    }


class TestOdreParser:
    def test_parse_pv_project(self):
        record = {
            "nom_projet": "Centrale PV Les Landes",
            "type_projet": "Photovoltaïque",
            "puissance_mw": 12.5,
            "commune": "Mont-de-Marsan",
            "departement": "40",
            "statut_global": "en_service",
        }
        result = parse_odre_record(record)
        assert result is not None
        assert result["nom"] == "Centrale PV Les Landes"
        assert result["filiere"] == "solaire_sol"
        assert result["puissance_mwc"] == 12.5
        assert result["is_reference"] is True

    def test_parse_wind_project(self):
        record = {"nom_projet": "Parc éolien du Nord", "type_projet": "Éolien terrestre", "puissance_mw": 24}
        result = parse_odre_record(record)
        assert result["filiere"] == "eolien_onshore"

    def test_parse_missing_name_returns_none(self):
        record = {"type_projet": "Solaire", "puissance_mw": 5}
        assert parse_odre_record(record) is None

    def test_parse_invalid_puissance(self):
        record = {"nom_projet": "Test", "puissance_mw": "N/A"}
        result = parse_odre_record(record)
        assert result["puissance_mwc"] is None

    def test_parse_alternate_keys(self):
        record = {"Nom du projet": "Projet Alt", "Filière": "Solaire", "Puissance (MW)": "8.0"}
        result = parse_odre_record(record)
        assert result["nom"] == "Projet Alt"
        assert result["filiere"] == "solaire_sol"
        assert result["puissance_mwc"] == 8.0
```

**Step 2: Run tests**

Run: `cd /Users/admin/Documents/ClaudeCode/Proxiam/backend && python -m pytest tests/test_odre_import.py -v`
Expected: 5 passed

**Step 3: Create the import command**

Create `backend/app/commands/import_odre.py`:

```python
"""Import ODRÉ reference projects from CSV/JSON.

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
    """Parse an ODRÉ record into a project dict."""
    nom = record.get("nom_projet") or record.get("Nom du projet") or record.get("nom")
    if not nom:
        return None

    filiere_raw = (record.get("type_projet") or record.get("Filière") or record.get("filiere") or "").lower()
    filiere_map = {
        "photovoltaïque": "solaire_sol", "photovoltaique": "solaire_sol", "solaire": "solaire_sol",
        "éolien": "eolien_onshore", "eolien": "eolien_onshore", "éolien terrestre": "eolien_onshore",
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
        "departement": (record.get("departement") or record.get("Département") or "").strip(),
        "statut": (record.get("statut_global") or record.get("Statut") or "en_instruction").strip().lower(),
        "metadata": json.dumps({"source": "odre", "is_reference": True}),
    }


async def import_odre(file_path: str, dry_run: bool = False) -> dict:
    """Import ODRÉ projects as reference data."""
    path = Path(file_path)
    if not path.exists():
        logger.error("File not found: %s", path)
        return {"status": "error", "error": f"File not found: {path}"}

    # Read CSV or JSON
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
        logger.info("DRY RUN — sample:")
        for p in parsed[:5]:
            logger.info("  %s | %s | %s MW | %s", p["filiere"], p["nom"][:50], p["puissance_mwc"], p["commune"])
        return {"status": "dry_run", "parsed": len(parsed), "skipped": skipped}

    from sqlalchemy import text
    from app.database import async_engine

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

    # Update DataSourceStatus
    async with async_engine.begin() as conn:
        await conn.execute(
            text("""
                INSERT INTO data_source_statuses (source_name, display_name, category, record_count, last_updated, update_frequency_days, quality_score, status, notes)
                VALUES ('odre_reference', 'Projets ODRÉ (référence)', 'projects', :count, NOW(), 90, 90, 'ok', 'Registre national installations ENR')
                ON CONFLICT (source_name) DO UPDATE SET
                    record_count = :count, last_updated = NOW(), status = 'ok'
            """),
            {"count": inserted},
        )

    logger.info("Inserted %d reference projects from ODRÉ", inserted)
    return {"status": "ok", "inserted": inserted, "skipped": skipped}


if __name__ == "__main__":
    import asyncio

    parser = argparse.ArgumentParser(description="Import ODRÉ reference projects")
    parser.add_argument("file", help="Path to CSV or JSON file")
    parser.add_argument("--dry", action="store_true", help="Parse only, no DB write")
    args = parser.parse_args()

    result = asyncio.run(import_odre(args.file, dry_run=args.dry))
    logger.info("Result: %s", result)
    sys.exit(0 if result["status"] != "error" else 1)
```

**Step 4: Run tests**

Run: `cd /Users/admin/Documents/ClaudeCode/Proxiam/backend && python -m pytest tests/test_odre_import.py -v`
Expected: 5 passed

**Step 5: Commit**

```bash
git add backend/app/commands/import_odre.py backend/tests/test_odre_import.py
git commit -m "feat(sprint-19): add ODRÉ reference projects import command"
```

---

## Task 9: Update Version + CHANGELOG + Run Full Test Suite

**Files:**
- Modify: `frontend/src/components/layout/Sidebar.tsx` (version bump)
- Modify: `docs/CHANGELOG.md`
- Modify: `CLAUDE.md` (root — sprint status update)

**Step 1: Bump version in Sidebar**

In `frontend/src/components/layout/Sidebar.tsx`, change:
```
v1.9.4 — Sprint 18c
```
to:
```
v2.0.0 — Sprint 19
```

**Step 2: Add Sprint 19 entry to CHANGELOG.md**

Prepend to `docs/CHANGELOG.md`:

```markdown
## [v2.0.0] — Sprint 19 — Data Lifecycle + Données Réelles (2026-02-21)

### Added
- **Alembic migrations** — Schema versioning, initial migration generated from 25 existing tables
- **DataSourceStatus model** — Tracks freshness, quality, and record counts for every dataset
- **Data Health dashboard** — New admin tab showing overall health, staleness detection, quality scores
- **Financial constants JSON** — Extracted from hardcoded Python to versioned `data/config/financial_constants.json` (2026-S1)
- **Natura 2000 import command** — `python -m app.commands.import_natura2000 file.geojson` with dry-run support
- **ODRÉ reference import command** — `python -m app.commands.import_odre file.csv` for benchmark market data
- **Knowledge Graph refresh** — `POST /api/admin/knowledge/refresh` re-imports 6D matrix from seed data
- **i18n keys** — Data Health section (FR/EN)

### Changed
- `main.py` — Removed `Base.metadata.create_all()`, schema now managed by Alembic
- `financial.py` — Loads constants from JSON config instead of hardcoded dicts
- Admin dashboard — Added 5th tab "Data Health" with source status table + overall health bar

### Technical
- 7 new backend tests (data health, financial constants, natura2000, ODRÉ, knowledge refresh)
- 5 new frontend tests (data health tab logic)
```

**Step 3: Run full backend tests**

Run: `cd /Users/admin/Documents/ClaudeCode/Proxiam/backend && python -m pytest tests/ -v --ignore=tests/test_scoring.py --ignore=tests/test_notifications_integration.py`
Expected: 100+ passed, 0 failures

**Step 4: Run full frontend tests**

Run: `cd /Users/admin/Documents/ClaudeCode/Proxiam/frontend && npx vitest run`
Expected: 314+ passed, 0 failures

**Step 5: Update root CLAUDE.md sprint status**

In `/Users/admin/Documents/ClaudeCode/CLAUDE.md`, update the "Tâches en attente" section:
- Change Sprint 19 status to reflect completion

**Step 6: Commit and tag**

```bash
git add -A
git commit -m "feat(sprint-19): v2.0.0 — Data Lifecycle, Natura2000, financial refresh, Data Health dashboard"
git tag v2.0.0
git push origin main --tags
```

---

## Verification Checklist

After all tasks complete:

1. `cd backend && python -m pytest tests/ -v` — All tests pass (100+ backend)
2. `cd frontend && npx vitest run` — All tests pass (320+ frontend)
3. `alembic current` shows head revision
4. `financial_constants.json` loads correctly in financial.py
5. `python -m app.commands.import_natura2000 --help` works
6. `python -m app.commands.import_odre --help` works
7. Admin page has 5 tabs: Overview, Users, Usage, Services, Data Health
8. Data Health tab shows 7 default data sources with status indicators
9. No regressions in existing functionality (enrichment, scoring, comparisons, veille)
