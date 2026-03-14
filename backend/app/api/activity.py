"""Activity feed API for audit logging."""

from uuid import UUID
from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from datetime import datetime
from app.core.database import get_db
from app.models.activity import Activity
from app.models.document import Document

router = APIRouter(prefix="/activity", tags=["activity"])


class ActivityResponse(BaseModel):
    id: UUID
    document_id: UUID | None
    action: str
    details: dict
    created_at: datetime
    filename: str | None = None

    class Config:
        from_attributes = True


@router.get("", response_model=dict)
async def list_activities(
    limit: int = Query(30, ge=1, le=100),
    document_id: UUID | None = Query(None),
    db: AsyncSession = Depends(get_db),
):
    """Get recent activity feed, optionally filtered by document."""
    query = select(Activity).order_by(Activity.created_at.desc()).limit(limit)

    if document_id:
        query = query.where(Activity.document_id == document_id)

    result = await db.execute(query)
    activities = result.scalars().all()

    # Get document filenames
    doc_ids = {a.document_id for a in activities if a.document_id}
    doc_names: dict[str, str] = {}
    if doc_ids:
        doc_query = select(Document.id, Document.filename).where(Document.id.in_(doc_ids))
        doc_result = await db.execute(doc_query)
        doc_names = {str(r[0]): r[1] for r in doc_result.fetchall()}

    # Count total
    count_query = select(func.count(Activity.id))
    if document_id:
        count_query = count_query.where(Activity.document_id == document_id)
    total = (await db.execute(count_query)).scalar() or 0

    return {
        "activities": [
            {
                "id": str(a.id),
                "document_id": str(a.document_id) if a.document_id else None,
                "action": a.action,
                "details": a.details,
                "created_at": a.created_at.isoformat(),
                "filename": doc_names.get(str(a.document_id), None) if a.document_id else None,
            }
            for a in activities
        ],
        "total": total,
    }


async def log_activity(
    db: AsyncSession,
    action: str,
    document_id: UUID | None = None,
    details: dict | None = None,
) -> None:
    """Helper to log an activity. Call from other endpoints."""
    activity = Activity(
        document_id=document_id,
        action=action,
        details=details or {},
    )
    db.add(activity)
    await db.commit()
