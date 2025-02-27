from datetime import datetime
from langchain_core.tools import tool, BaseTool
from typing import List, Dict, Any
from langchain.tools import Tool
from services.image_service import ImageService

image_service = ImageService()


@tool("get_time")
def get_time_tool(dummy: str = "") -> str:
    """Tool that gets current time. No input required."""
    return datetime.now().strftime("%Y-%m-%d %H:%M:%S")


@tool("generate_image")
def generate_image(prompt: str) -> str:
    """Generate an image based on the given prompt."""
    try:
        result = image_service.generate_image(prompt)
        return f"Image generated successfully: {result['url']}"
    except Exception as e:
        return f"Error generating image: {str(e)}"


# Create proper tool objects for LangGraph compatibility
get_time_tool_obj = Tool(
    name="get_time",
    func=get_time_tool,
    description="Gets the current time. No input required.",
)

generate_image_tool = Tool(
    name="generate_image",
    func=generate_image,
    description="Generates an image based on a text description. Input should be a detailed description of the desired image.",
)

# Combine all tools into a single list
AVAILABLE_TOOLS: List[BaseTool] = [get_time_tool_obj, generate_image_tool]

if __name__ == "__main__":
    print(get_time_tool.invoke({}))
    print(generate_image_tool.invoke({"prompt": "A beautiful sunset"}))
