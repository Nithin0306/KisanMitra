"""
Routes — POST /query (Unified voice entry point).
Receives STT transcript, delegates to orchestrator, returns structured + voice response.
"""

from fastapi import APIRouter, Depends, Request
from app.models.request_models import VoiceQueryRequest
from app.models.response_models import VoiceQueryResponse
from app.engines import orchestrator
from app.services.llm_service import get_llm_service
from app.services import weather_service, market_service, scheme_service

router = APIRouter()


@router.post("", response_model=VoiceQueryResponse)
async def handle_voice_query(request_body: VoiceQueryRequest, request: Request):
    crop_rules = request.app.state.crop_rules
    llm = get_llm_service()

    return await orchestrator.handle_query(
        request=request_body,
        llm_service=llm,
        crop_rules=crop_rules,
        weather_service=weather_service,
        market_service=market_service,
        scheme_service=scheme_service,
    )
