"""
Moving average pure functions used by market_engine.
Kept separate for unit testability.
"""

from typing import Optional


def moving_average(prices: list[float], window: int) -> Optional[float]:
    """Returns the simple moving average of the last `window` prices, or None if insufficient data."""
    if not prices or len(prices) < window:
        return None
    return round(sum(prices[-window:]) / window, 2)


def price_trend(prices: list[float], short_window: int = 3, long_window: int = 7) -> str:
    """
    Returns 'rising', 'falling', 'stable', or 'unknown'.
    Threshold: 1% difference between MA values.
    """
    ma_short = moving_average(prices, short_window)
    ma_long = moving_average(prices, long_window)
    if ma_short is None or ma_long is None:
        return "unknown"
    diff_pct = (ma_short - ma_long) / max(0.01, ma_long)
    if diff_pct > 0.01:
        return "rising"
    if diff_pct < -0.01:
        return "falling"
    return "stable"
