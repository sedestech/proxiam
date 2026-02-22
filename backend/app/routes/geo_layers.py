"""GeoJSON upload + WMS/WFS layer catalog — Sprint 21."""

import json

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_user, require_user
from app.database import get_db
from app.models.geo_layer import GeoLayer
from app.models.user import User

router = APIRouter()

# ── Predefined WMS/WFS catalog ──

LAYER_CATALOG = [
    {"name": "Natura 2000 (INPN)", "url": "https://ws.carmencarto.fr/WMS/119/natura2000", "type": "wms", "category": "environnement"},
    {"name": "ZNIEFF Type I", "url": "https://ws.carmencarto.fr/WMS/119/znieff1", "type": "wms", "category": "environnement"},
    {"name": "ZNIEFF Type II", "url": "https://ws.carmencarto.fr/WMS/119/znieff2", "type": "wms", "category": "environnement"},
    {"name": "Cadastre (IGN)", "url": "https://data.geopf.fr/wms/ows?service=WMS&layers=CADASTRALPARCELS.PARCELLAIRE_EXPRESS", "type": "wms", "category": "foncier"},
    {"name": "PLU (GPU)", "url": "https://data.geopf.fr/wms/ows?service=WMS&layers=URBANISME:plu", "type": "wms", "category": "urbanisme"},
    {"name": "Réseau RTE", "url": "https://opendata.reseaux-energies.fr/api/v2/catalog/datasets/postes-electriques-rte/exports/geojson", "type": "wfs", "category": "reseau"},
]


@router.get("/layers/catalog")
async def get_layer_catalog():
    """Return predefined WMS/WFS layers that users can add."""
    return LAYER_CATALOG


@router.get("/layers")
async def list_layers(
    db: AsyncSession = Depends(get_db),
    user: User | None = Depends(get_current_user),
):
    """List all visible layers (system + user's own)."""
    uid = user.id if user else None
    q = select(GeoLayer).where(
        (GeoLayer.user_id.is_(None)) | (GeoLayer.user_id == uid)
    ).order_by(GeoLayer.created_at.desc())
    result = await db.execute(q)
    layers = result.scalars().all()
    return [
        {
            "id": str(l.id),
            "name": l.name,
            "description": l.description,
            "layer_type": l.layer_type,
            "source_url": l.source_url,
            "feature_count": l.feature_count,
            "style": l.style,
            "visible": l.visible,
            "created_at": l.created_at.isoformat() if l.created_at else None,
            "is_mine": l.user_id == uid,
        }
        for l in layers
    ]


@router.post("/layers/upload")
async def upload_geojson(
    file: UploadFile = File(...),
    name: str = Query(..., min_length=1, max_length=200),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_user),
):
    """Upload a GeoJSON file as a new layer."""
    if not file.filename or not file.filename.endswith((".geojson", ".json")):
        raise HTTPException(400, "File must be .geojson or .json")

    content = await file.read()
    if len(content) > 10_000_000:
        raise HTTPException(400, "File too large (max 10 MB)")

    try:
        data = json.loads(content)
    except json.JSONDecodeError:
        raise HTTPException(400, "Invalid JSON")

    if data.get("type") != "FeatureCollection" or "features" not in data:
        raise HTTPException(400, "Must be a GeoJSON FeatureCollection")

    feature_count = len(data.get("features", []))
    if feature_count > 50_000:
        raise HTTPException(400, "Too many features (max 50 000)")

    layer = GeoLayer(
        user_id=user.id,
        name=name,
        layer_type="geojson",
        geojson_data=data,
        feature_count=feature_count,
        style={"fillColor": "#6366f1", "fillOpacity": 0.3, "strokeColor": "#4f46e5", "strokeWidth": 2},
    )
    db.add(layer)
    await db.commit()
    await db.refresh(layer)

    return {"id": str(layer.id), "name": layer.name, "feature_count": feature_count}


@router.post("/layers/wms")
async def add_wms_layer(
    name: str = Query(..., min_length=1),
    url: str = Query(..., min_length=10),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_user),
):
    """Register a WMS/WFS external layer."""
    layer = GeoLayer(
        user_id=user.id,
        name=name,
        layer_type="wms",
        source_url=url,
        style={"opacity": 0.7},
    )
    db.add(layer)
    await db.commit()
    await db.refresh(layer)
    return {"id": str(layer.id), "name": layer.name}


@router.delete("/layers/{layer_id}")
async def delete_layer(
    layer_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_user),
):
    """Delete a user's layer."""
    result = await db.execute(
        select(GeoLayer).where(GeoLayer.id == layer_id, GeoLayer.user_id == user.id)
    )
    layer = result.scalar_one_or_none()
    if not layer:
        raise HTTPException(404, "Layer not found")
    await db.delete(layer)
    await db.commit()
    return {"deleted": True}
