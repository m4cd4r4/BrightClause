"""Document analysis endpoints for clause extraction and risk assessment."""

import json
import httpx
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Query, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from pydantic import BaseModel
from app.core.config import get_settings
from app.core.database import get_db
from app.models.document import Document, Clause, Obligation
from app.services.clause_extraction import (
    extract_clauses_from_document,
    generate_document_summary,
    CLAUSE_TYPES,
)
from app.api.activity import log_activity
from app.core.auth import validate_byok_key
from app.core.rate_limit import limiter

settings = get_settings()

router = APIRouter(prefix="/analysis", tags=["analysis"])


class ClauseResponse(BaseModel):
    """Response model for a single clause."""

    id: UUID
    document_id: UUID
    clause_type: str
    content: str
    summary: str | None
    risk_level: str | None
    confidence: float | None
    risk_factors: list[str] = []
    page_number: int | None = None
    chunk_index: int | None = None

    class Config:
        from_attributes = True


class ExtractionRequest(BaseModel):
    """Optional request body for extraction endpoints."""

    claude_api_key: str | None = None


class AnalysisResponse(BaseModel):
    """Response model for document analysis."""

    document_id: UUID
    status: str
    clauses_extracted: int
    risk_summary: dict
    overall_risk: str
    clause_breakdown: dict
    high_risk_highlights: list[dict]


class AnalysisStatusResponse(BaseModel):
    """Response for analysis status check."""

    document_id: UUID
    status: str
    clauses_found: int
    message: str


class ReportResponse(BaseModel):
    """Response model for executive summary report."""

    executive_summary: str
    document_info: dict
    risk_overview: dict
    key_clauses: list[dict]
    entities_summary: list[dict]
    recommendations: list[str]


REPORT_PROMPT = """You are a senior contract analyst preparing an executive briefing. Based on the contract analysis data below, write:

1. An EXECUTIVE SUMMARY (2-3 paragraphs) covering:
   - What type of contract this appears to be
   - The overall risk posture and key concerns
   - Most important findings that require attention

2. A list of 3-6 specific RECOMMENDATIONS for the reader, each on a new line starting with "- "

CONTRACT DATA:
Document: {filename} ({page_count} pages)
Overall Risk: {overall_risk}
Risk Distribution: Critical={critical}, High={high}, Medium={medium}, Low={low}

HIGH-RISK CLAUSES:
{high_risk_clauses}

KEY ENTITIES:
{entities}

Format your response as:
EXECUTIVE SUMMARY:
[your summary paragraphs]

RECOMMENDATIONS:
- [recommendation 1]
- [recommendation 2]
..."""


@router.post("/{document_id}/report", response_model=ReportResponse)
async def generate_report(
    document_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """Generate an AI-powered executive summary report for a document."""
    # Load document
    doc_query = select(Document).where(Document.id == document_id)
    doc_result = await db.execute(doc_query)
    doc = doc_result.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    # Load clauses
    clause_query = (
        select(Clause)
        .where(Clause.document_id == document_id)
        .options(selectinload(Clause.chunk))
        .order_by(Clause.clause_type)
    )
    clause_result = await db.execute(clause_query)
    all_clauses = clause_result.scalars().all()

    # Load analysis summary
    summary = await generate_document_summary(document_id, db)

    # Load entities
    from app.models.knowledge_graph import Entity as EntityModel
    entity_query = select(EntityModel).where(EntityModel.document_id == document_id).limit(30)
    entity_result = await db.execute(entity_query)
    all_entities = entity_result.scalars().all()

    # Build high-risk clause text for the prompt
    high_risk = [c for c in all_clauses if c.risk_level in ('critical', 'high')]
    high_risk_text = "\n".join(
        f"- [{c.clause_type.replace('_', ' ').title()}] ({c.risk_level.upper()}): "
        f"{(c.summary or c.content[:200])}"
        for c in high_risk[:10]
    ) or "No high-risk clauses found."

    # Build entity text
    entity_text = "\n".join(
        f"- {e.entity_type}: {e.name}" + (f" = {e.value}" if e.value else "")
        for e in all_entities[:15]
    ) or "No entities extracted."

    # Generate AI summary
    prompt = REPORT_PROMPT.format(
        filename=doc.filename,
        page_count=doc.page_count or "unknown",
        overall_risk=summary["overall_risk"].upper(),
        critical=summary["risk_summary"].get("critical", 0),
        high=summary["risk_summary"].get("high", 0),
        medium=summary["risk_summary"].get("medium", 0),
        low=summary["risk_summary"].get("low", 0),
        high_risk_clauses=high_risk_text,
        entities=entity_text,
    )

    executive_summary = ""
    recommendations = []

    try:
        async with httpx.AsyncClient(timeout=90.0) as client:
            response = await client.post(
                f"{settings.ollama_url}/api/generate",
                json={
                    "model": settings.llm_model,
                    "prompt": prompt,
                    "stream": False,
                    "options": {
                        "temperature": 0.3,
                        "num_predict": 1024,
                    },
                },
            )

            if response.status_code == 200:
                text = response.json().get("response", "").strip()
                # Parse the structured response
                if "RECOMMENDATIONS:" in text:
                    parts = text.split("RECOMMENDATIONS:", 1)
                    executive_summary = parts[0].replace("EXECUTIVE SUMMARY:", "").strip()
                    rec_text = parts[1].strip()
                    recommendations = [
                        line.strip().lstrip("- ").strip()
                        for line in rec_text.split("\n")
                        if line.strip().startswith("- ") or line.strip().startswith("* ")
                    ]
                else:
                    executive_summary = text.replace("EXECUTIVE SUMMARY:", "").strip()
    except (httpx.TimeoutException, httpx.ConnectError):
        executive_summary = (
            "AI summary generation is temporarily unavailable. "
            "The report data below is based on automated clause extraction."
        )

    if not executive_summary:
        executive_summary = "Unable to generate executive summary. Please review the analysis data below."
    if not recommendations:
        recommendations = ["Review all high-risk clauses with legal counsel before proceeding."]

    # Build response
    key_clauses = [
        {
            "clause_type": c.clause_type.replace("_", " ").title(),
            "risk_level": c.risk_level,
            "summary": c.summary or c.content[:200],
            "risk_factors": c.clause_metadata.get("risk_factors", []),
            "page_number": c.chunk.page_number if c.chunk else None,
        }
        for c in sorted(
            all_clauses,
            key=lambda x: {"critical": 0, "high": 1, "medium": 2, "low": 3}.get(x.risk_level or "low", 4),
        )[:15]
    ]

    entities_summary = []
    entity_types: dict[str, list[str]] = {}
    for e in all_entities:
        entity_types.setdefault(e.entity_type, []).append(e.name)
    for etype, names in entity_types.items():
        entities_summary.append({
            "type": etype.replace("_", " ").title(),
            "count": len(names),
            "examples": names[:5],
        })

    await log_activity(db, "report_generated", document_id, {"filename": doc.filename})

    return ReportResponse(
        executive_summary=executive_summary,
        document_info={
            "filename": doc.filename,
            "page_count": doc.page_count,
            "status": doc.status,
            "total_clauses": len(all_clauses),
            "total_entities": len(all_entities),
        },
        risk_overview=summary["risk_summary"],
        key_clauses=key_clauses,
        entities_summary=entities_summary,
        recommendations=recommendations,
    )


@router.post("/{document_id}/extract", response_model=AnalysisStatusResponse)
@limiter.limit("10/minute")
async def trigger_extraction(
    request: Request,
    document_id: UUID,
    background_tasks: BackgroundTasks,
    body: ExtractionRequest | None = None,
    db: AsyncSession = Depends(get_db),
):
    """
    Trigger clause extraction for a document.

    Optionally accepts a `claude_api_key` in the request body to use
    Anthropic Claude for extraction instead of the default local Ollama model.
    """
    claude_api_key = validate_byok_key(body.claude_api_key if body else None)

    # Verify document exists and is processed
    query = select(Document).where(Document.id == document_id)
    result = await db.execute(query)
    doc = result.scalar_one_or_none()

    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    if doc.status != "completed":
        raise HTTPException(
            status_code=400,
            detail=f"Document must be in 'completed' status. Current: {doc.status}",
        )

    # Check if already analyzed
    clause_query = select(Clause).where(Clause.document_id == document_id).limit(1)
    clause_result = await db.execute(clause_query)
    existing_clause = clause_result.scalar_one_or_none()

    if existing_clause:
        from sqlalchemy import func
        count_query = select(func.count(Clause.id)).where(Clause.document_id == document_id)
        count_result = await db.execute(count_query)
        clause_count = count_result.scalar()

        return AnalysisStatusResponse(
            document_id=document_id,
            status="completed",
            clauses_found=clause_count,
            message="Document already analyzed. Use /analysis/{id}/reanalyze to re-extract.",
        )

    # Clear any stale extraction_status before queuing
    meta = dict(doc.doc_metadata or {})
    meta.pop("extraction_status", None)
    doc.doc_metadata = meta
    await db.commit()

    # Queue background extraction
    background_tasks.add_task(run_extraction, document_id, claude_api_key)

    await log_activity(db, "extraction_started", document_id, {"filename": doc.filename})

    return AnalysisStatusResponse(
        document_id=document_id,
        status="queued",
        clauses_found=0,
        message="Clause extraction started. Check /analysis/{id}/summary for results.",
    )


@router.post("/{document_id}/reanalyze", response_model=AnalysisStatusResponse)
async def reanalyze_document(
    document_id: UUID,
    background_tasks: BackgroundTasks,
    request: ExtractionRequest | None = None,
    db: AsyncSession = Depends(get_db),
):
    """
    Re-extract clauses from a document.

    This deletes existing clauses and runs extraction again.
    Optionally accepts a `claude_api_key` to use Claude instead of Ollama.
    """
    claude_api_key = validate_byok_key(request.claude_api_key if request else None)

    query = select(Document).where(Document.id == document_id)
    result = await db.execute(query)
    doc = result.scalar_one_or_none()

    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    from sqlalchemy import delete
    delete_query = delete(Clause).where(Clause.document_id == document_id)
    await db.execute(delete_query)
    # Clear previous extraction_status so polling resets to "pending"
    meta = dict(doc.doc_metadata or {})
    meta.pop("extraction_status", None)
    doc.doc_metadata = meta
    await db.commit()

    background_tasks.add_task(run_extraction, document_id, claude_api_key)

    return AnalysisStatusResponse(
        document_id=document_id,
        status="queued",
        clauses_found=0,
        message="Re-analysis started. Previous clauses deleted.",
    )


@router.get("/{document_id}/summary", response_model=AnalysisResponse)
async def get_analysis_summary(
    document_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """
    Get analysis summary for a document.

    Returns risk assessment and clause breakdown.
    """
    # Verify document exists
    query = select(Document).where(Document.id == document_id)
    result = await db.execute(query)
    doc = result.scalar_one_or_none()

    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    # Generate summary
    summary = await generate_document_summary(document_id, db)

    # Count clauses
    from sqlalchemy import func
    count_query = select(func.count(Clause.id)).where(Clause.document_id == document_id)
    count_result = await db.execute(count_query)
    clause_count = count_result.scalar()

    if clause_count > 0:
        status = "completed"
    elif (doc.doc_metadata or {}).get("extraction_status") in ("no_clauses_found", "error"):
        status = "failed"
    else:
        status = "pending"

    return AnalysisResponse(
        document_id=document_id,
        status=status,
        clauses_extracted=clause_count,
        risk_summary=summary["risk_summary"],
        overall_risk=summary["overall_risk"],
        clause_breakdown=summary["clause_breakdown"],
        high_risk_highlights=summary["high_risk_highlights"],
    )


@router.get("/{document_id}/clauses", response_model=list[ClauseResponse])
async def get_document_clauses(
    document_id: UUID,
    clause_type: str | None = None,
    risk_level: str | None = None,
    db: AsyncSession = Depends(get_db),
):
    """
    Get all extracted clauses for a document.

    Optionally filter by clause type or risk level.
    """
    query = (
        select(Clause)
        .where(Clause.document_id == document_id)
        .options(selectinload(Clause.chunk))
    )

    if clause_type:
        query = query.where(Clause.clause_type == clause_type)
    if risk_level:
        query = query.where(Clause.risk_level == risk_level)

    query = query.order_by(Clause.clause_type, Clause.created_at)
    result = await db.execute(query)
    clauses = result.scalars().all()

    return [
        ClauseResponse(
            id=c.id,
            document_id=c.document_id,
            clause_type=c.clause_type,
            content=c.content,
            summary=c.summary,
            risk_level=c.risk_level,
            confidence=c.confidence,
            risk_factors=c.clause_metadata.get("risk_factors", []),
            page_number=c.chunk.page_number if c.chunk else None,
            chunk_index=c.chunk.chunk_index if c.chunk else None,
        )
        for c in clauses
    ]


@router.get("/clause-types")
async def list_clause_types():
    """
    List all supported clause types.

    Returns clause types that can be extracted from contracts.
    """
    return {
        "clause_types": CLAUSE_TYPES,
        "descriptions": {
            "change_of_control": "Provisions triggered by ownership changes",
            "termination": "Contract termination conditions and notice periods",
            "ip_assignment": "Intellectual property ownership and transfer",
            "indemnification": "Protection against third-party claims",
            "limitation_of_liability": "Caps on damages and liability",
            "confidentiality": "NDA and information protection clauses",
            "non_compete": "Restrictions on competitive activities",
            "non_solicitation": "Employee and customer non-solicitation",
            "payment_terms": "Payment schedules and conditions",
            "warranty": "Warranties and representations",
            "governing_law": "Jurisdiction and applicable law",
            "dispute_resolution": "Arbitration and litigation procedures",
            "force_majeure": "Unforeseeable circumstance provisions",
            "assignment": "Contract assignment and transfer rights",
            "audit_rights": "Financial and operational audit provisions",
            "data_protection": "GDPR and data privacy clauses",
        },
    }


@router.get("/obligations/all")
async def list_all_obligations(
    status: str | None = Query(None),
    obligation_type: str | None = Query(None),
    limit: int = Query(50, le=200),
    db: AsyncSession = Depends(get_db),
):
    """List obligations across all documents with optional filtering."""
    query = (
        select(Obligation, Document.filename)
        .join(Document, Obligation.document_id == Document.id)
    )

    if status:
        query = query.where(Obligation.status == status)
    if obligation_type:
        query = query.where(Obligation.obligation_type == obligation_type)

    query = query.order_by(Obligation.due_date.nulls_last(), Obligation.created_at.desc()).limit(limit)
    result = await db.execute(query)
    rows = result.all()

    return {
        "obligations": [
            {
                "id": str(ob.id),
                "document_id": str(ob.document_id),
                "filename": filename,
                "description": ob.description,
                "responsible_party": ob.responsible_party,
                "due_date": ob.due_date,
                "obligation_type": ob.obligation_type,
                "status": ob.status,
                "clause_id": str(ob.clause_id) if ob.clause_id else None,
                "created_at": ob.created_at.isoformat(),
            }
            for ob, filename in rows
        ],
        "total": len(rows),
    }


EXPLAIN_PROMPT = """Explain this legal clause in simple, plain English that anyone can understand.
Be specific about what it means for each party involved. Highlight any concerns or things to watch out for.
Keep your explanation concise (2-4 paragraphs). Use markdown formatting for readability.

Clause type: {clause_type}

Clause text:
{content}

Plain English explanation:"""


class ExplainResponse(BaseModel):
    explanation: str
    clause_type: str


@router.post("/{document_id}/clauses/{clause_id}/explain", response_model=ExplainResponse)
async def explain_clause(
    document_id: UUID,
    clause_id: UUID,
    request: ExtractionRequest | None = None,
    db: AsyncSession = Depends(get_db),
):
    """Explain a clause in plain English using AI."""
    query = select(Clause).where(
        Clause.id == clause_id,
        Clause.document_id == document_id,
    )
    result = await db.execute(query)
    clause = result.scalar_one_or_none()

    if not clause:
        raise HTTPException(status_code=404, detail="Clause not found")

    prompt = EXPLAIN_PROMPT.format(
        clause_type=clause.clause_type.replace("_", " ").title(),
        content=clause.content[:3000],
    )

    # Per-request key (validated) takes priority over env var
    effective_api_key = validate_byok_key(request.claude_api_key if request else None) or settings.anthropic_api_key or None

    try:
        if effective_api_key:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    "https://api.anthropic.com/v1/messages",
                    headers={
                        "x-api-key": effective_api_key,
                        "anthropic-version": "2023-06-01",
                        "content-type": "application/json",
                    },
                    json={
                        "model": "claude-haiku-4-5-20251001",
                        "max_tokens": 1024,
                        "messages": [{"role": "user", "content": prompt}],
                    },
                )
                if response.status_code != 200:
                    raise HTTPException(status_code=502, detail="AI service temporarily unavailable")
                explanation = response.json()["content"][0]["text"].strip()
        else:
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(
                    f"{settings.ollama_url}/api/generate",
                    json={
                        "model": settings.llm_model,
                        "prompt": prompt,
                        "stream": False,
                        "options": {"temperature": 0.3, "num_predict": 512},
                    },
                )
                if response.status_code != 200:
                    raise HTTPException(status_code=502, detail="AI service temporarily unavailable")
                explanation = response.json().get("response", "").strip()

        if not explanation:
            explanation = "Unable to generate an explanation. Please try again."

    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="AI service timed out. Please try again.")
    except httpx.ConnectError:
        raise HTTPException(status_code=502, detail="AI service is not available. Please try again later.")

    return ExplainResponse(
        explanation=explanation,
        clause_type=clause.clause_type,
    )


async def run_extraction(document_id: UUID, claude_api_key: str | None = None):
    """Background task to run clause extraction."""
    import logging
    logger = logging.getLogger(__name__)
    from app.core.database import AsyncSessionLocal

    effective_key = claude_api_key or settings.anthropic_api_key or None
    async with AsyncSessionLocal() as db:
        try:
            clauses = await extract_clauses_from_document(document_id, db, claude_api_key=effective_key)
            if not clauses:
                # Extraction completed but found nothing — mark so the frontend can stop polling
                doc_result = await db.execute(select(Document).where(Document.id == document_id))
                doc = doc_result.scalar_one_or_none()
                if doc:
                    doc.doc_metadata = {**(doc.doc_metadata or {}), "extraction_status": "no_clauses_found"}
                    await db.commit()
        except Exception as e:
            logger.error(f"Extraction error for {document_id}: {e}", exc_info=True)
            try:
                doc_result = await db.execute(select(Document).where(Document.id == document_id))
                doc = doc_result.scalar_one_or_none()
                if doc:
                    doc.doc_metadata = {**(doc.doc_metadata or {}), "extraction_status": "error"}
                    await db.commit()
            except Exception:
                pass


# ── Obligation & Deadline Tracker ──────────────────────────────────────────

OBLIGATION_PROMPT = """Analyze the following contract clauses and extract ALL obligations, deadlines, and commitments.

For each obligation, provide a JSON array of objects with these fields:
- "description": Brief description of the obligation
- "responsible_party": Who must fulfill it (or null if unclear)
- "due_date": When it's due (exact text from contract, or null)
- "obligation_type": One of: payment, delivery, notification, compliance, reporting, general
- "clause_index": Which clause number (0-indexed) this came from

Clauses:
{clauses}

Return ONLY a valid JSON array. Example:
[{{"description": "Pay monthly rent of $2,000", "responsible_party": "Tenant", "due_date": "1st of each month", "obligation_type": "payment", "clause_index": 0}}]

JSON array:"""


class ObligationResponse(BaseModel):
    id: UUID
    document_id: UUID
    clause_id: UUID | None
    description: str
    responsible_party: str | None
    due_date: str | None
    obligation_type: str
    status: str
    created_at: str
    filename: str | None = None

    class Config:
        from_attributes = True


@router.post("/{document_id}/obligations/extract")
async def extract_obligations(
    document_id: UUID,
    request: ExtractionRequest | None = None,
    db: AsyncSession = Depends(get_db),
):
    """Extract obligations and deadlines from document clauses using AI."""
    # Load document
    doc_query = select(Document).where(Document.id == document_id)
    doc_result = await db.execute(doc_query)
    doc = doc_result.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    # Load clauses
    clause_query = (
        select(Clause)
        .where(Clause.document_id == document_id)
        .order_by(Clause.clause_type)
    )
    clause_result = await db.execute(clause_query)
    all_clauses = clause_result.scalars().all()

    if not all_clauses:
        raise HTTPException(status_code=400, detail="No clauses extracted yet. Run extraction first.")

    # Delete existing obligations for this document
    existing_query = select(Obligation).where(Obligation.document_id == document_id)
    existing_result = await db.execute(existing_query)
    for ob in existing_result.scalars().all():
        await db.delete(ob)
    await db.flush()

    # Build clause text for prompt
    clause_text = "\n".join(
        f"[{i}] ({c.clause_type.replace('_', ' ').title()}): {c.content[:500]}"
        for i, c in enumerate(all_clauses)
    )

    prompt = OBLIGATION_PROMPT.format(clauses=clause_text)

    # Per-request key (validated) takes priority over env var
    effective_api_key = validate_byok_key(request.claude_api_key if request else None) or settings.anthropic_api_key or None

    extracted = []
    try:
        if effective_api_key:
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(
                    "https://api.anthropic.com/v1/messages",
                    headers={
                        "x-api-key": effective_api_key,
                        "anthropic-version": "2023-06-01",
                        "content-type": "application/json",
                    },
                    json={
                        "model": "claude-haiku-4-5-20251001",
                        "max_tokens": 4096,
                        "messages": [{"role": "user", "content": prompt}],
                    },
                )
                if response.status_code == 200:
                    text = response.json()["content"][0]["text"].strip()
                    start = text.find("[")
                    end = text.rfind("]") + 1
                    if start >= 0 and end > start:
                        extracted = json.loads(text[start:end])
        else:
            async with httpx.AsyncClient(timeout=90.0) as client:
                response = await client.post(
                    f"{settings.ollama_url}/api/generate",
                    json={
                        "model": settings.llm_model,
                        "prompt": prompt,
                        "stream": False,
                        "options": {"temperature": 0.2, "num_predict": 2048},
                    },
                )
                if response.status_code == 200:
                    text = response.json().get("response", "").strip()
                    start = text.find("[")
                    end = text.rfind("]") + 1
                    if start >= 0 and end > start:
                        extracted = json.loads(text[start:end])
    except (httpx.TimeoutException, httpx.ConnectError, json.JSONDecodeError):
        pass

    # Save obligations
    created = []
    for item in extracted:
        clause_idx = item.get("clause_index")
        clause_id = all_clauses[clause_idx].id if clause_idx is not None and 0 <= clause_idx < len(all_clauses) else None

        ob = Obligation(
            document_id=document_id,
            clause_id=clause_id,
            description=item.get("description", "Unknown obligation"),
            responsible_party=item.get("responsible_party"),
            due_date=item.get("due_date"),
            obligation_type=item.get("obligation_type", "general"),
            status="pending",
        )
        db.add(ob)
        created.append(ob)

    await db.commit()

    await log_activity(db, "obligations_extracted", document_id, {
        "filename": doc.filename,
        "count": len(created),
    })

    return {
        "document_id": str(document_id),
        "obligations_found": len(created),
        "message": f"Extracted {len(created)} obligations from {len(all_clauses)} clauses.",
    }


@router.get("/{document_id}/obligations")
async def get_document_obligations(
    document_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """Get all obligations for a specific document."""
    doc_query = select(Document).where(Document.id == document_id)
    doc_result = await db.execute(doc_query)
    doc = doc_result.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    query = (
        select(Obligation)
        .where(Obligation.document_id == document_id)
        .order_by(Obligation.obligation_type, Obligation.due_date)
    )
    result = await db.execute(query)
    obligations = result.scalars().all()

    return {
        "document_id": str(document_id),
        "filename": doc.filename,
        "obligations": [
            {
                "id": str(ob.id),
                "description": ob.description,
                "responsible_party": ob.responsible_party,
                "due_date": ob.due_date,
                "obligation_type": ob.obligation_type,
                "status": ob.status,
                "clause_id": str(ob.clause_id) if ob.clause_id else None,
                "created_at": ob.created_at.isoformat(),
            }
            for ob in obligations
        ],
        "total": len(obligations),
    }
