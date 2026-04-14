"""
Routes — POST /scheme/match (government scheme filter).
"""

from fastapi import APIRouter
from app.models.request_models import SchemeRequest
from app.models.response_models import SchemeResponse, SchemeResult
from app.engines import scheme_engine
from app.services import scheme_service
from app.services.llm_service import get_llm_service

router = APIRouter()


@router.post("/match", response_model=SchemeResponse)
async def match_schemes(body: SchemeRequest):
    schemes = await scheme_service.get_schemes()
    matches, total = await scheme_engine.process(
        state=body.state,
        farmer_type=body.farmer_type,
        crop=body.crop,
        schemes=schemes,
    )

    llm = get_llm_service()
    # LLM simplifies raw eligibility description per scheme
    simplified_matches = []
    for m in matches:
        simplified = await llm.generate_explanation(
            factors=[m.description],
            feature="scheme_match",
            language_code=body.language_code,
        )
        simplified_matches.append(SchemeResult(
            scheme_id=m.scheme_id,
            scheme_name=m.scheme_name,
            ministry=m.ministry,
            eligibility_summary=simplified[:300],  # Hard cap on character count
            application_url=m.application_url,
            deadline=None,
        ))

    voice_explanation = await llm.generate_explanation(
        factors=[
            f"{total} government schemes found for {body.farmer_type} farmers in {body.state}.",
            f"Top {len(simplified_matches)}: {', '.join(m.scheme_name for m in simplified_matches)}.",
        ],
        feature="scheme_match",
        language_code=body.language_code,
    )

    return SchemeResponse(
        matched_schemes=simplified_matches,
        total_matches_found=total,
        voice_explanation=voice_explanation,
    )
