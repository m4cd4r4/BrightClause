"""Application configuration."""

from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Application
    app_name: str = "BrightClause"
    environment: str = "development"
    debug: bool = True

    # Auth
    api_key: str = ""  # Set in production; empty = auth disabled

    # CORS
    cors_origins: str = ""  # Comma-separated extra origins (e.g. "https://brightclause.com,https://www.brightclause.com")

    # Database
    database_url: str = "postgresql://brightclause:brightclause_dev@localhost:5433/brightclause"

    # Redis / Celery
    redis_url: str = "redis://localhost:6380/0"
    celery_broker_url: str = "redis://localhost:6380/0"
    celery_result_backend: str = "redis://localhost:6380/0"

    # MinIO (S3-compatible storage)
    minio_endpoint: str = "localhost:9000"
    minio_access_key: str = "brightclause"
    minio_secret_key: str = "brightclause_dev"
    minio_bucket: str = "contracts"
    minio_secure: bool = False  # Use HTTPS in production

    # Ollama
    ollama_url: str = "http://localhost:11435"
    llm_model: str = "llama3.2"
    embedding_model: str = "nomic-embed-text"
    vision_model: str = "llava"  # For OCR Tier 4 (Pixtral alternative)

    # Anthropic Claude API (optional — used for explain/obligations when set)
    anthropic_api_key: str = ""

    # File upload
    max_file_size: int = 50 * 1024 * 1024  # 50MB

    # Chunking (optimized for legal documents)
    # ~1500 tokens ≈ 6000 characters for legal text
    chunk_size: int = 6000
    chunk_overlap: int = 600

    # OCR Settings
    ocr_confidence_threshold: float = 0.80  # Below this, try next tier
    ocr_dpi: int = 300  # DPI for PDF to image conversion
    tesseract_lang: str = "eng"  # Tesseract language

    class Config:
        env_file = ".env"


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()
