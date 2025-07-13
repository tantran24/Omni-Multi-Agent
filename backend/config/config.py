import os
from typing import List
from dotenv import load_dotenv

# Load environment variables from .env file in the config directory
config_dir = os.path.dirname(os.path.abspath(__file__))
env_path = os.path.join(config_dir, ".env")
load_dotenv(dotenv_path=env_path)


class Config:
    # Server Configuration
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    CORS_ORIGINS: List[str] = ["http://localhost:5173"]

    # Provider Settings
    LLM_PROVIDER = "google_ai_studio"
    TTS_PROVIDER = "eleven_lab"

    # Google AI Studio Configuration
    GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
    GOOGLE_MODEL = os.getenv("GOOGLE_MODEL", "gemini-2.5-flash")
    GOOGLE_IMAGE_GENERATOR_MODEL = os.getenv(
        "GOOGLE_IMAGE_GENERATOR_MODEL", "gemini-2.0-flash-preview-image-generation"
    )

    # Eleven Labs Configuration
    ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY")
    ELEVENLABS_MODEL = os.getenv("ELEVENLABS_MODEL", "eleven_flash_v2_5")
    ELEVENLABS_VOICE_ID = os.getenv("ELEVENLABS_VOICE_ID", "foH7s9fX31wFFH2yqrFa")

    # Ollama Configuration
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_API_URL: str = f"{OLLAMA_BASE_URL}/api"
    OLLAMA_HEALTH_CHECK_URL: str = f"{OLLAMA_BASE_URL}/api/tags"
    OLLAMA_CONNECTION_TIMEOUT: int = 10
    OLLAMA_MAX_RETRIES: int = 3
    OLLAMA_RETRY_DELAY: int = 1

    # LLM Configuration
    LLM_MODEL: str = ""
    LLM_TEMPERATURE: float = 1.0
    LLM_CONTEXT_LENGTH: int = 4096
    LLM_TIMEOUT: int = 120
    LLM_BASE_URL: str = OLLAMA_BASE_URL
    MAX_TOKENS: int = 2048

    # LLM Advanced Parameters
    LLM_TOP_K: int = 64
    LLM_MIN_P: float = 0.01
    LLM_TOP_P: float = 0.95
    LLM_REPETITION_PENALTY: float = 1.0

    # Template Configuration
    GEMMA_CHAT_TEMPLATE: str = (
        "<bos><start_of_turn>user\n{prompt}<end_of_turn>\n<start_of_turn>model\n"
    )

    # Agent Configuration
    MAX_ITERATIONS: int = 5
    MAX_RETRIES: int = 3
    RETRY_DELAY: int = 1
    EARLY_STOPPING_METHOD: str = "force"

    # Feature Flags
    ENABLE_STREAMING: bool = False

    # File Paths Configuration
    CACHE_DIR: str = "database/cache"
    AUDIO_UPLOAD_DIR: str = f"{CACHE_DIR}/audioUpload"
    GENERATED_IMAGES_DIR: str = f"{CACHE_DIR}/generated_images"
    UPLOADED_FILES_DIR: str = f"{CACHE_DIR}/uploaded_files"

    # Database Configuration
    QDRANT_URL: str = "http://localhost:6333"
    QDRANT_COLLECTION_NAME: str = "rag_collection"
