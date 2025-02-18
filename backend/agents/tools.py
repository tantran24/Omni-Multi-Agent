from datetime import datetime
from langchain_core.tools import tool, BaseTool
from pydantic import Field
from ..services.image_service import ImageService

@tool
def get_time_tool():
    """Tool that get current time!"""
    date_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    return date_time


@tool
def generate_image_tool(prompt):
    """Tool that generate image by prompt!"""
    image_service = ImageService()
    image = image_service.generate_image(prompt)
    image.save("generated_image.png")
    return "Image generated successfully and saved as 'generated_image.png'"

       
AVAILABLE_TOOLS = [
    get_time_tool,
    generate_image_tool,
]


from typing import Optional, Type
from pydantic import BaseModel, Field

from langchain.callbacks.manager import (
    AsyncCallbackManagerForToolRun,
    CallbackManagerForToolRun,
)


class SearchInput(BaseModel):
    query: str = Field(description="should be a search query")


class CalculatorInput(BaseModel):
    a: int = Field(description="first number")
    b: int = Field(description="second number")


class CustomSearchTool(BaseTool):
    name: str = "custom_search"
    description: str = "useful for when you need to answer questions about current events"
    args_schema: Type[BaseModel] = SearchInput

    def _run(
        self, query: str, run_manager: Optional[CallbackManagerForToolRun] = None
    ) -> str:
        """Use the tool."""
        return "LangChain"

    async def _arun(
        self, query: str, run_manager: Optional[AsyncCallbackManagerForToolRun] = None
    ) -> str:
        """Use the tool asynchronously."""
        raise NotImplementedError("custom_search does not support async")


class CustomCalculatorTool(BaseTool):
    name: str = "Calculator"
    description: str = "useful for when you need to answer questions about math"
    args_schema: Type[BaseModel] = CalculatorInput
    return_direct: bool = True

    def _run(
        self, a: int, b: int, run_manager: Optional[CallbackManagerForToolRun] = None
    ) -> str:
        """Use the tool."""
        return a * b

    async def _arun(
        self,
        a: int,
        b: int,
        run_manager: Optional[AsyncCallbackManagerForToolRun] = None,
    ) -> str:
        """Use the tool asynchronously."""
        raise NotImplementedError("Calculator does not support async")
    

if __name__=="__main__":
    get_time_tool.invoke({})