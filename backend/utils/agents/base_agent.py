"""Base agent implementation with proper async support"""

from typing import List, Dict, Any, Optional
from langchain_core.messages import BaseMessage, HumanMessage, AIMessage, SystemMessage
import logging
from utils.wrappers.llm_wrapper import LLMWrapper
from utils.tools.tool_handler import ToolHandler
from .tools import get_tools_for_agent

logger = logging.getLogger(__name__)


class BaseAgent:
    """Base class for all specialized agents with async support"""

    def __init__(self, llm=None):
        self.llm = llm or LLMWrapper()
        self.tools: List[Any] = []
        self.agent_type = "base"
        self.agent_name = "Base Agent"

    def get_system_prompt(self) -> str:
        """Get the system prompt for this agent"""
        raise NotImplementedError("Subclasses must implement get_system_prompt")

    async def initialize_tools(self) -> None:
        """Initialize tools asynchronously"""
        agent_tools = get_tools_for_agent(self.agent_type)
        mcp_tools = await ToolHandler.initialize_tools()
        self.tools = agent_tools + mcp_tools

    async def invoke(
        self, message: HumanMessage, chat_history: Optional[List[BaseMessage]] = None
    ) -> Dict[str, Any]:
        """Process a message asynchronously and return response with any artifacts"""
        if chat_history is None:
            chat_history = []

        messages = [SystemMessage(content=self.get_system_prompt())]
        messages.extend(chat_history)
        messages.append(message)

        try:
            response = await self.llm.invoke(messages)
            if not response:
                return {
                    "messages": [
                        AIMessage(
                            content="I apologize, but I couldn't generate a response."
                        )
                    ]
                }

            processed_content, artifacts = await ToolHandler.process_tool_calls(
                response.content, self.tools
            )

            messages = [AIMessage(content=processed_content)]
            return {"messages": messages, "artifacts": artifacts}

        except Exception as e:
            logger.error(f"Error in agent invocation: {e}")
            return {
                "messages": [AIMessage(content=f"I encountered an error: {str(e)}")]
            }
