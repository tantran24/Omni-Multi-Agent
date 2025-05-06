import os
import logging
from datetime import datetime
from langchain_core.tools import Tool
from typing import Dict, Any, Optional, List
from .image_agent import ImageAgent
from services.mcp_service import detach_mcp_service
import asyncio

logger = logging.getLogger(__name__)

image_agent = ImageAgent()


def generate_image(prompt: str) -> str:
    """Generate an image based on the given prompt"""
    try:
        result = image_agent.generate_image(prompt)
        image_path = f"/generated_images/{result['filename']}"
        return image_path
    except Exception as e:
        raise Exception(f"Image generation failed: {str(e)}")


def get_time(input: str = "") -> str:
    """Get the current time, optionally in the specified timezone"""
    try:
        current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        return f"Current time: {current_time}"
    except Exception as e:
        raise Exception(f"Error getting time: {str(e)}")


generate_image_tool = Tool(
    name="generate_image",
    description="Generate an image based on the text description provided. Use this when the user wants to create, draw, or visualize an image.",
    func=generate_image,
)

get_time_tool = Tool(
    name="get_time",
    description="Get the current date and time. Use this when the user asks about the current time or date.",
    func=get_time,
)

TOOL_REGISTRY = {
    "assistant": [get_time_tool],
    "voice_assistant": [get_time_tool],
    "image": [generate_image_tool],
    "all": [generate_image_tool, get_time_tool],
}


def initialize_mcp_service():
    """
    Initialize MCP service, handling the event loop properly
    """
    try:
        try:
            loop = asyncio.get_event_loop()
        except RuntimeError:
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
        
        if not detach_mcp_service.initialized:
            if loop.is_running():
                logger.info("Creating task to initialize MCP service")
                task = asyncio.create_task(detach_mcp_service.initialize_client())
            else:
                logger.info("Running MCP service initialization synchronously")
                loop.run_until_complete(detach_mcp_service.initialize_client())
        
        return detach_mcp_service.initialized
    except Exception as e:
        logger.error(f"Error initializing MCP service: {e}")
        return False


def get_tools_for_agent(agent_type: str) -> List[Tool]:
    """Get the appropriate tools for a specific agent type"""
    base_tools = TOOL_REGISTRY.get(agent_type, []) if agent_type in TOOL_REGISTRY else []
    
    initialize_mcp_service()
    
    try:
        mcp_tools = detach_mcp_service.get_tools()
        if mcp_tools:
            logger.info(f"Retrieved {len(mcp_tools)} MCP tools: {[t.name for t in mcp_tools]}")
            
            if agent_type in ("router", "assistant", "research", "planning", "all"):
                logger.info(f"Adding MCP tools to agent type: {agent_type}")
                return base_tools + mcp_tools
        else:
            logger.warning(f"No MCP tools available for agent type: {agent_type}")
    except Exception as e:
        logger.error(f"Error getting MCP tools: {e}")
    
    return base_tools
