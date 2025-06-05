import logging
from datetime import datetime
from langchain_core.tools import Tool, StructuredTool
from typing import Optional, List
from ..agents.image_agent import ImageAgent
from services.mcp_service import detach_mcp_service
from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)

image_agent = ImageAgent()


class GenerateImageInput(BaseModel):
    prompt: str = Field(description="The text description of the image to generate")


def generate_image(prompt: str) -> str:
    """Generate an image based on the given prompt"""
    try:
        result = image_agent.generate_image(prompt)
        image_path = f"/generated_images/{result['filename']}"

        return f"""I've created an image based on your description: "{prompt}".

![Generated Image]({image_path})"""
    except Exception as e:
        raise Exception(f"Image generation failed: {str(e)}")


class GetTimeInput(BaseModel):
    input: Optional[str] = Field(
        default="", description="Optional timezone or format parameters"
    )


def get_time(input: Optional[str] = "") -> str:
    """Get the current time, optionally in the specified timezone"""
    try:
        current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        if input and input.strip():
            return f"The current time is {current_time}. You mentioned '{input}' which appears to be a timezone or format preference, but those options aren't fully implemented yet. Please use this information to provide a helpful response to the user."
        return f"The current time is {current_time}. You can use this information to provide a helpful response to the user about the current date and time."
    except Exception as e:
        raise Exception(f"Error getting time: {str(e)}")


generate_image_tool = StructuredTool.from_function(
    func=generate_image,
    name="generate_image",
    description="Generate an image based on the text description provided. Use this when the user wants to create, draw, or visualize an image.",
    args_schema=GenerateImageInput,
)

get_time_tool = StructuredTool.from_function(
    func=get_time,
    name="get_time",
    description="Get the current date and time. Use this when the user asks about the current time or date.",
    args_schema=GetTimeInput,
)

TOOL_REGISTRY = {
    "assistant": [get_time_tool],
    "voice_assistant": [get_time_tool],
    "image": [generate_image_tool],
    "all": [generate_image_tool, get_time_tool],
}


async def get_tools_for_agent(agent_type: str) -> List[Tool]:  # Made async
    """Get the appropriate tools for a specific agent type"""
    base_tools = (
        TOOL_REGISTRY.get(agent_type, []) if agent_type in TOOL_REGISTRY else []
    )

    try:
        if not detach_mcp_service.initialized:
            logger.info(
                f"MCP service not initialized. Initializing for agent type: {agent_type}"
            )
            await detach_mcp_service.initialize_client()

        # Await the get_tools() call
        mcp_tools_list = await detach_mcp_service.get_tools()

        if mcp_tools_list:
            logger.info(
                f"Retrieved {len(mcp_tools_list)} MCP tools for agent {agent_type}: {[t.name for t in mcp_tools_list]}"
            )

            # Logic for which agents get MCP tools
            if agent_type in ("router", "assistant", "research", "planning", "all"):
                logger.info(f"Adding MCP tools to agent type: {agent_type}")
                return base_tools + mcp_tools_list
            else:
                logger.info(
                    f"MCP tools not applicable for agent type: {agent_type}. Returning base tools."
                )
        else:
            logger.warning(
                f"No MCP tools available for agent type: {agent_type}. Returning base tools."
            )
    except Exception as e:
        logger.error(
            f"Error getting or processing MCP tools for agent {agent_type}: {e}",
            exc_info=True,
        )

    return base_tools