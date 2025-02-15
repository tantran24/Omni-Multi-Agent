from langchain_ollama.llms import OllamaLLM
from langgraph.graph import StateGraph
from langchain.schema import HumanMessage

class ChatAgent:
    def __init__(self, model="deepseek-r1:1.5b"):
        self.llm = OllamaLLM(model=model)

    def chat(self, prompt: str):
        return self.llm.invoke(prompt)
