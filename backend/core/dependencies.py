from fastapi import Depends
from services.llm_service import LLMService
from services.tts_service import TTService

_llm_service = None
_tts_service = None


def get_llm_service():
    global _llm_service
    if _llm_service is None:
        _llm_service = LLMService()
    return _llm_service


def get_tts_service():
    global _tts_service
    if _tts_service is None:
        _tts_service = TTService()
    return _tts_service
