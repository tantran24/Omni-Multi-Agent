import os
from typing import List


class Config:
    # Server Configuration
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    CORS_ORIGINS: List[str] = ["http://localhost:3000"]

    # Ollama Configuration
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_API_URL: str = f"{OLLAMA_BASE_URL}/api"
    OLLAMA_HEALTH_CHECK_URL: str = f"{OLLAMA_BASE_URL}/api/tags"
    OLLAMA_CONNECTION_TIMEOUT: int = 3  # Reduced timeout for faster failure detection
    OLLAMA_MAX_RETRIES: int = 2  # Reduced retries for faster fallback
    OLLAMA_RETRY_DELAY: int = 1  # Reduced delay for faster retry

    # LLM Configuration
    LLM_MODEL: str = "llama3-groq-tool-use:latest"
    LLM_TEMPERATURE: float = 0.7
    LLM_CONTEXT_LENGTH: int = 4096
    LLM_TIMEOUT: int = 20  # Reduced timeout for better responsiveness
    LLM_BASE_URL: str = OLLAMA_BASE_URL
    MAX_TOKENS: int = 4096

    # Performance Optimization
    MAX_ITERATIONS: int = 8  # Reduced iterations for faster processing
    MAX_RETRIES: int = 5  # Reduced retries for faster failure handling
    RETRY_DELAY: int = 1
    EARLY_STOPPING_METHOD: str = "force"
