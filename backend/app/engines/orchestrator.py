"""
Agent Orchestrator.

Routes voice transcripts through:
  1. LLM intent extraction (ONLY to pick a key from ALLOWED_INTENTS)
  2. Entity validation (deterministic)
  3. Engine dispatch (deterministic)
  4. LLM NLG (ONLY to convert reasoning_factors → farmer-readable explanation)

The LLM cannot alter any decision. Its output is validated against a hard allowlist.
"""

from __future__ import annotations

from typing import Any

import structlog

from app.core.config import settings
from app.models.request_models import VoiceQueryRequest
from app.models.response_models import VoiceQueryResponse, ErrorResponse

log = structlog.get_logger()

#  Constants 

ALLOWED_INTENTS = frozenset({
    "crop_recommendation",
    "market_price",
    "scheme_match",
})

REQUIRED_ENTITIES: dict[str, list[str]] = {
    "crop_recommendation": ["state", "district"],
    "market_price":         ["crop_name"],
    "scheme_match":         ["state", "farmer_type"],
}

INTENT_CONFIDENCE_THRESHOLD = 0.60

# Pre-baked error messages - LLM is never called for error responses
PRE_BAKED: dict[str, dict[str, str]] = {
    "unknown_intent": {
        "hi-IN": "माफ करें, मैं यह नहीं समझ पाया। कृपया फसल, मंडी भाव, या सरकारी योजना के बारे में पूछें।",
        "ta-IN": "மன்னிக்கவும், புரியவில்லை. பயிர், சந்தை அல்லது திட்டம் பற்றி கேளுங்கள்.",
        "te-IN": "క్షమించండి, అర్థం కాలేదు. పంట, మార్కెట్ లేదా పథకం గురించి అడగండి.",
        "kn-IN": "ಕ್ಷಮಿಸಿ, ಅರ್ಥವಾಗಲಿಲ್ಲ. ಬೆಳೆ, ಮಾರುಕಟ್ಟೆ ಅಥವಾ ಯೋಜನೆ ಬಗ್ಗೆ ಕೇಳಿ.",
        "mr-IN": "माफ करा, मला समजले नाही. पीक, बाजारभाव किंवा सरकारी योजनेबद्दल विचारा.",
        "pa-IN": "ਮਾਫ਼ ਕਰਨਾ, ਮੈਨੂੰ ਸਮਝ ਨਹੀਂ ਆਇਆ। ਫਸਲ, ਮੰਡੀ ਭਾਅ ਜਾਂ ਸਰਕਾਰੀ ਯੋਜਨਾ ਬਾਰੇ ਪੁੱਛੋ।",
        "en-IN": "Sorry, I couldn't understand. Please ask about crops, market prices, or government schemes.",
    },
    "low_stt_confidence": {
        "hi-IN": "आपकी आवाज़ स्पष्ट नहीं आई। कृपया शांत जगह पर फिर से बोलें।",
        "ta-IN": "உங்கள் குரல் தெளிவாக இல்லை. அமைதியான இடத்தில் மீண்டும் பேசுங்கள்.",
        "te-IN": "మీ గొంతు స్పష్టంగా వినబడలేదు. శాంతగా చోటులో మళ్లీ మాట్లాడండి.",
        "kn-IN": "ನಿಮ್ಮ ಧ್ವನಿ ಸ್ಪಷ್ಟವಾಗಿ ಬರಲಿಲ್ಲ. ಶಾಂತ ಸ್ಥಳದಲ್ಲಿ ಮತ್ತೊಮ್ಮೆ ಮಾತನಾಡಿ.",
        "mr-IN": "तुमचा आवाज स्पष्ट आला नाही. शांत ठिकाणी पुन्हा बोला.",
        "pa-IN": "ਤੁਹਾਡੀ ਆਵਾਜ਼ ਸਪੱਸ਼ਟ ਨਹੀਂ ਸੀ। ਕਿਸੇ ਸ਼ਾਂਤ ਥਾਂ 'ਤੇ ਦੁਬਾਰਾ ਬੋਲੋ।",
        "en-IN": "Your voice wasn't clear. Please speak again in a quiet place.",
    },
    "missing_entity": {
        "hi-IN": "कृपया अपना राज्य और जिला भी बताएं।",
        "ta-IN": "உங்கள் மாநிலம் மற்றும் மாவட்டம் கூறுங்கள்.",
        "te-IN": "దయచేసి మీ రాష్ట్రం మరియు జిల్లా చెప్పండి.",
        "kn-IN": "ದಯವಿಟ್ಟು ನಿಮ್ಮ ರಾಜ್ಯ ಮತ್ತು ಜಿಲ್ಲೆ ತಿಳಿಸಿ.",
        "mr-IN": "कृपया तुमचे राज्य आणि जिल्हा सांगा.",
        "pa-IN": "ਕਿਰਪਾ ਕਰਕੇ ਆਪਣਾ ਰਾਜ ਅਤੇ ਜ਼ਿਲ੍ਹਾ ਦੱਸੋ।",
        "en-IN": "Please also state your state and district.",
    },
}


def _pre_baked(key: str, language_code: str) -> str:
    lang_map = PRE_BAKED.get(key, {})
    return lang_map.get(language_code, lang_map.get("hi-IN", "Please try again."))


async def handle_query(
    request: VoiceQueryRequest,
    llm_service: Any,
    crop_rules: dict,
    weather_service: Any,
    market_service: Any,
    scheme_service: Any,
) -> VoiceQueryResponse:
    """
    Main orchestration function. Injected dependencies prevent direct imports in engines.
    """
    from app.engines import crop_engine, market_engine, scheme_engine
    from app.services.llm_service import IntentResult

    #  Step 1: STT confidence gate (before any LLM call) 
    if (
        request.stt_confidence is not None
        and request.stt_confidence < settings.STT_CONFIDENCE_THRESHOLD
    ):
        log.warning("orchestrator.low_stt", confidence=request.stt_confidence)
        return VoiceQueryResponse(
            intent="unknown",
            feature_response={
                "error_code": "LOW_STT_CONFIDENCE",
                "voice_message": _pre_baked("low_stt_confidence", request.language_code),
                "retryable": True,
            },
            voice_explanation=_pre_baked("low_stt_confidence", request.language_code),
            confidence=request.stt_confidence,
            degraded_mode=False,
        )

    #  Step 2: LLM intent extraction 
    location_hint = request.location
    intent_result: IntentResult = await llm_service.extract_intent(
        transcript=request.transcript,
        language_code=request.language_code,
        location_hint=location_hint,
    )
    log.info("orchestrator.intent", intent=intent_result.intent, confidence=intent_result.confidence)

    #  Step 3: Hard intent validation — LLM cannot expand scope 
    if intent_result.intent not in ALLOWED_INTENTS:
        return VoiceQueryResponse(
            intent="unknown",
            feature_response={"error_code": "INTENT_UNKNOWN", "retryable": True},
            voice_explanation=_pre_baked("unknown_intent", request.language_code),
            confidence=intent_result.confidence,
            degraded_mode=False,
        )

    #  Step 4: LLM confidence gate 
    if intent_result.confidence < INTENT_CONFIDENCE_THRESHOLD:
        return VoiceQueryResponse(
            intent="unknown",
            feature_response={"error_code": "INTENT_AMBIGUOUS", "retryable": True},
            voice_explanation=_pre_baked("unknown_intent", request.language_code),
            confidence=intent_result.confidence,
            degraded_mode=False,
        )

    #  Step 5: Entity completeness check 
    required = REQUIRED_ENTITIES[intent_result.intent]
    entities = intent_result.entities

    # Merge location context from request if missing from transcript
    if location_hint:
        entities.setdefault("state", location_hint.state)
        entities.setdefault("district", location_hint.district)

    missing = [k for k in required if not entities.get(k)]
    if missing:
        log.warning("orchestrator.missing_entities", missing=missing)
        return VoiceQueryResponse(
            intent=intent_result.intent,
            feature_response={"error_code": "MISSING_ENTITIES", "missing": missing, "retryable": True},
            voice_explanation=_pre_baked("missing_entity", request.language_code),
            confidence=intent_result.confidence,
            degraded_mode=False,
        )

    #  Step 6: Engine dispatch 
    reasoning_factors: list[str] = []
    feature_dict: dict = {}
    degraded = False

    if intent_result.intent == "crop_recommendation":
        entities.setdefault("soil_type", "loamy")  # Default if not extracted from transcript
        forecast, weather_source = await weather_service.get_forecast(
            state=entities["state"], district=entities["district"]
        )
        result = await crop_engine.process(entities, crop_rules, forecast, weather_source)
        reasoning_factors = result.reasoning_factors
        degraded = result.degraded_mode
        feature_dict = {
            "top_3_crops": [
                {"crop_name": c.crop_name, "score": c.score,
                 "soil_match": c.soil_match, "season_match": c.season_match,
                 "climate_fit": c.climate_fit}
                for c in result.top_3_crops
            ],
            "risk_level": result.risk_level,
            "reasoning_factors": result.reasoning_factors,
            "data_freshness": {"weather_source": result.weather_source},
            "degraded_mode": result.degraded_mode,
        }

    elif intent_result.intent == "market_price":
        price_series, data_age_hours, is_stale = await market_service.get_price_series(
            crop_name=entities["crop_name"],
            district=entities.get("district", ""),
            state=entities.get("state", ""),
        )
        result = await market_engine.process(
            crop_name=entities["crop_name"],
            district=entities.get("district", ""),
            state=entities.get("state", ""),
            price_series=price_series,
            data_age_hours=data_age_hours,
            is_stale=is_stale,
        )
        reasoning_factors = result.reasoning_factors
        degraded = result.degraded_mode
        feature_dict = {
            "decision": result.decision,
            "current_price_inr": result.current_price_inr,
            "price_unit": "per_quintal",
            "trend_direction": result.trend_direction,
            "confidence": result.confidence,
            "moving_avg_3d": result.moving_avg_3d,
            "moving_avg_7d": result.moving_avg_7d,
            "data_age_hours": result.data_age_hours,
            "degraded_mode": result.degraded_mode,
        }

    elif intent_result.intent == "scheme_match":
        schemes = await scheme_service.get_schemes()
        matches, total = await scheme_engine.process(
            state=entities["state"],
            farmer_type=entities.get("farmer_type", "small"),
            crop=entities.get("crop"),
            schemes=schemes,
        )
        reasoning_factors = [
            f"Found {total} schemes matching your eligibility.",
            f"Showing top {len(matches)} most relevant schemes for {entities['state']}.",
        ]
        degraded = False
        feature_dict = {
            "matched_schemes": [
                {"scheme_id": m.scheme_id, "scheme_name": m.scheme_name,
                 "ministry": m.ministry, "eligibility_summary": m.description,
                 "application_url": m.application_url, "deadline": m.deadline}
                for m in matches
            ],
            "total_matches_found": total,
        }

    #  Step 7: NLG - LLM converts factors -> voice explanation 
    voice_explanation = await llm_service.generate_explanation(
        factors=reasoning_factors,
        feature=intent_result.intent,
        language_code=request.language_code,
    )

    return VoiceQueryResponse(
        intent=intent_result.intent,
        feature_response=feature_dict,
        voice_explanation=voice_explanation,
        confidence=intent_result.confidence,
        degraded_mode=degraded,
    )
