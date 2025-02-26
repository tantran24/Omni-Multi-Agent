from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import logging
from services.llm_service import LLMService
from services.gpt_service import GPTService

router = APIRouter()
llm_service = LLMService()

class ChatMessage(BaseModel):
    message: str

class ChatResponse(BaseModel):
    response: str

@router.post("/chat", response_model=ChatResponse)
async def chat(chat_message: ChatMessage):
    try:
        if not chat_message.message:
            raise HTTPException(status_code=400, detail="Message cannot be empty")
            
        # Use await since process_message is now async
        response = await llm_service.process_message(chat_message.message)
        if not response:
            raise HTTPException(status_code=500, detail="Empty response from LLM service")
            
        return ChatResponse(response=response)
        
    except Exception as e:
        logging.error(f"Error processing chat message: {str(e)}")
        return ChatResponse(response=str(e))

