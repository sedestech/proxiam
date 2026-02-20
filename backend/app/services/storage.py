"""MinIO S3 storage service for document management."""
import io
import uuid
from typing import Optional

from minio import Minio
from minio.error import S3Error

from app.config import settings


def get_minio_client() -> Minio:
    """Create MinIO client from settings."""
    return Minio(
        settings.minio_endpoint,
        access_key=settings.minio_access_key,
        secret_key=settings.minio_secret_key,
        secure=False,
    )


def ensure_bucket(client: Minio, bucket: str = None) -> None:
    """Create bucket if it doesn't exist."""
    bucket = bucket or settings.minio_bucket
    if not client.bucket_exists(bucket):
        client.make_bucket(bucket)


def upload_file(
    data: bytes,
    filename: str,
    content_type: str,
    projet_id: Optional[str] = None,
) -> str:
    """Upload file to MinIO. Returns the storage key."""
    client = get_minio_client()
    ensure_bucket(client)

    ext = filename.rsplit(".", 1)[-1] if "." in filename else ""
    key = f"{projet_id or 'general'}/{uuid.uuid4().hex}.{ext}"

    client.put_object(
        settings.minio_bucket,
        key,
        io.BytesIO(data),
        length=len(data),
        content_type=content_type,
    )
    return key


def download_file(storage_key: str) -> bytes:
    """Download file from MinIO."""
    client = get_minio_client()
    response = client.get_object(settings.minio_bucket, storage_key)
    try:
        return response.read()
    finally:
        response.close()
        response.release_conn()


def delete_file(storage_key: str) -> bool:
    """Delete file from MinIO. Returns True if successful."""
    client = get_minio_client()
    try:
        client.remove_object(settings.minio_bucket, storage_key)
        return True
    except S3Error:
        return False
