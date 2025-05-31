from langgraph.graph import StateGraph, END
from langchain_core.messages import HumanMessage, SystemMessage, AIMessage, BaseMessage
from langchain_core.runnables import Runnable
from langchain.schema import Document
from langchain_qdrant import QdrantVectorStore
from langchain_core.vectorstores import VectorStoreRetriever

from base_agent import BaseAgent
import logging
from .prompts import get_RAG_system_prompt

logger = logging.getLogger(__name__)

class RAGAgent(BaseAgent):
    """Retrieval-Augmented Generation (RAG) Agent with LangGraph"""

    def __init__(self, llm, vectorstore: QdrantVectorStore):
        super().__init__(llm)
        self.vectorstore = vectorstore
        self.retriever = self.vectorstore.as_retriever()
        self.agent_type = "rag"
        self.agent_name = "RAG Agent"
        self.graph = self._build_workflow()


    def _build_workflow(self) -> Runnable:
        """Build LangGraph workflow for the RAG agent"""

        def retrieve_node(state: dict) -> dict:
            query = state["input"].content
            docs = self.retriever.invoke(query)
            context = "\n".join(doc.page_content for doc in docs)
            state["context"] = context
            return state

        def generate_node(state: dict) -> dict:
            context = state.get("context", "")
            query = state["input"].content
            system_prompt = SystemMessage(content=get_RAG_system_prompt())
            messages = [
                system_prompt,
                # HumanMessage(content=f"Use the following context to assist you in answering:\n{context}\n{query}")
                HumanMessage(
                    content=(
                        f"Dưới đây là tài liệu tham khảo:\n{context}\n\n"
                        f"Dựa trên thông tin trên, hãy trả lời câu hỏi sau một cách rõ ràng và đầy đủ:\n{query}"
                    )
                )
            ]
            response = self.llm.invoke(messages)
            state["output"] = response
            return state

        builder = StateGraph()
        builder.add_node("retrieve", retrieve_node)
        builder.add_node("generate", generate_node)
        builder.set_entry_point("retrieve")
        builder.add_edge("retrieve", "generate")
        builder.set_finish_point("generate")
        return builder.compile()

    async def invoke(self, message: HumanMessage, chat_history: list[BaseMessage] = None) -> dict:
        if chat_history is None:
            chat_history = []

        try:
            state = {"input": message}
            final_state = self.graph.invoke(state)
            ai_msg = final_state["output"]
            return {"messages": [ai_msg]}

        except Exception as e:
            logger.error(f"RAGAgent encountered an error: {e}")
            return {"messages": [AIMessage(content=f"Error: {str(e)}")]}


from qdrant_client import QdrantClient
from langchain_openai import ChatOpenAI
from langchain_qdrant import QdrantVectorStore

if __name__ == "__main__":
    qdrant_client = QdrantClient(url="http://localhost:6333")
    vectorstore = QdrantVectorStore(
        client=qdrant_client,
        collection_name="rag_collection",
        embedding=None  
    )

    rag_agent = RAGAgent(vectorstore=vectorstore)

    user_question = "chuyển động thẳng đều là gì?"
    message = HumanMessage(content=user_question)

    import asyncio
    result = asyncio.run(rag_agent.invoke(message))

    print("\n==== 💬 Agent Response ====\n")
    for msg in result["messages"]:
        print(msg.content)