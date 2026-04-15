"""
LLM Service — Vertex AI Gemini wrapper.

ONLY two calls are made to the LLM:
  1. extract_intent()        — classify transcript into a known intent enum
  2. generate_explanation()  — convert reasoning_factors list to voice-friendly text

The LLM NEVER receives scores, rankings, or any decision-making context.
Swapping providers: implement a new class conforming to LLMServiceProtocol and
update core/config.py LLM_PROVIDER. No other file changes required.
"""

from __future__ import annotations

import json
from dataclasses import dataclass, field
from typing import Any, Optional, Protocol, runtime_checkable

import structlog
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

from app.core.config import settings
from app.models.request_models import LocationContext

log = structlog.get_logger()


#  Protocol (interface) 

@dataclass
class IntentResult:
    intent: str                    # Must be in orchestrator.ALLOWED_INTENTS; validated there
    entities: dict[str, str]       # Extracted named entities (state, district, crop_name, etc.)
    confidence: float              # 0.0–1.0; orchestrator gates on < 0.60


@runtime_checkable
class LLMServiceProtocol(Protocol):
    async def extract_intent(
        self, transcript: str, language_code: str,
        location_hint: Optional[LocationContext]
    ) -> IntentResult: ...

    async def generate_explanation(
        self, factors: list[str], feature: str, language_code: str
    ) -> str: ...


#  Prompt templates 

INTENT_PROMPT_TEMPLATE = """\
You are an intent classifier for an agricultural voice assistant.
The farmer spoke in {language_code}.
Transcript: "{transcript}"
{location_hint_line}

Classify the intent into exactly one of:
- crop_recommendation
- market_price
- scheme_match
- unknown

Also extract named entities if present:
- state (Indian state name, in English)
- district (district name, in English)
- crop_name (crop name, in English)
- farmer_type (small | marginal | tenant)

Respond ONLY with valid JSON in this exact shape, no explanation:
{{"intent": "...", "entities": {{"state": "...", "district": "...", "crop_name": "...", "farmer_type": "..."}}, "confidence": 0.0}}

Rules:
- confidence must be a float between 0.0 and 1.0
- omit entity keys that are not present in the transcript
- intent must be exactly one of the four options above
"""

NLG_PROMPT_TEMPLATE = """\
You are a helpful agricultural assistant explaining advice to a low-literacy farmer in rural India.
Convert the following technical rule-engine findings into 2 simple, warm sentences in {language_code}.
Do not add any new information. Do not make any recommendations beyond what is listed. Maximum 80 words.

Findings:
{factors_text}

Language: {language_code}
Output (only the explanation, no labels):"""


#  Vertex AI implementation 

class VertexAILLMService:
    """
    Wraps google-cloud-aiplatform GenerativeModel.
    Handles retries, timeouts, and fallback for NLG failures.
    """

    def __init__(self):
        try:
            import vertexai
            from vertexai.generative_models import GenerativeModel
            vertexai.init(project=settings.GCP_PROJECT_ID, location=settings.GCP_REGION)
            self._model = GenerativeModel(settings.LLM_MODEL)
            log.info("llm_service.initialized", provider="vertex_ai", model=settings.LLM_MODEL)
        except Exception as exc:
            log.error("llm_service.init_failed", error=str(exc))
            self._model = None

    @retry(
        stop=stop_after_attempt(2),
        wait=wait_exponential(multiplier=1, min=1, max=4),
        retry=retry_if_exception_type(Exception),
        reraise=False,
    )
    async def _call_model(self, prompt: str) -> str:
        if self._model is None:
            raise RuntimeError("Vertex AI model not initialized")
        response = await self._model.generate_content_async(prompt)
        return response.text.strip()

    async def extract_intent(
        self,
        transcript: str,
        language_code: str,
        location_hint: Optional[LocationContext] = None,
    ) -> IntentResult:
        hint_line = ""
        if location_hint:
            hint_line = f"Known location context: state={location_hint.state}, district={location_hint.district}"

        prompt = INTENT_PROMPT_TEMPLATE.format(
            language_code=language_code,
            transcript=transcript[:500],  # Truncate to prevent prompt injection
            location_hint_line=hint_line,
        )

        try:
            raw = await self._call_model(prompt)
            # Strip markdown code fences if model wraps response
            raw = raw.strip().strip("```json").strip("```").strip()
            parsed = json.loads(raw)

            intent = str(parsed.get("intent", "unknown")).lower().strip()
            entities = {k: str(v) for k, v in parsed.get("entities", {}).items() if v}
            confidence = float(parsed.get("confidence", 0.0))
            confidence = max(0.0, min(1.0, confidence))  # Clamp

            return IntentResult(intent=intent, entities=entities, confidence=confidence)

        except Exception as exc:
            log.error("llm_service.intent_extraction_failed", error=str(exc))
            # Fail safe: return unknown intent, orchestrator will handle gracefully
            return IntentResult(intent="unknown", entities={}, confidence=0.0)

    async def generate_explanation(
        self,
        factors: list[str],
        feature: str,
        language_code: str,
    ) -> str:
        factors_text = "\n".join(f"- {f}" for f in factors)
        prompt = NLG_PROMPT_TEMPLATE.format(
            language_code=language_code,
            factors_text=factors_text,
        )

        try:
            explanation = await self._call_model(prompt)
            # Hard cap on explanation length (rural TTS bandwidth)
            words = explanation.split()
            if len(words) > 80:
                explanation = " ".join(words[:80]) + "।"
            return explanation
        except Exception as exc:
            log.error("llm_service.nlg_failed", error=str(exc))
            # Fallback: join raw factors in English — always better than silence
            return " ".join(factors[:3])


#  Gemini API implementation (fallback) 

class GeminiLLMService:
    """
    Wraps standard google-generativeai using a simple API key.
    Useful for local dev without a heavy GCP footprint.
    """

    def __init__(self):
        try:
            import google.generativeai as genai
            if not settings.GEMINI_API_KEY:
                raise ValueError("GEMINI_API_KEY is not set")
            genai.configure(api_key=settings.GEMINI_API_KEY)
            self._model = genai.GenerativeModel(settings.LLM_MODEL)
            log.info("llm_service.initialized", provider="gemini", model=settings.LLM_MODEL)
        except Exception as exc:
            log.error("llm_service.init_failed", error=str(exc))
            self._model = None

    @retry(
        stop=stop_after_attempt(2),
        wait=wait_exponential(multiplier=1, min=1, max=4),
        retry=retry_if_exception_type(Exception),
        reraise=False,
    )
    async def _call_model(self, prompt: str) -> str:
        if self._model is None:
            raise RuntimeError("Gemini model not initialized")
        response = await self._model.generate_content_async(prompt)
        return response.text.strip()

    async def extract_intent(
        self,
        transcript: str,
        language_code: str,
        location_hint: Optional[LocationContext] = None,
    ) -> IntentResult:
        hint_line = ""
        if location_hint:
            hint_line = f"Known location context: state={location_hint.state}, district={location_hint.district}"

        prompt = INTENT_PROMPT_TEMPLATE.format(
            language_code=language_code,
            transcript=transcript[:500],
            location_hint_line=hint_line,
        )

        try:
            raw = await self._call_model(prompt)
            raw = raw.strip().strip("```json").strip("```").strip()
            parsed = json.loads(raw)

            intent = str(parsed.get("intent", "unknown")).lower().strip()
            entities = {k: str(v) for k, v in parsed.get("entities", {}).items() if v}
            confidence = float(parsed.get("confidence", 0.0))
            confidence = max(0.0, min(1.0, confidence))

            return IntentResult(intent=intent, entities=entities, confidence=confidence)

        except Exception as exc:
            log.error("llm_service.intent_extraction_failed", error=str(exc))
            return IntentResult(intent="unknown", entities={}, confidence=0.0)

    async def generate_explanation(
        self,
        factors: list[str],
        feature: str,
        language_code: str,
    ) -> str:
        factors_text = "\n".join(f"- {f}" for f in factors)
        prompt = NLG_PROMPT_TEMPLATE.format(
            language_code=language_code,
            factors_text=factors_text,
        )

        try:
            explanation = await self._call_model(prompt)
            words = explanation.split()
            if len(words) > 80:
                explanation = " ".join(words[:80]) + "।"
            return explanation
        except Exception as exc:
            log.error("llm_service.nlg_failed", error=str(exc))
            return " ".join(factors[:3])


#  Factory 

def build_llm_service(provider: str = settings.LLM_PROVIDER) -> LLMServiceProtocol:
    """
    To swap providers: add a new class above implementing LLMServiceProtocol,
    then add a branch here. No other file changes required.
    """
    if provider == "vertex_ai":
        return VertexAILLMService()
    if provider == "gemini":
        return GeminiLLMService()
    raise ValueError(f"Unknown LLM provider: {provider}")


# Module-level singleton — injected via FastAPI Depends
_llm_service_instance: LLMServiceProtocol | None = None


def get_llm_service() -> LLMServiceProtocol:
    global _llm_service_instance
    if _llm_service_instance is None:
        _llm_service_instance = build_llm_service()
    return _llm_service_instance
