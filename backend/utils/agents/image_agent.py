from diffusers import DiffusionPipeline, LCMScheduler
import torch
import os
from datetime import datetime
import gc
from huggingface_hub import hf_hub_download
import logging
from langchain_core.messages import AIMessage
from utils.wrappers.image_generator_wrapper import ImageGeneratorWrapper
from config.config import Config


logger = logging.getLogger(__name__)


class ImageAgent:
    def __init__(self, provider="google_ai_studio"):
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.model = ImageGeneratorWrapper(provider=provider, device=self.device)
        self.images_dir = Config.GENERATED_IMAGES_DIR
        os.makedirs(self.images_dir, exist_ok=True)
        logger.info(f"Using device: {self.device}")

    async def initialize_tools(self):
        """Initialize tools for the image agent (async compatibility)"""
        pass

    async def invoke(self, message, chat_history=None):
        """
        Main interface method for the ImageAgent.
        This method is called by the chat agent and router.
        """
        try:
            prompt = message.content if hasattr(message, "content") else str(message)
            result = self.generate_image(prompt)

            response_message = (
                f"I've generated an image based on your request: {prompt}"
            )
            return {
                "messages": [AIMessage(content=response_message)],
                "artifacts": {"generate_image": result["image_url"]},
            }
        except Exception as e:
            logger.error(f"Image generation error: {str(e)}")
            error_message = (
                f"Sorry, I encountered an error generating the image: {str(e)}"
            )
            return {
                "messages": [AIMessage(content=error_message)],
                "artifacts": {},
            }

    def _clear_memory(self):
        if self.device == "cuda":
            torch.cuda.empty_cache()
            gc.collect()

    def generate_image(self, prompt: str) -> dict:
        logger.info(f"Generating image for prompt: {prompt}")
        image = self.model.generate(prompt)

        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"image_{timestamp}.png"
        filepath = os.path.join(self.images_dir, filename)

        if hasattr(image, "save"):
            image.save(filepath)
        else:
            with open(filepath, "wb") as f:
                f.write(image)

        logger.info(f"Image saved to {filepath}")
        self._clear_memory()

        image_url = f"/generated_images/{filename}"
        return {"filename": filename, "filepath": filepath, "image_url": image_url}

    def __del__(self):
        self._clear_memory()


def main():
    agent = ImageAgent(provider="google_ai_studio")
    result = agent.generate_image("A cat astronaut on Moon")

    print(f"\n✅ Image generated successfully!")
    print(f"File path: {result['filepath']}")


if __name__ == "__main__":
    main()
