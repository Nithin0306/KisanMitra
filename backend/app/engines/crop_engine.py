"""
Crop Recommendation Engine.

All scoring is deterministic. LLM is never called here.
Flow: soil score → season score → rainfall score → temp score → risk penalty → composite → top 3.
"""

from __future__ import annotations

import json
from dataclasses import dataclass, field
from datetime import date
from pathlib import Path
from typing import Literal, Any

import structlog

log = structlog.get_logger()

#  Weight constants (must sum to 1.0) 
WEIGHTS = {
    "soil_match":   0.35,
    "season_match": 0.25,
    "rainfall_fit": 0.20,
    "temp_fit":     0.15,
    "risk_penalty": 0.05,
}

#  Fallback crop sets keyed by soil type 
# Used when weather data is unavailable. Ordered by drought resilience (safest first).
STATIC_FALLBACK_CROPS: dict[str, list[str]] = {
    "black_cotton":  ["chickpea", "sorghum", "cotton"],
    "loamy":         ["chickpea", "maize", "mustard"],
    "sandy":         ["pearl_millet", "groundnut", "sorghum"],
    "sandy_loam":    ["chickpea", "groundnut", "maize"],
    "clay":          ["rice", "sugarcane", "maize"],
    "clay_loam":     ["wheat", "rice", "chickpea"],
    "alluvial":      ["wheat", "maize", "sugarcane"],
    "laterite":      ["sorghum", "groundnut", "chickpea"],
    "red_laterite":  ["groundnut", "chickpea", "maize"],
    "saline":        [],  # No safe crops — returns UNKNOWN
    "waterlogged":   [],
    "_default":      ["chickpea", "maize", "sorghum"],
}


@dataclass
class DayForecast:
    date: date
    temp_max_c: float
    temp_min_c: float
    rainfall_mm: float
    humidity_pct: float


@dataclass
class CropResultInternal:
    crop_name: str
    score: float
    soil_match: bool
    season_match: bool
    climate_fit: Literal["optimal", "marginal", "unsuitable", "unknown"]
    score_breakdown: dict[str, float]


@dataclass
class CropEngineResult:
    top_3_crops: list[CropResultInternal]
    risk_level: Literal["low", "medium", "high"]
    reasoning_factors: list[str]
    degraded_mode: bool
    weather_source: Literal["live", "redis_cache", "static_fallback"]


#  Rule loader 

_RULES_DIR = Path(__file__).parent.parent / "rules"


def load_static_rules() -> dict[str, Any]:
    """Called once at app startup; result stored in app.state.crop_rules."""
    crop_rules = json.loads((_RULES_DIR / "crop_rules.json").read_text())
    seasonal = json.loads((_RULES_DIR / "seasonal_calendar.json").read_text())
    risk = json.loads((_RULES_DIR / "risk_thresholds.json").read_text())
    return {"crops": crop_rules["crops"], "seasonal": seasonal, "risk": risk}


#  Scoring functions (pure, no I/O) 

def _score_soil(crop_rules: dict, soil_type: str) -> float:
    if soil_type in crop_rules["compatible_soils"]:
        return 1.0
    if soil_type in crop_rules["incompatible_soils"]:
        return 0.0
    return 0.5  # Neutral for unlisted soil types


def _derive_current_season(today: date, district_calendar: dict) -> str | None:
    """Returns 'kharif', 'rabi', 'zaid', or None if today is outside all windows."""
    for season, window in district_calendar.items():
        start_mm, start_dd = map(int, window["sow_start"].split("-"))
        end_mm, end_dd = map(int, window["sow_end"].split("-"))
        start = date(today.year, start_mm, start_dd)
        end = date(today.year, end_mm, end_dd)
        # Handle year wrap (e.g. rabi sowing starts Oct, harvest in following year)
        if start <= today <= end:
            return season
    return None


def _get_district_calendar(seasonal: dict, state: str, district: str) -> dict:
    return (
        seasonal.get(state, {}).get(district)
        or seasonal.get(state, {}).get("_default")
        or seasonal["_default"]["_default"]
    )


def _score_season(crop_rules: dict, district_calendar: dict, today: date) -> float:
    current = _derive_current_season(today, district_calendar)
    if current is None:
        return 0.0  # Not in any sowing window
    return 1.0 if current in crop_rules["seasons"] else 0.0


def _score_rainfall(crop_rules: dict, forecast: list[DayForecast]) -> float:
    total_mm = sum(d.rainfall_mm for d in forecast)
    rmin = crop_rules["rainfall_mm_season"]["min"]
    rmax = crop_rules["rainfall_mm_season"]["max"]
    if rmin <= total_mm <= rmax:
        return 1.0
    if total_mm < rmin:
        return max(0.0, total_mm / rmin)
    # total_mm > rmax
    return max(0.0, 1.0 - (total_mm - rmax) / rmax)


def _score_temp(crop_rules: dict, forecast: list[DayForecast]) -> float:
    avg_temp = sum((d.temp_max_c + d.temp_min_c) / 2 for d in forecast) / len(forecast)
    tmin = crop_rules["temp_range_c"]["min"]
    tmax = crop_rules["temp_range_c"]["max"]
    opt_min = crop_rules["temp_range_c"]["optimal_min"]
    opt_max = crop_rules["temp_range_c"]["optimal_max"]

    if avg_temp < tmin or avg_temp > tmax:
        return 0.0
    if opt_min <= avg_temp <= opt_max:
        return 1.0
    if avg_temp < opt_min:
        return (avg_temp - tmin) / max(0.01, opt_min - tmin)
    return (tmax - avg_temp) / max(0.01, tmax - opt_max)


def _is_pest_season(crop_rules: dict, today: date) -> bool:
    pest = crop_rules.get("pest_seasons")
    if not pest or len(pest) < 2:
        return False
    start_mm, start_dd = map(int, pest[0].split("-"))
    end_mm, end_dd = map(int, pest[1].split("-"))
    start = date(today.year, start_mm, start_dd)
    end = date(today.year, end_mm, end_dd)
    return start <= today <= end


def _compute_risk_penalty(crop_rules: dict, forecast: list[DayForecast],
                           risk_thresholds: dict, today: date) -> float:
    penalty = 0.0
    total_rain = sum(d.rainfall_mm for d in forecast)
    di = risk_thresholds["drought_index"]

    if total_rain <= di["high"]["total_rainfall_mm_14d"]:
        penalty += 0.8
    elif total_rain <= di["medium"]["total_rainfall_mm_14d"]:
        penalty += 0.5
    elif total_rain <= di["low"]["total_rainfall_mm_14d"]:
        penalty += 0.2

    excess_threshold = risk_thresholds["excess_rain"]["flag_mm_per_day"]
    if any(d.rainfall_mm > excess_threshold for d in forecast):
        penalty += 0.3

    if _is_pest_season(crop_rules, today):
        penalty += risk_thresholds["pest_season_penalty"]

    return min(1.0, penalty)


def _composite_score(soil_s, season_s, rain_s, temp_s, risk_penalty) -> float:
    risk_score = max(0.0, 1.0 - risk_penalty)
    return round(
        WEIGHTS["soil_match"]   * soil_s +
        WEIGHTS["season_match"] * season_s +
        WEIGHTS["rainfall_fit"] * rain_s +
        WEIGHTS["temp_fit"]     * temp_s +
        WEIGHTS["risk_penalty"] * risk_score,
        4,
    )


def _climate_fit(rain_s: float, temp_s: float) -> Literal["optimal", "marginal", "unsuitable", "unknown"]:
    avg = (rain_s + temp_s) / 2
    if avg >= 0.85:
        return "optimal"
    if avg >= 0.50:
        return "marginal"
    return "unsuitable"


def _build_reasoning_factors(
    top_crops: list[CropResultInternal],
    risk_level: str,
    soil_type: str,
    forecast: list[DayForecast] | None,
) -> list[str]:
    """Generate human-readable reasoning strings. These are passed to LLM for translation only."""
    factors: list[str] = []
    if top_crops:
        crop_names = ", ".join(c.crop_name for c in top_crops)
        factors.append(f"Soil type '{soil_type}' is best matched with: {crop_names}.")
    if forecast is not None:
        total_rain = sum(d.rainfall_mm for d in forecast)
        factors.append(f"Expected rainfall in next 14 days: {total_rain:.0f} mm.")
    factors.append(f"Overall weather risk level: {risk_level}.")
    if top_crops and top_crops[0].season_match:
        factors.append("Current period is within the optimal sowing window.")
    else:
        factors.append("Warning: current period may be outside the optimal sowing window.")
    return factors[:5]  # Cap at 5


#  Main engine function 

async def process(entities: dict, rules: dict, forecast: list[DayForecast] | None,
                  weather_source: str = "live") -> CropEngineResult:
    """
    Deterministic crop recommendation.
    Args:
        entities   : dict with keys soil_type, state, district
        rules      : app.state.crop_rules (pre-loaded at startup)
        forecast   : list of DayForecast or None if weather unavailable
        weather_source: "live" | "redis_cache" | "static_fallback"
    """
    soil_type = entities.get("soil_type", "_default")
    state = entities.get("state", "_default")
    district = entities.get("district", "_default")
    today = date.today()

    crops_db: dict = rules["crops"]
    seasonal: dict = rules["seasonal"]
    risk_thresholds: dict = rules["risk"]
    district_calendar = _get_district_calendar(seasonal, state, district)

    #  Weather fallback 
    if forecast is None or len(forecast) < 3:
        log.warning("crop_engine.weather_fallback", soil_type=soil_type)
        fallback_names = STATIC_FALLBACK_CROPS.get(soil_type, STATIC_FALLBACK_CROPS["_default"])
        fallback_crops = [
            CropResultInternal(
                crop_name=c, score=0.0, soil_match=True,
                season_match=False, climate_fit="unknown", score_breakdown={},
            )
            for c in fallback_names
        ]
        return CropEngineResult(
            top_3_crops=fallback_crops[:3],
            risk_level="medium",
            reasoning_factors=[
                f"Weather data unavailable — showing drought-safe crops for '{soil_type}' soil.",
                "Please check weather conditions before sowing.",
            ],
            degraded_mode=True,
            weather_source="static_fallback",
        )

    #  Score every crop 
    scored: list[tuple[str, float, dict, dict]] = []  # (name, score, breakdown, raw_crop_rules)
    for crop_name, crop_rules in crops_db.items():
        soil_s   = _score_soil(crop_rules, soil_type)
        season_s = _score_season(crop_rules, district_calendar, today)
        rain_s   = _score_rainfall(crop_rules, forecast)
        temp_s   = _score_temp(crop_rules, forecast)
        penalty  = _compute_risk_penalty(crop_rules, forecast, risk_thresholds, today)
        score    = _composite_score(soil_s, season_s, rain_s, temp_s, penalty)

        breakdown = {
            "soil_match": soil_s, "season_match": season_s,
            "rainfall_fit": rain_s, "temp_fit": temp_s, "risk_penalty": penalty,
        }
        scored.append((crop_name, score, breakdown, crop_rules))

    #  Filter and sort 
    eligible = [(n, s, bd, cr) for n, s, bd, cr in scored if s > 0.0]
    eligible.sort(key=lambda x: (
        -round(x[1], 2),
        not (x[2]["soil_match"] == 1.0),
        not (x[2]["season_match"] == 1.0),
        x[0],  # alphabetical tie-break
    ))

    top3 = [
        CropResultInternal(
            crop_name=name,
            score=score,
            soil_match=(breakdown["soil_match"] == 1.0),
            season_match=(breakdown["season_match"] == 1.0),
            climate_fit=_climate_fit(breakdown["rainfall_fit"], breakdown["temp_fit"]),
            score_breakdown=breakdown,
        )
        for name, score, breakdown, _ in eligible[:3]
    ]

    #  System-level risk 
    total_rain = sum(d.rainfall_mm for d in forecast)
    excess_flag = risk_thresholds["excess_rain"]["flag_mm_per_day"]
    di = risk_thresholds["drought_index"]
    if total_rain <= di["high"]["total_rainfall_mm_14d"] or \
            any(d.rainfall_mm > excess_flag for d in forecast):
        risk_level: Literal["low", "medium", "high"] = "high"
    elif total_rain <= di["low"]["total_rainfall_mm_14d"]:
        risk_level = "medium"
    else:
        risk_level = "low"

    reasoning = _build_reasoning_factors(top3, risk_level, soil_type, forecast)

    return CropEngineResult(
        top_3_crops=top3,
        risk_level=risk_level,
        reasoning_factors=reasoning,
        degraded_mode=(weather_source == "static_fallback"),
        weather_source=weather_source,  # type: ignore[arg-type]
    )
