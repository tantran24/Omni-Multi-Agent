from openai import AsyncOpenAI
from typing import Optional
import logging

logger = logging.getLogger(__name__)


class GPTService:
    _client: Optional[AsyncOpenAI] = None

    @classmethod
    def set_api_key(cls, api_key: str):
        try:
            cls._client = AsyncOpenAI(api_key=api_key)
            cls._client.completions.create(
                model="text-davinci-003", prompt="test", max_tokens=5
            )
        except Exception as e:
            cls._client = None
            raise ValueError(f"Failed to configure GPT client: {str(e)}")

    @classmethod
    async def chat(cls, message: str) -> str:
        if not cls._client:
            raise ValueError("GPT client not configured")

        try:
            response = await cls._client.chat.completions.create(
                model="gpt-3.5-turbo", messages=[{"role": "user", "content": message}]
            )
            return response.choices[0].message.content
        except Exception as e:
            raise ValueError(f"GPT chat error: {str(e)}")
