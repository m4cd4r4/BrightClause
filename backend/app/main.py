"""BrightClause FastAPI application."""

from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from app.core.config import get_settings
from app.core.database import engine, Base
from app.api import documents_router, search_router, health_router, analysis_router, graph_router, chat_router, activity_router, deals_router
from app.core.auth import verify_api_key

# Import models so they're registered with Base
from app.models import document  # noqa: F401
from app.models import knowledge_graph  # noqa: F401
from app.models import activity  # noqa: F401

settings = get_settings()


async def init_database():
    """Initialize database with pgvector extension and tables."""
    async with engine.begin() as conn:
        # Enable pgvector extension
        await conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
        # Create all tables
        await conn.run_sync(Base.metadata.create_all)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events."""
    # Startup
    print(f"Starting {settings.app_name} in {settings.environment} mode")
    await init_database()
    print("Database initialized with pgvector extension")
    yield
    # Shutdown
    print(f"Shutting down {settings.app_name}")


app = FastAPI(
    title="BrightClause API",
    description="AI-powered contract analysis for M&A due diligence",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS middleware – tightened for production
allowed_origins = [
    "https://frontend-jade-seven-48.vercel.app",
    "http://localhost:3000",
]
if settings.cors_origins:
    allowed_origins.extend(o.strip() for o in settings.cors_origins.split(",") if o.strip())
if settings.environment == "development":
    allowed_origins.append("*")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers (health is public; all others require API key)
app.include_router(health_router)
app.include_router(documents_router, dependencies=[Depends(verify_api_key)])
app.include_router(search_router, dependencies=[Depends(verify_api_key)])
app.include_router(analysis_router, dependencies=[Depends(verify_api_key)])
app.include_router(graph_router, dependencies=[Depends(verify_api_key)])
app.include_router(chat_router, dependencies=[Depends(verify_api_key)])
app.include_router(activity_router, dependencies=[Depends(verify_api_key)])
app.include_router(deals_router, dependencies=[Depends(verify_api_key)])


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "name": "BrightClause API",
        "version": "0.1.0",
        "status": "running",
        "docs": "/docs",
    }
