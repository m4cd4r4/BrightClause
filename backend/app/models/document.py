"""Document models for contract storage."""

from datetime import datetime
from typing import Optional
from uuid import UUID, uuid4
from sqlalchemy import String, Integer, Float, Text, ForeignKey, DateTime, func, Table, Column
from sqlalchemy.dialects.postgresql import UUID as PgUUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from pgvector.sqlalchemy import Vector
from app.core.database import Base

# Many-to-many association table for deals and documents
deal_documents = Table(
    "deal_documents",
    Base.metadata,
    Column("deal_id", PgUUID(as_uuid=True), ForeignKey("deals.id", ondelete="CASCADE"), primary_key=True),
    Column("document_id", PgUUID(as_uuid=True), ForeignKey("documents.id", ondelete="CASCADE"), primary_key=True),
)


class Document(Base):
    """Uploaded contract document."""

    __tablename__ = "documents"

    id: Mapped[UUID] = mapped_column(
        PgUUID(as_uuid=True), primary_key=True, default=uuid4
    )
    filename: Mapped[str] = mapped_column(String(255), nullable=False)
    file_path: Mapped[str] = mapped_column(String(500), nullable=False)
    file_size: Mapped[Optional[int]] = mapped_column(Integer)
    file_type: Mapped[Optional[str]] = mapped_column(String(50))
    page_count: Mapped[Optional[int]] = mapped_column(Integer)
    status: Mapped[str] = mapped_column(String(50), default="pending")
    uploaded_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    processed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    doc_metadata: Mapped[dict] = mapped_column(JSONB, default=dict, name="metadata")

    # Relationships
    chunks: Mapped[list["Chunk"]] = relationship(
        back_populates="document", cascade="all, delete-orphan"
    )
    clauses: Mapped[list["Clause"]] = relationship(
        back_populates="document", cascade="all, delete-orphan"
    )
    entities: Mapped[list["Entity"]] = relationship(
        back_populates="document", cascade="all, delete-orphan"
    )
    obligations: Mapped[list["Obligation"]] = relationship(
        back_populates="document", cascade="all, delete-orphan"
    )
    deals: Mapped[list["Deal"]] = relationship(
        secondary=deal_documents, back_populates="documents"
    )


class Deal(Base):
    """A deal or project grouping multiple documents."""

    __tablename__ = "deals"

    id: Mapped[UUID] = mapped_column(
        PgUUID(as_uuid=True), primary_key=True, default=uuid4
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    # Relationships
    documents: Mapped[list["Document"]] = relationship(
        secondary=deal_documents, back_populates="deals"
    )


class Chunk(Base):
    """Document chunk with vector embedding."""

    __tablename__ = "chunks"

    id: Mapped[UUID] = mapped_column(
        PgUUID(as_uuid=True), primary_key=True, default=uuid4
    )
    document_id: Mapped[UUID] = mapped_column(
        PgUUID(as_uuid=True), ForeignKey("documents.id", ondelete="CASCADE")
    )
    content: Mapped[str] = mapped_column(Text, nullable=False)
    chunk_index: Mapped[int] = mapped_column(Integer, nullable=False)
    page_number: Mapped[Optional[int]] = mapped_column(Integer)
    embedding = mapped_column(Vector(768))  # nomic-embed-text dimension
    chunk_metadata: Mapped[dict] = mapped_column(JSONB, default=dict, name="metadata")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    # Relationships
    document: Mapped["Document"] = relationship(back_populates="chunks")
    clauses: Mapped[list["Clause"]] = relationship(back_populates="chunk")


class Clause(Base):
    """Extracted contract clause."""

    __tablename__ = "clauses"

    id: Mapped[UUID] = mapped_column(
        PgUUID(as_uuid=True), primary_key=True, default=uuid4
    )
    document_id: Mapped[UUID] = mapped_column(
        PgUUID(as_uuid=True), ForeignKey("documents.id", ondelete="CASCADE")
    )
    chunk_id: Mapped[Optional[UUID]] = mapped_column(
        PgUUID(as_uuid=True), ForeignKey("chunks.id", ondelete="CASCADE")
    )
    clause_type: Mapped[str] = mapped_column(String(100), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    summary: Mapped[Optional[str]] = mapped_column(Text)
    risk_level: Mapped[Optional[str]] = mapped_column(String(20))
    confidence: Mapped[Optional[float]] = mapped_column(Float)
    clause_metadata: Mapped[dict] = mapped_column(JSONB, default=dict, name="metadata")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    # Relationships
    document: Mapped["Document"] = relationship(back_populates="clauses")
    chunk: Mapped[Optional["Chunk"]] = relationship(back_populates="clauses")


class Obligation(Base):
    """Extracted obligation or deadline from a contract."""

    __tablename__ = "obligations"

    id: Mapped[UUID] = mapped_column(
        PgUUID(as_uuid=True), primary_key=True, default=uuid4
    )
    document_id: Mapped[UUID] = mapped_column(
        PgUUID(as_uuid=True), ForeignKey("documents.id", ondelete="CASCADE")
    )
    clause_id: Mapped[Optional[UUID]] = mapped_column(
        PgUUID(as_uuid=True), ForeignKey("clauses.id", ondelete="SET NULL"), nullable=True
    )
    description: Mapped[str] = mapped_column(Text, nullable=False)
    responsible_party: Mapped[Optional[str]] = mapped_column(String(200))
    due_date: Mapped[Optional[str]] = mapped_column(String(100))
    obligation_type: Mapped[str] = mapped_column(
        String(50), default="general"
    )  # payment, delivery, notification, compliance, reporting, general
    status: Mapped[str] = mapped_column(String(20), default="pending")  # pending, completed, overdue
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    # Relationships
    document: Mapped["Document"] = relationship(back_populates="obligations")
    clause: Mapped[Optional["Clause"]] = relationship()
