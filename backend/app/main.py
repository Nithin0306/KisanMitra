"""
KisanMitra FastAPI application factory.

Startup sequence:
  1. Configure structured logging
  2. Connect Redis (cache + stale fallback layer)
  3. Connect PostgreSQL (scheme data, future farmer profiles)
  4. Load static rule files into app.state (crop_rules, seasonal_calendar, risk_thresholds)
  5. Warm scheme in-memory cache from scheme_rules.json

All five components must be healthy for /health to return "healthy".
If Redis or PostgreSQL fails to connect, the server still starts but /health shows "degraded".
"""

from contextlib import asynccontextmanager

import structlog
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.core.logging import configure_logging
from app.core.redis_client import get_redis_pool, close_redis_pool
from app.core.db import init_db
from app.routes import crop, market, scheme, query, health

log = structlog.get_logger()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup: connect Redis, warm caches. Shutdown: close connections."""
    configure_logging()
    log.info("kisanmitra.startup", env=settings.ENV)

    # 1. Redis — non-fatal: server starts even if Redis is down (degraded mode)
    try:
        await get_redis_pool()
    except Exception as exc:
        log.warning("kisanmitra.redis_unavailable", error=str(exc))

    # 2. PostgreSQL — non-fatal for MVP (scheme data loaded from JSON)
    try:
        await init_db()
    except Exception as exc:
        log.warning("kisanmitra.db_unavailable", error=str(exc))

    # 3. Pre-load static rule files — MUST succeed (app cannot function without them)
    from app.engines.crop_engine import load_static_rules
    app.state.crop_rules = load_static_rules()
    log.info("kisanmitra.crop_rules_loaded")

    # 4. Warm scheme in-memory cache from JSON
    from app.services.scheme_service import load_schemes_at_startup
    await load_schemes_at_startup()
    log.info("kisanmitra.schemes_loaded")

    log.info("kisanmitra.ready")
    yield  # ← Application serves requests here

    # Shutdown
    await close_redis_pool()
    log.info("kisanmitra.shutdown")


def create_app() -> FastAPI:
    app = FastAPI(
        title="KisanMitra API",
        description=(
            "Voice-first agricultural assistant — all decisions are deterministic. "
            "LLM is used ONLY for intent extraction and NLG."
        ),
        version="1.0.0",
        lifespan=lifespan,
        docs_url="/docs" if settings.ENV != "production" else None,
        redoc_url=None,
    )

    # CORS — allow all during development so Expo Go on any device can connect.
    # In production, replace with exact domain/origin.
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],          # Dev: open. Prod: restrict to app domain.
        allow_methods=["GET", "POST"],
        allow_headers=["*"],
        allow_credentials=False,
    )

    # Gzip for clients that don't support Brotli
    app.add_middleware(GZipMiddleware, minimum_size=500)

    # ── Routers ───────────────────────────────────────────────────────────────
    app.include_router(health.router, tags=["ops"])
    app.include_router(query.router, prefix="/query", tags=["voice"])
    app.include_router(crop.router, prefix="/crop", tags=["crop"])
    app.include_router(market.router, prefix="/market", tags=["market"])
    app.include_router(scheme.router, prefix="/scheme", tags=["scheme"])

    # ── Simple ping endpoint (no DB/Redis dependency) ─────────────────────────
    @app.get("/ping", tags=["ops"])
    async def ping():
        """Lightweight liveness probe — returns immediately."""
        return JSONResponse({"status": "ok", "service": "kisanmitra"})

    return app


app = create_app()
