import os
import gc
import torch
import logging
from datetime import datetime
from io import BytesIO

from diffusers import DiffusionPipeline, LCMScheduler
from huggingface_hub import hf_hub_download
from PIL import Image
from typing import Optional

from datetime import datetime
from diffusers import EulerDiscreteScheduler
from diffusers.utils import load_image

from google import genai
from google.genai import types

from config.config import Config

logger = logging.getLogger(__name__)


class ImageGeneratorWrapper:
    def __init__(self, provider: str = "diffusers", device: Optional[str] = None):
        self.provider = provider
        self.device = device or ("cuda" if torch.cuda.is_available() else "cpu")
        self.model = None

        if self.provider == "diffusers":
            self._init_diffusers()
        elif self.provider == "google_ai_studio":
            self._init_google_ai_studio()
        else:
            raise ValueError(f"Unknown image generation provider: {self.provider}")

    def _init_diffusers(self):
        logger.info("Initializing Diffusers pipeline...")
        base_model_id = "stabilityai/stable-diffusion-xl-base-1.0"
        repo_name = "tianweiy/DMD2"
        ckpt_name = "dmd2_sdxl_4step_lora_fp16.safetensors"

        pipe = DiffusionPipeline.from_pretrained(
            base_model_id,
            torch_dtype=torch.float16 if self.device == "cuda" else torch.float32,
            variant="fp16" if self.device == "cuda" else None,
        ).to(self.device)

        lora_path = hf_hub_download(repo_name, ckpt_name)
        pipe.load_lora_weights(lora_path)
        pipe.fuse_lora(lora_scale=1.0)

        if self.device == "cuda" and hasattr(
            pipe, "enable_xformers_memory_efficient_attention"
        ):
            pipe.enable_xformers_memory_efficient_attention()

        scheduler_config = pipe.scheduler.config
        scheduler_config.num_inference_steps = 4
        scheduler_config.timestep_spacing = "trailing"
        scheduler_config.steps_offset = 0
        scheduler_config.use_karras_sigmas = True
        pipe.scheduler = LCMScheduler.from_config(scheduler_config)

        self.model = pipe

    def _init_google_ai_studio(self):
        logger.info("Initializing Google AI Studio API...")
        self.model = genai.Client()

    def generate(self, prompt: str, **kwargs) -> Image.Image:
        if self.provider == "diffusers":
            return self._generate_diffusers(prompt)
        elif self.provider == "google_ai_studio":
            return self._generate_google(prompt)
        elif self.provider == "photomaker":
            return self._generate_photomaker(prompt, **kwargs)
        else:
            raise NotImplementedError

    def _generate_diffusers(self, prompt: str) -> Image.Image:
        return self.model(
            prompt=prompt,
            num_inference_steps=4,
            guidance_scale=0,
            width=512,
            height=512,
        ).images[0]

    def _generate_google(self, prompt: str) -> Image.Image:
        contents = [
            types.Content(
                role="user",
                parts=[types.Part.from_text(text=prompt)],
            )
        ]

        config = types.GenerateContentConfig(
            response_modalities=["TEXT", "IMAGE"], response_mime_type="text/plain"
        )

        response = self.model.models.generate_content(
            model=Config.GOOGLE_IMAGE_GENERATOR_MODEL,
            contents=contents,
            config=config,
        )

        for part in response.candidates[0].content.parts:
            if part.text is not None:
                print(part.text)
            elif part.inline_data is not None:
                image = Image.open(BytesIO(part.inline_data.data))
                # timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                # image.save(f"generated_image/generated_image_{timestamp}.png")
                return image

        raise RuntimeError("No image found in Gemini response.")
