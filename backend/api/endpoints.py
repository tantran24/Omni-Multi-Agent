from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import logging
from services.llm_service import LLMService

router = APIRouter()
llm_service = LLMService()


class ChatMessage(BaseModel):
    message: str


class ChatResponse(BaseModel):
    response: str


@router.post("/chat", response_model=ChatResponse)
async def chat(chat_message: ChatMessage):
    if not chat_message.message:
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    try:
        response = await llm_service.process_message(chat_message.message)
        if not response:
            raise HTTPException(
                status_code=500, detail="Empty response from LLM service"
            )

        return ChatResponse(response=response)

    except Exception as e:
        logging.error(f"Error processing chat message: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
