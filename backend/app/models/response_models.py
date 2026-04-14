"""
Pydantic v2 response models for all KisanMitra API endpoints.
All response shapes are defined here; engines return dataclasses that are converted here.
"""

from __future__ import annotations
from datetime import datetime, date
from typing import Literal, Optional
from pydantic import BaseModel, Field


#  Error (shared across all endpoints) 

class ErrorResponse(BaseModel):
    error_code: str
    message: str
    voice_message: str       # Pre-baked, language-aware; NO LLM in error path
    retryable: bool
    confidence: Optional[float] = None


#  Health 

class DependencyStatus(BaseModel):
    status: Literal["ok", "degraded", "down"]
    latency_ms: Optional[int] = None
    detail: Optional[str] = None


class HealthResponse(BaseModel):
    status: Literal["healthy", "degraded", "unhealthy"]
    timestamp: datetime
    dependencies: dict[str, DependencyStatus]


#  Crop Recommendation 

class CropResult(BaseModel):
    crop_name: str
    score: float = Field(..., ge=0.0, le=1.0, description="Composite rule-engine score [0–1]")
    soil_match: bool
    season_match: bool
    climate_fit: Literal["optimal", "marginal", "unsuitable", "unknown"]


class DataFreshness(BaseModel):
    weather_fetched_at: Optional[datetime] = None
    weather_source: Literal["live", "redis_cache", "static_fallback"]


class CropResponse(BaseModel):
    top_3_crops: list[CropResult]
    risk_level: Literal["low", "medium", "high"]
    reasoning_factors: list[str] = Field(..., max_length=5)
    voice_explanation: str
    data_freshness: DataFreshness
    degraded_mode: bool


#  Market Price 

class MarketResponse(BaseModel):
    decision: Literal["SELL", "WAIT", "UNKNOWN"]
    current_price_inr: Optional[float] = None
    price_unit: str = "per_quintal"
    trend_direction: Literal["rising", "falling", "stable", "unknown"]
    confidence: Literal["high", "medium", "low"]
    moving_avg_3d: Optional[float] = None
    moving_avg_7d: Optional[float] = None
    data_age_hours: Optional[int] = None
    voice_explanation: str
    degraded_mode: bool


#  Scheme Match 

class SchemeResult(BaseModel):
    scheme_id: str
    scheme_name: str
    ministry: str
    eligibility_summary: str    # LLM-simplified ≤ 50 words
    application_url: Optional[str] = None
    deadline: Optional[date] = None


class SchemeResponse(BaseModel):
    matched_schemes: list[SchemeResult]
    total_matches_found: int
    voice_explanation: str


#  Voice Query (wraps all feature responses) 

class VoiceQueryResponse(BaseModel):
    intent: str
    feature_response: dict
    voice_explanation: str
    confidence: float
    degraded_mode: bool
