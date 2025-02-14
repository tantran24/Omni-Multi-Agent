
from agents.tts_agent import TTSAgent

class TTService:
    def __init__(self):
        self.agent = TTSAgent()

    def process_text(self, text: str):
        self.agent.speak(text)


