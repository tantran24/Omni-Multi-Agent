"""Memory mixin for adding persistent memory capabilities to any agent."""

from typing import List, Optional, Dict, Any
from langchain_core.messages import BaseMessage, HumanMessage, AIMessage
import logging
from services.memory_service import memory_service

logger = logging.getLogger(__name__)


class MemoryMixin:
    """Mixin class to add persistent memory capabilities to any agent."""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.session_id: Optional[str] = None
        self._memory_enabled = True

    def set_session_id(self, session_id: str):
        """Set the current session ID."""
        self.session_id = session_id

    def disable_memory(self):
        """Disable memory for this agent."""
        self._memory_enabled = False

    def enable_memory(self):
        """Enable memory for this agent."""
        self._memory_enabled = True

    async def initialize_session(self, title: str = None) -> str:
        """Initialize a new session if none exists."""
        if not self._memory_enabled:
            return None

        if not self.session_id:
            self.session_id = await memory_service.create_session(title=title)
            logger.info(f"Created new session: {self.session_id}")
        return self.session_id

    async def load_conversation_history(self, limit: int = 50) -> List[BaseMessage]:
        """Load conversation history from persistent storage."""
        if not self._memory_enabled or not self.session_id:
            return []

        try:
            messages_data = await memory_service.get_recent_messages(
                self.session_id, limit=limit
            )
            # Convert to BaseMessage objects
            messages = []
            for msg_data in messages_data:
                if msg_data["role"] == "user":
                    messages.append(HumanMessage(content=msg_data["content"]))
                elif msg_data["role"] == "assistant":
                    messages.append(AIMessage(content=msg_data["content"]))
            return messages
        except Exception as e:
            logger.error(f"Error loading conversation history: {e}")
            return []

    async def save_message(
        self,
        role: str,
        content: str,
        message_type: str = "text",
        metadata: Dict = None,
        agent_type: str = None,
    ) -> Optional[str]:
        """Save a message to persistent storage."""
        if not self._memory_enabled or not self.session_id:
            return None

        try:
            return await memory_service.add_message(
                session_id=self.session_id,
                role=role,
                content=content,
                message_type=message_type,
                metadata=metadata or {},
                agent_type=agent_type or self.__class__.__name__,
            )
        except Exception as e:
            logger.error(f"Error saving message: {e}")
            return None

    async def get_session_context(self) -> Dict[str, Any]:
        """Get comprehensive session context."""
        if not self._memory_enabled or not self.session_id:
            return {}

        return await memory_service.get_session_context(self.session_id)

    def get_current_session_id(self) -> Optional[str]:
        """Get the current session ID."""
        return self.session_id if self._memory_enabled else None
