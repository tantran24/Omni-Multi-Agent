"""Base agent implementation with proper async support"""

from typing import List, Dict, Any, Optional
from langchain_core.messages import BaseMessage, HumanMessage, AIMessage, SystemMessage
import logging
from utils.wrappers.llm_wrapper import LLMWrapper
from utils.tools.tool_handler import ToolHandler
from .tools import get_tools_for_agent

logger = logging.getLogger(__name__)


class BaseAgent:
    """Base class for all specialized agents with async support"""

    def __init__(self, llm=None):
        self.llm = llm or LLMWrapper()
        self.tools: List[Any] = []
        self.agent_type = "base"
        self.agent_name = "Base Agent"

    def get_system_prompt(self) -> str:
        """Get the system prompt for this agent"""
        raise NotImplementedError("Subclasses must implement get_system_prompt")

    async def initialize_tools(self) -> None:
        """Initialize tools asynchronously"""
        agent_tools = await get_tools_for_agent(self.agent_type)
        mcp_tools = await ToolHandler.initialize_tools()
        self.tools = agent_tools + mcp_tools
        logger.info(
            f"{self.agent_name} initialized with {len(self.tools)} tools: {[tool.name for tool in self.tools]}"
        )

    async def invoke(
        self, message: HumanMessage, chat_history: Optional[List[BaseMessage]] = None
    ) -> Dict[str, Any]:
        """Process a message asynchronously and return response with any artifacts"""
        if chat_history is None:
            chat_history = []

        messages = [SystemMessage(content=self.get_system_prompt())]
        messages.extend(chat_history)
        messages.append(message)

        try:
            response = await self.llm.invoke(messages)
            if not response:
                return {
                    "messages": [
                        AIMessage(
                            content="I apologize, but I couldn't generate a response."
                        )
                    ]
                }

            # Ensure response has content and it's a string
            response_content = getattr(response, "content", None)
            if response_content is None:
                logger.warning("Response object has no content attribute")
                response_content = ""
            elif not isinstance(response_content, str):
                logger.warning(
                    f"Response content is not a string (type: {type(response_content)})"
                )
                response_content = str(response_content)

            processed_content, artifacts = await ToolHandler.process_tool_calls(
                response_content, self.tools
            )

            logger.info(
                f"{self.agent_name} response content: {response_content[:200]}..."
            )
            if artifacts:
                logger.info(
                    f"{self.agent_name} generated artifacts: {list(artifacts.keys())}"
                )

            # Check if we have valid tool results before proceeding
            has_successful_tools = (
                any(
                    not str(result).startswith("[Tool Error:")
                    for result in artifacts.values()
                )
                if artifacts
                else False
            )

            if artifacts and has_successful_tools:
                tool_results_message = """Bạn đã sử dụng các công cụ tìm kiếm và nhận được kết quả. Dưới đây là thông tin từ các công cụ:

"""
                for tool_name, result in artifacts.items():
                    # Truncate long results to prevent overwhelming the model
                    result_str = str(result)
                    if len(result_str) > 2000:
                        result_preview = result_str[:2000] + "... [đã cắt ngắn]"
                    else:
                        result_preview = result_str
                    tool_results_message += (
                        f"Kết quả từ {tool_name}:\n{result_preview}\n\n"
                    )

                tool_results_message += """Bây giờ hãy tổng hợp thông tin từ các kết quả tìm kiếm trên để đưa ra câu trả lời đầy đủ, chính xác và có cấu trúc cho người dùng. 

Yêu cầu:
- Tổng hợp thông tin từ nhiều nguồn
- Trình bày rõ ràng, có cấu trúc
- Trích dẫn nguồn khi có thể
- Đưa ra kết luận dựa trên bằng chứng
- KHÔNG gọi lại các công cụ tìm kiếm nữa"""

                messages.append(AIMessage(content=response_content))
                messages.append(HumanMessage(content=tool_results_message))

                final_response = await self.llm.invoke(messages)
                if final_response:
                    final_content = getattr(final_response, "content", "")
                    if not isinstance(final_content, str):
                        final_content = str(final_content)
                    messages = [AIMessage(content=final_content)]
                    return {"messages": messages, "artifacts": artifacts}
            elif artifacts:
                # All tools failed, return error message
                logger.warning(f"{self.agent_name} - All tool calls failed")
                error_message = "I tried to use some tools to help with your request, but they encountered errors. Let me provide a response based on my knowledge instead."
                messages = [AIMessage(content=error_message)]
                return {"messages": messages, "artifacts": artifacts}

            messages = [AIMessage(content=processed_content)]
            return {"messages": messages, "artifacts": artifacts}

        except Exception as e:
            logger.error(f"Error in agent invocation: {e}", exc_info=True)
            return {
                "messages": [AIMessage(content=f"I encountered an error: {str(e)}")]
            }
