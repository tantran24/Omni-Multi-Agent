from typing import List, Dict, Any, Optional
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage, BaseMessage
import logging

from utils.wrappers.llm_wrapper import LLMWrapper
from utils.tools.tool_handler import ToolHandler
from .base_agent import BaseAgent
from .tools import get_tools_for_agent

logger = logging.getLogger(__name__)

class RAGAgent(BaseAgent):
    """Retrieval-Augmented Generation (RAG) Agent"""

    def __init__(self, llm=None, retriever=None):
        super().__init__(llm)
        self.retriever = retriever
        self.agent_type = "rag"
        self.agent_name = "RAG Agent"

    def get_system_prompt(self) -> str:
        """Define system prompt for RAG Agent"""
        return (
            "You are an intelligent assistant that provides accurate, relevant, and well-sourced answers using the retrieved knowledge base documents."
        )

    async def retrieve_context(self, query: str) -> str:
        """Retrieve relevant documents from vector store based on the query"""
        if not self.retriever:
            logger.warning("No retriever configured for RAGAgent.")
            return ""
        try:
            docs = await self.retriever.ainvoke(query)
            context = "\n".join(doc.page_content for doc in docs)
            return context
        except Exception as e:
            logger.error(f"Error during document retrieval: {e}")
            return ""

    async def invoke(
        self, message: HumanMessage, chat_history: Optional[List[BaseMessage]] = None
    ) -> Dict[str, Any]:
        """Override the base invoke to include document retrieval"""
        if chat_history is None:
            chat_history = []

        user_query = message.content
        retrieved_context = await self.retrieve_context(user_query)

        context_prefix = (
            f"Use the following context to assist you in answering:\n{retrieved_context}\n"
            if retrieved_context else ""
        )

        messages = [
            SystemMessage(content=self.get_system_prompt()),
            HumanMessage(content=context_prefix + user_query),
        ]
        messages = messages + chat_history

        try:
            response = await self.llm.invoke(messages)
            if not response:
                return {
                    "messages": [
                        AIMessage(content="I couldn't generate a response.")
                    ]
                }

            processed_content, artifacts = await ToolHandler.process_tool_calls(
                response.content, self.tools
            )

            return {
                "messages": [AIMessage(content=processed_content)],
                "artifacts": artifacts,
            }

        except Exception as e:
            logger.error(f"RAGAgent encountered an error: {e}")
            return {
                "messages": [AIMessage(content=f"Error: {str(e)}")]
            }
