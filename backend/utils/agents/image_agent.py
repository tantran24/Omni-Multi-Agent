from diffusers import DiffusionPipeline, LCMScheduler
import torch
import os
from datetime import datetime
import gc
from huggingface_hub import hf_hub_download
import logging

logger = logging.getLogger(__name__)


class ImageAgent:
    def __init__(self):
        self.pipe = None
        self.images_dir = os.path.join(
            os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
            "generated_images",
        )
        os.makedirs(self.images_dir, exist_ok=True)
        self._setup_device()

    def _setup_device(self):
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        if self.device == "cuda":
            torch.backends.cudnn.benchmark = True
        logger.info(f"Using device: {self.device}")

    def _ensure_pipeline(self):
        if self.pipe is None:
            logger.info("Initializing image generation pipeline...")
            base_model_id = "stabilityai/stable-diffusion-xl-base-1.0"
            repo_name = "tianweiy/DMD2"
            ckpt_name = "dmd2_sdxl_4step_lora_fp16.safetensors"

            self.pipe = DiffusionPipeline.from_pretrained(
                base_model_id,
                torch_dtype=torch.float16 if self.device == "cuda" else torch.float32,
                variant="fp16" if self.device == "cuda" else None,
            ).to(self.device)

            lora_path = hf_hub_download(repo_name, ckpt_name)
            self.pipe.load_lora_weights(lora_path)
            self.pipe.fuse_lora(lora_scale=1.0)

            if self.device == "cuda" and hasattr(
                self.pipe, "enable_xformers_memory_efficient_attention"
            ):
                self.pipe.enable_xformers_memory_efficient_attention()

            scheduler_config = self.pipe.scheduler.config
            scheduler_config.num_inference_steps = 4
            scheduler_config.timestep_spacing = "trailing"
            scheduler_config.steps_offset = 0
            scheduler_config.use_karras_sigmas = True
            self.pipe.scheduler = LCMScheduler.from_config(scheduler_config)

    def _clear_memory(self):
        if self.device == "cuda":
            torch.cuda.empty_cache()
            gc.collect()

    def generate_image(self, prompt: str) -> dict:
        logger.info(f"Generating image for prompt: {prompt}")
        self._ensure_pipeline()
        self._clear_memory()

        image = self.pipe(
            prompt=prompt,
            num_inference_steps=4,
            guidance_scale=0,
            width=512,
            height=512,
        ).images[0]

        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"image_{timestamp}.png"
        filepath = os.path.join(self.images_dir, filename)
        image.save(filepath)
        logger.info(f"Image saved to {filepath}")

        self._clear_memory()

        return {"filename": filename, "filepath": filepath}

    def __del__(self):
        self._clear_memory()
