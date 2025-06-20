#!/usr/bin/env python3
"""Simple test script to verify memory service functionality."""

import asyncio
import sys
import os

# Add the backend directory to sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from services.memory_service import MemoryService


async def test_memory_service():
    """Test basic memory service functionality."""
    print("Testing Memory Service...")

    memory_service = MemoryService()

    try:
        # Test 1: Create a session
        print("1. Creating new session...")
        session_id = await memory_service.create_session(
            title="Test Session", metadata={"test": True}
        )
        print(f"   Created session: {session_id}")

        # Test 2: Add messages
        print("2. Adding messages...")
        await memory_service.add_message(
            session_id=session_id, role="user", content="Hello, this is a test message!"
        )

        await memory_service.add_message(
            session_id=session_id,
            role="assistant",
            content="Hello! I received your test message.",
            agent_type="chat",
        )
        print("   Messages added successfully")

        # Test 3: Get session context
        print("3. Getting session context...")
        context = await memory_service.get_session_context(session_id)
        print(
            f"   Context retrieved: {len(context.get('recent_messages', []))} messages"
        )

        # Test 4: List sessions
        print("4. Listing sessions...")
        sessions = await memory_service.list_sessions()
        print(f"   Found {len(sessions)} sessions")

        # Test 5: Get specific session
        print("5. Getting specific session...")
        session_details = await memory_service.get_session(session_id)
        print(f"   Session title: {session_details['title']}")

        # Test 6: Update session
        print("6. Updating session...")
        updated = await memory_service.update_session(
            session_id, title="Updated Test Session"
        )
        print(f"   Session updated: {updated}")

        print("✅ All tests passed!")
        return True

    except Exception as e:
        print(f"❌ Test failed: {e}")
        import traceback

        traceback.print_exc()
        return False


if __name__ == "__main__":
    success = asyncio.run(test_memory_service())
    sys.exit(0 if success else 1)
