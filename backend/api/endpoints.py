from fastapi import APIRouter, HTTPException, File, UploadFile
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

class TextPayload(BaseModel):
    text: str

class ImagePromptPayload(BaseModel):
    prompt: str

@router.post("/chat")
async def chat(chat_message: ChatMessage):
    try:
        logging.info(f"Received chat message: {chat_message.message}")
        
        if not chat_message.message:
            raise HTTPException(status_code=400, detail="Message cannot be empty")
            
        response = llm_service.process_prompt(chat_message.message)
        
        if not response:
            raise HTTPException(status_code=500, detail="No response from LLM service")
        
        # Check if response contains an image generation result
        if "generated_image.png" in response:
            return {
                "response": response,
                "has_image": True,
                "image_path": "generated_image.png"
            }
            
        logging.info(f"Sending response: {response}")
        return {"response": response, "has_image": False}
        
    except Exception as e:
        logging.error(f"Error processing chat message: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error processing message: {str(e)}"
        )

@router.post("/speak")
async def speak(payload: TextPayload):
    try:
        if not payload.text or not isinstance(payload.text, str):
            raise HTTPException(status_code=422, detail="Invalid text payload")
        
        text = payload.text.strip()
        if not text:
            raise HTTPException(status_code=422, detail="Empty text is not allowed")
            
        tts_service.process_text(text)
        return {"status": "success", "message": "Text processed successfully"}
    except Exception as e:
        logging.error(f"TTS error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/listen")
async def listen():
    result = stt_service.process_audio()
    return {"text": result}

@router.post("/generate-image")
async def generate_image(payload: ImagePromptPayload):
    image = image_service.generate_image(payload.prompt)
    image.save("generated_image.png")
    return {"status": "image generated", "file": "generated_image.png"}

@router.post("/upload-file")
async def upload_file(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        # Save file or process it as needed
        return {"status": "success", "filename": file.filename}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/config/gpt")
async def configure_gpt(config: GPTConfig):
    try:
        print(f"Received API key configuration request") 
        if not config.api_key:
            raise HTTPException(status_code=400, detail="API key cannot be empty")
            
        GPTService.set_api_key(config.api_key)
        print("API key configured successfully") 
        return {"status": "success"}
    except Exception as e:
        print(f"Error configuring API key: {str(e)}") 
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/chat_with_gpt")
async def chat(chat_message: ChatMessage):
    try:
        print(f"Received message: {chat_message.message}")  
        
        if not GPTService._client: 
            raise HTTPException(status_code=400, detail="API key not configured")
            
        if not chat_message.message:
            raise HTTPException(status_code=400, detail="Message cannot be empty")
            
        response = await GPTService.chat(chat_message.message)
        print(f"GPT response: {response}")  
        
        return {"response": response}
    except Exception as e:
        print(f"Error in chat endpoint: {str(e)}")  
        raise HTTPException(status_code=500, detail=str(e))

