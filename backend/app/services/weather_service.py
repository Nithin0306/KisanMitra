"""
Weather Service — Open-Meteo API wrapper.

Fetch strategy (in order):
  1. Redis cache (TTL 3h) → "redis_cache"
  2. Live Open-Meteo API → "live" + write to cache + write to stale key (TTL 24h)
  3. Redis stale key (up to 24h old) → "static_fallback" + degraded_mode=True
  4. None (total failure) → engine.process() handles fallback crops
"""

from __future__ import annotations

from datetime import datetime, date
from typing import Optional

import httpx
import structlog
from tenacity import retry, stop_after_attempt, wait_exponential

from app.core.config import settings
from app.core.redis_client import get_redis
from app.engines.crop_engine import DayForecast

log = structlog.get_logger()

FORECAST_DAYS = 14

# Open-Meteo free API — no key required
OPEN_METEO_PARAMS = {
    "daily": "temperature_2m_max,temperature_2m_min,precipitation_sum,relative_humidity_2m_max",
    "forecast_days": FORECAST_DAYS,
    "timezone": "Asia/Kolkata",
}

# Rough lat/lon lookup for districts (extend this dict for production)
DISTRICT_COORDS: dict[str, tuple[float, float]] = {
    "nashik":      (20.0, 73.8),
    "pune":        (18.5, 73.9),
    "nagpur":      (21.1, 79.1),
    "ludhiana":    (30.9, 75.8),
    "amritsar":    (31.6, 74.9),
    "jaipur":      (26.9, 75.8),
    "jodhpur":     (26.3, 73.0),
    "coimbatore":  (11.0, 76.9),
    "thanjavur":   (10.8, 79.1),
    "lucknow":     (26.8, 80.9),
    "agra":        (27.2, 78.0),
    "_default":    (20.5, 78.9),  # Approximate geographic center of India
}


def _get_coords(district: str) -> tuple[float, float]:
    return DISTRICT_COORDS.get(district.lower(), DISTRICT_COORDS["_default"])


def _cache_key(state: str, district: str) -> str:
    return f"weather:{state.lower()}:{district.lower()}"


def _parse_open_meteo(data: dict) -> list[DayForecast]:
    daily = data.get("daily", {})
    dates = daily.get("time", [])
    tmax = daily.get("temperature_2m_max", [])
    tmin = daily.get("temperature_2m_min", [])
    precip = daily.get("precipitation_sum", [])
    humidity = daily.get("relative_humidity_2m_max", [])

    forecasts = []
    for i, d in enumerate(dates):
        forecasts.append(DayForecast(
            date=date.fromisoformat(d),
            temp_max_c=float(tmax[i] or 0),
            temp_min_c=float(tmin[i] or 0),
            rainfall_mm=float(precip[i] or 0),
            humidity_pct=float(humidity[i] or 0),
        ))
    return forecasts


@retry(stop=stop_after_attempt(2), wait=wait_exponential(multiplier=0.5, min=0.5, max=2))
async def _fetch_live(lat: float, lon: float) -> list[DayForecast]:
    params = {**OPEN_METEO_PARAMS, "latitude": lat, "longitude": lon}
    async with httpx.AsyncClient(timeout=settings.TIMEOUT_OPEN_METEO) as client:
        resp = await client.get(settings.OPEN_METEO_BASE_URL, params=params)
        resp.raise_for_status()
        return _parse_open_meteo(resp.json())


async def get_forecast(state: str, district: str) -> tuple[list[DayForecast] | None, str]:
    """
    Returns (forecast_list, source_label).
    source_label: "live" | "redis_cache" | "static_fallback" | "none"
    """
    redis = await get_redis()
    cache_key = _cache_key(state, district)
    stale_key = f"{cache_key}:stale"

    #  1. Redis cache 
    import json as _json
    cached = await redis.get(cache_key)
    if cached:
        try:
            raw = _json.loads(cached)
            forecasts = [DayForecast(**d) for d in raw]
            log.info("weather_service.cache_hit", key=cache_key)
            return forecasts, "redis_cache"
        except Exception:
            pass  # Corrupt cache entry — continue to live fetch

    #  2. Live fetch 
    lat, lon = _get_coords(district)
    try:
        forecasts = await _fetch_live(lat, lon)
        serialized = _json.dumps([
            {"date": str(f.date), "temp_max_c": f.temp_max_c, "temp_min_c": f.temp_min_c,
             "rainfall_mm": f.rainfall_mm, "humidity_pct": f.humidity_pct}
            for f in forecasts
        ])
        await redis.setex(cache_key, settings.CACHE_TTL_WEATHER, serialized)
        await redis.setex(stale_key, settings.CACHE_TTL_STALE_WEATHER, serialized)
        log.info("weather_service.live_fetch", district=district)
        return forecasts, "live"
    except Exception as exc:
        log.warning("weather_service.live_fetch_failed", error=str(exc))

    #  3. Stale cache 
    stale = await redis.get(stale_key)
    if stale:
        try:
            raw = _json.loads(stale)
            forecasts = [DayForecast(**d) for d in raw]
            log.warning("weather_service.stale_cache_hit", key=stale_key)
            return forecasts, "static_fallback"
        except Exception:
            pass

    #  4. Total failure 
    log.error("weather_service.total_failure", district=district, state=state)
    return None, "none"
