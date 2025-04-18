"""
Enhanced MCP Tool Handler with async support
"""

import logging
import asyncio
import json
import re
from typing import Any, List, Dict, Optional
from langchain_core.tools import Tool, BaseTool
from services.mcp_service import detach_mcp_service

logger = logging.getLogger(__name__)


class AsyncToolHandler:
    """Handler specifically designed to support both sync and async tool invocation"""

    @staticmethod
    def invoke_tool(tool: BaseTool, args: Any) -> Any:
        """Invoke a tool with proper async support"""
        try:
            is_structured_tool = (
                hasattr(tool, "_run_async") and tool._run_async is not None
            )
            is_async_tool = (
                is_structured_tool
                or hasattr(tool, "ainvoke")
                or hasattr(tool, "coroutine")
                or (
                    hasattr(tool, "invoke") and asyncio.iscoroutinefunction(tool.invoke)
                )
            )

            logger.info(f"Invoking tool {tool.name} (async={is_async_tool})")

            if (
                isinstance(args, str)
                and hasattr(tool, "args_schema")
                and tool.args_schema
            ):
                param_name = None
                try:
                    if hasattr(tool.args_schema, "__annotations__"):
                        keys = list(tool.args_schema.__annotations__.keys())
                        if keys:
                            param_name = keys[0]
                    elif hasattr(tool.args_schema, "schema") and callable(
                        tool.args_schema.schema
                    ):
                        schema = tool.args_schema.schema()
                        if "properties" in schema and schema["properties"]:
                            param_name = next(iter(schema["properties"].keys()))
                except Exception as e:
                    logger.warning(f"Error extracting schema info: {e}")

                # Format args appropriately
                if param_name:
                    args = {param_name: args}
                else:
                    # Common fallback parameter names
                    for common_param in ["input", "query", "text", "path"]:
                        if args.startswith(f"{common_param}="):
                            args = {
                                common_param: args.split("=", 1)[1].strip().strip("'\"")
                            }
                            break
                    else:
                        # Last resort - generic dict with "input" key
                        args = {"input": args}

            # Handle async invocation
            if is_async_tool:
                # Get or create event loop
                try:
                    loop = asyncio.get_event_loop()
                except RuntimeError:
                    loop = asyncio.new_event_loop()
                    asyncio.set_event_loop(loop)

                # Determine the right async method to call
                if hasattr(tool, "ainvoke"):
                    return loop.run_until_complete(tool.ainvoke(args))
                elif is_structured_tool and hasattr(tool, "_run_async"):
                    # StructuredTool needs to unpack dict args
                    if isinstance(args, dict):
                        return loop.run_until_complete(tool._run_async(**args))
                    else:
                        return loop.run_until_complete(tool._run_async(input=args))
                elif hasattr(tool, "coroutine"):
                    return loop.run_until_complete(tool.coroutine(args))
                elif asyncio.iscoroutinefunction(tool.invoke):
                    return loop.run_until_complete(tool.invoke(args))
                else:
                    raise ValueError(
                        f"Could not determine async method for {tool.name}"
                    )
            else:
                # Synchronous invocation
                if hasattr(tool, "invoke"):
                    return tool.invoke(args)
                elif hasattr(tool, "func"):
                    return tool.func(args)
                elif hasattr(tool, "run"):
                    if isinstance(args, dict):
                        return tool.run(**args)
                    else:
                        return tool.run(args)
                else:
                    return tool(args)

        except Exception as e:
            logger.error(f"Error invoking tool {tool.name}: {e}")
            return f"Error: {str(e)}"

    @staticmethod
    def process_tool_call(
        content: str, tools: List[BaseTool], pattern="[Tool Used]"
    ) -> tuple[str, Dict]:
        """Process tool calls in content and return the processed content and artifacts"""
        artifacts = {}

        if not tools or not content:
            return content, artifacts

        # Build patterns for tool detection
        tool_pattern = rf"{re.escape(pattern)}\s*(?P<name>[\w-]+)\((?P<args>[^)]*)\)"
        tool_names = [t.name for t in tools]

        def handle_tool_match(match):
            try:
                # Extract tool name and arguments
                tool_name = match.group("name")
                args_str = match.group("args").strip()
                logger.info(f"Tool call detected: {tool_name} with args '{args_str}'")

                # Find the matching tool
                tool = next((t for t in tools if t.name == tool_name), None)
                if not tool:
                    logger.warning(f"Tool '{tool_name}' not found")
                    return match.group(0)

                # Process arguments
                if args_str:
                    try:
                        # Try JSON first
                        args = json.loads(args_str)
                    except:
                        # Handle key=value format
                        if "=" in args_str and not args_str.startswith("{"):
                            try:
                                key, value = args_str.split("=", 1)
                                args = {key.strip(): value.strip().strip("'\"")}
                            except:
                                args = args_str
                        else:
                            args = args_str
                else:
                    args = {}

                # Invoke the tool with proper async handling
                result = AsyncToolHandler.invoke_tool(tool, args)
                artifacts[tool_name] = result
                return str(result)
            except Exception as e:
                logger.error(f"Error processing tool call: {e}")
                return f"Error processing tool: {str(e)}"

        # Process both [Tool Used] pattern and direct tool calls
        processed = re.sub(tool_pattern, handle_tool_match, content)

        # Add direct tool name pattern
        if tool_names:
            direct_pattern = "|".join(re.escape(name) for name in tool_names)
            direct_regex = re.compile(
                f"(?P<name>{direct_pattern})\\((?P<args>[^)]*)\\)"
            )
            processed = direct_regex.sub(handle_tool_match, processed)

        return processed, artifacts
