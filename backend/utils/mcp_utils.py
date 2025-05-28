import logging
import asyncio
from typing import Dict, List, Any
from services.mcp_service import detach_mcp_service

logger = logging.getLogger(__name__)


async def check_mcp_status() -> Dict[str, Any]:
    """
    Check the status of MCP services and tools
    Returns a dictionary with diagnostic information
    """
    status = {
        "initialized": detach_mcp_service.initialized,
        "configs_count": len(detach_mcp_service.list_configs()),
        "configs": detach_mcp_service.list_configs(),
        "has_client": detach_mcp_service.client is not None,
    }

    if not status["initialized"] and status["has_client"]:
        try:
            init_success = await detach_mcp_service.initialize_client()
            status["initialization_attempt"] = "success" if init_success else "failed"
        except Exception as e:
            status["initialization_attempt"] = f"error: {str(e)}"

    try:
        tools = await detach_mcp_service.get_tools()
        status["tools_count"] = len(tools)
        status["tool_names"] = [t.name for t in tools] if tools else []
    except Exception as e:
        status["tools_error"] = str(e)
        status["tools_count"] = 0
        status["tool_names"] = []

    return status


def get_mcp_tools_by_category() -> Dict[str, List[str]]:
    """
    Organize MCP tools by category to help with agent routing
    """
    tools = []
    if detach_mcp_service.initialized and detach_mcp_service.client:
        if hasattr(detach_mcp_service.client, "tools"):
            tools = detach_mcp_service.client.tools

    if not tools:
        return {}

    categories = {
        "search": [],
        "reasoning": [],
        "calculation": [],
        "generation": [],
        "external_api": [],
        "other": [],
    }

    for tool in tools:
        tool_name = tool.name.lower()
        if any(term in tool_name for term in ["search", "find", "lookup"]):
            categories["search"].append(tool.name)
        elif any(term in tool_name for term in ["reason", "think", "analyze"]):
            categories["reasoning"].append(tool.name)
        elif any(term in tool_name for term in ["calculate", "compute", "math"]):
            categories["calculation"].append(tool.name)
        elif any(term in tool_name for term in ["generate", "create", "build"]):
            categories["generation"].append(tool.name)
        elif any(term in tool_name for term in ["api", "service", "fetch"]):
            categories["external_api"].append(tool.name)
        else:
            categories["other"].append(tool.name)

    return {k: v for k, v in categories.items() if v}
