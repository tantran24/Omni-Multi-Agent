from typing import Optional
from utils.graph_utils import create_agent_graph
from utils.agents.chat_agent import ChatAgent
import logging
from langchain_core.runnables import RunnableConfig

logger = logging.getLogger(__name__)


class LLMService:
    """Service to manage LLM interactions and agent coordination with persistent memory"""

    def __init__(self):
        self.chat_agent: Optional[ChatAgent] = None
        self.initialized = False
        self.current_session_id: Optional[str] = None

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

    async def process_message(self, message: str, session_id: str = None) -> str:
        """Process a message through the agent graph asynchronously with session management"""
        await self.ensure_initialized()

        if not self.chat_agent:
            raise RuntimeError("Chat agent initialization failed")

        try:
            # Set session if provided, or create a new one if none exists
            if session_id:
                if session_id != self.current_session_id:
                    self.chat_agent.set_session_id(session_id)
                    self.current_session_id = session_id
            elif not self.current_session_id:
                # Create a new session if none exists
                new_session_id = await self.chat_agent.initialize_session()
                self.current_session_id = new_session_id

            config = RunnableConfig(recursion_limit=25)
            return await self.chat_agent.achat(message)
        except Exception as e:
            logger.error(f"Message processing error: {str(e)}")
            raise

    async def create_new_session(self, title: str = None) -> str:
        """Create a new chat session."""
        await self.ensure_initialized()

        if not self.chat_agent:
            raise RuntimeError("Chat agent not initialized")

        session_id = await self.chat_agent.initialize_session(title=title)
        self.current_session_id = session_id
        return session_id

    async def switch_session(self, session_id: str) -> bool:
        """Switch to a different session."""
        await self.ensure_initialized()

        if not self.chat_agent:
            return False

        try:
            self.chat_agent.set_session_id(session_id)
            self.current_session_id = session_id
            return True
        except Exception as e:
            logger.error(f"Error switching session: {e}")
            return False

    def get_current_session_id(self) -> Optional[str]:
        """Get the current session ID."""
        return self.current_session_id


# Initialize the service globally
llm_service = LLMService()
