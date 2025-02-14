from fastapi import Depends
from services.llm_service import LLMService
from services.tts_service import TTService

def get_llm_service():
    return LLMService()

def get_tts_service():
    return TTService()

