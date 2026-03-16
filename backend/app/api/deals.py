"""Deal management endpoints for grouping related documents."""

from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query, Request
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from pydantic import BaseModel
from app.core.database import get_db
from app.core.rate_limit import limiter
from app.core.config import get_settings
from app.models.document import Deal, Document, deal_documents
from app.services.storage import upload_document as minio_upload
from app.api.activity import log_activity

router = APIRouter(prefix="/deals", tags=["deals"])
settings = get_settings()


class CreateDealRequest(BaseModel):
    name: str
    description: str | None = None


class AddDocumentsRequest(BaseModel):
    document_ids: list[str]


@router.post("")
async def create_deal(
    body: CreateDealRequest,
    db: AsyncSession = Depends(get_db),
):
    """Create a new deal."""
    deal = Deal(name=body.name.strip(), description=body.description)
    db.add(deal)
    await db.commit()
    await db.refresh(deal)

    await log_activity(db, "deal_created", None, {"deal_name": deal.name})

    return {
        "id": str(deal.id),
        "name": deal.name,
        "description": deal.description,
        "created_at": deal.created_at.isoformat(),
        "document_count": 0,
    }


@router.get("")
async def list_deals(
    limit: int = Query(50, le=200),
    db: AsyncSession = Depends(get_db),
):
    """List all deals with document counts."""
    query = (
        select(Deal)
        .options(selectinload(Deal.documents))
        .order_by(Deal.created_at.desc())
        .limit(limit)
    )
    result = await db.execute(query)
    deals = result.scalars().all()

    return {
        "deals": [
            {
                "id": str(d.id),
                "name": d.name,
                "description": d.description,
                "created_at": d.created_at.isoformat(),
                "document_count": len(d.documents),
                "documents": [
                    {
                        "id": str(doc.id),
                        "filename": doc.filename,
                        "status": doc.status,
                    }
                    for doc in d.documents[:5]
                ],
            }
            for d in deals
        ],
        "total": len(deals),
    }


@router.get("/{deal_id}")
async def get_deal(
    deal_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """Get a specific deal with all documents and aggregate analysis."""
    query = (
        select(Deal)
        .where(Deal.id == deal_id)
        .options(selectinload(Deal.documents).selectinload(Document.clauses))
    )
    result = await db.execute(query)
    deal = result.scalar_one_or_none()

    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")

    # Aggregate risk across all documents in the deal
    risk_summary = {"critical": 0, "high": 0, "medium": 0, "low": 0}
    for doc in deal.documents:
        for clause in doc.clauses:
            if clause.risk_level in risk_summary:
                risk_summary[clause.risk_level] += 1

    return {
        "id": str(deal.id),
        "name": deal.name,
        "description": deal.description,
        "created_at": deal.created_at.isoformat(),
        "document_count": len(deal.documents),
        "risk_summary": risk_summary,
        "documents": [
            {
                "id": str(doc.id),
                "filename": doc.filename,
                "status": doc.status,
                "file_size": doc.file_size,
                "page_count": doc.page_count,
                "clause_count": len(doc.clauses),
            }
            for doc in deal.documents
        ],
    }


@router.post("/{deal_id}/documents")
async def add_documents_to_deal(
    deal_id: UUID,
    body: AddDocumentsRequest,
    db: AsyncSession = Depends(get_db),
):
    """Add existing documents to a deal."""
    query = select(Deal).where(Deal.id == deal_id).options(selectinload(Deal.documents))
    result = await db.execute(query)
    deal = result.scalar_one_or_none()

    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")

    existing_ids = {str(d.id) for d in deal.documents}
    added = 0

    for doc_id_str in body.document_ids:
        if doc_id_str in existing_ids:
            continue
        doc_query = select(Document).where(Document.id == UUID(doc_id_str))
        doc_result = await db.execute(doc_query)
        doc = doc_result.scalar_one_or_none()
        if doc:
            deal.documents.append(doc)
            added += 1

    await db.commit()

    return {"deal_id": str(deal_id), "documents_added": added}


@router.delete("/{deal_id}/documents/{document_id}")
async def remove_document_from_deal(
    deal_id: UUID,
    document_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """Remove a document from a deal."""
    query = select(Deal).where(Deal.id == deal_id).options(selectinload(Deal.documents))
    result = await db.execute(query)
    deal = result.scalar_one_or_none()

    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")

    deal.documents = [d for d in deal.documents if d.id != document_id]
    await db.commit()

    return {"status": "removed", "deal_id": str(deal_id), "document_id": str(document_id)}


@router.post("/{deal_id}/upload")
@limiter.limit("3/minute")
async def batch_upload_to_deal(
    request: Request,
    deal_id: UUID,
    files: list[UploadFile] = File(...),
    db: AsyncSession = Depends(get_db),
):
    """Batch upload PDF files directly to a deal."""
    query = select(Deal).where(Deal.id == deal_id).options(selectinload(Deal.documents))
    result = await db.execute(query)
    deal = result.scalar_one_or_none()

    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")

    uploaded = []
    errors = []

    for file in files:
        if not file.filename or not file.filename.lower().endswith(".pdf"):
            errors.append(f"{file.filename}: Only PDF files supported")
            continue

        content = await file.read()
        if len(content) > settings.max_file_size:
            errors.append(f"{file.filename}: File too large")
            continue

        safe_filename = (
            file.filename.replace("/", "_")
            .replace("\\", "_")
            .replace("..", "_")
            .replace("\x00", "")
        )
        if len(safe_filename) > 255:
            safe_filename = safe_filename[:251] + ".pdf"

        doc = Document(
            filename=safe_filename,
            file_path="",
            file_size=len(content),
            file_type="application/pdf",
            status="uploading",
        )
        db.add(doc)
        await db.commit()
        await db.refresh(doc)

        try:
            object_path = minio_upload(doc.id, content)
            doc.file_path = object_path
            doc.status = "queued"
            deal.documents.append(doc)
            await db.commit()

            from app.tasks.document_tasks import process_document
            process_document.delay(str(doc.id))

            uploaded.append({"id": str(doc.id), "filename": doc.filename})
        except Exception as e:
            doc.status = "failed"
            await db.commit()
            errors.append(f"{file.filename}: {str(e)}")

    if uploaded:
        await log_activity(db, "batch_uploaded", None, {
            "deal_name": deal.name,
            "count": len(uploaded),
        })

    return {
        "deal_id": str(deal_id),
        "uploaded": uploaded,
        "errors": errors,
        "total_uploaded": len(uploaded),
    }


@router.delete("/{deal_id}")
async def delete_deal(
    deal_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """Delete a deal (does not delete its documents)."""
    query = select(Deal).where(Deal.id == deal_id)
    result = await db.execute(query)
    deal = result.scalar_one_or_none()

    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")

    await db.delete(deal)
    await db.commit()

    return {"status": "deleted", "deal_id": str(deal_id)}
