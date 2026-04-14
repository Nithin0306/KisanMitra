"""
Pydantic BaseSettings — reads all configuration from environment variables.
All secrets (API keys, DB URLs) must be set via .env or deployment env; never hard-coded.
"""

from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field
from typing import List


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    #  App 
    ENV: str = Field("development", description="development | staging | production")
    ALLOWED_ORIGINS: List[str] = Field(
        default=["*"],
        description="CORS allowed origins — restrict in production",
    )

    #  Redis 
    REDIS_URL: str = Field("redis://localhost:6379/0")

    #  PostgreSQL 
    DATABASE_URL: str = Field(
        "postgresql+asyncpg://kisan:kisan@localhost:5432/kisanmitra",
    )

    #  Vertex AI (Gemini) 
    GCP_PROJECT_ID: str = Field("", description="GCP project for Vertex AI")
    GCP_REGION: str = Field("asia-south1", description="Vertex AI region")
    LLM_MODEL: str = Field("gemini-1.5-flash", description="Vertex AI model name")
    LLM_PROVIDER: str = Field("vertex_ai", description="vertex_ai | openai | anthropic | ollama")

    #  Open-Meteo (free, no key required) 
    OPEN_METEO_BASE_URL: str = Field("https://api.open-meteo.com/v1/forecast")

    #  Agmarknet 
    AGMARKNET_BASE_URL: str = Field("https://agmarknet.gov.in/SearchCmmMkt.aspx")
    AGMARKNET_API_KEY: str = Field("", description="data.gov.in resource API key")

    #  Timeouts (seconds) 
    TIMEOUT_OPEN_METEO: float = 3.0
    TIMEOUT_AGMARKNET: float = 5.0
    TIMEOUT_VERTEX_AI: float = 8.0

    #  STT confidence threshold 
    STT_CONFIDENCE_THRESHOLD: float = 0.65

    #  Cache TTLs (seconds) 
    CACHE_TTL_WEATHER: int = 10_800      # 3 hours
    CACHE_TTL_MARKET: int = 3_600        # 1 hour
    CACHE_TTL_STALE_WEATHER: int = 86_400   # 24 hours
    CACHE_TTL_STALE_MARKET: int = 21_600    # 6 hours


settings = Settings()
