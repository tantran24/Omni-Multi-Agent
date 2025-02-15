from langchain_ollama.llms import OllamaLLM
from .prompts import get_system_prompt
from tools.image_tools import generate_image
import re

class ChatAgent:
    def __init__(self, model="deepseek-r1:1.5b"):
        self.llm = OllamaLLM(model=model)
        self.system_prompt = get_system_prompt()

    def _is_image_request(self, text: str) -> bool:
        image_keywords = [
            'draw', 'generate image', 'create image', 'make an image',
            'create a picture', 'generate a picture', 'draw a picture'
        ]
        return any(keyword in text.lower() for keyword in image_keywords)

    def _extract_image_prompt(self, text: str) -> str:
        patterns = [
            r'(?:draw|generate|create|make)\s+(?:an?\s+)?(?:image|picture)\s+(?:of\s+)?["\']?([^"\'\.]+)["\']?',
            r'(?:draw|generate|create|make)\s+["\']?([^"\'\.]+)["\']?'
        ]
        
        for pattern in patterns:
            if match := re.search(pattern, text.lower()):
                return match.group(1).strip()
        return text

    def chat(self, prompt: str) -> str:
        if self._is_image_request(prompt):
            try:
                image_path = generate_image(self._extract_image_prompt(prompt))
                return f"[Image Agent] I've generated your image! You can find it here: {image_path}"
            except Exception as e:
                return f"[Image Agent] Error generating image: {str(e)}"

        try:
            full_prompt = f"{self.system_prompt}\n\nUser: {prompt}"
            response = self.llm.invoke(full_prompt)
            return response.replace('\r\n', '\n')
        except Exception as e:
            return f"[Chat Agent] Error processing request: {str(e)}"
