from langchain_ollama.llms import OllamaLLM
from langgraph.graph import StateGraph
from langchain.schema import HumanMessage, SystemMessage
from .tools import execute_tool
from .prompts import get_system_prompt
import re
from services.image_service import ImageService

class ChatAgent:
    def __init__(self, model="deepseek-r1:1.5b"):
        self.llm = OllamaLLM(
            model=model
        )
        self.system_prompt = get_system_prompt()
        self.context = []
        self.image_service = ImageService()

    def _is_image_request(self, text: str) -> bool:
        image_keywords = ['draw', 'generate image', 'create image', 'make an image',
                         'create a picture', 'generate a picture', 'draw a picture']
        return any(keyword in text.lower() for keyword in image_keywords)

    def _extract_image_prompt(self, text: str) -> str:
        # Look for the actual description after image-related keywords
        patterns = [
            r'(?:draw|generate|create|make)\s+(?:an?\s+)?(?:image|picture)\s+(?:of\s+)?["\']?([^"\'\.]+)["\']?',
            r'(?:draw|generate|create|make)\s+["\']?([^"\'\.]+)["\']?'
        ]
        
        for pattern in patterns:
            match = re.search(pattern, text.lower())
            if match:
                return match.group(1).strip()
        return text  # fallback to using the entire text as prompt

    def _extract_tool_calls(self, response: str) -> list:
        # Look for patterns like [Tool Used] tool_name(args) or explicit image generation requests
        tool_pattern = r'\[Tool Used\]\s*(\w+)\((.*?)\)'
        matches = re.finditer(tool_pattern, response)
        tool_calls = [(m.group(1), m.group(2).strip()) for m in matches]
        
        # Check for image generation requests in the text
        if any(phrase in response.lower() for phrase in ['generate image', 'create image', 'draw']):
            # Extract the description/prompt after these phrases
            image_prompt = re.search(r'(?:generate|create|draw)\s+(?:an?\s+)?image\s+(?:of\s+)?["\']?([^"\']+)["\']?', response.lower())
            if image_prompt:
                tool_calls.append(('generate_image', image_prompt.group(1)))
        
        return tool_calls

    def _process_tools(self, response: str) -> str:
        tool_calls = self._extract_tool_calls(response)
        for tool_name, args in tool_calls:
            result = execute_tool(tool_name, args)
            # Replace tool call with result
            response = response.replace(
                f'[Tool Used] {tool_name}({args})',
                f'[Tool Result] {result}'
            )
        return response

    def chat(self, prompt: str) -> str:
        # First, check if this is an image generation request
        if self._is_image_request(prompt):
            image_prompt = self._extract_image_prompt(prompt)
            from backend.tools.image_tools import generate_image  # Import the image tool directly
            return generate_image(image_prompt)

        # Regular chat flow
        full_prompt = f"{self.system_prompt}\n\nUser: {prompt}"
        response = self.llm.invoke(full_prompt)
        processed_response = self._process_tools(response)
        
        if processed_response != response:
            final_prompt = f"{full_prompt}\n\nInitial Response: {processed_response}\n\nPlease provide a final response incorporating the tool results."
            processed_response = self.llm.invoke(final_prompt)

        return processed_response.replace('\r\n', '\n')
