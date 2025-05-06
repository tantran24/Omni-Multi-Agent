from diffusers import DiffusionPipeline, LCMScheduler
import torch
import os
from datetime import datetime
import gc
from huggingface_hub import hf_hub_download
import logging
from utils.wrappers.image_generator_wrapper import ImageGeneratorWrapper


logger = logging.getLogger(__name__)



class ImageAgent:
    def __init__(self, provider="google_ai_studio"):
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.model = ImageGeneratorWrapper(provider=provider, device=self.device)
        self.images_dir = os.path.join(
            os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
            "generated_images",
        )
        os.makedirs(self.images_dir, exist_ok=True)
        logger.info(f"Using device: {self.device}")

    def _clear_memory(self):
        if self.device == "cuda":
            torch.cuda.empty_cache()
            gc.collect()

    def generate_image(self, prompt: str) -> dict:
        logger.info(f"Generating image for prompt: {prompt}")
        image = self.model.generate(prompt)

        # Save image to disk
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"image_{timestamp}.png"
        filepath = os.path.join(self.images_dir, filename)

        # If image is raw bytes from API, decode before saving
        if hasattr(image, "save"):
            image.save(filepath)
        else:
            with open(filepath, "wb") as f:
                f.write(image)

        logger.info(f"Image saved to {filepath}")
        self._clear_memory()

        return {"filename": filename, "filepath": filepath}

    def __del__(self):
        self._clear_memory()


def main():
    agent = ImageAgent(provider="google_ai_studio")
    result = agent.generate_image("A cat astronaut on Mars")

    print(f"\n✅ Image generated successfully!")
    print(f"File path: {result['filepath']}")

if __name__ == "__main__":
    main()






