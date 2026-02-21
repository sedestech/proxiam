"""Documents API — Sprint 9.

Upload, list, download, and delete documents linked to projects.
Files stored in MinIO S3, metadata in PostgreSQL.
"""
from typing import Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile
from fastapi.responses import Response
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import require_user
from app.database import get_db
from app.models.user import User
from app.services.storage import delete_file, download_file, upload_file

router = APIRouter()

MAX_FILE_SIZE = 50 * 1024 * 1024  # 50 MB


@router.post("/documents/upload")
async def upload_document(
    file: UploadFile = File(...),
    projet_id: Optional[str] = Form(None),
    category: str = Form("general"),
    description: Optional[str] = Form(None),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_user),
):
    """Upload a document to MinIO and store metadata in PostgreSQL."""
    data = await file.read()

    if len(data) > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="File too large (max 50 MB)")

    if len(data) == 0:
        raise HTTPException(status_code=400, detail="Empty file")

    # Validate projet_id exists if provided
    if projet_id:
        check = await db.execute(
            text("SELECT id FROM projets WHERE id = :id"),
            {"id": projet_id},
        )
        if not check.scalar():
            raise HTTPException(status_code=404, detail="Project not found")

    # Upload to MinIO
    storage_key = upload_file(
        data=data,
        filename=file.filename or "unnamed",
        content_type=file.content_type or "application/octet-stream",
        projet_id=projet_id,
    )

    # Store metadata in PostgreSQL
    result = await db.execute(
        text("""
            INSERT INTO documents (projet_id, filename, original_name, mimetype, size_bytes, storage_key, category, description)
            VALUES (:projet_id, :filename, :original_name, :mimetype, :size_bytes, :storage_key, :category, :description)
            RETURNING id, uploaded_at
        """),
        {
            "projet_id": projet_id,
            "filename": file.filename or "unnamed",
            "original_name": file.filename or "unnamed",
            "mimetype": file.content_type or "application/octet-stream",
            "size_bytes": len(data),
            "storage_key": storage_key,
            "category": category,
            "description": description,
        },
    )
    row = result.mappings().first()
    await db.commit()

    return {
        "id": str(row["id"]),
        "filename": file.filename,
        "size_bytes": len(data),
        "mimetype": file.content_type,
        "category": category,
        "uploaded_at": str(row["uploaded_at"]),
        "storage_key": storage_key,
    }


@router.get("/documents")
async def list_documents(
    projet_id: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    limit: int = Query(50, le=200),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_user),
):
    """List documents, optionally filtered by project or category."""
    conditions = []
    params = {"limit": limit}

    if projet_id:
        conditions.append("d.projet_id = :projet_id")
        params["projet_id"] = projet_id
    if category:
        conditions.append("d.category = :category")
        params["category"] = category

    where = f"WHERE {' AND '.join(conditions)}" if conditions else ""

    query = text(f"""
        SELECT d.id, d.filename, d.original_name, d.mimetype, d.size_bytes,
               d.storage_key, d.category, d.description, d.uploaded_at,
               d.projet_id, p.nom as projet_nom
        FROM documents d
        LEFT JOIN projets p ON d.projet_id = p.id
        {where}
        ORDER BY d.uploaded_at DESC
        LIMIT :limit
    """)
    result = await db.execute(query, params)
    rows = result.mappings().all()

    return {
        "documents": [
            {
                "id": str(r["id"]),
                "filename": r["filename"],
                "original_name": r["original_name"],
                "mimetype": r["mimetype"],
                "size_bytes": r["size_bytes"],
                "category": r["category"],
                "description": r["description"],
                "uploaded_at": str(r["uploaded_at"]) if r["uploaded_at"] else None,
                "projet_id": str(r["projet_id"]) if r["projet_id"] else None,
                "projet_nom": r["projet_nom"],
            }
            for r in rows
        ],
        "total": len(rows),
    }


@router.get("/documents/{doc_id}/download")
async def download_document(
    doc_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_user),
):
    """Download a document by ID."""
    result = await db.execute(
        text("SELECT storage_key, original_name, mimetype FROM documents WHERE id = :id"),
        {"id": doc_id},
    )
    row = result.mappings().first()
    if not row:
        raise HTTPException(status_code=404, detail="Document not found")

    data = download_file(row["storage_key"])

    return Response(
        content=data,
        media_type=row["mimetype"],
        headers={"Content-Disposition": f'attachment; filename="{row["original_name"]}"'},
    )


@router.delete("/documents/{doc_id}")
async def delete_document(
    doc_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_user),
):
    """Delete a document (MinIO + PostgreSQL)."""
    result = await db.execute(
        text("SELECT storage_key FROM documents WHERE id = :id"),
        {"id": doc_id},
    )
    row = result.mappings().first()
    if not row:
        raise HTTPException(status_code=404, detail="Document not found")

    # Delete from MinIO
    delete_file(row["storage_key"])

    # Delete from PostgreSQL
    await db.execute(text("DELETE FROM documents WHERE id = :id"), {"id": doc_id})
    await db.commit()

    return {"deleted": True}
