from diffusers import StableDiffusionPipeline
import torch
import os
import uuid
from PIL import Image  # Ensure PIL is installed

class IllustriousImageGenerator:
    def __init__(self):
        self.model_id = "OnomaAIResearch/Illustrious-xl-early-release-v0"
        self.pipe = StableDiffusionPipeline.from_pretrained(
            self.model_id,
            torch_dtype=torch.float16,
            trust_remote_code=True
        ).to("cuda")

    def generate_image(self, prompt: str, negative_prompt: str = "", num_steps: int = 30):
        """Generate an image using Illustrious-XL model"""
        image = self.pipe(
            prompt=prompt,
            negative_prompt=negative_prompt,
            num_inference_steps=num_steps
        ).images[0]
        # Save the image to disk
        output_dir = os.path.join(os.path.dirname(__file__), "..", "generated_images")
        os.makedirs(output_dir, exist_ok=True)
        filename = f"{uuid.uuid4().hex}.png"
        file_path = os.path.join(output_dir, filename)
        image.save(file_path)
        return file_path  # return the file path to the saved image

def generate_image(prompt: str) -> str:
    """Tool for generating images from text descriptions"""
    generator = IllustriousImageGenerator()
    image_path = generator.generate_image(prompt)
    return image_path
