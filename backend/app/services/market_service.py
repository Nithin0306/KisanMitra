"""
Market Service — Agmarknet/data.gov.in wrapper.

Fetches daily mandi prices for a given crop + district + state.
Returns a chronological price series (oldest first) for moving-average computation.

Fallback strategy:
  1. Redis cache (TTL 1h)
  2. Live Agmarknet API
  3. Stale Redis (TTL 6h) → degraded_mode=True
  4. Empty list → market_engine returns UNKNOWN
"""

from __future__ import annotations

import json
from datetime import datetime, timedelta

import httpx
import structlog
from tenacity import retry, stop_after_attempt, wait_exponential

from app.core.config import settings
from app.core.redis_client import get_redis

log = structlog.get_logger()


def _cache_key(crop_name: str, district: str, state: str) -> str:
    parts = [crop_name.lower(), district.lower(), state.lower()]
    return "market:" + ":".join(p.replace(" ", "_") for p in parts)


@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=1, max=4))
async def _fetch_agmarknet(crop_name: str, district: str, state: str) -> list[float]:
    """
    Calls data.gov.in Agmarknet resource API.
    Returns daily modal prices (₹/quintal) oldest-first for last 14 days.

    Assumption: Agmarknet API returns JSON with records containing
    'Modal_Price' and 'Arrival_Date' fields.
    This implementation uses the data.gov.in REST API format.
    """
    # data.gov.in Agmarknet endpoint
    params = {
        "api-key": settings.AGMARKNET_API_KEY,
        "format": "json",
        "filters[Commodity]": crop_name.title(),
        "filters[District]": district.title(),
        "filters[State]": state.title(),
        "limit": 14,
    }
    url = "https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070"

    async with httpx.AsyncClient(timeout=settings.TIMEOUT_AGMARKNET) as client:
        resp = await client.get(url, params=params)
        resp.raise_for_status()
        data = resp.json()

    records = data.get("records", [])
    # Sort by date ascending (oldest first)
    records.sort(key=lambda r: r.get("Arrival_Date", ""))
    prices = []
    for r in records:
        try:
            prices.append(float(r["Modal_Price"]))
        except (KeyError, ValueError):
            continue
    return prices


async def get_price_series(
    crop_name: str,
    district: str,
    state: str,
) -> tuple[list[float], int | None, bool]:
    """
    Returns (price_series, data_age_hours, is_stale).
    price_series: daily modal prices oldest-first (may be empty).
    data_age_hours: hours since last live fetch (None if from live).
    is_stale: True if data came from stale cache.
    """
    redis = await get_redis()
    cache_key = _cache_key(crop_name, district, state)
    stale_key = f"{cache_key}:stale"
    age_key = f"{cache_key}:fetched_at"

    #  1. Redis cache 
    cached = await redis.get(cache_key)
    if cached:
        try:
            prices = json.loads(cached)
            fetched_at_str = await redis.get(age_key)
            age_hours = None
            if fetched_at_str:
                fetched_at = datetime.fromisoformat(fetched_at_str)
                age_hours = int((datetime.utcnow() - fetched_at).total_seconds() / 3600)
            log.info("market_service.cache_hit", key=cache_key)
            return prices, age_hours, False
        except Exception:
            pass

    #  2. Live fetch 
    try:
        prices = await _fetch_agmarknet(crop_name, district, state)
        if prices:
            serialized = json.dumps(prices)
            now_str = datetime.utcnow().isoformat()
            await redis.setex(cache_key, settings.CACHE_TTL_MARKET, serialized)
            await redis.setex(stale_key, settings.CACHE_TTL_STALE_MARKET, serialized)
            await redis.setex(age_key, settings.CACHE_TTL_STALE_MARKET, now_str)
            log.info("market_service.live_fetch", crop=crop_name, district=district)
            return prices, 0, False
    except Exception as exc:
        log.warning("market_service.live_fetch_failed", error=str(exc))

    #  3. Stale cache 
    stale = await redis.get(stale_key)
    if stale:
        try:
            prices = json.loads(stale)
            fetched_at_str = await redis.get(age_key)
            age_hours = settings.CACHE_TTL_STALE_MARKET // 3600  # Assume worst case
            if fetched_at_str:
                fetched_at = datetime.fromisoformat(fetched_at_str)
                age_hours = int((datetime.utcnow() - fetched_at).total_seconds() / 3600)
            log.warning("market_service.stale_cache_hit", age_hours=age_hours)
            return prices, age_hours, True
        except Exception:
            pass

    #  4. Total failure 
    log.error("market_service.total_failure", crop=crop_name)
    return [], None, True
