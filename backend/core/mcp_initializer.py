import asyncio
import logging
from services.mcp_service import detach_mcp_service

logger = logging.getLogger(__name__)


async def initialize_mcp_on_startup():
    """
    Initialize MCP service and tools explicitly at startup
    This ensures they're ready when agents need them
    """
    logger.info("Starting MCP service initialization...")

    try:
        if not detach_mcp_service.initialized:
            await detach_mcp_service.initialize_client()

        tools = await detach_mcp_service.get_tools()
        if tools:
            logger.info(
                f"MCP initialization successful! Found {len(tools)} tools: {[t.name for t in tools]}"
            )
            return tools
        else:
            logger.warning("MCP initialization reported no tools.")
            return []
    except Exception as e:
        logger.error(f"Error during MCP initialization: {e}")
        return []


def apply_mcp_fixes():
    """
    Apply all the necessary fixes to get MCP tools working
    Call this during application startup
    """
    loop = asyncio.get_event_loop()
    if loop.is_running():
        asyncio.create_task(initialize_mcp_on_startup())
    else:
        loop.run_until_complete(initialize_mcp_on_startup())

    return True
