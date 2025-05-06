import os
from typing import List
from dotenv import load_dotenv

load_dotenv(dotenv_path="core/.env")


class Config:
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    CORS_ORIGINS: List[str] = ["http://localhost:5173"]

    LLM_PROVIDER = "google_ai_studio"
    TTS_PROVIDER = "eleven_lab"
    # Google AI Studio
    GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
    GOOGLE_MODEL = os.getenv("GOOGLE_MODEL", "gemini-2.0-flash-thinking-exp-01-21")
    GOOGLE_IMAGE_GENERATOR_MODEL = os.getenv("GOOGLE_IMAGE_GENERATOR_MODEL", "gemini-2.0-flash-exp-image-generation")
    # Eleven Lab
    ELEVENLAB_API_KEY = os.getenv("ELEVENLAB_API_KEY")
    ELEVENLAB_MODEL = os.getenv("ELEVENLAB_MODEL", "eleven_flash_v2_5")
    ELEVENLAB_VOICE_ID = os.getenv("ELEVENLAB_VOICE_ID", "ueSxRO0nLF1bj93J2hVt")
    # Ollama
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_API_URL: str = f"{OLLAMA_BASE_URL}/api"
    OLLAMA_HEALTH_CHECK_URL: str = f"{OLLAMA_BASE_URL}/api/tags"
    OLLAMA_CONNECTION_TIMEOUT: int = 10
    OLLAMA_MAX_RETRIES: int = 3
    OLLAMA_RETRY_DELAY: int = 1

    LLM_MODEL: str = ""
    LLM_TEMPERATURE: float = 1.0
    LLM_CONTEXT_LENGTH: int = 4096
    LLM_TIMEOUT: int = 120
    LLM_BASE_URL: str = OLLAMA_BASE_URL
    MAX_TOKENS: int = 2048

    LLM_TOP_K: int = 64
    LLM_MIN_P: float = 0.01
    LLM_TOP_P: float = 0.95
    LLM_REPETITION_PENALTY: float = 1.0

    GEMMA_CHAT_TEMPLATE: str = (
        "<bos><start_of_turn>user\n{prompt}<end_of_turn>\n<start_of_turn>model\n"
    )

    MAX_ITERATIONS: int = 5
    MAX_RETRIES: int = 3
    RETRY_DELAY: int = 1
    EARLY_STOPPING_METHOD: str = "force"

    ENABLE_STREAMING: bool = False
