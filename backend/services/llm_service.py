import logging
from core.config import Config
from agents.llm_agent import ChatAgent
from services.image_service import ImageService
import requests
import time
import re
from typing import Optional


class LLMService:
    def __init__(self):
        self.chat_agent = None
        self.image_service = ImageService()
        self.base_url = Config.OLLAMA_BASE_URL
        self.error_state = None
        self._initialize_chat_agent()

    def _check_ollama_connection(self) -> bool:
        for attempt in range(Config.OLLAMA_MAX_RETRIES):
            try:
                response = requests.get(
                    Config.OLLAMA_HEALTH_CHECK_URL,
                    timeout=Config.OLLAMA_CONNECTION_TIMEOUT,
                )
                if response.status_code == 200:
                    return True
            except requests.exceptions.RequestException as e:
                logging.warning(f"Attempt {attempt + 1} failed: {str(e)}")
                if attempt < Config.OLLAMA_MAX_RETRIES - 1:
                    time.sleep(Config.OLLAMA_RETRY_DELAY)
        return False

    def _initialize_chat_agent(self):
        if self._check_ollama_connection():
            try:
                self.chat_agent = ChatAgent()
                self.error_state = None
                logging.info("Successfully connected to Ollama server")
            except Exception as e:
                self.error_state = f"Failed to initialize chat agent: {str(e)}"
                logging.error(self.error_state)
        else:
            self.error_state = (
                "Could not connect to Ollama server after multiple attempts"
            )
            logging.error(self.error_state)

    async def process_message(self, message: str) -> str:
        if self.chat_agent is None:
            if self.error_state:
                return f"Error: {self.error_state}"
            self._initialize_chat_agent()
            if self.chat_agent is None:
                return "Error: Could not connect to Ollama server. Please ensure it's running."

        try:
            logging.info(f"Processing message: {message}")
            response = self.chat_agent.chat(message)

            image_match = re.search(r"\[Tool Used\] generate_image\((.*?)\)", response)
            if image_match:
                prompt = image_match.group(1)
                try:
                    image_result = self.image_service.generate_image(prompt)
                    response = response.replace(
                        f"[Tool Used] generate_image({prompt})",
                        f'![Generated Image]({image_result["url"]})',
                    )
                except Exception as e:
                    logging.error(f"Image generation error: {str(e)}")
                    response += (
                        f"\nSorry, there was an error generating the image: {str(e)}"
                    )

            logging.info(f"Response received: {response}")
            return response
        except Exception as e:
            logging.error(f"Error in LLM service: {str(e)}")
            return f"Error: {str(e)}"
