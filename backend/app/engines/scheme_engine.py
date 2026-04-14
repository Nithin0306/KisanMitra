"""
Scheme Eligibility Engine.

Pure boolean filter — no scoring, no LLM. Schemes are pre-loaded into memory at startup.
Eligibility predicate per scheme:
  1. state matches (if scheme has state restriction)
  2. farmer_type is in scheme's allowed farmer_types
  3. crop matches (if scheme has crop restriction and crop is provided)
Returns top 3 matching schemes ordered by specificity (most targeted first).
"""

from __future__ import annotations

import json
from dataclasses import dataclass
from datetime import date
from pathlib import Path
from typing import Optional

import structlog

log = structlog.get_logger()

_SCHEME_DB: list[dict] = []


def load_schemes() -> list[dict]:
    """Load scheme rules from JSON at startup. Returns the list."""
    global _SCHEME_DB
    rules_path = Path(__file__).parent.parent / "rules" / "scheme_rules.json"
    _SCHEME_DB = json.loads(rules_path.read_text())
    log.info("scheme_engine.loaded", count=len(_SCHEME_DB))
    return _SCHEME_DB


@dataclass
class SchemeMatchResult:
    scheme_id: str
    scheme_name: str
    ministry: str
    description: str               # Raw; LLM simplifies this in routes/
    application_url: Optional[str]
    deadline: Optional[str]
    specificity_score: int         # Higher = more targeted (used for top-3 ordering)


def _matches(scheme: dict, state: str, farmer_type: str, crop: Optional[str]) -> tuple[bool, int]:
    """
    Returns (matches: bool, specificity_score: int).
    Specificity: +1 for each non-empty filter that matched (state, crop).
    Higher specificity = listed first (more relevant to this farmer).
    """
    eligibility = scheme.get("eligibility", {})
    specificity = 0

    # State filter
    allowed_states = eligibility.get("states", [])
    if allowed_states:
        if state not in allowed_states:
            return False, 0
        specificity += 1

    # Farmer type filter (always present)
    allowed_farmer_types = eligibility.get("farmer_types", [])
    if allowed_farmer_types and farmer_type not in allowed_farmer_types:
        return False, 0

    # Crop filter (optional on both scheme and request)
    allowed_crops = eligibility.get("crops", [])
    if allowed_crops and crop:
        if crop.lower() not in [c.lower() for c in allowed_crops]:
            return False, 0
        specificity += 1
    # If scheme has crop filter but request has no crop → still include (farmer may not know crop yet)

    return True, specificity


async def process(
    state: str,
    farmer_type: str,
    crop: Optional[str] = None,
    schemes: Optional[list[dict]] = None,
) -> tuple[list[SchemeMatchResult], int]:
    """
    Args:
        schemes: pre-loaded scheme list (app.state or _SCHEME_DB). Falls back to _SCHEME_DB.
    Returns:
        (top_3_matches, total_count_before_trim)
    """
    db = schemes or _SCHEME_DB
    matches: list[SchemeMatchResult] = []

    for scheme in db:
        matched, specificity = _matches(scheme, state, farmer_type, crop)
        if matched:
            matches.append(SchemeMatchResult(
                scheme_id=scheme["scheme_id"],
                scheme_name=scheme["scheme_name"],
                ministry=scheme["ministry"],
                description=scheme["description"],
                application_url=scheme.get("application_url"),
                deadline=scheme.get("deadline"),
                specificity_score=specificity,
            ))

    total = len(matches)
    # Sort: higher specificity first; within same specificity, maintain JSON order (stable sort)
    matches.sort(key=lambda m: -m.specificity_score)
    return matches[:3], total
