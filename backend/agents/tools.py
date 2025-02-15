from datetime import datetime
import requests
from typing import List, Dict, Any
from services.image_service import ImageService

class Tool:
    def __init__(self, name: str, description: str, func: callable):
        self.name = name
        self.description = description
        self.func = func

def get_current_time() -> str:
    return datetime.now().strftime("%Y-%m-%d %H:%M:%S")

def search_web(query: str) -> str:
    # Implement actual web search logic here
    return f"Searched for: {query}"

def calculate(expression: str) -> str:
    try:
        return str(eval(expression))
    except:
        return "Error in calculation"

def generate_image(prompt: str) -> str:
    image_service = ImageService()
    image = image_service.generate_image(prompt)
    image.save("generated_image.png")
    return "Image generated successfully and saved as 'generated_image.png'"

# Define available tools
AVAILABLE_TOOLS = [
    Tool(
        name="get_time",
        description="Get the current date and time",
        func=get_current_time
    ),
    Tool(
        name="search",
        description="Search the web for information",
        func=search_web
    ),
    Tool(
        name="calculate",
        description="Perform mathematical calculations",
        func=calculate
    ),
    Tool(
        name="generate_image",
        description="Generate an image from a text description",
        func=generate_image
    )
]

def get_tool_descriptions() -> str:
    return "\n".join([
        f"- {tool.name}: {tool.description}"
        for tool in AVAILABLE_TOOLS
    ])

def execute_tool(tool_name: str, args: str = "") -> str:
    for tool in AVAILABLE_TOOLS:
        if tool.name == tool_name:
            return tool.func(args)
    return f"Tool '{tool_name}' not found"

