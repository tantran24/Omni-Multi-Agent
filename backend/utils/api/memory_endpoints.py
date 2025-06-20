"""API endpoints for memory and session management."""

from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from services.memory_service import memory_service
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


class CreateSessionRequest(BaseModel):
    title: Optional[str] = Field(default=None, description="Session title")
    metadata: Optional[Dict[str, Any]] = Field(
        default=None, description="Session metadata"
    )


class UpdateSessionRequest(BaseModel):
    title: Optional[str] = Field(default=None, description="New session title")
    metadata: Optional[Dict[str, Any]] = Field(
        default=None, description="Updated metadata"
    )


class SessionResponse(BaseModel):
    id: str
    title: str
    user_id: Optional[str]
    created_at: str
    updated_at: str
    is_active: bool
    metadata: Dict[str, Any]


class SessionListResponse(BaseModel):
    id: str
    title: str
    created_at: str
    updated_at: str
    message_count: int
    metadata: Dict[str, Any]


class MessageResponse(BaseModel):
    id: str
    text: str
    isUser: bool
    timestamp: str
    messageType: str
    metadata: Dict[str, Any]
    agentType: Optional[str]
    isError: bool


@router.post("/sessions", response_model=SessionResponse)
async def create_session(request: CreateSessionRequest):
    """Create a new chat session."""
    try:
        session_id = await memory_service.create_session(
            title=request.title, metadata=request.metadata
        )

        session = await memory_service.get_session(session_id)
        if not session:
            raise HTTPException(status_code=500, detail="Failed to create session")

        return SessionResponse(**session)
    except Exception as e:
        logger.error(f"Error creating session: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/sessions", response_model=List[SessionListResponse])
async def list_sessions(
    user_id: Optional[str] = Query(None, description="Filter by user ID"),
    limit: int = Query(50, description="Maximum number of sessions to return"),
):
    """List all sessions."""
    try:
        sessions = await memory_service.list_sessions(user_id=user_id, limit=limit)
        return [SessionListResponse(**session) for session in sessions]
    except Exception as e:
        logger.error(f"Error listing sessions: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/sessions/{session_id}", response_model=SessionResponse)
async def get_session(session_id: str):
    """Get a specific session by ID."""
    try:
        session = await memory_service.get_session(session_id)
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")

        return SessionResponse(**session)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting session {session_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/sessions/{session_id}", response_model=SessionResponse)
async def update_session(session_id: str, request: UpdateSessionRequest):
    """Update a session."""
    try:
        success = await memory_service.update_session(
            session_id=session_id, title=request.title, metadata=request.metadata
        )

        if not success:
            raise HTTPException(status_code=404, detail="Session not found")

        session = await memory_service.get_session(session_id)
        return SessionResponse(**session)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating session {session_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/sessions/{session_id}")
async def delete_session(session_id: str):
    """Delete a session."""
    try:
        success = await memory_service.delete_session(session_id)
        if not success:
            raise HTTPException(status_code=404, detail="Session not found")

        return {"message": "Session deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting session {session_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/sessions/{session_id}/messages", response_model=List[MessageResponse])
async def get_session_messages(
    session_id: str,
    limit: int = Query(50, description="Maximum number of messages to return"),
):
    """Get messages for a session."""
    try:
        messages = await memory_service.get_recent_messages(session_id, limit=limit)
        # Convert content to text for response model
        formatted_messages = []
        for message in messages:
            formatted_message = {**message, "text": message["content"]}
            formatted_messages.append(MessageResponse(**formatted_message))
        return formatted_messages
    except Exception as e:
        logger.error(f"Error getting messages for session {session_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/sessions/{session_id}/context")
async def get_session_context(session_id: str):
    """Get comprehensive session context."""
    try:
        context = await memory_service.get_session_context(session_id)
        if not context:
            raise HTTPException(status_code=404, detail="Session not found")

        return context
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting context for session {session_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))
