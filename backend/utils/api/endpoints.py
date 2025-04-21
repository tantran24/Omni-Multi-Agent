from fastapi import APIRouter, HTTPException, BackgroundTasks, UploadFile, File
from pydantic import BaseModel, Field
import asyncio
from services.llm_service import LLMService
import re
from typing import Optional, Dict, Any
import logging
from fastapi.responses import JSONResponse, Response
import shutil
import os
from services.mcp_service import detach_mcp_service

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

    response = await llm_service.process_message(chat_message.message)

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

    return ChatResponse(response=response, image=image_url)


async def ensure_llm_service_ready():
    """Ensure that the LLM service is initialized and ready for the next request"""
    try:
        await llm_service.ensure_initialized()
    except Exception as e:
        logger.error(f"Error ensuring LLM service is ready: {str(e)}")


@router.post("/transcribe")
async def transcribe(audio: UploadFile = File(...)):

    temp_file_path = f"audioUpload/{audio.filename}"
    print(os.path.isdir("audioUpload"))
    with open(temp_file_path, "wb") as buffer:
        shutil.copyfileobj(audio.file, buffer)

    try:
        result = run(long_form_audio=temp_file_path)
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
    tools = detach_mcp_service.get_tools()

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
            detach_mcp_service.add_config(name, conf)
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
        detach_mcp_service.delete_config(name)
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
