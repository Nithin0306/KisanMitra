"""
Shared Redis connection pool (redis.asyncio).
Single pool instance reused across all requests via FastAPI dependency injection.
"""

import redis.asyncio as aioredis
import structlog
from app.core.config import settings

log = structlog.get_logger()
_pool: aioredis.Redis | None = None


async def get_redis_pool() -> aioredis.Redis:
    global _pool
    if _pool is None:
        _pool = aioredis.from_url(
            settings.REDIS_URL,
            encoding="utf-8",
            decode_responses=True,
            socket_connect_timeout=2,
            socket_timeout=2,
        )
        await _pool.ping()
        log.info("redis.connected", url=settings.REDIS_URL)
    return _pool


async def close_redis_pool():
    global _pool
    if _pool:
        await _pool.close()
        _pool = None
        log.info("redis.disconnected")


async def get_redis() -> aioredis.Redis:
    """FastAPI dependency — yields the shared Redis client."""
    return await get_redis_pool()
