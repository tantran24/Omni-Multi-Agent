"""Memory service for long-term persistent conversation history."""

from typing import List, Dict, Optional, Any
from datetime import datetime, timedelta
from sqlalchemy import select, func, desc, and_
from sqlalchemy.ext.asyncio import AsyncSession
import logging
from database.models import ChatSession, ChatMessage, ConversationSummary
from database.connection import AsyncSessionLocal

logger = logging.getLogger(__name__)


class MemoryService:
    """Service for managing long-term conversation memory and session persistence."""

    def __init__(self):
        self.max_context_messages = 50
        self.summary_threshold = 100

    async def create_session(
        self, title: str = None, user_id: str = None, metadata: Dict = None
    ) -> str:
        """Create a new chat session."""
        try:
            async with AsyncSessionLocal() as db:
                session = ChatSession(
                    title=title or f"Chat {datetime.now().strftime('%Y-%m-%d %H:%M')}",
                    user_id=user_id,
                    metadata_=metadata or {},
                )
                db.add(session)
                await db.commit()
                await db.refresh(session)
                return session.id
        except Exception as e:
            logger.error(f"Error creating session: {e}")
            raise

    async def add_message(
        self,
        session_id: str,
        role: str,
        content: str,
        message_type: str = "text",
        metadata: Dict = None,
        agent_type: str = None,
    ) -> str:
        """Add a new message to a session."""
        try:
            async with AsyncSessionLocal() as db:
                message = ChatMessage(
                    session_id=session_id,
                    role=role,
                    content=content,
                    message_type=message_type,
                    metadata_=metadata or {},
                    agent_type=agent_type,
                )
                db.add(message)
                await db.commit()
                await db.refresh(message)
                return message.id
        except Exception as e:
            logger.error(f"Error adding message: {e}")
            raise

    async def get_session_context(self, session_id: str) -> Dict[str, Any]:
        """Get session context."""
        try:
            # Get recent messages
            recent_messages = await self.get_recent_messages(session_id)
            return {
                "session_id": session_id,
                "recent_messages": recent_messages,
                "stats": {"total_messages": len(recent_messages)},
            }
        except Exception as e:
            logger.error(f"Error getting session context: {e}")
            return {"session_id": session_id, "recent_messages": []}

    async def list_sessions(self, user_id: str = None, limit: int = 50) -> List[Dict]:
        """List sessions, optionally filtered by user."""
        try:
            async with AsyncSessionLocal() as db:
                query = select(ChatSession).where(ChatSession.is_active == True)

                if user_id:
                    query = query.where(ChatSession.user_id == user_id)

                query = query.order_by(desc(ChatSession.updated_at)).limit(limit)

                result = await db.execute(query)
                sessions = result.scalars().all()

                session_list = []
                for session in sessions:
                    # Get message count for each session
                    count_result = await db.execute(
                        select(func.count(ChatMessage.id)).where(
                            ChatMessage.session_id == session.id
                        )
                    )
                    count = count_result.scalar() or 0

                    session_list.append(
                        {
                            "id": session.id,
                            "title": session.title,
                            "created_at": session.created_at.isoformat(),
                            "updated_at": session.updated_at.isoformat(),
                            "message_count": count,
                            "metadata": session.metadata_ or {},
                        }
                    )

                return session_list
        except Exception as e:
            logger.error(f"Error listing sessions: {e}")
            return []

    async def get_recent_messages(
        self, session_id: str, limit: int = 50, include_system: bool = True
    ) -> List[Dict]:
        """Get recent messages from a session."""
        try:
            async with AsyncSessionLocal() as db:
                query = select(ChatMessage).where(ChatMessage.session_id == session_id)

                if not include_system:
                    query = query.where(ChatMessage.role != "system")

                query = query.order_by(desc(ChatMessage.timestamp)).limit(limit)

                result = await db.execute(query)
                messages = result.scalars().all()

                # Reverse to get chronological order
                messages = list(reversed(messages))

                message_list = []
                for msg in messages:
                    message_list.append(
                        {
                            "id": msg.id,
                            "role": msg.role,
                            "content": msg.content,
                            "isUser": msg.role == "user",
                            "timestamp": msg.timestamp.isoformat(),
                            "messageType": msg.message_type,
                            "metadata": msg.metadata_ or {},
                            "agentType": msg.agent_type,
                            "isError": msg.message_type == "error",
                        }
                    )

                return message_list
        except Exception as e:
            logger.error(f"Error getting recent messages for session {session_id}: {e}")
            return []

    async def get_session(self, session_id: str) -> Optional[Dict]:
        """Get session by ID."""
        try:
            async with AsyncSessionLocal() as db:
                result = await db.execute(
                    select(ChatSession).where(ChatSession.id == session_id)
                )
                session = result.scalar_one_or_none()

                if session:
                    return {
                        "id": session.id,
                        "title": session.title,
                        "user_id": session.user_id,
                        "created_at": session.created_at.isoformat(),
                        "updated_at": session.updated_at.isoformat(),
                        "is_active": session.is_active,
                        "metadata": session.metadata_ or {},
                    }
                return None
        except Exception as e:
            logger.error(f"Error getting session {session_id}: {e}")
            return None

    async def update_session(
        self, session_id: str, title: str = None, metadata: Dict = None
    ) -> bool:
        """Update session details."""
        try:
            async with AsyncSessionLocal() as db:
                result = await db.execute(
                    select(ChatSession).where(ChatSession.id == session_id)
                )
                session = result.scalar_one_or_none()

                if not session:
                    return False

                if title:
                    session.title = title
                if metadata:
                    session.metadata_ = metadata

                session.updated_at = datetime.now()
                await db.commit()
                return True
        except Exception as e:
            logger.error(f"Error updating session {session_id}: {e}")
            return False

    async def delete_session(self, session_id: str) -> bool:
        """Soft delete a session."""
        try:
            async with AsyncSessionLocal() as db:
                result = await db.execute(
                    select(ChatSession).where(ChatSession.id == session_id)
                )
                session = result.scalar_one_or_none()

                if not session:
                    return False

                session.is_active = False
                session.updated_at = datetime.now()
                await db.commit()
                return True
        except Exception as e:
            logger.error(f"Error deleting session {session_id}: {e}")
            return False


# Create a global instance
memory_service = MemoryService()
