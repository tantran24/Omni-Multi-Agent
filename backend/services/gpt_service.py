from openai import AsyncOpenAI
from typing import Optional
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class GPTService:
    _client: Optional[AsyncOpenAI] = None

    @classmethod
    def set_api_key(cls, api_key: str):
        try:
            cls._client = AsyncOpenAI(api_key=api_key)
            logger.info("GPT client configured successfully")

            test_response = cls._client.completions.create(
                model="text-davinci-003",
                prompt="test",
                max_tokens=5
            )
            logger.info("API key verified successfully")
        except Exception as e:
            logger.error(f"Failed to configure GPT client: {str(e)}")
            cls._client = None
            raise

    @classmethod
    async def chat(cls, message: str) -> str:
        if not cls._client:
            logger.error("GPT client not configured")
            raise ValueError("GPT client not configured")

        try:
            logger.info(f"Sending message to GPT: {message}")
            response = await cls._client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[{"role": "user", "content": message}]
            )
            response_text = response.choices[0].message.content
            logger.info(f"Received GPT response: {response_text}")
            return response_text
        except Exception as e:
            logger.error(f"GPT chat error: {str(e)}")
            raise
