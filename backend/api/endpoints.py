from fastapi import APIRouter
from services.llm_service import LLMService
from services.tts_service import TTService
from services.stt_service import STTService
from services.image_service import ImageService

router = APIRouter()

llm_service = LLMService()
tts_service = TTService()
stt_service = STTService()
image_service = ImageService()

@router.post("/chat")
async def chat(prompt: str):
    response = llm_service.process_prompt(prompt)
    return {"response": response}

@router.post("/speak")
async def speak(text: str):
    tts_service.process_text(text)
    return {"status": "success"}

@router.post("/listen")
async def listen():
    result = stt_service.process_audio()
    return {"text": result}

@router.post("/generate-image")
async def generate_image(prompt: str):
    image = image_service.generate_image(prompt)
    image.save("generated_image.png")
    return {"status": "image generated", "file": "generated_image.png"}

