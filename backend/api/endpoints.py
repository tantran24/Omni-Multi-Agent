from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import logging
from services.llm_service import LLMService
from services.tts_service import TTService
from services.stt_service import STTService
from services.image_service import ImageService
from services.gpt_service import GPTService

router = APIRouter()

llm_service = LLMService()
tts_service = TTService()
stt_service = STTService()
image_service = ImageService()

class GPTConfig(BaseModel):
    api_key: str

class ChatMessage(BaseModel):
    message: str

@router.post("/config/gpt")
async def configure_gpt(config: GPTConfig):
    try:
        print(f"Received API key configuration request") # Debug log
        if not config.api_key:
            raise HTTPException(status_code=400, detail="API key cannot be empty")
            
        GPTService.set_api_key(config.api_key)
        print("API key configured successfully") # Debug log
        return {"status": "success"}
    except Exception as e:
        print(f"Error configuring API key: {str(e)}") # Debug log
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/chat")
async def chat(chat_message: ChatMessage):
    try:
        print(f"Received message: {chat_message.message}")  # Debug log
        
        if not GPTService._client:  # Changed from _api_key to _client
            raise HTTPException(status_code=400, detail="API key not configured")
            
        if not chat_message.message:
            raise HTTPException(status_code=400, detail="Message cannot be empty")
            
        response = await GPTService.chat(chat_message.message)
        print(f"GPT response: {response}")  # Debug log
        
        return {"response": response}
    except Exception as e:
        print(f"Error in chat endpoint: {str(e)}")  # Debug log
        raise HTTPException(status_code=500, detail=str(e))

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

