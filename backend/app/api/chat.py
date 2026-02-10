"""Contract Q&A Chat API using RAG (Retrieval-Augmented Generation)."""

import httpx
from uuid import UUID
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.config import get_settings
from app.core.database import get_db
from app.services.hybrid_search import hybrid_search
from app.api.activity import log_activity

settings = get_settings()
router = APIRouter(prefix="/chat", tags=["chat"])


class ChatMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str


class ChatRequest(BaseModel):
    question: str
    history: list[ChatMessage] = []


class SourceChunk(BaseModel):
    chunk_id: str
    content: str
    page_number: int | None
    score: float


class ChatResponse(BaseModel):
    answer: str
    sources: list[SourceChunk]


CHAT_SYSTEM_PROMPT = """You are a helpful contract analyst. Answer the user's question based ONLY on the contract content provided below. If the answer is not in the contract, say so clearly.

Guidelines:
- Be specific and reference exact sections or page numbers when possible
- Use plain English that anyone can understand
- If a clause has risks or concerns, mention them
- Keep answers concise but thorough
- Format your response with markdown for readability"""


def _build_context(chunks: list) -> str:
    """Build context string from retrieved chunks."""
    parts = []
    for i, chunk in enumerate(chunks, 1):
        page_info = f" (Page {chunk.page_number})" if chunk.page_number else ""
        parts.append(f"[Excerpt {i}{page_info}]:\n{chunk.content[:1500]}")
    return "\n\n---\n\n".join(parts)


def _build_history(history: list[ChatMessage]) -> str:
    """Build conversation history string."""
    if not history:
        return ""
    lines = []
    for msg in history[-6:]:  # Last 3 exchanges max
        role = "User" if msg.role == "user" else "Assistant"
        lines.append(f"{role}: {msg.content}")
    return "\n".join(lines)


@router.post("/{document_id}", response_model=ChatResponse)
async def chat_with_document(
    document_id: UUID,
    request: ChatRequest,
    db: AsyncSession = Depends(get_db),
):
    """Ask a question about a specific document using RAG."""
    if not request.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty")

    # 1. Retrieve relevant chunks via hybrid search
    search_results = await hybrid_search(
        query=request.question,
        db=db,
        limit=5,
        document_id=document_id,
        semantic_weight=0.8,
        keyword_weight=0.2,
        min_similarity=0.2,
    )

    if not search_results:
        return ChatResponse(
            answer="I couldn't find relevant content in this document to answer your question. "
                   "This may mean the document hasn't been fully processed yet, or the question "
                   "isn't related to the document's content.",
            sources=[],
        )

    # 2. Build prompt with context
    context = _build_context(search_results)
    history = _build_history(request.history)

    prompt = f"""{CHAT_SYSTEM_PROMPT}

CONTRACT EXCERPTS:
{context}

{f"CONVERSATION HISTORY:{chr(10)}{history}{chr(10)}" if history else ""}
USER QUESTION: {request.question}

Answer:"""

    # 3. Call Ollama for generation
    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
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

            if response.status_code != 200:
                raise HTTPException(
                    status_code=502,
                    detail="AI service temporarily unavailable",
                )

            data = response.json()
            answer = data.get("response", "").strip()

            if not answer:
                answer = "I wasn't able to generate a response. Please try rephrasing your question."

    except httpx.TimeoutException:
        raise HTTPException(
            status_code=504,
            detail="AI service timed out. Please try a simpler question.",
        )
    except httpx.ConnectError:
        raise HTTPException(
            status_code=502,
            detail="AI service is not available. Please try again later.",
        )

    # 4. Return answer with source chunks
    sources = [
        SourceChunk(
            chunk_id=str(r.chunk_id),
            content=r.content[:300] + "..." if len(r.content) > 300 else r.content,
            page_number=r.page_number,
            score=round(r.combined_score, 4),
        )
        for r in search_results[:3]  # Top 3 sources
    ]

    await log_activity(db, "chat_question", document_id, {"question": request.question[:200]})

    return ChatResponse(answer=answer, sources=sources)
