"""
Formatter utilities — price rounding, payload size enforcement.
Stateless pure functions — no I/O, no side effects.
"""

import json


def round_price(price: float | None, decimals: int = 0) -> float | None:
    """Round price to nearest rupee (default) for display."""
    if price is None:
        return None
    return round(price, decimals)


def truncate_words(text: str, max_words: int) -> str:
    words = text.split()
    if len(words) <= max_words:
        return text
    return " ".join(words[:max_words]) + "…"


def enforce_payload_limit(data: dict, max_bytes: int) -> dict:
    """
    If JSON-serialized size exceeds max_bytes, drop optional fields in order:
    moving_avg_3d, moving_avg_7d, reasoning_factors, data_freshness.
    Returns the trimmed dict. Raises ValueError if core fields can't fit.
    """
    DROPPABLE = ["moving_avg_3d", "moving_avg_7d", "data_freshness", "reasoning_factors"]
    serialized = json.dumps(data, default=str).encode()
    if len(serialized) <= max_bytes:
        return data
    for key in DROPPABLE:
        if key in data:
            del data[key]
            serialized = json.dumps(data, default=str).encode()
            if len(serialized) <= max_bytes:
                return data
    return data  # Return best-effort even if still oversized
