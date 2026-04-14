"""
Routes — POST /market/price (direct market price advisory).
"""

from fastapi import APIRouter
from app.models.request_models import MarketRequest
from app.models.response_models import MarketResponse
from app.engines import market_engine
from app.services import market_service
from app.services.llm_service import get_llm_service

router = APIRouter()


@router.post("/price", response_model=MarketResponse)
async def get_market_price(body: MarketRequest):
    price_series, data_age_hours, is_stale = await market_service.get_price_series(
        crop_name=body.crop_name,
        district=body.district,
        state=body.state,
    )

    result = await market_engine.process(
        crop_name=body.crop_name,
        district=body.district,
        state=body.state,
        price_series=price_series,
        data_age_hours=data_age_hours,
        is_stale=is_stale,
    )

    llm = get_llm_service()
    voice_explanation = await llm.generate_explanation(
        factors=result.reasoning_factors,
        feature="market_price",
        language_code=body.language_code,
    )

    return MarketResponse(
        decision=result.decision,
        current_price_inr=result.current_price_inr,
        price_unit="per_quintal",
        trend_direction=result.trend_direction,
        confidence=result.confidence,
        moving_avg_3d=result.moving_avg_3d,
        moving_avg_7d=result.moving_avg_7d,
        data_age_hours=result.data_age_hours,
        voice_explanation=voice_explanation,
        degraded_mode=result.degraded_mode,
    )
