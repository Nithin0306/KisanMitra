"""
Language utilities — locale mappings and prompt-language labels.
Stateless — no I/O, no state.
"""

LANGUAGE_LABELS: dict[str, str] = {
    "hi-IN": "Hindi",
    "ta-IN": "Tamil",
    "te-IN": "Telugu",
    "kn-IN": "Kannada",
    "mr-IN": "Marathi",
    "pa-IN": "Punjabi",
}

DEFAULT_LANGUAGE = "hi-IN"


def language_label(code: str) -> str:
    """Returns 'Hindi', 'Tamil', etc. for a given BCP 47 code."""
    return LANGUAGE_LABELS.get(code, LANGUAGE_LABELS[DEFAULT_LANGUAGE])


def is_supported(code: str) -> bool:
    return code in LANGUAGE_LABELS
