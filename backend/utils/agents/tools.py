import os
from datetime import datetime
from langchain_core.tools import Tool, BaseTool
from typing import Dict, Any, Optional
from .image_agent import ImageAgent

image_agent = ImageAgent()


def generate_image(prompt: str) -> str:
    """
    Generate an image based on the given prompt
    """
    try:
        result = image_agent.generate_image(prompt)
        image_path = f"/generated_images/{result['filename']}"
        return image_path
    except Exception as e:
        raise Exception(f"Image generation failed: {str(e)}")


def get_time(timezone: Optional[str] = None) -> str:
    """
    Get the current time, optionally in the specified timezone
    """
    try:
        current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        return f"Current time: {current_time}"
    except Exception as e:
        raise Exception(f"Error getting time: {str(e)}")


# Define tools as proper LangChain tools with schema
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

# Organize tools by agent type for better access control
TOOL_REGISTRY = {
    "assistant": [get_time_tool],
    "image": [generate_image_tool],
    "all": [generate_image_tool, get_time_tool],
}


def get_tools_for_agent(agent_type: str):
    """Get the appropriate tools for a specific agent type"""
    return TOOL_REGISTRY.get(agent_type, []) if agent_type in TOOL_REGISTRY else []
