
from typing import IO
from elevenlabs import ElevenLabs
from io import BytesIO
from core.config import Config
import logging



logger = logging.getLogger(__name__)


class TTSWrapper:

    def __init__(self):
        self.provider = Config.TTS_PROVIDER

        if self.provider == "eleven_lab":
            try:
                self.model = ElevenLabs(
                        api_key=Config.ELEVENLAB_API_KEY,
                )

            except Exception as e:
                logger.error(
                    f"[TTSWrapper] Error initializing ElevenLab: {e}"
                )
                raise e
        else:
            logger.error(
                f"[TTSWrapper] Error initializing "
            )

    def invoke(self, text:str)->IO[bytes]:
        """Invoke the TTS model asynchronously"""
        try:
            response = self.model.text_to_speech.convert(
                        voice_id=Config.ELEVENLAB_VOICE_ID,
                        output_format="mp3_44100_32",
                        text=text,
                        model_id=Config.ELEVENLAB_MODEL,
                    )
            audio_stream = BytesIO()
            for chunk in response:
                if chunk:
                    audio_stream.write(chunk)
            return audio_stream
        except Exception as e:
            logger.error(f"[TTSWrapper] Invoke error ({self.provider}): {e}")
            raise e
