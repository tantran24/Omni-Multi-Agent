from langgraph.graph import StateGraph, END
from langchain_core.messages import HumanMessage, SystemMessage, AIMessage, BaseMessage
from langchain_core.runnables import Runnable
from langchain.schema import Document
from langchain_qdrant import QdrantVectorStore
from langchain_core.vectorstores import VectorStoreRetriever

from .base_agent import BaseAgent
from .memory_mixin import MemoryMixin
import logging
from config.prompts import get_RAG_system_prompt

logger = logging.getLogger(__name__)


class RAGAgent(BaseAgent, MemoryMixin):
    """Retrieval-Augmented Generation (RAG) Agent with LangGraph"""

    def __init__(self, vectorstore: QdrantVectorStore, llm=None):
        super().__init__(llm)
        MemoryMixin.__init__(self)
        self.vectorstore = vectorstore
        self.retriever = self.vectorstore.as_retriever(search_kwargs={"k": 6})
        self.agent_type = "rag"
        self.agent_name = "RAG Agent"
        self.graph = self._build_workflow()

    def _build_workflow(self) -> Runnable:
        """Build LangGraph workflow for the RAG agent"""

        async def retrieve_node(state: dict) -> dict:
            query = state["input"].content
            docs = await self.retriever.ainvoke(query)
            context = "\n".join(doc.page_content for doc in docs)
            print("YOLO MOTHER FUCKER CONTEXT:\n ", context)
            state["context"] = context
            return state

        async def generate_node(state: dict) -> dict:
            context = state.get("context", "")
            query = state["input"].content
            system_prompt = SystemMessage(content=get_RAG_system_prompt())
            messages = [
                system_prompt,
                HumanMessage(
                    content=(
                        f"Dưới đây là tài liệu tham khảo:\n{context}\n\n"
                        f"Dựa trên thông tin trên, hãy trả lời câu hỏi sau một cách rõ ràng và đầy đủ:\n{query}"
                    )
                ),
            ]
            response = await self.llm.invoke(messages)
            state["output"] = response
            return state

        builder = StateGraph(state_schema=dict)
        builder.add_node("retrieve", retrieve_node)
        builder.add_node("generate", generate_node)

        builder.set_entry_point("retrieve")
        builder.add_edge("retrieve", "generate")
        builder.set_finish_point("generate")
        return builder.compile()

    async def ainvoke(
        self, message: HumanMessage, chat_history: list[BaseMessage] = None
    ) -> dict:
        if chat_history is None:
            chat_history = []

        try:
            state = {"input": message}
            final_state = await self.graph.ainvoke(state)
            ai_msg = final_state["output"]
            return {"messages": [ai_msg]}

        except Exception as e:
            logger.error(f"RAGAgent encountered an error: {e}")
            return {"messages": [AIMessage(content=f"Error: {str(e)}")]}


from qdrant_client import QdrantClient
from langchain_huggingface import HuggingFaceEmbeddings
import asyncio
import time


async def main():
    qdrant_client = QdrantClient(url="http://localhost:6333")

    vectorstore = QdrantVectorStore(
        client=qdrant_client,
        collection_name="rag_collection",
        embedding=HuggingFaceEmbeddings(
            model_name="thanhtantran/Vietnamese_Embedding_v2"
        ),
    )

    rag_agent = RAGAgent(llm=None, vectorstore=vectorstore)

    # user_question = "cách thực hiện bài thực hành khảo sát chuyển động rơi tự do"
    while True:
        print("\n====> User Input:")
        user_question = input()
        if user_question == "q":
            break
        message = HumanMessage(content=user_question)
        start_time = time.time()

        print("\nChatbot: ...")
        result = await rag_agent.ainvoke(message)
        end_time = time.time()
        elapsed_seconds = end_time - start_time
        elapsed_minutes = elapsed_seconds / 60
        print(
            "\n============================================================================="
        )
        print(
            f"\n====>>> Chatbot Response ==== Processed in {elapsed_minutes:.2f} minutes ({elapsed_seconds:.2f} seconds).\n"
        )
        for msg in result["messages"]:
            print(msg.content)


if __name__ == "__main__":
    asyncio.run(main())
