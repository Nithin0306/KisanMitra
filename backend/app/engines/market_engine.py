"""
Market Price Engine.

Deterministic moving-average comparator.
Decision rule:
  3d MA > 7d MA by ≥ SELL_THRESHOLD_PCT → SELL
  otherwise                             → WAIT
  data days < MIN_DATA_DAYS            → UNKNOWN
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Literal

import structlog

log = structlog.get_logger()

#  Thresholds 
SELL_THRESHOLD_PCT = 0.02   # 3d MA must exceed 7d MA by ≥ 2% to trigger SELL
MIN_DATA_DAYS = 4            # Fewer than this → UNKNOWN, confidence = low


@dataclass
class MarketEngineResult:
    decision: Literal["SELL", "WAIT", "UNKNOWN"]
    current_price_inr: float | None
    trend_direction: Literal["rising", "falling", "stable", "unknown"]
    confidence: Literal["high", "medium", "low"]
    moving_avg_3d: float | None
    moving_avg_7d: float | None
    data_age_hours: int | None
    reasoning_factors: list[str]
    degraded_mode: bool


def _moving_average(prices: list[float], window: int) -> float | None:
    if len(prices) < window:
        return None
    return sum(prices[-window:]) / window


def _trend_direction(ma3: float | None, ma7: float | None) -> Literal["rising", "falling", "stable", "unknown"]:
    if ma3 is None or ma7 is None:
        return "unknown"
    diff_pct = (ma3 - ma7) / max(0.01, ma7)
    if diff_pct > 0.01:
        return "rising"
    if diff_pct < -0.01:
        return "falling"
    return "stable"


def _confidence_level(days_available: int) -> Literal["high", "medium", "low"]:
    if days_available >= 7:
        return "high"
    if days_available >= 4:
        return "medium"
    return "low"


async def process(
    crop_name: str,
    district: str,
    state: str,
    price_series: list[float],     # Chronological daily prices, oldest first
    data_age_hours: int | None,
    is_stale: bool = False,
) -> MarketEngineResult:
    """
    Args:
        price_series   : daily prices oldest-first; fetched by market_service
        data_age_hours : hours since last live API call
        is_stale       : True if data came from stale Redis cache (API was down)
    """
    n = len(price_series)

    if n < MIN_DATA_DAYS:
        return MarketEngineResult(
            decision="UNKNOWN",
            current_price_inr=price_series[-1] if price_series else None,
            trend_direction="unknown",
            confidence="low",
            moving_avg_3d=None,
            moving_avg_7d=None,
            data_age_hours=data_age_hours,
            reasoning_factors=[
                f"Insufficient price data for {crop_name} in {district} ({n} days available, need {MIN_DATA_DAYS}).",
                "Cannot compute reliable moving average — recommendation unavailable.",
            ],
            degraded_mode=True,
        )

    ma3 = _moving_average(price_series, 3)
    ma7 = _moving_average(price_series, 7)
    current_price = price_series[-1]
    confidence = _confidence_level(n)
    trend = _trend_direction(ma3, ma7)

    # Decision rule — purely deterministic
    if ma3 is not None and ma7 is not None:
        diff_pct = (ma3 - ma7) / max(0.01, ma7)
        if diff_pct >= SELL_THRESHOLD_PCT:
            decision: Literal["SELL", "WAIT", "UNKNOWN"] = "SELL"
            reason = f"3-day average (₹{ma3:.0f}) exceeds 7-day average (₹{ma7:.0f}) by {diff_pct*100:.1f}% — prices trending up."
        else:
            decision = "WAIT"
            reason = f"3-day average (₹{ma3:.0f}) does not significantly exceed 7-day average (₹{ma7:.0f}) — prices stable or falling."
    else:
        decision = "WAIT"  # Insufficient 7-day data but enough for 3-day
        reason = f"7-day average unavailable ({n} days of data). 3-day average: ₹{ma3:.0f}."

    factors = [
        f"Current market price for {crop_name} in {district}: ₹{current_price:.0f}/quintal.",
        reason,
    ]
    if is_stale:
        factors.append(f"Warning: using cached data ({data_age_hours}h old) — live API unavailable.")

    return MarketEngineResult(
        decision=decision,
        current_price_inr=current_price,
        trend_direction=trend,
        confidence=confidence,
        moving_avg_3d=ma3,
        moving_avg_7d=ma7,
        data_age_hours=data_age_hours,
        reasoning_factors=factors,
        degraded_mode=is_stale,
    )
