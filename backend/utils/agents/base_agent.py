from typing import List, Dict, Any, Optional
from langchain_core.messages import BaseMessage, HumanMessage, AIMessage, SystemMessage
import logging
import re
import json
import asyncio
from utils.wrappers.llm_wrapper import LLMWrapper
from .tools import get_tools_for_agent

logger = logging.getLogger(__name__)


class BaseAgent:
    """Base class for all specialized agents"""

    def __init__(self, llm=None):
        self.llm = llm or LLMWrapper()
        self.agent_type = "base"
        self.agent_name = "Base Agent"
        self.tools = []
        self.initialize_tools()

    def initialize_tools(self):
        """Initialize the tools for this agent type"""
        self.tools = get_tools_for_agent(self.agent_type)
        logger.info(f"{self.agent_name} initialized with {len(self.tools)} tools")

    def get_system_prompt(self) -> str:
        """Get the system prompt for this agent"""
        from .prompts import get_system_prompt

        tools_desc = ""
        if self.tools:
            tools_desc = "\n\nYou have access to the following tools:\n"
            for tool in self.tools:
                tools_desc += f"- {tool.name}: {tool.description}\n"

            tools_desc += (
                "\nUse these tools when appropriate by formatting your response like:\n"
            )
            tools_desc += "[Tool Used] tool_name(parameter)"

        return f"{get_system_prompt()}\n\nYou are the {self.agent_name}. Focus on your specialty.{tools_desc}"

    def process_response(self, content: str) -> Dict[str, Any]:
        """Process the LLM response and extract any artifacts or process tool calls"""
        content, artifacts = self.process_tool_calls(content)
        return {
            "content": content,
            "artifacts": artifacts,
        }

    def process_tool_calls(self, content: str) -> tuple[str, dict]:
        """Process tool calls in the content"""
        artifacts = {}

        tool_pattern = r"\[Tool Used\]\s*(?P<name>[\w-]+)\((?P<args>[^)]*)\)"

        def invoke_tool(match):
            try:
                tool_name = match.group("name")
                args_str = match.group("args").strip()
                logger.info(f"Invoking tool: {tool_name} with args '{args_str}'")

                tool = next((t for t in self.tools if t.name == tool_name), None)
                if not tool:
                    logger.warning(f"Tool '{tool_name}' not found in agent tools")
                    return match.group(0)

                arg_val = None
                if args_str:
                    try:
                        arg_val = json.loads(args_str)
                    except Exception:
                        if hasattr(tool, "args_schema") and tool.args_schema:
                            try:
                                schema_keys = list(
                                    tool.args_schema.__annotations__.keys()
                                )
                                if schema_keys:
                                    arg_val = {schema_keys[0]: args_str}
                                    logger.info(
                                        f"Created structured input for {tool_name}: {arg_val}"
                                    )
                                else:
                                    arg_val = {}
                            except Exception as e:
                                logger.error(
                                    f"Error processing schema for {tool_name}: {e}"
                                )
                                return f"Error: {str(e)}"
                        else:
                            # For tools without schema, string args are fine
                            arg_val = args_str

                try:
                    result = tool.invoke(arg_val)
                    logger.info(f"Tool '{tool_name}' returned: {result}")
                    artifacts[tool_name] = result
                    return str(result)
                except Exception as e:
                    logger.error(f"Error invoking tool '{tool_name}': {e}")
                    return f"Error invoking {tool_name}: {e}"
            except Exception as e:
                logger.error(f"Exception in invoke_tool: {e}")
                return f"Error processing tool: {str(e)}"

        content = re.sub(tool_pattern, invoke_tool, content)

        if self.tools:
            tool_names = [t.name for t in self.tools]
            direct_pattern = "|".join(re.escape(name) for name in tool_names)
            direct_regex = re.compile(rf"(?P<name>{direct_pattern})\((?P<args>[^)]*)\)")

            content = direct_regex.sub(invoke_tool, content)

        return content, artifacts

    def invoke(
        self, message: HumanMessage, chat_history: List[BaseMessage] = None
    ) -> Dict[str, Any]:
        """Invoke the agent with a message and optional chat history"""
        if chat_history is None:
            chat_history = []

        if not self.tools:
            self.initialize_tools()

        system_prompt = self.get_system_prompt()
        recent_history = chat_history[-4:] if len(chat_history) > 4 else chat_history

        messages = [
            SystemMessage(content=system_prompt),
            *recent_history,
            message,
        ]

        response = self.llm.invoke(messages)
        processed = self.process_response(response.content)

        return {
            "messages": [AIMessage(content=processed["content"])],
            "chat_history": [message, AIMessage(content=processed["content"])],
            "artifacts": processed.get("artifacts", {}),
        }
