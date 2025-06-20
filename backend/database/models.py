"""Database models for long-term memory and session management."""

from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    DateTime,
    ForeignKey,
    Boolean,
    JSON,
)
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from datetime import datetime
import uuid

Base = declarative_base()


class ChatSession(Base):
    """Model for chat sessions to organize conversations."""

    __tablename__ = "chat_sessions"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String(255), nullable=False, default="New Chat")
    user_id = Column(String(255), nullable=True)  # For future multi-user support
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    is_active = Column(Boolean, default=True)
    metadata_ = Column(JSON, nullable=True)  # For storing session-specific metadata

    # Relationship to messages
    messages = relationship(
        "ChatMessage", back_populates="session", cascade="all, delete-orphan"
    )

    def __repr__(self):
        return f"<ChatSession(id='{self.id}', title='{self.title}', created_at='{self.created_at}')>"


class ChatMessage(Base):
    """Model for individual chat messages within sessions."""

    __tablename__ = "chat_messages"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    session_id = Column(String, ForeignKey("chat_sessions.id"), nullable=False)
    role = Column(String(50), nullable=False)  # 'user', 'assistant', 'system'
    content = Column(Text, nullable=False)
    timestamp = Column(DateTime, default=func.now())
    message_type = Column(
        String(50), default="text"
    )  # 'text', 'image', 'file', 'error'
    metadata_ = Column(
        JSON, nullable=True
    )  # For storing message-specific data (images, files, etc.)
    agent_type = Column(
        String(100), nullable=True
    )  # Which agent processed this message

    # Relationship to session
    session = relationship("ChatSession", back_populates="messages")

    def __repr__(self):
        return f"<ChatMessage(id='{self.id}', role='{self.role}', session_id='{self.session_id}')>"


class UserContext(Base):
    """Model for storing user context and preferences."""

    __tablename__ = "user_context"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(255), nullable=False)
    context_key = Column(
        String(255), nullable=False
    )  # e.g., 'preferences', 'long_term_memory'
    context_value = Column(JSON, nullable=False)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    def __repr__(self):
        return f"<UserContext(user_id='{self.user_id}', key='{self.context_key}')>"


class ConversationSummary(Base):
    """Model for storing conversation summaries for efficient memory retrieval."""

    __tablename__ = "conversation_summaries"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    session_id = Column(String, ForeignKey("chat_sessions.id"), nullable=False)
    summary_text = Column(Text, nullable=False)
    summary_type = Column(String(50), default="auto")  # 'auto', 'manual'
    created_at = Column(DateTime, default=func.now())
    message_count = Column(Integer, default=0)  # Number of messages summarized

    # Relationship to session
    session = relationship("ChatSession")

    def __repr__(self):
        return f"<ConversationSummary(id='{self.id}', session_id='{self.session_id}')>"
