from diffusers import StableDiffusionPipeline
import torch
from PIL import Image

class ImageAgent:
    def __init__(self):
        self.pipe = StableDiffusionPipeline.from_pretrained(
            "stable-diffusion-v1-5",  # Using a generic base model
            torch_dtype=torch.float16,
            use_safetensors=True
        )
        if torch.cuda.is_available():
            self.pipe = self.pipe.to("cuda")

    def generate_image(self, prompt: str) -> Image.Image:
        image = self.pipe(prompt).images[0]
        return image
