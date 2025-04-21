import logging
import asyncio
import json
import re
from typing import Any, List, Dict, Optional
from langchain_core.tools import Tool
from services.mcp_service import detach_mcp_service
from .async_tool_handler import AsyncToolHandler  # Import the new async handler

logger = logging.getLogger(__name__)


class MCPToolHandler:
    """Handler for MCP tools with proper initialization and tool invocation"""

    @staticmethod
    async def initialize_mcp() -> bool:
        """
        Initialize MCP client properly - use this at startup and before tool access
        Returns True if initialization was successful
        """
        try:
            if detach_mcp_service.initialized:
                return True

            try:
                loop = asyncio.get_event_loop()
            except RuntimeError:
                loop = asyncio.new_event_loop()
                asyncio.set_event_loop(loop)
                logger.info("Created new event loop for MCP initialization")

            result = await detach_mcp_service.initialize_client()
            logger.info(f"MCP service initialization result: {result}")
            return result
        except Exception as e:
            logger.error(f"Error initializing MCP service: {e}")
            return False

    @staticmethod
    def synchronous_initialize() -> bool:
        """
        Initialize MCP client synchronously - use in non-async contexts
        Returns True if initialization was successful
        """
        try:
            if detach_mcp_service.initialized:
                return True

            try:
                loop = asyncio.get_event_loop()
            except RuntimeError:
                loop = asyncio.new_event_loop()
                asyncio.set_event_loop(loop)
                logger.info("Created new event loop for synchronous MCP initialization")

            if loop.is_running():
                asyncio.create_task(detach_mcp_service.initialize_client())
                return detach_mcp_service.initialized
            else:
                return loop.run_until_complete(detach_mcp_service.initialize_client())
        except Exception as e:
            logger.error(f"Error in synchronous MCP initialization: {e}")
            return False

    @staticmethod
    def get_mcp_tools() -> List[Tool]:
        """
        Get MCP tools, ensuring initialization first
        Returns list of available tools (may be empty if initialization fails)
        """
        MCPToolHandler.synchronous_initialize()
        try:
            tools = detach_mcp_service.get_tools()
            if tools:
                logger.info(
                    f"Retrieved {len(tools)} MCP tools: {[t.name for t in tools]}"
                )
            else:
                logger.warning("No MCP tools available after initialization")
            return tools
        except Exception as e:
            logger.error(f"Error retrieving MCP tools: {e}")
            return []

    @staticmethod
    def _get_schema_keys(tool):
        """
        Helper method to safely extract parameter names from a tool's schema
        Handles multiple schema formats (dict, class with annotations, Pydantic)
        """
        try:
            if not hasattr(tool, "args_schema") or not tool.args_schema:
                return []

            if hasattr(tool.args_schema, "__annotations__"):
                return list(tool.args_schema.__annotations__.keys())

            if isinstance(tool.args_schema, dict):
                return list(tool.args_schema.keys())

            if hasattr(tool.args_schema, "schema") and callable(
                tool.args_schema.schema
            ):
                schema_dict = tool.args_schema.schema()
                if isinstance(schema_dict, dict) and "properties" in schema_dict:
                    return list(schema_dict["properties"].keys())

            return []
        except Exception as e:
            logger.warning(f"Error extracting schema keys: {e}")
            return [] @ staticmethod

    def invoke_tool(tool: Tool, args: Any) -> Any:
        """
        Safely invoke a tool using the appropriate method
        Now uses AsyncToolHandler to properly handle StructuredTools
        """
        # Use the new AsyncToolHandler which properly supports StructuredTools
        return AsyncToolHandler.invoke_tool(tool, args)

    @staticmethod
    def process_tool_call(
        content: str, tools: List[Tool], artifacts: Optional[Dict] = None
    ) -> tuple[str, Dict]:
        """
        Process tool calls in content using the correct pattern matching
        Returns the updated content and artifacts dictionary
        """
        if artifacts is None:
            artifacts = {}

        if not tools:
            return content, artifacts

        tool_pattern = r"\[Tool Used\]\s*(?P<name>[\w-]+)\((?P<args>[^)]*)\)"

        def handle_tool_match(match):
            try:
                tool_name = match.group("name")
                args_str = match.group("args").strip()
                logger.info(f"Tool call detected: {tool_name} with args '{args_str}'")

                tool = next((t for t in tools if t.name == tool_name), None)
                if not tool:
                    logger.warning(f"Tool '{tool_name}' not found in available tools")
                    return match.group(0)

                if args_str:
                    try:
                        arg_val = json.loads(args_str)
                    except json.JSONDecodeError:
                        if "=" in args_str and not args_str.startswith("{"):
                            try:
                                key, value = args_str.split("=", 1)
                                arg_val = {key.strip(): value.strip().strip("'")}
                            except Exception:
                                if hasattr(tool, "args_schema") and tool.args_schema:
                                    schema_keys = MCPToolHandler._get_schema_keys(tool)
                                    if schema_keys:
                                        arg_val = {schema_keys[0]: args_str}
                                    else:
                                        arg_val = {"input": args_str}
                                else:
                                    arg_val = args_str
                        else:
                            if hasattr(tool, "args_schema") and tool.args_schema:
                                schema_keys = MCPToolHandler._get_schema_keys(tool)
                                if schema_keys:
                                    arg_val = {schema_keys[0]: args_str}
                                else:
                                    arg_val = {"input": args_str}
                            else:
                                arg_val = args_str
                else:
                    arg_val = {}

                result = MCPToolHandler.invoke_tool(tool, arg_val)
                artifacts[tool_name] = result
                return str(result)
            except Exception as e:
                logger.error(f"Error in handle_tool_match: {e}")
                return f"Error processing tool: {str(e)}"

        processed = re.sub(tool_pattern, handle_tool_match, content)

        tool_names = [t.name for t in tools]
        if tool_names:
            names_pattern = "|".join(re.escape(name) for name in tool_names)
            direct_regex = re.compile(f"(?P<name>{names_pattern})\\((?P<args>[^)]*)\\)")
            processed = direct_regex.sub(handle_tool_match, processed)

        return processed, artifacts
