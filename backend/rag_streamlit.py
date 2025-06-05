import streamlit as st
import asyncio
import nest_asyncio
import time

nest_asyncio.apply()  # Thêm cái này để fix event loop trong Streamlit

# các import của bạn, ví dụ:
from qdrant_client import QdrantClient
from langchain_qdrant import QdrantVectorStore
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_core.messages import HumanMessage
from utils.agents.rag_agent import RAGAgent

rag_agent = None

async def create_rag_agent():
    qdrant_client = QdrantClient(url="http://localhost:6333")
    vectorstore = QdrantVectorStore(
        client=qdrant_client,
        collection_name="rag_collection",
        embedding=HuggingFaceEmbeddings(
            model_name="thanhtantran/Vietnamese_Embedding_v2"
        ),
    )
    return RAGAgent(llm=None, vectorstore=vectorstore)

def main():
    global rag_agent
    st.title("🤖 Chatbot Hỏi Đáp Tài Liệu")

    user_input = st.text_input("Nhập câu hỏi của bạn:")

    if user_input:
        async def get_response():
            global rag_agent
            if rag_agent is None:
                rag_agent = await create_rag_agent()

            message = HumanMessage(content=user_input)
            start_time = time.time()
            result = await rag_agent.ainvoke(message)
            end_time = time.time()
            return result, end_time - start_time

        with st.spinner("Đang xử lý..."):
            result, duration = asyncio.run(get_response())  # Dùng asyncio.run cùng nest_asyncio.apply()

            response_text = "\n\n".join(msg.content for msg in result["messages"])
            st.markdown("### 💬 Phản hồi:")
            st.write(response_text)
            st.markdown(f"⏱️ Xử lý trong **{duration:.2f} giây**.")

if __name__ == "__main__":
    main()
