from datetime import datetime
from langchain_core.tools import tool
from typing import List
from langchain.tools import Tool

@tool("get_time")
def get_time_tool(dummy: str = "") -> str:
    """Tool that gets current time. No input required."""
    return datetime.now().strftime("%Y-%m-%d %H:%M:%S")

@tool("generate_image")
def generate_image(prompt: str) -> str:
    """Generate an image based on the given prompt."""
    # Placeholder for image generation logic
    return f"Generated image for prompt: {prompt}"

# Combine all tools into a single list
AVAILABLE_TOOLS: List[Tool] = [
    get_time_tool,
    Tool(
        name="generate_image",
        func=generate_image,
        description="Generates an image based on a text description. Input should be a detailed description of the desired image."
    )
]

if __name__=="__main__":
    get_time_tool.invoke({})