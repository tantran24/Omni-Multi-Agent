from fastapi import APIRouter, HTTPException, BackgroundTasks, UploadFile, File
from pydantic import BaseModel, Field
import asyncio
from services.llm_service import LLMService
import re
from typing import Optional
import logging
from fastapi.responses import JSONResponse
import shutil
import os

from stt.decode import run

logger = logging.getLogger(__name__)

router = APIRouter()
llm_service = LLMService()


class ChatMessage(BaseModel):
    message: str


class ChatResponse(BaseModel):
    response: str
    image: Optional[str] = Field(default=None)


@router.post("/chat", response_model=ChatResponse)
async def chat(chat_message: ChatMessage, background_tasks: BackgroundTasks):
    """
    Process a chat message and return a response from the appropriate agent
    """
    if not chat_message.message or not chat_message.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    try:
        response = await llm_service.process_message(chat_message.message)

        if not response:
            raise HTTPException(
                status_code=500, detail="Empty response from LLM service"
            )

        # Extract image URL if present in the response
        image_url = None
        img_match = re.search(
            r"!\[Generated Image\]\((/generated_images/[^)]+)\)", response
        )
        if img_match:
            image_url = img_match.group(1)
            # Clean up the response by removing the image markdown
            response = re.sub(r"!\[Generated Image\]\([^)]+\)", "", response)
            response = response.strip()

        # Ensure the LLM service is ready for the next request
        background_tasks.add_task(ensure_llm_service_ready)

        return ChatResponse(response=response, image=image_url)

    except asyncio.TimeoutError:
        logger.error("Request processing timed out")
        raise HTTPException(
            status_code=504,
            detail="Processing took too long. Please try a shorter or simpler query.",
        )
    except Exception as e:
        logger.error(f"Error processing chat request: {str(e)}")
        if "connection" in str(e).lower():
            raise HTTPException(
                status_code=503,
                detail="Could not connect to language model. Please check if Ollama is running.",
            )
        raise HTTPException(status_code=500, detail=str(e))


async def ensure_llm_service_ready():
    """Ensure that the LLM service is initialized and ready for the next request"""
    try:
        await llm_service.ensure_initialized()
    except Exception as e:
        logger.error(f"Error ensuring LLM service is ready: {str(e)}")



@router.post("/transcribe")
async def transcribe(audio: UploadFile = File(...)):

    temp_file_path = f"audioUpload/{audio.filename}"
    print(os.path.isdir('audioUpload'))
    with open(temp_file_path, "wb") as buffer:
        shutil.copyfileobj(audio.file, buffer)

    try:
        result = run(long_form_audio=temp_file_path)
    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)

    return {"transcription": result}