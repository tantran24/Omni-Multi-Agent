from fastapi import (
    APIRouter,
    HTTPException,
    BackgroundTasks,
    UploadFile,
    File,
    WebSocket,
    Form,
)
from pydantic import BaseModel, Field
import asyncio
from services.llm_service import LLMService
from services.conversation_service import ConversationService
import re
from typing import Optional, Dict, Any
import logging
from fastapi.responses import JSONResponse, Response
import shutil
import os
import torch
from services.mcp_service import detach_mcp_service
import datetime
from utils.api.pdf_reader import router as pdf_router
from utils.api.memory_endpoints import router as memory_router
from config.config import Config

from utils.stt.decode import run

logger = logging.getLogger(__name__)

router = APIRouter()
llm_service = LLMService()
conversation_service = ConversationService()


class ChatMessage(BaseModel):
    message: str
    session_id: Optional[str] = Field(
        default=None, description="Session ID for conversation context"
    )


class ChatResponse(BaseModel):
    response: str
    image: Optional[str] = Field(default=None)
    session_id: Optional[str] = Field(
        default=None, description="Session ID used for this conversation"
    )


@router.post("/chat", response_model=ChatResponse)
async def chat(chat_message: ChatMessage, background_tasks: BackgroundTasks):
    """
    Process a chat message and return a response from the appropriate agent with session management
    """
    if not chat_message.message or not chat_message.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    # Process with session support
    response = await llm_service.process_message(
        chat_message.message, session_id=chat_message.session_id
    )

    if not response:
        raise HTTPException(status_code=500, detail="Empty response from LLM service")

    image_url = None
    img_match = re.search(
        r"!\[Generated Image\]\((/generated_images/[^)]+)\)", response
    )
    if img_match:
        image_url = img_match.group(1)
        response = re.sub(r"!\[Generated Image\]\([^)]+\)", "", response)
        response = response.strip()

    background_tasks.add_task(ensure_llm_service_ready)

    # Get current session ID for response
    current_session_id = llm_service.get_current_session_id()

    return ChatResponse(
        response=response, image=image_url, session_id=current_session_id
    )


@router.post("/chat-with-image", response_model=ChatResponse)
async def chat_with_image(
    text: str = Form(""),
    image: UploadFile = File(...),
    session_id: str = Form(None),
    background_tasks: BackgroundTasks = None,
):
    """
    Process a chat message with an uploaded image/document and return a response with session support
    """
    try:  # Create directory for uploaded files if it doesn't exist
        os.makedirs(Config.UPLOADED_FILES_DIR, exist_ok=True)

        # Generate a unique filename with extension
        file_extension = os.path.splitext(image.filename)[1].lower()
        timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        unique_filename = f"file_{timestamp}{file_extension}"
        file_path = os.path.join(Config.UPLOADED_FILES_DIR, unique_filename)

        # Save the uploaded file
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(image.file, buffer)

        # Create public URL for the file
        file_url = f"/uploaded_files/{unique_filename}"

        # Determine file type
        content_type = image.content_type or ""

        if "pdf" in content_type or file_extension == ".pdf":
            file_type = "pdf"
        else:
            file_type = "image"

        # Create message with file info
        message = text.strip()
        if not message:
            if file_type == "pdf":
                message = f"I've uploaded this PDF document. Can you help me analyze it? {file_url}"
            else:
                message = "I've uploaded this image. Can you describe what you see?"  # Process the message with session support
        response = await llm_service.process_message(message, session_id=session_id)

        if not response:
            raise HTTPException(
                status_code=500, detail="Empty response from LLM service"
            )

        # Check for image in response
        image_url = None
        img_match = re.search(
            r"!\[Generated Image\]\((/generated_images/[^)]+)\)", response
        )
        if img_match:
            image_url = img_match.group(1)
            response = re.sub(r"!\[Generated Image\]\([^)]+\)", "", response)
            response = (
                response.strip()
            )  # If no image was generated but we have a file, include the file URL
        if not image_url and file_url:
            image_url = file_url

        if background_tasks:
            background_tasks.add_task(ensure_llm_service_ready)

        # Get current session ID for response
        current_session_id = llm_service.get_current_session_id()

        return ChatResponse(
            response=response, image=image_url, session_id=current_session_id
        )

    except Exception as e:
        logger.error(f"Error in chat_with_image: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


async def ensure_llm_service_ready():
    """Ensure that the LLM service is initialized and ready for the next request"""
    try:
        await llm_service.ensure_initialized()
    except Exception as e:
        logger.error(f"Error ensuring LLM service is ready: {str(e)}")


@router.post("/transcribe")
async def transcribe(audio: UploadFile = File(...)):

    temp_file_path = f"{Config.AUDIO_UPLOAD_DIR}/{audio.filename}"
    print(os.path.isdir(Config.AUDIO_UPLOAD_DIR))
    with open(temp_file_path, "wb") as buffer:
        shutil.copyfileobj(audio.file, buffer)

    try:
        result = conversation_service.stt(audio_path=temp_file_path)
    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)
    finally:
        os.remove(temp_file_path)
    return {"transcription": result}


@router.get("/mcp/configs")
async def list_mcp_configs():
    """List all MCP configurations, flattening any legacy 'mcpServers' wrapper"""
    configs = detach_mcp_service.list_configs()
    if "mcpServers" in configs and isinstance(configs["mcpServers"], dict):
        return configs["mcpServers"]
    return configs


@router.get("/mcp/tools")
async def list_mcp_tools():
    """List all available MCP tool metadata"""
    logger.info(f"Listing MCP tools with configs: {detach_mcp_service.list_configs()}")

    await detach_mcp_service.initialize_client()
    tools = await detach_mcp_service.get_tools()

    # If tools exist, return their actual metadata
    if tools:
        return [{"name": tool.name, "description": tool.description} for tool in tools]
    # Fallback to config names if no tools available
    return [
        {"name": name, "description": f"MCP tool: {name} (not initialized)"}
        for name in detach_mcp_service.list_configs().keys()
    ]


@router.post("/mcp/configs", status_code=201)
async def add_mcp_config(config_body: dict):
    """Add or update MCP configurations by JSON map of names to configs"""
    try:
        mapping = (
            config_body.get("mcpServers")
            if "mcpServers" in config_body
            else config_body
        )
        if not isinstance(mapping, dict) or not mapping:
            raise HTTPException(
                status_code=400, detail="Invalid MCP configuration payload"
            )
        for name, conf in mapping.items():
            await detach_mcp_service.add_config(name, conf)
        # Reset LLM service to rebuild graph with new MCP tools
        llm_service.initialized = False
        llm_service.chat_agent = None
        updated = detach_mcp_service.list_configs()
        # Return using JSONResponse for correct headers
        return JSONResponse(status_code=201, content=updated)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error adding MCP configs: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/mcp/configs/{name}")
async def delete_mcp_config(name: str):
    """Delete an existing MCP configuration"""
    try:
        await detach_mcp_service.delete_config(name)
        llm_service.initialized = False
        llm_service.chat_agent = None
        return Response(status_code=204)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/mcp/status")
async def get_mcp_status():
    """Get detailed status information about MCP service and tools"""
    from utils.mcp_utils import check_mcp_status

    status = await check_mcp_status()
    return status


@router.websocket("/ws/conversation")
async def websocket_conversation(websocket: WebSocket):
    await websocket.accept()
    while True:
        data: bytes = await websocket.receive_bytes()
        if len(data) > 0:
            audio_tensor = torch.frombuffer(data, dtype=torch.float32).unsqueeze(0)
            audio_tensor = audio_tensor * 32767

            text_transcribe = await asyncio.to_thread(
                conversation_service.stt, data=audio_tensor, audio_path=" "
            )
            text_response = await conversation_service.process_message(text_transcribe)
            audio_response = conversation_service.tts(text_response)
            audio_bytes_to_send: bytes = audio_response.getvalue()
            await websocket.send_bytes(audio_bytes_to_send)


@router.post("/read-pdf")
async def read_pdf(pdf_path: str):
    """
    Read PDF content using PyPDF2 and return the text
    """
    try:
        import PyPDF2

        # Make sure the path starts from the proper location
        if pdf_path.startswith("/uploaded_files/"):
            filename = pdf_path.replace("/uploaded_files/", "")
            pdf_path = os.path.join(Config.UPLOADED_FILES_DIR, filename)

        # Check if file exists
        if not os.path.exists(pdf_path):
            raise HTTPException(
                status_code=404, detail=f"PDF file not found: {pdf_path}"
            )

        # Open and read the PDF file
        pdf_text = ""
        with open(pdf_path, "rb") as file:
            reader = PyPDF2.PdfReader(file)
            for page_num in range(len(reader.pages)):
                page = reader.pages[page_num]
                pdf_text += f"\n\n--- Page {page_num + 1} ---\n\n"
                pdf_text += page.extract_text()

        return {"text": pdf_text}

    except ImportError:
        return JSONResponse(
            status_code=500,
            content={
                "detail": "PyPDF2 package not installed. Please install it with 'pip install PyPDF2'"
            },
        )
    except Exception as e:
        logger.error(f"Error reading PDF: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# Include PDF router
router.include_router(pdf_router, prefix="/pdf")
router.include_router(memory_router, prefix="/memory", tags=["Memory Management"])
