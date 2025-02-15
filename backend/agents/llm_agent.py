from langchain_ollama.llms import OllamaLLM
from langgraph.graph import StateGraph
from langchain.schema import HumanMessage

class ChatAgent:
    def __init__(self, model="deepseek-r1:1.5b"):
        self.llm = OllamaLLM(
            model=model
        )

    def chat(self, prompt: str):
        response = self.llm.invoke(prompt)
        # Ensure consistent line endings
        return response.replace('\r\n', '\n')
