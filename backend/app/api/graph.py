"""Knowledge graph API endpoints."""

from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from app.core.database import get_db
from app.models.document import Document
from app.models.knowledge_graph import Entity, Relationship
from app.services.entity_extraction import (
    extract_entities_from_document,
    get_document_graph,
    find_entity_across_documents,
    ENTITY_TYPES,
    RELATIONSHIP_TYPES,
)

router = APIRouter(prefix="/graph", tags=["knowledge-graph"])


class EntityResponse(BaseModel):
    """Response model for an entity."""

    id: UUID
    document_id: UUID
    entity_type: str
    name: str
    normalized_name: str | None
    value: str | None
    confidence: float | None
    context: str | None

    class Config:
        from_attributes = True


class GraphResponse(BaseModel):
    """Response model for document graph."""

    document_id: str
    nodes: list[dict]
    edges: list[dict]
    stats: dict


class ExtractionStatusResponse(BaseModel):
    """Response for extraction status."""

    document_id: UUID
    status: str
    entities_found: int
    relationships_found: int
    message: str


# ============================================
# STATIC ROUTES (must come before dynamic routes)
# ============================================

@router.get("/types")
async def list_types():
    """
    List all supported entity and relationship types.
    """
    return {
        "entity_types": ENTITY_TYPES,
        "relationship_types": RELATIONSHIP_TYPES,
        "entity_descriptions": {
            "party": "Companies, organizations, LLCs, corporations",
            "person": "Named individuals (executives, signatories)",
            "date": "Important dates (effective, expiration, renewal)",
            "amount": "Monetary values (fees, caps, penalties)",
            "location": "Addresses, jurisdictions, governing law",
            "term": "Duration terms (contract length, renewal)",
            "percentage": "Rates, percentages (interest, commission)",
        },
        "relationship_descriptions": {
            "party_to_contract": "Party is a signatory to the contract",
            "effective_date": "Contract becomes effective on this date",
            "expiration_date": "Contract expires on this date",
            "governs": "Jurisdiction governs the contract",
            "payment_to": "Payment obligation between parties",
            "employs": "Employment relationship",
            "subsidiary_of": "Corporate subsidiary relationship",
            "controls": "Control or ownership relationship",
            "guarantor_for": "Guarantor relationship",
            "beneficiary_of": "Beneficiary relationship",
        },
    }


@router.get("/stats")
async def graph_stats(
    db: AsyncSession = Depends(get_db),
):
    """
    Get overall knowledge graph statistics.
    """
    # Count entities by type
    entity_stats = await db.execute(
        select(Entity.entity_type, func.count(Entity.id))
        .group_by(Entity.entity_type)
    )
    entity_rows = entity_stats.fetchall()

    # Count relationships by type
    rel_stats = await db.execute(
        select(Relationship.relationship_type, func.count(Relationship.id))
        .group_by(Relationship.relationship_type)
    )
    rel_rows = rel_stats.fetchall()

    # Count documents with entities
    doc_count = await db.execute(
        select(func.count(func.distinct(Entity.document_id)))
    )

    return {
        "documents_with_entities": doc_count.scalar() or 0,
        "entity_counts": {row[0]: row[1] for row in entity_rows},
        "relationship_counts": {row[0]: row[1] for row in rel_rows},
        "total_entities": sum(row[1] for row in entity_rows),
        "total_relationships": sum(row[1] for row in rel_rows),
    }


@router.get("/cross-reference")
async def cross_reference_entities(
    min_documents: int = Query(2, ge=2, description="Minimum documents an entity must appear in"),
    entity_type: str | None = Query(None, description="Filter by entity type"),
    db: AsyncSession = Depends(get_db),
):
    """
    Find entities that appear across multiple documents.

    Returns entities grouped by normalized name that appear in at least
    min_documents different documents.
    """
    from sqlalchemy.orm import aliased

    # Query entities grouped by normalized_name with document count
    base_query = (
        select(
            Entity.normalized_name,
            Entity.entity_type,
            func.count(func.distinct(Entity.document_id)).label("doc_count"),
        )
        .where(Entity.normalized_name.isnot(None))
        .group_by(Entity.normalized_name, Entity.entity_type)
        .having(func.count(func.distinct(Entity.document_id)) >= min_documents)
        .order_by(func.count(func.distinct(Entity.document_id)).desc())
    )

    if entity_type:
        base_query = base_query.where(Entity.entity_type == entity_type)

    result = await db.execute(base_query)
    cross_refs = result.fetchall()

    # For each cross-reference, get the document details
    entities_out = []
    for row in cross_refs[:50]:  # Limit to 50
        norm_name = row[0]
        etype = row[1]
        doc_count = row[2]

        # Get the actual entities for this normalized name
        detail_query = (
            select(Entity)
            .where(
                Entity.normalized_name == norm_name,
                Entity.entity_type == etype,
            )
            .order_by(Entity.document_id)
        )
        detail_result = await db.execute(detail_query)
        detail_entities = detail_result.scalars().all()

        # Group by document
        doc_map: dict[str, dict] = {}
        for e in detail_entities:
            doc_id = str(e.document_id)
            if doc_id not in doc_map:
                doc_map[doc_id] = {"document_id": doc_id, "contexts": []}
            if e.context:
                doc_map[doc_id]["contexts"].append(e.context[:200])

        # Get document filenames
        doc_ids = [e.document_id for e in detail_entities]
        if doc_ids:
            doc_query = select(Document.id, Document.filename).where(Document.id.in_(doc_ids))
            doc_result = await db.execute(doc_query)
            doc_names = {str(r[0]): r[1] for r in doc_result.fetchall()}
            for doc_id, info in doc_map.items():
                info["filename"] = doc_names.get(doc_id, "Unknown")

        entities_out.append({
            "normalized_name": norm_name,
            "entity_type": etype,
            "document_count": doc_count,
            "documents": list(doc_map.values()),
        })

    return {"entities": entities_out, "total": len(entities_out)}


@router.get("/timeline/{document_id}")
async def get_timeline(
    document_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """
    Get a timeline of important dates from a document.

    Extracts date entities, parses them, and returns sorted timeline events.
    """
    query = select(Document).where(Document.id == document_id)
    result = await db.execute(query)
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    # Get all date entities for this document
    date_query = (
        select(Entity)
        .where(Entity.document_id == document_id, Entity.entity_type == "date")
        .order_by(Entity.name)
    )
    date_result = await db.execute(date_query)
    date_entities = date_result.scalars().all()

    # Also get related relationships for context
    rel_query = (
        select(Relationship)
        .where(
            Relationship.document_id == document_id,
            Relationship.relationship_type.in_(["effective_date", "expiration_date"]),
        )
    )
    rel_result = await db.execute(rel_query)
    relationships = rel_result.scalars().all()

    # Map entity IDs to relationship context
    rel_context = {}
    for r in relationships:
        rel_context[r.target_entity_id] = r.relationship_type

    # Build timeline events
    import re
    from datetime import datetime as dt

    def try_parse_date(text: str) -> str | None:
        """Try common date formats."""
        text = text.strip()
        for fmt in (
            "%Y-%m-%d", "%m/%d/%Y", "%d/%m/%Y", "%B %d, %Y", "%b %d, %Y",
            "%d %B %Y", "%d %b %Y", "%Y-%m-%dT%H:%M:%S", "%m-%d-%Y",
        ):
            try:
                return dt.strptime(text, fmt).date().isoformat()
            except ValueError:
                continue
        # Try extracting a date-like pattern from text
        match = re.search(r"(\d{4}[-/]\d{1,2}[-/]\d{1,2})", text)
        if match:
            try:
                return dt.strptime(match.group(1).replace("/", "-"), "%Y-%m-%d").date().isoformat()
            except ValueError:
                pass
        match = re.search(r"(\d{1,2}[-/]\d{1,2}[-/]\d{4})", text)
        if match:
            try:
                return dt.strptime(match.group(1).replace("/", "-"), "%m-%d-%Y").date().isoformat()
            except ValueError:
                pass
        return None

    events = []
    for entity in date_entities:
        name_lower = (entity.name or "").lower()
        rel_type = rel_context.get(entity.id, "")

        if "effective" in name_lower or rel_type == "effective_date":
            event_type = "effective"
        elif "expir" in name_lower or "terminat" in name_lower or rel_type == "expiration_date":
            event_type = "expiration"
        elif "renew" in name_lower:
            event_type = "renewal"
        elif "payment" in name_lower or "due" in name_lower:
            event_type = "payment"
        elif "notice" in name_lower:
            event_type = "notice"
        elif "sign" in name_lower or "execut" in name_lower:
            event_type = "execution"
        else:
            event_type = "other"

        if event_type in ("effective", "expiration", "execution"):
            importance = "high"
        elif event_type in ("renewal", "payment"):
            importance = "medium"
        else:
            importance = "low"

        parsed_date = try_parse_date(entity.value or entity.name or "")

        events.append({
            "id": str(entity.id),
            "date": entity.value or entity.name,
            "parsed_date": parsed_date,
            "label": entity.name,
            "type": event_type,
            "context": entity.context,
            "importance": importance,
            "page_number": entity.page_number,
        })

    events.sort(key=lambda e: (
        0 if e["parsed_date"] else 1,
        e["parsed_date"] or "",
    ))

    return {"document_id": str(document_id), "events": events, "total": len(events)}


@router.get("/search/entity")
async def search_entity(
    name: str = Query(..., min_length=2, description="Entity name to search"),
    entity_type: str | None = Query(None, description="Filter by entity type"),
    db: AsyncSession = Depends(get_db),
):
    """
    Search for an entity across all documents.

    Useful for finding which contracts involve a specific party,
    or tracking an entity across the portfolio.
    """
    results = await find_entity_across_documents(name, entity_type, db)

    return {
        "query": name,
        "entity_type": entity_type,
        "results": results,
        "total": len(results),
        "documents_found": len(set(r["document_id"] for r in results)),
    }


# ============================================
# DYNAMIC ROUTES (document-specific)
# ============================================

@router.post("/{document_id}/extract", response_model=ExtractionStatusResponse)
async def trigger_entity_extraction(
    document_id: UUID,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    """
    Trigger entity extraction for a document.

    Extracts parties, dates, amounts, locations, and other entities.
    Also identifies relationships between entities.
    """
    # Verify document exists and is processed
    query = select(Document).where(Document.id == document_id)
    result = await db.execute(query)
    doc = result.scalar_one_or_none()

    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    if doc.status != "completed":
        raise HTTPException(
            status_code=400,
            detail=f"Document must be processed first. Current status: {doc.status}",
        )

    # Check if already extracted
    entity_query = select(func.count(Entity.id)).where(Entity.document_id == document_id)
    entity_result = await db.execute(entity_query)
    entity_count = entity_result.scalar()

    rel_query = select(func.count(Relationship.id)).where(Relationship.document_id == document_id)
    rel_result = await db.execute(rel_query)
    rel_count = rel_result.scalar()

    if entity_count > 0:
        return ExtractionStatusResponse(
            document_id=document_id,
            status="completed",
            entities_found=entity_count,
            relationships_found=rel_count,
            message="Entities already extracted. Use /graph/{id}/reextract to refresh.",
        )

    # Queue background extraction
    background_tasks.add_task(run_entity_extraction, document_id)

    return ExtractionStatusResponse(
        document_id=document_id,
        status="queued",
        entities_found=0,
        relationships_found=0,
        message="Entity extraction started. Check /graph/{id} for results.",
    )


@router.post("/{document_id}/reextract", response_model=ExtractionStatusResponse)
async def reextract_entities(
    document_id: UUID,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    """
    Re-extract entities from a document.

    Deletes existing entities and relationships, then extracts fresh.
    """
    # Verify document exists
    query = select(Document).where(Document.id == document_id)
    result = await db.execute(query)
    doc = result.scalar_one_or_none()

    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    # Queue background extraction (it will delete existing first)
    background_tasks.add_task(run_entity_extraction, document_id)

    return ExtractionStatusResponse(
        document_id=document_id,
        status="queued",
        entities_found=0,
        relationships_found=0,
        message="Re-extraction started. Previous entities will be replaced.",
    )


@router.get("/{document_id}", response_model=GraphResponse)
async def get_graph(
    document_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """
    Get the knowledge graph for a document.

    Returns nodes (entities) and edges (relationships) suitable for visualization.
    """
    # Verify document exists
    query = select(Document).where(Document.id == document_id)
    result = await db.execute(query)
    doc = result.scalar_one_or_none()

    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    graph = await get_document_graph(document_id, db)
    return GraphResponse(**graph)


@router.get("/{document_id}/entities", response_model=list[EntityResponse])
async def get_document_entities(
    document_id: UUID,
    entity_type: str | None = Query(None, description="Filter by entity type"),
    db: AsyncSession = Depends(get_db),
):
    """
    Get all entities extracted from a document.

    Optionally filter by entity type.
    """
    query = select(Entity).where(Entity.document_id == document_id)

    if entity_type:
        query = query.where(Entity.entity_type == entity_type)

    query = query.order_by(Entity.entity_type, Entity.name)
    result = await db.execute(query)
    entities = result.scalars().all()

    return [
        EntityResponse(
            id=e.id,
            document_id=e.document_id,
            entity_type=e.entity_type,
            name=e.name,
            normalized_name=e.normalized_name,
            value=e.value,
            confidence=e.confidence,
            context=e.context,
        )
        for e in entities
    ]


@router.get("/{document_id}/relationships")
async def get_document_relationships(
    document_id: UUID,
    relationship_type: str | None = Query(None, description="Filter by relationship type"),
    db: AsyncSession = Depends(get_db),
):
    """
    Get all relationships in a document's knowledge graph.
    """
    query = select(Relationship).where(Relationship.document_id == document_id)

    if relationship_type:
        query = query.where(Relationship.relationship_type == relationship_type)

    result = await db.execute(query)
    relationships = result.scalars().all()

    # Get entity names for display
    entity_ids = set()
    for r in relationships:
        entity_ids.add(r.source_entity_id)
        entity_ids.add(r.target_entity_id)

    if entity_ids:
        entity_query = select(Entity).where(Entity.id.in_(entity_ids))
        entity_result = await db.execute(entity_query)
        entities = {e.id: e for e in entity_result.scalars().all()}
    else:
        entities = {}

    return {
        "relationships": [
            {
                "id": str(r.id),
                "source_entity": {
                    "id": str(r.source_entity_id),
                    "name": entities[r.source_entity_id].name if r.source_entity_id in entities else None,
                    "type": entities[r.source_entity_id].entity_type if r.source_entity_id in entities else None,
                },
                "target_entity": {
                    "id": str(r.target_entity_id),
                    "name": entities[r.target_entity_id].name if r.target_entity_id in entities else None,
                    "type": entities[r.target_entity_id].entity_type if r.target_entity_id in entities else None,
                },
                "type": r.relationship_type,
                "description": r.description,
                "confidence": r.confidence,
            }
            for r in relationships
        ],
        "total": len(relationships),
    }


async def run_entity_extraction(document_id: UUID):
    """Background task to run entity extraction."""
    from app.core.database import AsyncSessionLocal

    async with AsyncSessionLocal() as db:
        try:
            await extract_entities_from_document(document_id, db)
        except Exception as e:
            print(f"Entity extraction error for {document_id}: {e}")
