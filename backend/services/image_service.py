from ..agents.image_agent import ImageAgent

class ImageService:
    def __init__(self):
        self.agent = ImageAgent()

    def generate_image(self, prompt: str):
        return self.agent.generate_image(prompt)

