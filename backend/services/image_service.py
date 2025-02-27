from agents.image_agent import ImageAgent
import os


class ImageService:
    def __init__(self):
        self.agent = ImageAgent()

    def generate_image(self, prompt: str) -> dict:
        result = self.agent.generate_image(prompt)
        filename = result["filename"]
        return {"url": f"/generated_images/{filename}", "filename": filename}
