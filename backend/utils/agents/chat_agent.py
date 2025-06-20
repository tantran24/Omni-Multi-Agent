from typing import List
from langchain_core.messages import BaseMessage, HumanMessage, AIMessage
import logging
from .memory_mixin import MemoryMixin

logger = logging.getLogger(__name__)


class ChatAgent(MemoryMixin):
    """Main chat agent that uses the async-aware multi-agent graph for processing queries with optional memory"""

    def __init__(self):
        super().__init__()
        self.chat_history: List[BaseMessage] = []
        self.agent_executor = None

    def set_agent_executor(self, executor):
        """Set the agent executor function from the graph"""
        self.agent_executor = executor

    async def achat(self, prompt: str, agent_type: str = None) -> str:
        """Process a chat message through the agent graph asynchronously with optional memory"""
        try:
            if not prompt.strip():
                return "Please provide a valid input"

            if self.agent_executor is None:
                return "Agent executor not initialized"

            # If memory is enabled, handle session and persistence
            if self._memory_enabled:
                await self.initialize_session()

                # Load conversation history for context
                memory_history = await self.load_conversation_history()
                chat_history = memory_history if memory_history else self.chat_history

                # Save user message
                await self.save_message("user", prompt)
            else:
                chat_history = self.chat_history

            input_state = {
                "input": prompt,
                "chat_history": chat_history,
                "current_agent": None,
                "output": None,
                "artifacts": {},
            }

            try:
                response = await self.agent_executor.ainvoke(input_state)
                if isinstance(response, dict):
                    output = response.get("output", "")
                    current_agent = response.get("current_agent", agent_type)

                    # Update local history if memory is disabled
                    if not self._memory_enabled and "chat_history" in response:
                        self.chat_history = response["chat_history"]

                    # Handle artifacts
                    artifacts = response.get("artifacts", {})
                    metadata = {}

                    if "generate_image" in artifacts:
                        image_path = artifacts["generate_image"]
                        if "![Generated Image]" not in output:
                            output += f"\n\n![Generated Image]({image_path})"
                        metadata["image_path"] = image_path

                    # Save assistant response if memory is enabled
                    if self._memory_enabled:
                        await self.save_message(
                            "assistant",
                            output,
                            metadata=metadata,
                            agent_type=current_agent,
                        )
                    else:
                        # Update local history
                        self.chat_history.extend(
                            [HumanMessage(content=prompt), AIMessage(content=output)]
                        )

                    return output
                else:
                    raise ValueError(
                        f"Invalid response format from agent: {type(response)}"
                    )

            except Exception as e:
                logger.error(f"Graph execution error: {str(e)}")

                # Save error message if memory is enabled
                if self._memory_enabled:
                    error_msg = f"Error: {str(e)}"
                    await self.save_message(
                        "assistant",
                        error_msg,
                        message_type="error",
                        agent_type=agent_type,
                    )

                raise

        except Exception as e:
            logger.error(f"Chat error: {str(e)}")
            return f"Error: {str(e)}"
