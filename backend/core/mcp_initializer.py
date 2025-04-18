"""
MCP Initialization Script
Ensures MCP tools are properly initialized at startup
"""

import asyncio
import logging
from services.mcp_service import detach_mcp_service
from utils.agents.mcp_tool_handler import MCPToolHandler

logger = logging.getLogger(__name__)


async def initialize_mcp_on_startup():
    """
    Initialize MCP service and tools explicitly at startup
    This ensures they're ready when agents need them
    """
    logger.info("Starting MCP service initialization...")

    try:
        success = await MCPToolHandler.initialize_mcp()

        if success:
            tools = detach_mcp_service.get_tools()
            logger.info(
                f"MCP initialization successful! Found {len(tools)} tools: {[t.name for t in tools]}"
            )
            return tools
        else:
            logger.warning("MCP initialization reported failure.")
            return []
    except Exception as e:
        logger.error(f"Error during MCP initialization: {e}")
        return []


def patch_agent_tool_invocation():
    """
    Apply runtime patches to fix tool invocation in agents
    This is a workaround to fix the MCP tool usage without changing source files
    """
    from utils.agents.router_agent import BaseAgent

    original_process_tool_calls = BaseAgent.process_tool_calls

    def patched_process_tool_calls(self, content):
        """A patched version that fixes tool invocation"""
        artifacts = {}

        if "[Tool Used] get_time(" in content or "generate_image" in content:
            content, artifacts = original_process_tool_calls(self, content)

        if self.tools:
            from utils.agents.mcp_tool_handler import MCPToolHandler

            mcp_tools = [
                t for t in self.tools if t.name not in ["get_time", "generate_image"]
            ]
            if mcp_tools:
                content, mcp_artifacts = MCPToolHandler.process_tool_call(
                    content, mcp_tools
                )
                artifacts.update(mcp_artifacts)

        return content, artifacts

    BaseAgent.process_tool_calls = patched_process_tool_calls
    logger.info("Applied MCP tool invocation patch to BaseAgent")


def apply_mcp_fixes():
    """
    Apply all the necessary fixes to get MCP tools working
    Call this during application startup
    """
    from utils.agents.router_agent import BaseAgent

    patch_agent_tool_invocation()

    loop = asyncio.get_event_loop()
    if loop.is_running():
        asyncio.create_task(initialize_mcp_on_startup())
    else:
        loop.run_until_complete(initialize_mcp_on_startup())

    return True
