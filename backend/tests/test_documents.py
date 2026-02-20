"""Integration tests for Documents API (Sprint 9).

Tests:
  - POST /api/documents/upload
  - GET /api/documents
  - GET /api/documents/{id}/download
  - DELETE /api/documents/{id}

Requires backend + MinIO running.

Run with:
    cd backend && pytest tests/test_documents.py -v
"""

import httpx
import pytest

BASE = "http://localhost:8000/api"


@pytest.fixture(scope="module")
def client():
    with httpx.Client(base_url=BASE, timeout=30) as c:
        yield c


@pytest.fixture(scope="module")
def uploaded_doc(client):
    """Upload a test file and return its metadata."""
    content = b"Test document content for Sprint 9"
    files = {"file": ("test_sprint9.txt", content, "text/plain")}
    data = {"category": "test", "description": "Test doc"}
    r = client.post("/documents/upload", files=files, data=data)
    assert r.status_code == 200
    return r.json()


def test_upload_returns_id(uploaded_doc):
    """Upload should return a document ID."""
    assert "id" in uploaded_doc
    assert uploaded_doc["filename"] == "test_sprint9.txt"


def test_upload_returns_size(uploaded_doc):
    """Upload should return correct file size."""
    assert uploaded_doc["size_bytes"] == len(b"Test document content for Sprint 9")


def test_upload_returns_category(uploaded_doc):
    """Upload should return the category."""
    assert uploaded_doc["category"] == "test"


def test_list_documents(client, uploaded_doc):
    """GET /documents should return a list."""
    r = client.get("/documents")
    assert r.status_code == 200
    data = r.json()
    assert "documents" in data
    assert "total" in data


def test_list_has_uploaded_doc(client, uploaded_doc):
    """The uploaded doc should appear in the list."""
    r = client.get("/documents")
    ids = [d["id"] for d in r.json()["documents"]]
    assert uploaded_doc["id"] in ids


def test_download_document(client, uploaded_doc):
    """Download should return the file content."""
    doc_id = uploaded_doc["id"]
    r = client.get(f"/documents/{doc_id}/download")
    assert r.status_code == 200
    assert r.content == b"Test document content for Sprint 9"


def test_download_404(client):
    """Download unknown doc should return 404."""
    r = client.get("/documents/00000000-0000-0000-0000-000000000000/download")
    assert r.status_code == 404


def test_upload_empty_file(client):
    """Upload empty file should fail."""
    files = {"file": ("empty.txt", b"", "text/plain")}
    r = client.post("/documents/upload", files=files)
    assert r.status_code == 400


def test_delete_document(client, uploaded_doc):
    """Delete should remove the document."""
    doc_id = uploaded_doc["id"]
    r = client.delete(f"/documents/{doc_id}")
    assert r.status_code == 200
    assert r.json()["deleted"] is True


def test_delete_404(client):
    """Delete unknown doc should return 404."""
    r = client.delete("/documents/00000000-0000-0000-0000-000000000000")
    assert r.status_code == 404
