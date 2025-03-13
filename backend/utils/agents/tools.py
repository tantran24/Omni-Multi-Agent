import os
from datetime import datetime
from langchain_core.tools import Tool
from typing import Dict, Any
from .image_agent import ImageAgent

image_agent = ImageAgent()


def generate_image(prompt: str) -> Dict[str, str]:
    """
    Generate an image based on the given prompt
    """
    try:
        result = image_agent.generate_image(prompt)
        image_path = f"/generated_images/{result['filename']}"
        return image_path
    except Exception as e:
        raise Exception(f"Image generation failed: {str(e)}")


def get_time() -> str:
    """
    Get the current time
    """
    return datetime.now().strftime("%Y-%m-%d %H:%M:%S")


generate_image_tool_obj = Tool(
    name="generate_image",
    description="Generate an image based on the text description provided. Use this when the user wants to create, draw, or visualize an image.",
    func=generate_image,
)

get_time_tool_obj = Tool(
    name="get_time",
    description="Get the current date and time. Use this when the user asks about the current time or date.",
    func=get_time,
)

available_tools = [generate_image_tool_obj, get_time_tool_obj]
