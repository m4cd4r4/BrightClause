# BrightClause

<div align="center">

**AI-Powered Contract Intelligence**

[![Next.js](https://img.shields.io/badge/Next.js-14.1-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.109-009688?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16%20+%20pgvector-336791?style=flat-square&logo=postgresql)](https://www.postgresql.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Playwright](https://img.shields.io/badge/E2E_Tests-Playwright-45ba4b?style=flat-square&logo=playwright)](https://playwright.dev/)

[Live Demo](https://brightclause.com) | [API Docs](http://45.77.233.102:8002/docs) | [Quick Start](#quick-start)

<img src="docs/demo-preview.gif" alt="BrightClause Demo" width="800" />

</div>

---

## Overview

BrightClause transforms contract review from weeks to minutes. Upload PDFs, extract key clauses with AI, assess risk levels, compare documents side-by-side, and explore entity relationships through an interactive knowledge graph. Enhanced reading and analysis for any commercial contract.

**Part of the Lens Suite** &mdash; BrightClause &middot; TaxLens &middot; PetLens

### Key Capabilities

| Feature | Description |
|---------|-------------|
| **4-Tier OCR** | PyMuPDF, Tesseract, PaddleOCR, Vision LLM fallback |
| **Clause Extraction** | 16+ clause types with AI-powered risk scoring |
| **BYOK Extraction** | Bring Your Own Anthropic API key — upload any document and extract clauses on demand |
| **Contract Q&A Chat** | RAG-powered chat — ask questions about any document in natural language |
| **Plain-English Translator** | One-click clause explanation in simple, non-legal language |
| **Executive Reports** | AI-generated executive summaries with risk overview and recommendations |
| **Timeline Extraction** | Automatic extraction and visualization of key contract dates |
| **Cross-Document Entities** | Entity resolution across your entire document portfolio |
| **Obligation Tracker** | AI extracts obligations, parties, and deadlines with status tracking |
| **Deal Grouping** | Group contracts into deals for aggregate risk analysis |
| **Knowledge Graph** | Entity extraction with interactive relationship visualization |
| **Hybrid Search** | Semantic + keyword search with configurable weights |
| **Risk Assessment** | 4-level scoring (Critical, High, Medium, Low) |
| **Document Comparison** | Side-by-side risk and clause comparison matrix |
| **PDF Viewer** | In-app PDF display with clause navigation sidebar |
| **Dark/Light Mode** | Full theme toggle with localStorage persistence |
| **Activity Feed** | Audit log tracking uploads, analysis, chat, and exports |
| **Multi-Format Export** | Excel, Word, PDF, CSV, JSON |

---

## Architecture

```mermaid
graph TD
    subgraph FE["Frontend (Next.js 14)"]
        Landing["Landing Page"]
        Dashboard["Dashboard + Activity"]
        DocDetail["Document Detail + Chat"]
        Compare["Compare Matrix"]
        Analytics["Analytics + CrossRef"]
        Search["Search"]
        Obligations["Obligations"]
        Deals["Deals"]
        KG["Knowledge Graph Viz"]
    end

    FE -->|"/api/* proxy\nno mixed-content, API key server-side"| BE

    subgraph BE["Backend API (FastAPI)"]
        DocsAPI["Documents API"]
        SearchAPI["Search API"]
        AnalysisAPI["Analysis API"]
        ChatAPI["Chat (RAG)"]
        GraphAPI["Graph API"]
        DealsAPI["Deals API"]
        ActivityAPI["Activity API"]
        ObligationAPI["Obligation Extraction"]
    end

    BE --> PG["PostgreSQL + pgvector\n768-dim vectors"]
    BE --> MinIO["MinIO (Storage)\nS3-compatible"]
    BE --> LLM["Ollama / Claude\nllama3.2 / BYOK"]

    PG --> Redis["Redis (Queue)"]
    Redis --> Celery["Celery (Workers)"]
```

---

## Document Processing Pipeline

```
Upload PDF
    │
    ▼
┌────────────────────────────────────────────┐
│  4-Tier OCR Pipeline                       │
│  ├─ Tier 0: PyMuPDF (native text)          │
│  ├─ Tier 1: Tesseract (clean scans)        │
│  ├─ Tier 2: PaddleOCR (complex layouts)    │
│  └─ Tier 3: Vision LLM (handwriting)       │
└────────────────────────────────────────────┘
    │
    ▼
┌────────────────────────────────────────────┐
│  Chunking (6000 chars, 600 overlap)        │
│  Semantic boundary preservation            │
└────────────────────────────────────────────┘
    │
    ▼
┌────────────────────────────────────────────┐
│  Vector Embeddings (nomic-embed-text)      │
│  768 dimensions, IVFFlat indexing          │
└────────────────────────────────────────────┘
    │
    ├──────────────────────┐
    ▼                      ▼
┌───────────────┐   ┌───────────────┐
│    Clause     │   │    Entity     │
│  Extraction   │   │  Extraction   │
│  (16+ types)  │   │  (7 types)    │
└───────────────┘   └───────────────┘
    │                      │
    ▼                      ▼
┌───────────────┐   ┌───────────────┐
│     Risk      │   │   Knowledge   │
│  Assessment   │   │     Graph     │
└───────────────┘   └───────────────┘
```

---

## Tech Stack

### Backend
| Technology | Purpose |
|------------|---------|
| **FastAPI** | Async Python web framework |
| **PostgreSQL + pgvector** | Vector database for semantic search |
| **SQLAlchemy 2.0** | Async ORM with eager loading |
| **Celery + Redis** | Background task processing |
| **MinIO** | S3-compatible object storage |
| **Ollama** | Local LLM inference (llama3.2, nomic-embed-text) |
| **Claude API (BYOK)** | Per-request Anthropic API key for cloud-quality extraction without server-side cost |

### Frontend
| Technology | Purpose |
|------------|---------|
| **Next.js 14** | React framework with App Router |
| **TypeScript** | Type safety |
| **TailwindCSS** | Utility-first styling with custom ink/accent palette |
| **Framer Motion** | Page transitions & entrance animations |
| **Playwright** | Cross-browser E2E testing (Chrome, Firefox, WebKit) |

---

## Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 18+
- 8GB RAM minimum (for Ollama)

### 1. Clone & Start Services

```bash
git clone https://github.com/m4cd4r4/BrightClause.git
cd BrightClause

# Start all backend services
docker-compose up -d

# Pull required Ollama models
docker exec clauselens-ollama ollama pull llama3.2
docker exec clauselens-ollama ollama pull nomic-embed-text
```

### 2. Start Frontend

```bash
cd frontend
npm install
npm run dev
```

### 3. Access

| Service | URL |
|---------|-----|
| Frontend (local) | http://localhost:3000 |
| Frontend (prod) | https://brightclause.com |
| API Docs (local) | http://localhost:8002/docs |
| API (prod) | http://45.77.233.102:8002 |
| MinIO Console | http://localhost:9001 |

---

## API Reference

### Documents API

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/documents/upload` | Upload PDF contract |
| `GET` | `/documents` | List all documents |
| `GET` | `/documents/{id}` | Get document details |
| `GET` | `/documents/{id}/download-url` | Presigned PDF download URL |
| `PATCH` | `/documents/{id}` | Rename document |
| `DELETE` | `/documents/{id}` | Delete document |
| `GET` | `/documents/{id}/chunks` | Get text chunks |

### Chat API (RAG)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/chat/{id}` | Ask a question about a document |

Accepts `question` and `history` array. Returns AI answer with source chunk citations.

### Search API

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/search?q={query}` | Hybrid semantic + keyword search |
| `GET` | `/search/stats` | Index statistics |

**Parameters:** `limit`, `mode` (hybrid/semantic/keyword), `document_id`, `semantic_weight`

### Analysis API

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/analysis/{id}/extract` | Trigger clause extraction (optional body: `{"claude_api_key": "sk-ant-..."}`) |
| `POST` | `/analysis/{id}/report` | Generate AI executive summary |
| `POST` | `/analysis/{id}/clauses/{clause_id}/explain` | Plain-English clause explanation |
| `POST` | `/analysis/{id}/obligations/extract` | AI obligation extraction |
| `GET` | `/analysis/{id}/obligations` | List obligations for document |
| `GET` | `/analysis/obligations/all` | Cross-document obligation list |
| `GET` | `/analysis/{id}/summary` | Get risk summary |
| `GET` | `/analysis/{id}/clauses` | Get extracted clauses (with page numbers) |
| `GET` | `/analysis/clause-types` | List clause types |

**BYOK Extraction:** Pass `claude_api_key` in the request body to use Claude (Haiku) instead of the local Ollama model. The key is never stored server-side — it is used only for the duration of the request.

```bash
curl -X POST http://localhost:8002/analysis/{id}/extract \
  -H "Content-Type: application/json" \
  -d '{"claude_api_key": "sk-ant-api03-..."}'
```

### Knowledge Graph API

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/graph/{id}/extract` | Trigger entity extraction |
| `GET` | `/graph/{id}` | Get graph nodes & edges |
| `GET` | `/graph/{id}/entities` | Get entities by type |
| `GET` | `/graph/{id}/timeline` | Extract timeline events |
| `GET` | `/graph/cross-reference` | Cross-document entity resolution |
| `GET` | `/graph/stats` | Graph statistics |
| `GET` | `/graph/types` | Entity & relationship types |

### Deals API

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/deals` | Create a deal |
| `GET` | `/deals` | List all deals |
| `GET` | `/deals/{id}` | Deal detail with aggregate risk |
| `POST` | `/deals/{id}/documents` | Add documents to deal |
| `DELETE` | `/deals/{id}/documents/{doc_id}` | Remove document from deal |
| `POST` | `/deals/{id}/upload` | Batch upload to deal |
| `DELETE` | `/deals/{id}` | Delete deal |

### Activity API

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/activity` | Recent activity feed (audit log) |

---

## Clause Types & Risk Assessment

### Supported Clause Types

| Category | Types |
|----------|-------|
| **Deal Terms** | Change of Control, Assignment, Exclusivity |
| **IP & Data** | IP Ownership, Confidentiality, Data Privacy |
| **Liability** | Indemnification, Limitation of Liability, Warranty |
| **Term** | Termination, Renewal, Notice Periods |
| **Competition** | Non-Compete, Non-Solicitation |
| **Financial** | Payment Terms, Audit Rights, Insurance |
| **Compliance** | Governing Law, Dispute Resolution, Force Majeure |

### Risk Levels

| Level | Color | Trigger Examples |
|-------|-------|------------------|
| **Critical** | Red | Automatic termination, uncapped liability, IP transfer |
| **High** | Orange | Consent required, gross negligence, material restrictions |
| **Medium** | Amber | 30-day notice, standard indemnification |
| **Low** | Green | Market-standard terms, reasonable limitations |

---

## Project Structure

```
BrightClause/
├── backend/
│   ├── app/
│   │   ├── api/                  # Route handlers
│   │   │   ├── documents.py      # Upload, list, download, delete
│   │   │   ├── search.py         # Hybrid vector search
│   │   │   ├── analysis.py       # Extraction, reports, obligations
│   │   │   ├── graph.py          # Knowledge graph, timeline, cross-ref
│   │   │   ├── chat.py           # RAG Q&A
│   │   │   ├── deals.py          # Deal management
│   │   │   ├── activity.py       # Audit log
│   │   │   └── health.py
│   │   ├── core/                 # Config, database, auth
│   │   ├── models/               # SQLAlchemy models
│   │   │   ├── document.py       # Document, Chunk, Clause, Obligation, Deal
│   │   │   ├── knowledge_graph.py # Entity, Relationship
│   │   │   └── activity.py       # Activity audit log
│   │   ├── services/             # Business logic
│   │   │   ├── ocr_pipeline.py   # 4-tier OCR
│   │   │   ├── pdf_extractor.py  # PDF text extraction
│   │   │   ├── chunking.py       # Semantic chunking
│   │   │   ├── embeddings.py     # Vector embeddings
│   │   │   ├── clause_extraction.py
│   │   │   ├── entity_extraction.py
│   │   │   ├── hybrid_search.py  # Semantic + keyword
│   │   │   └── storage.py        # MinIO file storage
│   │   ├── tasks/                # Celery async tasks
│   │   ├── main.py               # FastAPI entry point
│   │   └── worker.py             # Celery worker
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx                      # Landing page
│   │   │   ├── hero-visual.tsx               # Animated product mockup
│   │   │   ├── layout.tsx                    # Root layout + ThemeProvider
│   │   │   ├── providers.tsx                 # Context providers
│   │   │   ├── error.tsx                     # Error boundary
│   │   │   ├── dashboard/page.tsx            # Document management + activity feed
│   │   │   ├── search/page.tsx               # Hybrid search
│   │   │   ├── compare/page.tsx              # Side-by-side comparison
│   │   │   ├── analytics/page.tsx            # Portfolio analytics + cross-ref
│   │   │   ├── obligations/page.tsx          # Obligation & deadline tracker
│   │   │   ├── deals/page.tsx                # Deal list
│   │   │   ├── deals/[id]/page.tsx           # Deal detail + aggregate risk
│   │   │   ├── documents/[id]/page.tsx       # Document detail + clauses
│   │   │   ├── documents/[id]/chat-panel.tsx # RAG Q&A sidebar
│   │   │   ├── documents/[id]/pdf-viewer.tsx # PDF viewer + clause nav
│   │   │   ├── documents/[id]/timeline.tsx   # Timeline visualization
│   │   │   ├── documents/[id]/graph/page.tsx # Knowledge graph
│   │   │   └── api/[...path]/route.ts        # Backend proxy
│   │   └── lib/
│   │       ├── api.ts                        # Typed API client
│   │       ├── risk.ts                       # Centralized risk utilities
│   │       ├── toast.tsx                     # Toast notification system
│   │       ├── navigation.tsx                # Shared navigation (7 routes)
│   │       ├── theme.tsx                     # Dark/light mode provider
│   │       ├── walkthrough.tsx               # Guided onboarding
│   │       ├── export.ts                     # Export (Excel/Word/PDF/CSV/JSON)
│   │       └── export-lazy.ts                # Lazy-loaded export deps
│   ├── tests/
│   │   ├── dashboard.spec.ts
│   │   ├── document-detail.spec.ts
│   │   └── knowledge-graph.spec.ts
│   └── next.config.js
├── docker-compose.yml
├── docs/
│   └── DEMO.md
└── README.md
```

---

## Design System

### Colors

| Token | Value | Usage |
|-------|-------|-------|
| `ink-950` | `#0a0a0b` | Background |
| `ink-900` | `#18181b` | Cards, surfaces |
| `accent` | `#c9a227` | Legal gold (primary actions) |
| `critical` | `#ef4444` | Red &mdash; Critical risk |
| `high` | `#f97316` | Orange &mdash; High risk |
| `medium` | `#f59e0b` | Amber &mdash; Medium risk |
| `low` | `#10b981` | Emerald &mdash; Low risk |

### Typography

| Font | Usage |
|------|-------|
| **Cormorant Garamond** | Display headings |
| **DM Sans** | Body text |
| **JetBrains Mono** | Code, data labels, clause references |

---

## Development

### Run Tests

```bash
cd frontend

# Run all E2E tests
npx playwright test

# With Playwright UI
npx playwright test --ui

# Headed mode (visible browser)
npx playwright test --headed
```

### Environment Variables

```bash
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/brightclause

# Redis
REDIS_URL=redis://localhost:6379/0

# MinIO
MINIO_ENDPOINT=localhost:9000
MINIO_ACCESS_KEY=brightclause
MINIO_SECRET_KEY=brightclause_dev

# Ollama
OLLAMA_URL=http://localhost:11434
LLM_MODEL=llama3.2
EMBEDDING_MODEL=nomic-embed-text

# Processing
CHUNK_SIZE=6000
CHUNK_OVERLAP=600
MAX_FILE_SIZE=52428800

# Optional: Anthropic Claude API (for server-side extraction without BYOK)
# Leave blank to use Ollama for all LLM inference (free, self-hosted)
ANTHROPIC_API_KEY=
```

---

## Demo Data

Public contract datasets for testing:
- [CUAD Dataset](https://github.com/TheAtticusProject/cuad) - 13K labeled clauses
- [SEC EDGAR](https://www.sec.gov/cgi-bin/browse-edgar) - Public commercial filings
- [MAUD Dataset](https://www.mauldataset.org/) - 152 labeled agreements

---

## Roadmap

### Completed
- [x] PDF upload with 4-tier OCR pipeline
- [x] Clause extraction with risk scoring (16+ clause types)
- [x] Knowledge graph visualization (interactive canvas with zoom/pan/filters)
- [x] Hybrid semantic + keyword search
- [x] E2E test suite with Playwright (Chrome, Firefox, WebKit)
- [x] Production deployment (Vercel frontend + VPS backend)
- [x] Celery async job processing for extraction
- [x] Export to Excel, Word, PDF, CSV, JSON
- [x] Document comparison matrix (side-by-side risk & clause diff)
- [x] Portfolio analytics dashboard
- [x] API proxy layer (hidden backend, server-side API key)
- [x] Animated hero visual with product mockup
- [x] Guided walkthrough & onboarding
- [x] Drag-and-drop upload with inline rename
- [x] Centralized risk utilities & toast notifications
- [x] Clause source tracking (page number & chunk index)
- [x] Contract Q&A Chat (RAG with source citations)
- [x] Plain-English clause translator
- [x] AI executive summary report generation
- [x] Timeline extraction and visualization
- [x] Cross-document entity resolution
- [x] Dark/light mode with theme toggle
- [x] Activity feed / audit log
- [x] Obligation & deadline tracker
- [x] Deal grouping with aggregate risk analysis
- [x] In-app PDF viewer with clause navigation
- [x] BYOK (Bring Your Own Key) — Claude API extraction per-request, key stored in sessionStorage only

### Planned
- [ ] Browser-only privacy mode (pdf.js + WebLLM, no server required)
- [ ] Custom extraction templates
- [ ] Playbook compliance checking
- [ ] Multi-user auth & role-based access

---

## License

MIT License - See [LICENSE](./LICENSE) for details.

---

## Author

**Macdara** &mdash; [GitHub](https://github.com/m4cd4r4)

Built with enterprise-grade engineering practices to demonstrate production AI/ML systems.
