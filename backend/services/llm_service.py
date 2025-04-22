from typing import Optional
from core.graph import create_agent_graph
from utils.agents.chat_agent import ChatAgent
import logging
from langchain_core.runnables import RunnableConfig

logger = logging.getLogger(__name__)


class LLMService:
    """Service to manage LLM interactions and agent coordination"""

    def __init__(self):
        self.chat_agent: Optional[ChatAgent] = None
        self.initialized = False

    async def initialize(self) -> None:
        """Initialize the service asynchronously"""
        if self.initialized:
            return

        try:
            self.chat_agent = ChatAgent()
            graph = await create_agent_graph()
            self.chat_agent.set_agent_executor(graph)
            self.initialized = True
            logger.info("LLM service initialized successfully")
        except Exception as e:
            logger.error(f"Error initializing LLM service: {e}")
            raise

    async def ensure_initialized(self) -> None:
        """Ensure the service is initialized"""
        if not self.initialized:
            await self.initialize()

    async def process_message(self, message: str) -> str:
        """Process a message through the agent graph asynchronously"""
        await self.ensure_initialized()

        if not self.chat_agent:
            raise RuntimeError("Chat agent initialization failed")

        try:
            config = RunnableConfig(recursion_limit=25)
            return await self.chat_agent.achat(message)
        except Exception as e:
            logger.error(f"Message processing error: {str(e)}")
            raise
