from langchain_ollama.llms import OllamaLLM
from .prompts import get_system_prompt
from tools.image_tools import generate_image
import re
from .graph import process_message

class ChatAgent:
    def __init__(self):
        pass

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
        try:
            if self._is_image_request(prompt):
                image_prompt = self._extract_image_prompt(prompt)
                image_path = generate_image(image_prompt)
                return f"Generated image: {image_path}"
            
            response = process_message(prompt)
            return response.replace('\r\n', '\n')
        except Exception as e:
            return f"[Chat Agent] Error processing request: {str(e)}"
