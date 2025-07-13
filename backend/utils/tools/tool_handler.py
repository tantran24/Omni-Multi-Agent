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
            logger.debug(f"Invoking tool {tool.name} with args: {args}")

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

            logger.debug(f"Formatted args for tool {tool.name}: {args}")

            # Handle async tools
            if hasattr(tool, "ainvoke"):
                logger.debug(f"Using ainvoke for tool {tool.name}")
                result = await tool.ainvoke(args)
            elif is_structured_tool:
                logger.debug(f"Using _run_async for structured tool {tool.name}")
                if isinstance(args, dict):
                    result = await tool._run_async(**args)
                else:
                    result = await tool._run_async(args)
            elif asyncio.iscoroutinefunction(getattr(tool, "invoke", None)):
                logger.debug(f"Using async invoke for tool {tool.name}")
                result = await tool.invoke(args)
            else:
                # Handle sync tools
                logger.debug(f"Using sync execution for tool {tool.name}")
                result = await asyncio.to_thread(
                    lambda: (
                        tool.invoke(args)
                        if hasattr(tool, "invoke")
                        else (
                            tool.func(args)
                            if hasattr(tool, "func")
                            else (
                                tool.run(**args)
                                if hasattr(tool, "run") and isinstance(args, dict)
                                else (
                                    tool.run(args)
                                    if hasattr(tool, "run")
                                    else tool(args)
                                )
                            )
                        )
                    )
                )

            logger.debug(
                f"Tool {tool.name} execution completed, result type: {type(result)}"
            )
            return result

        except Exception as e:
            logger.error(f"Error invoking tool {tool.name}: {e}", exc_info=True)
            # Re-raise the exception to let the caller handle it
            raise e

    @staticmethod
    async def process_tool_calls(
        content: str,
        tools: List[Tool],
        artifacts: Optional[Dict] = None,
        max_tool_calls: int = 3,
    ) -> tuple[str, Dict]:
        """Process tool calls in content using async invocation with safeguards against infinite loops"""
        if artifacts is None:
            artifacts = {}

        # Ensure content is a string
        if content is None:
            logger.debug("Content is None, returning empty string")
            return "", artifacts

        if not isinstance(content, str):
            logger.warning(
                f"Content is not a string (type: {type(content)}), converting to string"
            )
            content = str(content)

        if not tools or not content:
            logger.debug(
                f"Tool processing: tools={len(tools) if tools else 0}, content_length={len(content) if content else 0}"
            )
            return content, artifacts

        # Multiple patterns to catch different tool calling formats
        patterns = [
            r"\[Tool Used\]\s*(?P<n>[\w_-]+)\((?P<args>[^)]*)\)",  # [Tool Used] pattern with underscore support
            r"(?P<n>tavily[-_]search|tavily[-_]extract|tavily[-_]crawl|tavily[-_]map)\((?P<args>[^)]*)\)",  # Direct tool calls with hyphen/underscore
        ]

        tool_map = {t.name: t for t in tools}
        logger.debug(f"Available tools: {list(tool_map.keys())}")

        # Track tool usage to prevent infinite loops
        tool_call_count = {}

        async def handle_tool_match(match) -> str:
            try:
                tool_name = match.group("n")
                args_str = match.group("args").strip()

                # Check if we've exceeded the limit for this tool
                if tool_call_count.get(tool_name, 0) >= max_tool_calls:
                    logger.warning(
                        f"Tool {tool_name} has been called {max_tool_calls} times, skipping further calls to prevent loops"
                    )
                    return ""  # Return empty string to hide exceeded calls

                tool_call_count[tool_name] = tool_call_count.get(tool_name, 0) + 1

                logger.info(
                    f"Processing tool call {tool_call_count[tool_name]}: {tool_name}({args_str})"
                )

                tool = tool_map.get(tool_name)
                if not tool:
                    # Try to find the tool with underscore/hyphen variations
                    alt_tool_name = (
                        tool_name.replace("_", "-")
                        if "_" in tool_name
                        else tool_name.replace("-", "_")
                    )
                    tool = tool_map.get(alt_tool_name)
                    if tool:
                        tool_name = alt_tool_name  # Use the correct name for tracking
                    else:
                        logger.warning(
                            f"Tool {tool_name} not found in available tools: {list(tool_map.keys())}"
                        )
                        return ""  # Return empty string to hide unmatched tool calls

                # Parse arguments
                if args_str:
                    try:
                        # Try to parse as JSON first
                        if args_str.startswith("{") and args_str.endswith("}"):
                            args = json.loads(args_str)
                        else:
                            # Handle key=value format
                            args_dict = {}
                            # Split by comma but handle quoted values
                            parts = []
                            current_part = ""
                            in_quotes = False
                            quote_char = None

                            for char in args_str:
                                if char in ['"', "'"] and (
                                    not in_quotes or char == quote_char
                                ):
                                    if not in_quotes:
                                        in_quotes = True
                                        quote_char = char
                                    else:
                                        in_quotes = False
                                        quote_char = None
                                    current_part += char
                                elif char == "," and not in_quotes:
                                    parts.append(current_part.strip())
                                    current_part = ""
                                else:
                                    current_part += char

                            if current_part.strip():
                                parts.append(current_part.strip())

                            for part in parts:
                                if "=" in part:
                                    key, value = part.split("=", 1)
                                    key = key.strip()
                                    value = value.strip().strip("'\"")
                                    args_dict[key] = value

                            args = args_dict if args_dict else args_str
                    except json.JSONDecodeError as e:
                        logger.warning(
                            f"Failed to parse args as JSON: {e}, using raw string"
                        )
                        args = args_str
                else:
                    args = {}

                # Invoke tool with enhanced error handling
                try:
                    result = await ToolHandler.ainvoke_tool(tool, args)
                    if result is not None:
                        # Create a unique key for each tool call to avoid overwrites
                        call_count = tool_call_count.get(tool_name, 1)
                        artifact_key = (
                            f"{tool_name}_{call_count}" if call_count > 1 else tool_name
                        )
                        artifacts[artifact_key] = result
                        result_preview = (
                            str(result)[:200] + "..."
                            if len(str(result)) > 200
                            else str(result)
                        )
                        logger.info(
                            f"Tool {tool_name} executed successfully, result length: {len(str(result))}, preview: {result_preview}"
                        )
                        return ""  # Return empty string to hide tool call in output
                    else:
                        logger.warning(f"Tool {tool_name} returned None result")
                        return ""  # Return empty string to hide failed tool call
                except Exception as tool_error:
                    logger.error(
                        f"Error invoking tool {tool_name}: {tool_error}", exc_info=True
                    )
                    return ""  # Return empty string to hide failed tool call

            except Exception as e:
                logger.error(f"Error processing tool call: {e}", exc_info=True)
                return ""  # Return empty string to hide error

        # Process all patterns - collect all matches first, then process in reverse order
        all_matches = []
        for pattern in patterns:
            matches = list(re.finditer(pattern, content))
            logger.debug(f"Pattern {pattern}: found {len(matches)} matches")
            all_matches.extend(matches)

        # Sort matches by start position in reverse order to maintain string indices
        all_matches.sort(key=lambda m: m.start(), reverse=True)

        # Process matches in reverse order to maintain string indices
        for match in all_matches:
            replacement = await handle_tool_match(match)
            content = content[: match.start()] + replacement + content[match.end() :]

        # Clean up any remaining JSON artifacts that might be left over
        # Remove standalone JSON blocks that might be tool results
        json_patterns = [
            r"```json\s*\[.*?\]\s*```",  # JSON code blocks
            r"\[.*?\](?=\s*```json|\s*$)",  # Standalone JSON arrays
            r"```\s*\[.*?\]\s*```",  # Generic code blocks with arrays
        ]

        for pattern in json_patterns:
            content = re.sub(pattern, "", content, flags=re.DOTALL)

        # Remove multiple consecutive newlines
        content = re.sub(r"\n{3,}", "\n\n", content)

        # Remove leading/trailing whitespace
        content = content.strip()

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
