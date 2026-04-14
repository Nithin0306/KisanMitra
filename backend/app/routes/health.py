"""
Routes — GET /health (liveness + dependency status).

Checks: Redis, PostgreSQL, Open-Meteo, Agmarknet, Vertex AI.
Returns "degraded" if any non-critical dependency is down.
Returns "unhealthy" only if Redis or DB (critical path) is down.
"""

import asyncio
import time
from datetime import datetime, timezone

import httpx
import structlog
from fastapi import APIRouter

from app.models.response_models import HealthResponse, DependencyStatus
from app.core.redis_client import get_redis
from app.core.config import settings

log = structlog.get_logger()
router = APIRouter()

CRITICAL_DEPS = {"redis", "postgres"}


async def _check_redis() -> DependencyStatus:
    t0 = time.monotonic()
    try:
        redis = await get_redis()
        await redis.ping()
        return DependencyStatus(status="ok", latency_ms=int((time.monotonic() - t0) * 1000))
    except Exception as e:
        return DependencyStatus(status="down", detail=str(e)[:120])


async def _check_postgres() -> DependencyStatus:
    t0 = time.monotonic()
    try:
        from app.core.db import engine
        async with engine.connect() as conn:
            await conn.execute(__import__("sqlalchemy").text("SELECT 1"))
        return DependencyStatus(status="ok", latency_ms=int((time.monotonic() - t0) * 1000))
    except Exception as e:
        return DependencyStatus(status="down", detail=str(e)[:120])


async def _check_open_meteo() -> DependencyStatus:
    t0 = time.monotonic()
    try:
        async with httpx.AsyncClient(timeout=3.0) as client:
            r = await client.get(
                settings.OPEN_METEO_BASE_URL,
                params={"latitude": 20.5, "longitude": 78.9, "daily": "temperature_2m_max",
                        "forecast_days": 1, "timezone": "Asia/Kolkata"}
            )
            r.raise_for_status()
        return DependencyStatus(status="ok", latency_ms=int((time.monotonic() - t0) * 1000))
    except Exception as e:
        return DependencyStatus(status="degraded", detail=str(e)[:120])


async def _check_agmarknet() -> DependencyStatus:
    t0 = time.monotonic()
    try:
        async with httpx.AsyncClient(timeout=3.0) as client:
            r = await client.head("https://api.data.gov.in")
            # A 4xx is fine — we're only checking reachability
        return DependencyStatus(status="ok", latency_ms=int((time.monotonic() - t0) * 1000))
    except Exception as e:
        return DependencyStatus(status="degraded", detail=str(e)[:120])


async def _check_vertex_ai() -> DependencyStatus:
    t0 = time.monotonic()
    try:
        # Lightweight: check that the GCP project ID is configured
        if not settings.GCP_PROJECT_ID:
            return DependencyStatus(status="degraded", detail="GCP_PROJECT_ID not set")
        return DependencyStatus(status="ok", latency_ms=int((time.monotonic() - t0) * 1000))
    except Exception as e:
        return DependencyStatus(status="degraded", detail=str(e)[:120])


@router.get("/health", response_model=HealthResponse)
async def health_check():
    results = await asyncio.gather(
        _check_redis(),
        _check_postgres(),
        _check_open_meteo(),
        _check_agmarknet(),
        _check_vertex_ai(),
        return_exceptions=False,
    )

    deps = {
        "redis":      results[0],
        "postgres":   results[1],
        "open_meteo": results[2],
        "agmarknet":  results[3],
        "vertex_ai":  results[4],
    }

    # Determine overall status
    critical_down = any(deps[k].status == "down" for k in CRITICAL_DEPS)
    any_degraded = any(d.status in ("down", "degraded") for d in deps.values())

    if critical_down:
        status = "unhealthy"
    elif any_degraded:
        status = "degraded"
    else:
        status = "healthy"

    return HealthResponse(
        status=status,
        timestamp=datetime.now(timezone.utc),
        dependencies=deps,
    )
