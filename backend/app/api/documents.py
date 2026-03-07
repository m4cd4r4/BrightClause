"""Document upload and management endpoints."""

from uuid import UUID
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, Request
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from pydantic import BaseModel
import redis as redis_lib
from app.core.database import get_db
from app.core.config import get_settings
from app.core.rate_limit import limiter
from app.models.document import Document
from app.services.storage import upload_document as minio_upload, delete_document as minio_delete, get_document_url
from app.api.activity import log_activity

router = APIRouter(prefix="/documents", tags=["documents"])
settings = get_settings()


class DocumentResponse(BaseModel):
    """Document response schema."""

    id: UUID
    filename: str
    file_size: int | None
    file_type: str | None
    page_count: int | None
    status: str
    chunk_count: int = 0
    metadata: dict = {}

    class Config:
        from_attributes = True


class DocumentDetailResponse(DocumentResponse):
    """Detailed document response with download URL."""

    download_url: str | None = None


class DocumentListResponse(BaseModel):
    """List of documents response."""

    documents: list[DocumentResponse]
    total: int
    skip: int
    limit: int


def _get_queue_depth() -> int:
    """Check the current Celery task queue depth in Redis."""
    try:
        r = redis_lib.from_url(settings.redis_url, decode_responses=True)
        return r.llen("celery") or 0
    except Exception:
        return 0


MAX_QUEUE_DEPTH = 20
ESTIMATED_SECONDS_PER_DOC = 30


@router.post("/upload", response_model=DocumentResponse)
@limiter.limit("5/minute")
async def upload_document(
    request: Request,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
):
    """
    Upload a contract document (PDF). Rate limited to 5 uploads/minute per IP.

    The document will be stored in MinIO and processed asynchronously by Celery:
    1. Store in MinIO
    2. Extract text (4-tier OCR pipeline)
    3. Chunk the text
    4. Generate embeddings
    5. Store in database
    """
    # Validate file extension
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")

    # Sanitize filename — strip path separators to prevent path traversal
    safe_filename = file.filename.replace("/", "_").replace("\\", "_").replace("..", "_")

    # Read file content
    content = await file.read()

    # Check file size
    if len(content) > settings.max_file_size:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Maximum size is {settings.max_file_size // (1024*1024)}MB",
        )

    # Validate PDF magic bytes — reject non-PDF content disguised with .pdf extension
    if not content[:5].startswith(b"%PDF-"):
        raise HTTPException(status_code=400, detail="File is not a valid PDF")

    # Queue back-pressure: reject uploads when queue is saturated
    queue_depth = _get_queue_depth()
    if queue_depth >= MAX_QUEUE_DEPTH:
        raise HTTPException(
            status_code=503,
            detail="Server is busy processing documents. Please try again in a few minutes.",
        )

    # Create document record
    doc = Document(
        filename=safe_filename,
        file_path="",  # Will be set after MinIO upload
        file_size=len(content),
        file_type="application/pdf",
        status="uploading",
    )
    db.add(doc)
    await db.commit()
    await db.refresh(doc)

    try:
        # Upload to MinIO
        object_path = minio_upload(doc.id, content)
        doc.file_path = object_path
        doc.status = "queued"
        await db.commit()

        # Queue Celery task for processing
        from app.tasks.document_tasks import process_document
        process_document.delay(str(doc.id))

        # Log activity
        await log_activity(db, "uploaded", doc.id, {"filename": doc.filename, "file_size": doc.file_size})

        # Calculate queue position and estimated wait time
        queue_position = _get_queue_depth()
        estimated_wait = queue_position * ESTIMATED_SECONDS_PER_DOC
        response_metadata = doc.doc_metadata or {}
        response_metadata["queue_position"] = queue_position
        response_metadata["estimated_wait_seconds"] = estimated_wait

        return DocumentResponse(
            id=doc.id,
            filename=doc.filename,
            file_size=doc.file_size,
            file_type=doc.file_type,
            page_count=doc.page_count,
            status=doc.status,
            metadata=response_metadata,
        )

    except Exception as e:
        # Cleanup on failure — log details server-side, return generic message to client
        import logging
        logging.getLogger(__name__).error(f"Upload failed for doc {doc.id}: {e}", exc_info=True)
        doc.status = "failed"
        doc.doc_metadata = {"error": "Upload processing failed"}
        await db.commit()
        raise HTTPException(status_code=500, detail="Upload failed. Please try again or contact support.")


@router.get("", response_model=DocumentListResponse)
async def list_documents(
    skip: int = 0,
    limit: int = 20,
    status: str | None = None,
    db: AsyncSession = Depends(get_db),
):
    """
    List all uploaded documents.

    Args:
        skip: Number of documents to skip (pagination)
        limit: Maximum documents to return
        status: Filter by status (queued, processing, completed, failed)
    """
    # Build query
    query = select(Document).options(selectinload(Document.chunks))

    if status:
        query = query.where(Document.status == status)

    query = query.offset(skip).limit(limit).order_by(Document.uploaded_at.desc())

    result = await db.execute(query)
    documents = result.scalars().all()

    # Get total count
    count_query = select(func.count(Document.id))
    if status:
        count_query = count_query.where(Document.status == status)
    count_result = await db.execute(count_query)
    total = count_result.scalar()

    doc_responses = [
        DocumentResponse(
            id=doc.id,
            filename=doc.filename,
            file_size=doc.file_size,
            file_type=doc.file_type,
            page_count=doc.page_count,
            status=doc.status,
            chunk_count=len(doc.chunks) if doc.chunks else 0,
            metadata=doc.doc_metadata,
        )
        for doc in documents
    ]

    return DocumentListResponse(
        documents=doc_responses,
        total=total,
        skip=skip,
        limit=limit,
    )


@router.get("/{document_id}", response_model=DocumentDetailResponse)
async def get_document(
    document_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """Get a specific document by ID with download URL."""
    query = (
        select(Document)
        .where(Document.id == document_id)
        .options(selectinload(Document.chunks))
    )
    result = await db.execute(query)
    doc = result.scalar_one_or_none()

    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    # Generate presigned download URL
    download_url = None
    if doc.status == "completed":
        try:
            download_url = get_document_url(doc.id)
        except Exception:
            pass

    return DocumentDetailResponse(
        id=doc.id,
        filename=doc.filename,
        file_size=doc.file_size,
        file_type=doc.file_type,
        page_count=doc.page_count,
        status=doc.status,
        chunk_count=len(doc.chunks) if doc.chunks else 0,
        metadata=doc.doc_metadata,
        download_url=download_url,
    )


@router.get("/{document_id}/download-url")
async def get_download_url(
    document_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """Get a presigned download URL for the document PDF."""
    query = select(Document).where(Document.id == document_id)
    result = await db.execute(query)
    doc = result.scalar_one_or_none()

    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    try:
        url = get_document_url(doc.id)
        return {"download_url": url, "filename": doc.filename}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate download URL: {str(e)}")


class RenameRequest(BaseModel):
    """Rename a document."""
    filename: str


@router.patch("/{document_id}", response_model=DocumentResponse)
async def rename_document(
    document_id: UUID,
    body: RenameRequest,
    db: AsyncSession = Depends(get_db),
):
    """Rename a document."""
    query = select(Document).where(Document.id == document_id).options(selectinload(Document.chunks))
    result = await db.execute(query)
    doc = result.scalar_one_or_none()

    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    doc.filename = body.filename.strip()
    await db.commit()

    return DocumentResponse(
        id=doc.id,
        filename=doc.filename,
        file_size=doc.file_size,
        file_type=doc.file_type,
        page_count=doc.page_count,
        status=doc.status,
        chunk_count=len(doc.chunks) if doc.chunks else 0,
        metadata=doc.doc_metadata,
    )


@router.delete("/{document_id}")
async def delete_document(
    document_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """Delete a document and all associated data."""
    query = select(Document).where(Document.id == document_id)
    result = await db.execute(query)
    doc = result.scalar_one_or_none()

    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    # Delete from MinIO
    try:
        minio_delete(document_id)
    except Exception:
        pass  # Continue even if MinIO delete fails

    filename = doc.filename

    # Delete from database (cascades to chunks and clauses)
    await db.delete(doc)
    await db.commit()

    await log_activity(db, "deleted", None, {"filename": filename, "document_id": str(document_id)})

    return {"status": "deleted", "document_id": str(document_id)}


@router.post("/{document_id}/reprocess")
async def reprocess_document(
    document_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """
    Reprocess a document.

    Useful if processing failed or you want to regenerate embeddings.
    """
    query = select(Document).where(Document.id == document_id)
    result = await db.execute(query)
    doc = result.scalar_one_or_none()

    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    if doc.status == "processing":
        raise HTTPException(status_code=400, detail="Document is already processing")

    # Reset status and queue for reprocessing
    doc.status = "queued"
    doc.doc_metadata = {**doc.doc_metadata, "reprocessed": True}
    await db.commit()

    # Queue Celery task
    from app.tasks.document_tasks import process_document
    process_document.delay(str(doc.id))

    return {"status": "queued", "document_id": str(document_id)}


@router.get("/{document_id}/chunks")
async def get_document_chunks(
    document_id: UUID,
    skip: int = 0,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
):
    """Get chunks for a document."""
    from app.models.document import Chunk

    # Verify document exists
    doc_query = select(Document).where(Document.id == document_id)
    doc_result = await db.execute(doc_query)
    doc = doc_result.scalar_one_or_none()

    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    # Get chunks
    query = (
        select(Chunk)
        .where(Chunk.document_id == document_id)
        .offset(skip)
        .limit(limit)
        .order_by(Chunk.chunk_index)
    )
    result = await db.execute(query)
    chunks = result.scalars().all()

    return {
        "document_id": str(document_id),
        "chunks": [
            {
                "id": str(chunk.id),
                "chunk_index": chunk.chunk_index,
                "page_number": chunk.page_number,
                "content": chunk.content,
                "has_embedding": chunk.embedding is not None,
                "metadata": chunk.chunk_metadata,
            }
            for chunk in chunks
        ],
        "total": len(doc.chunks) if doc.chunks else 0,
        "skip": skip,
        "limit": limit,
    }
