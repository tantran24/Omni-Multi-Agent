from agents.llm_agent import ChatAgent

class LLMService:
    def __init__(self):
        self.agent = ChatAgent()

    def process_prompt(self, prompt: str):
        return self.agent.chat(prompt)

