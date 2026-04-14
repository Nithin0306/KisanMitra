"""
Routes — POST /crop/recommend (direct, bypass intent layer).
Used when the client already knows it needs a crop recommendation.
"""

from fastapi import APIRouter, Request
from app.models.request_models import CropRequest
from app.models.response_models import CropResponse, DataFreshness
from app.engines import crop_engine
from app.services import weather_service
from app.services.llm_service import get_llm_service

router = APIRouter()


@router.post("/recommend", response_model=CropResponse)
async def recommend_crops(body: CropRequest, request: Request):
    crop_rules = request.app.state.crop_rules

    # Use override forecast if provided (test/dev), else fetch live
    if body.forecast_override:
        from app.engines.crop_engine import DayForecast
        forecast = [
            DayForecast(
                date=f.date, temp_max_c=f.temp_max_c, temp_min_c=f.temp_min_c,
                rainfall_mm=f.rainfall_mm, humidity_pct=f.humidity_pct,
            )
            for f in body.forecast_override
        ]
        source = "live"
    else:
        forecast, source = await weather_service.get_forecast(body.state, body.district)

    entities = {
        "soil_type": body.soil_type,
        "state": body.state,
        "district": body.district,
    }
    result = await crop_engine.process(entities, crop_rules, forecast, source)

    llm = get_llm_service()
    voice_explanation = await llm.generate_explanation(
        factors=result.reasoning_factors,
        feature="crop_recommendation",
        language_code=body.language_code,
    )

    return CropResponse(
        top_3_crops=[
            {"crop_name": c.crop_name, "score": c.score,
             "soil_match": c.soil_match, "season_match": c.season_match,
             "climate_fit": c.climate_fit}
            for c in result.top_3_crops
        ],
        risk_level=result.risk_level,
        reasoning_factors=result.reasoning_factors,
        voice_explanation=voice_explanation,
        data_freshness=DataFreshness(weather_source=result.weather_source),
        degraded_mode=result.degraded_mode,
    )
