from PIL import Image
import requests
from io import BytesIO

class ImageAgent:
    def generate_image(self, prompt: str):
        url = f"https://api.deepai.org/api/text2img"
        response = requests.post(url, data={'text': prompt}, headers={'api-key': 'YOUR_API_KEY'})
        image = Image.open(BytesIO(response.content))
        return image
