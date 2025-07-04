from typing import List, Dict, Any, Optional
from langchain_core.messages import BaseMessage, HumanMessage, AIMessage
import logging


logger = logging.getLogger(__name__)


class ConversationAgent:
    """Main chat agent that uses the async-aware multi-agent graph for processing queries"""

    def __init__(self):
        self.chat_history: List[BaseMessage] = []
        self.agent_executor = None

    def set_agent_executor(self, executor):
        """Set the agent executor function from the graph"""
        self.agent_executor = executor

    async def achat(self, prompt: str) -> str:
        """Process a chat message through the agent graph asynchronously"""
        try:
            if not prompt.strip():
                return "Please provide a valid input"

            if self.agent_executor is None:
                return "Agent executor not initialized"

            input_state = {
                "input": prompt,
                "chat_history": self.chat_history,
                "current_agent": None,
                "output": None,
            }

            try:
                response = await self.agent_executor.ainvoke(input_state)

                if isinstance(response, dict):
                    output = response.get("output", "")

                    if "chat_history" in response:
                        self.chat_history = response["chat_history"]

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

