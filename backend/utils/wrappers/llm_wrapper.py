"""LLM Wrapper with async support for different LLM providers"""

from typing import List
from langchain_core.messages import BaseMessage
from langchain_community.chat_models import ChatOllama
from langchain_google_genai import ChatGoogleGenerativeAI
from core.config import Config
import logging

logger = logging.getLogger(__name__)


class LLMWrapper:
    def __init__(self):
        self.provider = Config.LLM_PROVIDER

        if self.provider == "google_ai_studio":
            try:
                self.model = ChatGoogleGenerativeAI(
                    model=Config.GOOGLE_MODEL,
                    google_api_key=Config.GOOGLE_API_KEY,
                    temperature=Config.LLM_TEMPERATURE,
                )
            except Exception as e:
                logger.error(
                    f"[LLMWrapper] Error initializing ChatGoogleGenerativeAI: {e}"
                )
                raise e
        else:  # Ollama
            self.model = ChatOllama(
                model=Config.LLM_MODEL,
                base_url=Config.OLLAMA_BASE_URL,
                retry_on_failure=True,
                seed=42,
                temperature=Config.LLM_TEMPERATURE,
                timeout=Config.LLM_TIMEOUT,
                num_ctx=Config.LLM_CONTEXT_LENGTH,
                streaming=Config.ENABLE_STREAMING,
                top_k=Config.LLM_TOP_K,
                top_p=Config.LLM_TOP_P,
                min_p=Config.LLM_MIN_P,
                repeat_penalty=Config.LLM_REPETITION_PENALTY,
            )

    async def invoke(self, messages: List[BaseMessage]) -> BaseMessage:
        """Invoke the LLM model asynchronously"""
        try:
            response = await self.model.ainvoke(messages)
            return response
        except Exception as e:
            logger.error(f"[LLMWrapper] Invoke error ({self.provider}): {e}")
            raise e
