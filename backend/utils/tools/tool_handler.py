import logging
import asyncio
import json
import re
from typing import Any, List, Dict, Optional
from langchain_core.tools import Tool, BaseTool
from services.mcp_service import detach_mcp_service

logger = logging.getLogger(__name__)


class ToolHandler:
    """Unified handler for tool invocation with proper async support"""

    @staticmethod
    async def ainvoke_tool(tool: BaseTool, args: Any) -> Any:
        """Asynchronously invoke a tool with proper error handling"""
        try:
            is_structured_tool = (
                hasattr(tool, "_run_async") and tool._run_async is not None
            )
            # Format args appropriately if needed
            if isinstance(args, str) and hasattr(tool, "args_schema"):
                if hasattr(tool.args_schema, "__annotations__"):
                    param_name = next(
                        iter(tool.args_schema.__annotations__.keys()), "input"
                    )
                    args = {param_name: args}
                elif isinstance(args, str) and "=" in args:
                    key, value = args.split("=", 1)
                    args = {key.strip(): value.strip().strip("'\"")}
                else:
                    args = {"input": args}

            # Handle async tools
            if hasattr(tool, "ainvoke"):
                return await tool.ainvoke(args)
            elif is_structured_tool:
                if isinstance(args, dict):
                    return await tool._run_async(**args)
                return await tool._run_async(args)
            elif asyncio.iscoroutinefunction(getattr(tool, "invoke", None)):
                return await tool.invoke(args)

            # Handle sync tools
            return await asyncio.to_thread(
                lambda: (
                    tool.invoke(args)
                    if hasattr(tool, "invoke")
                    else (
                        tool.func(args)
                        if hasattr(tool, "func")
                        else (
                            tool.run(**args)
                            if hasattr(tool, "run") and isinstance(args, dict)
                            else tool.run(args) if hasattr(tool, "run") else tool(args)
                        )
                    )
                )
            )
        except Exception as e:
            logger.error(f"Error invoking tool {tool.name}: {e}")
            return f"Error: {str(e)}"

    @staticmethod
    async def process_tool_calls(
        content: str, tools: List[Tool], artifacts: Optional[Dict] = None
    ) -> tuple[str, Dict]:
        """Process tool calls in content using async invocation"""
        if artifacts is None:
            artifacts = {}

        if not tools or not content:
            logger.debug(
                f"Tool processing: tools={len(tools) if tools else 0}, content_length={len(content) if content else 0}"
            )
            return content, artifacts

        # Multiple patterns to catch different tool calling formats
        patterns = [
            r"\[Tool Used\]\s*(?P<n>[\w-]+)\((?P<args>[^)]*)\)",  # [Tool Used] pattern
            r"(?P<n>tavily-search|tavily-extract|tavily-crawl|tavily-map)\((?P<args>[^)]*)\)",  # Direct tool calls
        ]

        tool_map = {t.name: t for t in tools}
        logger.debug(f"Available tools: {list(tool_map.keys())}")

        async def handle_tool_match(match) -> str:
            try:
                tool_name = match.group("n")
                args_str = match.group("args").strip()

                logger.info(f"Processing tool call: {tool_name}({args_str})")

                tool = tool_map.get(tool_name)
                if not tool:
                    logger.warning(
                        f"Tool {tool_name} not found in available tools: {list(tool_map.keys())}"
                    )
                    return match.group(0)

                # Parse arguments
                if args_str:
                    try:
                        args = json.loads(args_str)
                    except json.JSONDecodeError:
                        args = args_str
                else:
                    args = {}

                # Invoke tool
                result = await ToolHandler.ainvoke_tool(tool, args)
                artifacts[tool_name] = result
                logger.info(
                    f"Tool {tool_name} executed successfully, result length: {len(str(result))}"
                )

                return f"[Tool Result: {tool_name}]"
            except Exception as e:
                logger.error(f"Error processing tool call: {e}")
                return f"Error: {str(e)}"

        # Process all patterns
        for pattern in patterns:
            matches = list(re.finditer(pattern, content))
            logger.debug(f"Pattern {pattern}: found {len(matches)} matches")
            for match in matches:
                replacement = await handle_tool_match(match)
                content = (
                    content[: match.start()] + replacement + content[match.end() :]
                )

        return content, artifacts

    @staticmethod
    async def initialize_tools() -> List[Tool]:
        """Initialize and return available tools"""
        try:
            if not detach_mcp_service.initialized:
                await detach_mcp_service.initialize_client()
            return await detach_mcp_service.get_tools()
        except Exception as e:
            logger.error(f"Error initializing tools: {e}")
            return []
