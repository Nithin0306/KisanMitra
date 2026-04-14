"""
Scheme Service — loads scheme data from JSON rules file at startup.

For MVP: loads scheme_rules.json into memory at startup.
For production: replace with PostgreSQL query + in-memory refresh every 24h via Celery beat.
"""

from __future__ import annotations

import json
from pathlib import Path

import structlog

log = structlog.get_logger()

_SCHEME_CACHE: list[dict] = []
_RULES_PATH = Path(__file__).parent.parent / "rules" / "scheme_rules.json"


async def load_schemes_at_startup() -> list[dict]:
    global _SCHEME_CACHE
    _SCHEME_CACHE = json.loads(_RULES_PATH.read_text())
    log.info("scheme_service.loaded", count=len(_SCHEME_CACHE))
    return _SCHEME_CACHE


async def get_schemes() -> list[dict]:
    """Returns in-memory scheme list. Always available — no network dependency."""
    if not _SCHEME_CACHE:
        await load_schemes_at_startup()
    return _SCHEME_CACHE
