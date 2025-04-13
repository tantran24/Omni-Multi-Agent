from typing import List, Dict, Any, Optional, Callable
from langchain_core.messages import BaseMessage, HumanMessage, AIMessage, SystemMessage
from langchain_ollama import ChatOllama
from core.config import Config
import logging
from .prompts import (
    get_system_prompt,
    get_router_prompt,
    get_assistant_agent_prompt,
    get_image_agent_prompt,
    get_math_agent_prompt,
    get_research_agent_prompt,
    get_planning_agent_prompt,
)
import re
from utils.wrappers.llm_wrapper import LLMWrapper
from .tools import get_tools_for_agent, get_time_tool, generate_image_tool

logger = logging.getLogger(__name__)


class BaseAgent:
    """Base class for all specialized agents"""

    def __init__(self, llm=None):
        self.llm = llm or LLMWrapper()
        self.agent_type = "base"
        self.agent_name = "Base Agent"
        self.tools = []

    def get_system_prompt(self) -> str:
        """Get the system prompt for this agent"""
        # Include available tools in the system prompt
        tools_desc = ""
        if self.tools:
            tools_desc = "\n\nYou have access to the following tools:\n"
            for tool in self.tools:
                tools_desc += f"- {tool.name}: {tool.description}\n"

            tools_desc += (
                "\nUse these tools when appropriate by formatting your response like:\n"
            )
            tools_desc += "[Tool Used] tool_name(parameter)"

        return f"{get_system_prompt()}\n\nYou are the {self.agent_name}. Focus on your specialty.{tools_desc}"

    def process_response(self, content: str) -> Dict[str, Any]:
        """Process the LLM response and extract any artifacts or process tool calls"""
        content = self.process_tool_calls(content)
        return {
            "content": content,
            "artifacts": {},
        }

    def process_tool_calls(self, content: str) -> str:
        """Process tool calls in the content"""
        # Process get_time tool
        if "[Tool Used] get_time(" in content:
            try:
                time_result = get_time_tool.invoke()
                content = content.replace("[Tool Used] get_time()", time_result)
            except Exception as e:
                logger.error(f"Error using get_time tool: {str(e)}")
                content += f"\nError getting time: {str(e)}"

        return content

    def invoke(
        self, message: HumanMessage, chat_history: List[BaseMessage] = None
    ) -> Dict[str, Any]:
        """Invoke the agent with a message and optional chat history"""
        if chat_history is None:
            chat_history = []

        system_prompt = self.get_system_prompt()

        # Only include recent history for context
        recent_history = chat_history[-4:] if len(chat_history) > 4 else chat_history

        messages = [
            SystemMessage(content=system_prompt),
            *recent_history,
            message,
        ]

        response = self.llm.invoke(messages)
        processed = self.process_response(response.content)

        return {
            "messages": [AIMessage(content=processed["content"])],
            "chat_history": [message, AIMessage(content=processed["content"])],
            "artifacts": processed.get("artifacts", {}),
        }


class RouterAgent(BaseAgent):
    """Router agent that directs messages to specialized agents"""

    def __init__(self):
        super().__init__()
        self.agent_type = "router"
        self.agent_name = "Router Agent"
        self.tools = []

    def get_system_prompt(self) -> str:
        """Get the specialized router prompt"""
        return get_router_prompt()

    def create_specialized_agent(self, agent_type: str) -> BaseAgent:
        """Factory method to create specialized agents"""
        if agent_type == "assistant":
            return AssistantAgent(self.llm)
        elif agent_type == "image":
            return ImageAgent(self.llm)
        elif agent_type == "math":
            return MathAgent(self.llm)
        elif agent_type == "research":
            return ResearchAgent(self.llm)
        elif agent_type == "planning":
            return PlanningAgent(self.llm)
        else:
            logger.warning(
                f"Unknown agent type: {agent_type}, defaulting to AssistantAgent"
            )
            return AssistantAgent(self.llm)


class AssistantAgent(BaseAgent):
    """General assistant agent for conversation"""

    def __init__(self, llm=None):
        super().__init__(llm)
        self.agent_type = "assistant"
        self.agent_name = "Assistant Agent"
        self.tools = get_tools_for_agent("assistant")

    def get_system_prompt(self) -> str:
        """Get the specialized assistant prompt"""
        return get_assistant_agent_prompt()


class MathAgent(BaseAgent):
    """Specialized agent for mathematical calculations"""

    def __init__(self, llm=None):
        super().__init__(llm)
        self.agent_type = "math"
        self.agent_name = "Math Agent"
        self.tools = []

    def get_system_prompt(self) -> str:
        """Get the specialized math prompt"""
        return get_math_agent_prompt()


class ResearchAgent(BaseAgent):
    """Specialized agent for research and information gathering"""

    def __init__(self, llm=None):
        super().__init__(llm)
        self.agent_type = "research"
        self.agent_name = "Research Agent"
        self.tools = []

    def get_system_prompt(self) -> str:
        """Get the specialized research prompt"""
        return get_research_agent_prompt()


class PlanningAgent(BaseAgent):
    """Specialized agent for planning and organizing tasks"""

    def __init__(self, llm=None):
        super().__init__(llm)
        self.agent_type = "planning"
        self.agent_name = "Planning Agent"
        self.tools = []

    def get_system_prompt(self) -> str:
        """Get the specialized planning prompt"""
        return get_planning_agent_prompt()


class ImageAgent(BaseAgent):
    """Specialized agent for image generation"""

    def __init__(self, llm=None):
        super().__init__(llm)
        self.agent_type = "image"
        self.agent_name = "Image Agent"
        self.tools = get_tools_for_agent("image")

    def get_system_prompt(self) -> str:
        """Get the specialized image agent prompt"""
        return get_image_agent_prompt()

    def process_response(self, content: str) -> Dict[str, Any]:
        """Process the image generation response and handle tool calls"""
        artifacts = {}

        # Look for image generation tool calls
        image_match = re.search(r"\[Tool Used\] generate_image\(([^)]+)\)", content)
        if image_match:
            try:
                image_prompt = image_match.group(1).strip()
                logger.info(f"Generating image with prompt: {image_prompt}")
                image_path = generate_image_tool.invoke(image_prompt)
                artifacts = {"image": image_path}
                # Add a reference to the image in the content
                content = re.sub(r"\[Tool Used\] generate_image\([^)]+\)", "", content)
                content += f"\n\n![Generated Image]({image_path})"

            except Exception as e:
                error_msg = f"\n\nError generating image: {str(e)}"
                logger.error(error_msg)
                content += error_msg

        return {
            "content": content,
            "artifacts": artifacts,
        }


class ChatAgent:
    """Main chat agent that uses the multi-agent graph for processing queries"""

    def __init__(self):
        self.chat_history: List[BaseMessage] = []
        self.agent_executor = None

    def set_agent_executor(self, executor):
        """Set the agent executor function from the graph"""
        self.agent_executor = executor

    def chat(self, prompt: str) -> str:
        """Process a chat message through the agent graph"""
        try:
            if not prompt.strip():
                return "Please provide a valid input"

            if self.agent_executor is None:
                return "Agent executor not initialized"

            # Create the input state for the graph
            input_state = {
                "input": prompt,
                "chat_history": self.chat_history,
                "current_agent": None,
                "output": None,
                "artifacts": {},
            }

            # Process the message through the agent graph
            try:
                # Use .invoke() method for compiled graphs rather than calling directly
                response = self.agent_executor.invoke(input_state)

                if isinstance(response, dict):
                    output = response.get("output", "")

                    # Update chat history if available
                    if "chat_history" in response:
                        self.chat_history = response["chat_history"]

                    # Handle any artifacts (like images)
                    artifacts = response.get("artifacts", {})
                    if "image" in artifacts:
                        image_path = artifacts["image"]
                        if "![Generated Image]" not in output:
                            output += f"\n\n![Generated Image]({image_path})"

                    return output
                else:
                    raise ValueError(
                        f"Invalid response format from agent: {type(response)}"
                    )

            except Exception as e:
                logger.error(f"Graph execution error: {str(e)}")
                raise

        except Exception as e:
            logger.error(f"Chat error: {str(e)}")
            return f"Error: {str(e)}"
