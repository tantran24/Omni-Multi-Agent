from langchain.chat_models import ChatOpenAI
from langgraph.graph import StateGraph
from langchain.schema import SystemMessage, HumanMessage

class ChatAgent:
    def __init__(self, model="gpt-3.5-turbo"):
        self.llm = ChatOpenAI(model_name=model)

    def chat(self, prompt: str):
        return self.llm([HumanMessage(content=prompt)]).content
