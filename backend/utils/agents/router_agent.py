from typing import List, Dict, Any, Optional
from langchain_core.messages import BaseMessage, HumanMessage, AIMessage
import logging
import re
from services.mcp_service import detach_mcp_service
from .base_agent import BaseAgent
from .tools import get_tools_for_agent, get_time_tool, generate_image_tool
from .prompts import (
    get_router_prompt,
    get_assistant_agent_prompt,
    get_image_agent_prompt,
    get_math_agent_prompt,
    get_research_agent_prompt,
    get_planning_agent_prompt,
    get_conversation_assistant_agent_prompt,
)

logger = logging.getLogger(__name__)


class RouterAgent(BaseAgent):
    """Router agent that directs messages to specialized agents"""

    def __init__(self):
        super().__init__()
        self.agent_type = "router"
        self.agent_name = "Router Agent"

        self._ensure_mcp_initialized()

    def _ensure_mcp_initialized(self):
        """Ensure MCP service is initialized"""
        try:
            import asyncio

            loop = asyncio.get_event_loop()
            if not detach_mcp_service.initialized:
                logger.info("MCP service not initialized in RouterAgent")

            status = (
                "initialized" if detach_mcp_service.initialized else "not initialized"
            )
            logger.info(f"MCP service status in RouterAgent: {status}")
        except Exception as e:
            logger.error(f"Error checking MCP service: {e}")

    def get_system_prompt(self) -> str:
        """Get the specialized router prompt including MCP tool names"""
        prompt = get_router_prompt()

        self._ensure_mcp_initialized()

        if detach_mcp_service.initialized:
            try:
                mcp_tools = []
                if (
                    hasattr(detach_mcp_service.client, "tools")
                    and detach_mcp_service.client.tools
                ):
                    mcp_tools = detach_mcp_service.client.tools

                if mcp_tools:
                    tool_names = [t.name for t in mcp_tools]
                    prompt += "\n\nAvailable MCP tools: " + ", ".join(tool_names)
                    prompt += "\n\nMCP Tool Details:"
                    for tool in mcp_tools:
                        prompt += f"\n- {tool.name}: {tool.description}"
                        if hasattr(tool, "args_schema") and tool.args_schema:
                            try:
                                param_names = list(
                                    tool.args_schema.__annotations__.keys()
                                )
                                if param_names:
                                    prompt += f" (Parameters: {param_names})"
                            except Exception:
                                pass
            except Exception as e:
                logger.error(f"Error getting MCP tool information: {e}")

        return prompt

    def create_specialized_agent(self, agent_type: str) -> BaseAgent:
        """Factory method to create specialized agents"""
        agent_type = agent_type.lower()
        agent_map = {
            "assistant": AssistantAgent,
            "image": ImageAgent,
            "math": MathAgent,
            "research": ResearchAgent,
            "planning": PlanningAgent,
        }

        if agent_type in agent_map:
            return agent_map[agent_type](self.llm)

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

    def get_system_prompt(self) -> str:
        """Get the specialized assistant prompt including tool descriptions"""
        system_prompt = get_assistant_agent_prompt()
        if self.tools:
            tool_lines = [f"- {tool.name}: {tool.description}" for tool in self.tools]
            tools_desc = "\n\nYou have access to the following tools:\n" + "\n".join(
                tool_lines
            )
            tools_desc += '\n\nUse tools by indicating "[Tool Used] tool_name(args)" in your response.'
        else:
            tools_desc = ""

        return f"{system_prompt}{tools_desc}"


class MathAgent(BaseAgent):
    """Specialized agent for mathematical calculations"""

    def __init__(self, llm=None):
        super().__init__(llm)
        self.agent_type = "math"
        self.agent_name = "Math Agent"

    def get_system_prompt(self) -> str:
        return get_math_agent_prompt()


class ResearchAgent(BaseAgent):
    """Specialized agent for research and information gathering"""

    def __init__(self, llm=None):
        super().__init__(llm)
        self.agent_type = "research"
        self.agent_name = "Research Agent"

    def get_system_prompt(self) -> str:
        return get_research_agent_prompt()


class PlanningAgent(BaseAgent):
    """Specialized agent for planning and organizing tasks"""

    def __init__(self, llm=None):
        super().__init__(llm)
        self.agent_type = "planning"
        self.agent_name = "Planning Agent"

    def get_system_prompt(self) -> str:
        return get_planning_agent_prompt()


class ImageAgent(BaseAgent):
    """Specialized agent for image generation"""

    def __init__(self, llm=None):
        super().__init__(llm)
        self.agent_type = "image"
        self.agent_name = "Image Agent"

    def get_system_prompt(self) -> str:
        return get_image_agent_prompt()


class ConversationAssistantAgent(BaseAgent):
    """General voice assistant agent for conversation"""

    def __init__(self, llm=None):
        super().__init__(llm)
        self.agent_type = "voice_assistant"
        self.agent_name = "Voice Assistant Agent"

    def get_system_prompt(self) -> str:
        """Get the specialized assistant prompt including tool descriptions"""
        system_prompt = get_conversation_assistant_agent_prompt()
        if self.tools:
            tool_lines = [f"- {tool.name}: {tool.description}" for tool in self.tools]
            tools_desc = "\n\nYou have access to the following tools:\n" + "\n".join(
                tool_lines
            )
            tools_desc += '\n\nUse tools by indicating "[Tool Used] tool_name(args)" in your response.'
        else:
            tools_desc = ""

        return f"{system_prompt}{tools_desc}"
