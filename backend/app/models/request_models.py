"""
Pydantic v2 request models for all KisanMitra API endpoints.
Validation is the HTTP boundary's responsibility — engines receive typed Python objects.
"""

from __future__ import annotations
from datetime import date
from typing import Literal, Optional
from pydantic import BaseModel, Field, field_validator


#  Shared 

class LocationContext(BaseModel):
    state: str = Field(..., min_length=2, max_length=64)
    district: str = Field(..., min_length=2, max_length=64)


#  ICAR Soil Type Enum 
# Must match keys in data/icar_soil_types.json
SoilTypeEnum = Literal[
    "alluvial", "black_cotton", "red_laterite", "laterite",
    "loamy", "sandy", "sandy_loam", "clay", "clay_loam", "saline", "waterlogged"
]

LanguageCodeEnum = Literal["hi-IN", "ta-IN", "te-IN", "kn-IN", "mr-IN", "en-IN", "pa-IN"]


#  Voice Query 

class VoiceQueryRequest(BaseModel):
    transcript: str = Field(..., min_length=1, max_length=1000, description="Raw STT output text")
    language_code: LanguageCodeEnum = "hi-IN"
    farmer_id: Optional[str] = Field(None, max_length=128)
    stt_confidence: Optional[float] = Field(None, ge=0.0, le=1.0)
    location: Optional[LocationContext] = None


#  Crop Recommendation 

class DayForecast(BaseModel):
    date: date
    temp_max_c: float = Field(..., ge=-10.0, le=60.0)
    temp_min_c: float = Field(..., ge=-10.0, le=60.0)
    rainfall_mm: float = Field(..., ge=0.0, le=1000.0)
    humidity_pct: float = Field(..., ge=0.0, le=100.0)

    @field_validator("temp_min_c")
    @classmethod
    def min_lt_max(cls, v, info):
        if "temp_max_c" in info.data and v > info.data["temp_max_c"]:
            raise ValueError("temp_min_c must be ≤ temp_max_c")
        return v


class CropRequest(BaseModel):
    soil_type: SoilTypeEnum
    district: str = Field(..., min_length=2, max_length=64)
    state: str = Field(..., min_length=2, max_length=64)
    language_code: LanguageCodeEnum = "hi-IN"
    forecast_override: Optional[list[DayForecast]] = Field(
        None, description="Test-only: provide manually, skips live weather fetch"
    )


#  Market Price 

class MarketRequest(BaseModel):
    crop_name: str = Field(..., min_length=2, max_length=64)
    district: str = Field(..., min_length=2, max_length=64)
    state: str = Field(..., min_length=2, max_length=64)
    language_code: LanguageCodeEnum = "hi-IN"


#  Scheme Match 

class SchemeRequest(BaseModel):
    state: str = Field(..., min_length=2, max_length=64)
    farmer_type: Literal["small", "marginal", "tenant"]
    crop: Optional[str] = Field(None, max_length=64)
    language_code: LanguageCodeEnum = "hi-IN"
