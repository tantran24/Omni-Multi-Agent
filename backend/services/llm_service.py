import asyncio
from typing import Optional
from core.graph import create_agent_graph
from utils.agents.router_agent import ChatAgent
import logging
from langchain_core.runnables import RunnableConfig

logger = logging.getLogger(__name__)


class LLMService:
    def __init__(self):
        self.chat_agent: Optional[ChatAgent] = None
        self.initialized = False
        self.initializing = False
        self._initialize_lock = asyncio.Lock()

    async def ensure_initialized(self):
        """Ensure the service is initialized in a thread-safe manner"""
        if not self.initialized and not self.initializing:
            async with self._initialize_lock:
                if not self.initialized:
                    try:
                        self.initializing = True
                        logger.info("Initializing LLM service...")

                        # Create the agent graph
                        agent_graph = create_agent_graph()

                        # Create and configure the chat agent
                        self.chat_agent = ChatAgent()
                        self.chat_agent.set_agent_executor(agent_graph)

                        self.initialized = True
                        logger.info("LLM service initialization complete")
                    except Exception as e:
                        logger.error(f"Initialization error: {str(e)}")
                        raise
                    finally:
                        self.initializing = False

    async def process_message(self, message: str) -> str:
        """Process a message through the agent graph"""
        await self.ensure_initialized()

        if not self.chat_agent:
            raise RuntimeError("Chat agent initialization failed")

        try:
            config = RunnableConfig(recursion_limit=25)

            return await asyncio.get_event_loop().run_in_executor(
                None, lambda: self.chat_agent.chat(message)
            )
        except Exception as e:
            logger.error(f"Message processing error: {str(e)}")
            raise
