from typing import Dict, Any, Callable
from .image_tools import generate_image

# Dictionary of all available tools
AVAILABLE_TOOLS: Dict[str, Dict[str, Any]] = {
    "generate_image": {
        "name": "generate_image",
        "description": "Generates images from text descriptions using Illustrious-XL model",
        "function": generate_image,
        "parameters": {
            "type": "object",
            "properties": {
                "prompt": {
                    "type": "string",
                    "description": "Text description of the image to generate"
                }
            },
            "required": ["prompt"]
        }
    },
}

def get_tool_function(tool_name: str) -> Callable:
    """Get the function for a specific tool"""
    return AVAILABLE_TOOLS[tool_name]["function"]

def get_tool_descriptions() -> str:
    """Format all tool descriptions for the prompt"""
    descriptions = []
    for tool_name, tool_info in AVAILABLE_TOOLS.items():
        desc = f"- {tool_name}: {tool_info['description']}"
        descriptions.append(desc)
    return "\n".join(descriptions)

__all__ = ['AVAILABLE_TOOLS', 'get_tool_function', 'get_tool_descriptions']
