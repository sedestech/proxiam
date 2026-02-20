"""Projects API routes — Sprint 4+6+7.

Returns project data with proper serialization (UUID, Geometry, Decimal).
Includes phase progression, stats, filters, CSV export, and CRUD operations.
"""
import csv
import io
import uuid
from typing import Optional

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import Projet
from app.routes.notifications import create_notification

router = APIRouter()


class ProjetCreate(BaseModel):
    nom: str = Field(..., min_length=1, max_length=200)
    filiere: Optional[str] = None
    puissance_mwc: Optional[float] = None
    surface_ha: Optional[float] = None
    commune: Optional[str] = None
    departement: Optional[str] = None
    region: Optional[str] = None
    statut: str = "prospection"
    lon: Optional[float] = None
    lat: Optional[float] = None


class ProjetUpdate(BaseModel):
    nom: Optional[str] = Field(None, min_length=1, max_length=200)
    filiere: Optional[str] = None
    puissance_mwc: Optional[float] = None
    surface_ha: Optional[float] = None
    commune: Optional[str] = None
    departement: Optional[str] = None
    region: Optional[str] = None
    statut: Optional[str] = None
    lon: Optional[float] = None
    lat: Optional[float] = None


def _serialize_projet(row: dict) -> dict:
    """Convert a raw projet row to a JSON-serializable dict."""
    return {
        "id": str(row["id"]),
        "nom": row["nom"],
        "filiere": row["filiere"],
        "puissance_mwc": float(row["puissance_mwc"]) if row["puissance_mwc"] else None,
        "surface_ha": float(row["surface_ha"]) if row["surface_ha"] else None,
        "commune": row["commune"],
        "departement": row["departement"],
        "region": row["region"],
        "statut": row["statut"],
        "score_global": row["score_global"],
        "lon": float(row["lon"]) if row.get("lon") else None,
        "lat": float(row["lat"]) if row.get("lat") else None,
        "date_creation": str(row["date_creation"]) if row.get("date_creation") else None,
    }


@router.get("/projets")
async def list_projets(
    filiere: Optional[str] = None,
    statut: Optional[str] = None,
    region: Optional[str] = None,
    limit: int = Query(50, le=200),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
):
    conditions = ["1=1"]
    params: dict = {"limit": limit, "offset": offset}

    if filiere:
        conditions.append("filiere = :filiere")
        params["filiere"] = filiere
    if statut:
        conditions.append("statut = :statut")
        params["statut"] = statut
    if region:
        conditions.append("region = :region")
        params["region"] = region

    where = " AND ".join(conditions)
    query = text(f"""
        SELECT id, nom, filiere, puissance_mwc, surface_ha,
               commune, departement, region, statut, score_global,
               ST_X(geom) as lon, ST_Y(geom) as lat,
               date_creation
        FROM projets
        WHERE {where}
        ORDER BY date_creation DESC
        LIMIT :limit OFFSET :offset
    """)
    result = await db.execute(query, params)
    rows = result.mappings().all()
    return [_serialize_projet(dict(r)) for r in rows]


@router.get("/projets/{projet_id}")
async def get_projet(projet_id: str, db: AsyncSession = Depends(get_db)):
    query = text("""
        SELECT id, nom, filiere, puissance_mwc, surface_ha,
               commune, departement, region, statut, score_global,
               ST_X(geom) as lon, ST_Y(geom) as lat,
               date_creation
        FROM projets
        WHERE id = :id
    """)
    result = await db.execute(query, {"id": projet_id})
    row = result.mappings().first()
    if not row:
        raise HTTPException(status_code=404, detail="Projet non trouve")
    return _serialize_projet(dict(row))


@router.get("/projets/{projet_id}/phases")
async def get_projet_phases(projet_id: str, db: AsyncSession = Depends(get_db)):
    """Return the bloc-level phase progression for a project.

    Returns 8 blocs (B1-B8) with aggregated completion from projet_phases.
    Each bloc: code, titre, statut (termine/en_cours/a_faire), completion_pct.
    """
    # Verify project exists
    check = await db.execute(
        text("SELECT id FROM projets WHERE id = :id"), {"id": projet_id}
    )
    if not check.first():
        raise HTTPException(status_code=404, detail="Projet non trouve")

    # Get bloc-level progression by joining blocs → phases → projet_phases
    query = text("""
        SELECT b.code, b.titre,
               COALESCE(MAX(pp.completion_pct), 0) as completion_pct,
               CASE
                   WHEN MAX(pp.completion_pct) >= 100 THEN 'termine'
                   WHEN MAX(pp.completion_pct) > 0 THEN 'en_cours'
                   ELSE 'a_faire'
               END as statut
        FROM blocs b
        LEFT JOIN phases p ON p.bloc_id = b.id
        LEFT JOIN projet_phases pp ON pp.phase_id = p.id AND pp.projet_id = :projet_id
        GROUP BY b.id, b.code, b.titre
        ORDER BY b.code
    """)
    result = await db.execute(query, {"projet_id": projet_id})
    rows = result.mappings().all()

    return [
        {
            "code": row["code"],
            "titre": row["titre"],
            "statut": row["statut"],
            "completion_pct": row["completion_pct"],
        }
        for row in rows
    ]


@router.get("/projets/stats/summary")
async def projets_stats(db: AsyncSession = Depends(get_db)):
    """Return portfolio summary statistics."""
    query = text("""
        SELECT
            COUNT(*) as total,
            COUNT(*) FILTER (WHERE statut = 'prospection') as prospection,
            COUNT(*) FILTER (WHERE statut = 'autorisation') as autorisation,
            COUNT(*) FILTER (WHERE statut = 'construction') as construction,
            COUNT(*) FILTER (WHERE statut = 'exploitation') as exploitation,
            COUNT(*) FILTER (WHERE statut = 'ingenierie') as ingenierie,
            COALESCE(AVG(score_global), 0) as avg_score,
            COALESCE(SUM(puissance_mwc), 0) as total_mwc,
            COUNT(DISTINCT filiere) as nb_filieres
        FROM projets
    """)
    result = await db.execute(query)
    row = result.mappings().first()
    return {
        "total": row["total"],
        "by_statut": {
            "prospection": row["prospection"],
            "ingenierie": row["ingenierie"],
            "autorisation": row["autorisation"],
            "construction": row["construction"],
            "exploitation": row["exploitation"],
        },
        "avg_score": round(float(row["avg_score"])),
        "total_mwc": float(row["total_mwc"]),
        "nb_filieres": row["nb_filieres"],
    }


@router.get("/projets/stats/analytics")
async def projets_analytics(db: AsyncSession = Depends(get_db)):
    """Return analytics data: score distribution, filiere performance, phase stats."""
    # Score distribution (10-point buckets: 0-9, 10-19, ..., 90-100)
    score_query = text("""
        SELECT
            CASE
                WHEN score_global IS NULL THEN 'unscored'
                WHEN score_global < 20 THEN '0-19'
                WHEN score_global < 40 THEN '20-39'
                WHEN score_global < 60 THEN '40-59'
                WHEN score_global < 80 THEN '60-79'
                ELSE '80-100'
            END as bucket,
            COUNT(*) as count
        FROM projets
        GROUP BY bucket
        ORDER BY bucket
    """)
    score_result = await db.execute(score_query)
    score_dist = [dict(r) for r in score_result.mappings().all()]

    # Filiere performance (avg score + count + avg power)
    filiere_query = text("""
        SELECT
            COALESCE(filiere, 'autre') as filiere,
            COUNT(*) as count,
            COALESCE(AVG(score_global), 0) as avg_score,
            COALESCE(AVG(puissance_mwc), 0) as avg_mwc
        FROM projets
        GROUP BY filiere
        ORDER BY count DESC
    """)
    filiere_result = await db.execute(filiere_query)
    filiere_perf = [
        {**dict(r), "avg_score": round(float(r["avg_score"])), "avg_mwc": round(float(r["avg_mwc"]), 1)}
        for r in filiere_result.mappings().all()
    ]

    # Recent activity (last 10 notifications)
    activity_query = text("""
        SELECT type, title, created_at
        FROM notifications
        ORDER BY created_at DESC
        LIMIT 10
    """)
    activity_result = await db.execute(activity_query)
    activity = [
        {"type": r["type"], "title": r["title"],
         "timestamp": r["created_at"].isoformat() if r["created_at"] else None}
        for r in activity_result.mappings().all()
    ]

    return {
        "score_distribution": score_dist,
        "filiere_performance": filiere_perf,
        "recent_activity": activity,
    }


@router.get("/projets/export/csv")
async def export_projets_csv(db: AsyncSession = Depends(get_db)):
    """Export all projects as CSV file."""
    query = text("""
        SELECT id, nom, filiere, puissance_mwc, surface_ha,
               commune, departement, region, statut, score_global,
               ST_X(geom) as lon, ST_Y(geom) as lat,
               date_creation
        FROM projets
        ORDER BY nom
    """)
    result = await db.execute(query)
    rows = result.mappings().all()

    output = io.StringIO()
    writer = csv.writer(output, delimiter=";")
    writer.writerow([
        "id", "nom", "filiere", "puissance_mwc", "surface_ha",
        "commune", "departement", "region", "statut", "score_global",
        "longitude", "latitude", "date_creation",
    ])
    for row in rows:
        writer.writerow([
            str(row["id"]),
            row["nom"],
            row["filiere"] or "",
            float(row["puissance_mwc"]) if row["puissance_mwc"] else "",
            float(row["surface_ha"]) if row["surface_ha"] else "",
            row["commune"] or "",
            row["departement"] or "",
            row["region"] or "",
            row["statut"] or "",
            row["score_global"] if row["score_global"] is not None else "",
            float(row["lon"]) if row["lon"] else "",
            float(row["lat"]) if row["lat"] else "",
            str(row["date_creation"]) if row["date_creation"] else "",
        ])

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=proxiam-projets.csv"},
    )


# ─── CRUD ───


@router.post("/projets", status_code=201)
async def create_projet(body: ProjetCreate, db: AsyncSession = Depends(get_db)):
    """Create a new project."""
    projet_id = str(uuid.uuid4())
    geom_sql = "ST_SetSRID(ST_MakePoint(:lon, :lat), 4326)" if body.lon and body.lat else "NULL"

    query = text(f"""
        INSERT INTO projets (id, nom, filiere, puissance_mwc, surface_ha,
                            commune, departement, region, statut, geom)
        VALUES (:id, :nom, :filiere, :puissance_mwc, :surface_ha,
                :commune, :departement, :region, :statut, {geom_sql})
        RETURNING id
    """)
    params = {
        "id": projet_id,
        "nom": body.nom,
        "filiere": body.filiere,
        "puissance_mwc": body.puissance_mwc,
        "surface_ha": body.surface_ha,
        "commune": body.commune,
        "departement": body.departement,
        "region": body.region,
        "statut": body.statut,
    }
    if body.lon and body.lat:
        params["lon"] = body.lon
        params["lat"] = body.lat

    await db.execute(query, params)
    await db.commit()

    await create_notification(
        db, type="project_created", title=f"Projet cree : {body.nom}",
        message=f"Filiere {body.filiere or 'inconnue'}, statut {body.statut}",
        entity_type="projet", entity_id=projet_id,
    )

    # Return the created project
    return await get_projet(projet_id, db)


@router.put("/projets/{projet_id}")
async def update_projet(
    projet_id: str, body: ProjetUpdate, db: AsyncSession = Depends(get_db)
):
    """Update an existing project."""
    # Verify exists
    check = await db.execute(
        text("SELECT id FROM projets WHERE id = :id"), {"id": projet_id}
    )
    if not check.first():
        raise HTTPException(status_code=404, detail="Projet non trouve")

    # Build dynamic SET clause
    updates = []
    params: dict = {"id": projet_id}
    update_data = body.dict(exclude_unset=True)

    # Handle lon/lat → geom separately
    if "lon" in update_data and "lat" in update_data:
        lon = update_data.pop("lon")
        lat = update_data.pop("lat")
        if lon is not None and lat is not None:
            updates.append("geom = ST_SetSRID(ST_MakePoint(:lon, :lat), 4326)")
            params["lon"] = lon
            params["lat"] = lat
    elif "lon" in update_data:
        update_data.pop("lon")
    elif "lat" in update_data:
        update_data.pop("lat")

    for field, value in update_data.items():
        updates.append(f"{field} = :{field}")
        params[field] = value

    if not updates:
        return await get_projet(projet_id, db)

    set_clause = ", ".join(updates)
    query = text(f"UPDATE projets SET {set_clause} WHERE id = :id")
    await db.execute(query, params)
    await db.commit()

    await create_notification(
        db, type="project_updated", title=f"Projet modifie",
        message=f"Champs mis a jour : {', '.join(update_data.keys())}",
        entity_type="projet", entity_id=projet_id,
    )

    return await get_projet(projet_id, db)


@router.put("/projets/{projet_id}/phases/{bloc_code}")
async def update_phase_completion(
    projet_id: str,
    bloc_code: str,
    completion_pct: int = Query(..., ge=0, le=100),
    db: AsyncSession = Depends(get_db),
):
    """Update the completion percentage for a bloc (B1-B8) on a project.

    Updates all phases in the given bloc for this project.
    Creates projet_phases entries if they don't exist (upsert).
    """
    # Verify project exists
    check = await db.execute(
        text("SELECT id FROM projets WHERE id = :id"), {"id": projet_id}
    )
    if not check.first():
        raise HTTPException(status_code=404, detail="Projet non trouve")

    # Get phases for this bloc
    phases_q = await db.execute(
        text("""
            SELECT p.id FROM phases p
            JOIN blocs b ON p.bloc_id = b.id
            WHERE b.code = :bloc_code
        """),
        {"bloc_code": bloc_code},
    )
    phase_ids = [r[0] for r in phases_q.fetchall()]
    if not phase_ids:
        raise HTTPException(status_code=404, detail=f"Bloc {bloc_code} not found")

    # Pick the first phase as representative (same pattern as seed)
    phase_id = phase_ids[0]
    statut = "termine" if completion_pct >= 100 else "en_cours" if completion_pct > 0 else "a_faire"

    # Upsert
    await db.execute(
        text("""
            INSERT INTO projet_phases (projet_id, phase_id, completion_pct, statut)
            VALUES (:projet_id, :phase_id, :pct, :statut)
            ON CONFLICT (projet_id, phase_id) DO UPDATE
            SET completion_pct = :pct, statut = :statut
        """),
        {"projet_id": projet_id, "phase_id": phase_id, "pct": completion_pct, "statut": statut},
    )
    await db.commit()

    return {"bloc_code": bloc_code, "completion_pct": completion_pct, "statut": statut}


@router.delete("/projets/{projet_id}")
async def delete_projet(projet_id: str, db: AsyncSession = Depends(get_db)):
    """Delete a project and its associated data."""
    # Verify exists
    check = await db.execute(
        text("SELECT id FROM projets WHERE id = :id"), {"id": projet_id}
    )
    if not check.first():
        raise HTTPException(status_code=404, detail="Projet non trouve")

    # Delete related data first
    await db.execute(
        text("DELETE FROM projet_phases WHERE projet_id = :id"), {"id": projet_id}
    )
    await db.execute(
        text("DELETE FROM projet_risques WHERE projet_id = :id"), {"id": projet_id}
    )
    await db.execute(
        text("DELETE FROM projet_documents WHERE projet_id = :id"), {"id": projet_id}
    )
    # Get name before deleting
    name_result = await db.execute(
        text("SELECT nom FROM projets WHERE id = :id"), {"id": projet_id}
    )
    name_row = name_result.first()

    await db.execute(
        text("DELETE FROM projets WHERE id = :id"), {"id": projet_id}
    )
    await db.commit()

    await create_notification(
        db, type="project_deleted",
        title=f"Projet supprime : {name_row[0] if name_row else projet_id}",
        entity_type="projet", entity_id=projet_id,
    )

    return {"status": "deleted", "id": projet_id}


@router.post("/projets/import")
async def import_projets(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
):
    """Import projects from CSV (semicolon-separated) or JSON file.

    CSV columns: nom, filiere, puissance_mwc, surface_ha, commune, departement, region, statut, lon, lat
    JSON: array of objects with the same fields.
    """
    data = await file.read()
    content = data.decode("utf-8-sig")  # Handle BOM from Excel

    filename = file.filename or ""
    records = []

    if filename.endswith(".json"):
        import json
        try:
            parsed = json.loads(content)
            if not isinstance(parsed, list):
                raise HTTPException(status_code=400, detail="JSON must be an array")
            records = parsed
        except json.JSONDecodeError as e:
            raise HTTPException(status_code=400, detail=f"Invalid JSON: {str(e)}")
    else:
        # CSV with semicolon delimiter (French Excel)
        reader = csv.DictReader(io.StringIO(content), delimiter=";")
        for row in reader:
            records.append({k.strip(): v.strip() for k, v in row.items() if k})

    if not records:
        raise HTTPException(status_code=400, detail="No records found in file")

    if len(records) > 500:
        raise HTTPException(status_code=400, detail="Too many records (max 500)")

    created = []
    errors = []

    for i, rec in enumerate(records):
        nom = rec.get("nom", "").strip()
        if not nom:
            errors.append({"row": i + 1, "error": "nom is required"})
            continue

        filiere = rec.get("filiere") or None
        statut = rec.get("statut", "prospection") or "prospection"
        commune = rec.get("commune") or None
        departement = rec.get("departement") or None
        region = rec.get("region") or None

        try:
            puissance = float(rec["puissance_mwc"]) if rec.get("puissance_mwc") else None
        except (ValueError, TypeError):
            puissance = None

        try:
            surface = float(rec["surface_ha"]) if rec.get("surface_ha") else None
        except (ValueError, TypeError):
            surface = None

        try:
            lon = float(rec["lon"]) if rec.get("lon") else None
            lat = float(rec["lat"]) if rec.get("lat") else None
        except (ValueError, TypeError):
            lon, lat = None, None

        geom_sql = "ST_SetSRID(ST_MakePoint(:lon, :lat), 4326)" if lon and lat else "NULL"
        new_id = str(uuid.uuid4())

        await db.execute(
            text(f"""
                INSERT INTO projets (id, nom, filiere, puissance_mwc, surface_ha, commune, departement, region, statut, geom)
                VALUES (:id, :nom, :filiere, :puissance, :surface, :commune, :departement, :region, :statut, {geom_sql})
            """),
            {
                "id": new_id, "nom": nom, "filiere": filiere,
                "puissance": puissance, "surface": surface,
                "commune": commune, "departement": departement,
                "region": region, "statut": statut,
                "lon": lon, "lat": lat,
            },
        )
        created.append({"id": new_id, "nom": nom})

    await db.commit()

    if created:
        await create_notification(
            db, type="import_completed",
            title=f"Import : {len(created)} projet(s)",
            message=f"Fichier {filename}, {len(errors)} erreur(s)",
            entity_type="import",
        )

    return {
        "imported": len(created),
        "errors": errors,
        "projects": created,
    }
