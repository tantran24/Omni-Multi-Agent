import os
from typing import List

class Config:
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_API_URL: str = f"{OLLAMA_BASE_URL}/api"
    OLLAMA_HEALTH_CHECK_URL: str = f"{OLLAMA_BASE_URL}/api/tags"
    OLLAMA_CONNECTION_TIMEOUT: int = 5
    OLLAMA_MAX_RETRIES: int = 3
    OLLAMA_RETRY_DELAY: int = 2
    CORS_ORIGINS: List[str] = ["http://localhost:3000"]
    
    # LLM Configuration
    LLM_TEMPERATURE: float = 0.7
    LLM_CONTEXT_LENGTH: int = 4096
    LLM_TIMEOUT: int = 30
    LLM_MODEL: str = "llama3.2:latest"
    MAX_ITERATIONS: int = 10
    EARLY_STOPPING_METHOD: str = "force"
    LLM_BASE_URL: str = OLLAMA_BASE_URL
    MAX_RETRIES: int = 10
    RETRY_DELAY: int = 1
    MAX_TOKENS: int = 4096
