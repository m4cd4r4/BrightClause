"""Contract Q&A Chat API using RAG (Retrieval-Augmented Generation)."""

import httpx
from uuid import UUID
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.config import get_settings
from app.core.database import get_db
from app.core.rate_limit import limiter
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


def _build_messages(context: str, history: list[ChatMessage], question: str) -> list[dict]:
    """Build Claude messages list with context in the first user turn."""
    messages = []

    # Seed context into the first user message
    first_user = f"CONTRACT EXCERPTS:\n{context}\n\nQUESTION: "

    if not history:
        messages.append({"role": "user", "content": first_user + question})
        return messages

    # Prepend context to the oldest user message in history
    for i, msg in enumerate(history[-6:]):
        if i == 0 and msg.role == "user":
            messages.append({"role": "user", "content": first_user + msg.content})
        else:
            messages.append({"role": msg.role, "content": msg.content})

    messages.append({"role": "user", "content": question})
    return messages


async def _call_claude(context: str, history: list[ChatMessage], question: str) -> str:
    """Call Claude Haiku via Anthropic API."""
    messages = _build_messages(context, history, question)
    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.post(
            "https://api.anthropic.com/v1/messages",
            headers={
                "x-api-key": settings.anthropic_api_key,
                "anthropic-version": "2023-06-01",
                "content-type": "application/json",
            },
            json={
                "model": "claude-haiku-4-5-20251001",
                "max_tokens": 1024,
                "system": CHAT_SYSTEM_PROMPT,
                "messages": messages,
            },
        )
        if response.status_code != 200:
            raise HTTPException(status_code=502, detail="AI service temporarily unavailable")
        return response.json()["content"][0]["text"].strip()


async def _call_ollama(context: str, history: list[ChatMessage], question: str) -> str:
    """Call local Ollama — fallback for development."""
    history_str = ""
    if history:
        lines = [
            f"{'User' if m.role == 'user' else 'Assistant'}: {m.content}"
            for m in history[-6:]
        ]
        history_str = "\n".join(lines) + "\n\n"

    prompt = (
        f"{CHAT_SYSTEM_PROMPT}\n\nCONTRACT EXCERPTS:\n{context}\n\n"
        f"{history_str}USER QUESTION: {question}\n\nAnswer:"
    )

    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.post(
            f"{settings.ollama_url}/api/generate",
            json={
                "model": settings.llm_model,
                "prompt": prompt,
                "stream": False,
                "options": {"temperature": 0.3, "num_predict": 1024},
            },
        )
        if response.status_code != 200:
            raise HTTPException(status_code=502, detail="AI service temporarily unavailable")
        answer = response.json().get("response", "").strip()
        return answer or "I wasn't able to generate a response. Please try rephrasing your question."


@router.post("/{document_id}", response_model=ChatResponse)
@limiter.limit("30/minute")
async def chat_with_document(
    request: Request,
    document_id: UUID,
    chat_request: ChatRequest,
    db: AsyncSession = Depends(get_db),
):
    """Ask a question about a specific document using RAG."""
    if not chat_request.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty")

    # 1. Retrieve relevant chunks via hybrid search
    search_results = await hybrid_search(
        query=chat_request.question,
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

    # 2. Build context from retrieved chunks
    context = _build_context(search_results)

    # 3. Generate answer — Claude Haiku if API key set, else Ollama
    try:
        if settings.anthropic_api_key:
            answer = await _call_claude(context, chat_request.history, chat_request.question)
        else:
            answer = await _call_ollama(context, chat_request.history, chat_request.question)
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="AI service timed out. Please try a simpler question.")
    except httpx.ConnectError:
        raise HTTPException(status_code=502, detail="AI service is not available. Please try again later.")

    # 4. Return answer with source chunks
    sources = [
        SourceChunk(
            chunk_id=str(r.chunk_id),
            content=r.content[:300] + "..." if len(r.content) > 300 else r.content,
            page_number=r.page_number,
            score=round(r.combined_score, 4),
        )
        for r in search_results[:3]
    ]

    await log_activity(db, "chat_question", document_id, {"question": chat_request.question[:200]})

    return ChatResponse(answer=answer, sources=sources)
