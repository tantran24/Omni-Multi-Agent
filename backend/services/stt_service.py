from agents.stt_agent import STTAgent

class STTService:
    def __init__(self):
        self.agent = STTAgent()

    def process_audio(self):
        return self.agent.listen()
