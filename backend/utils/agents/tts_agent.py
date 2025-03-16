import pyttsx3

class TTSAgent:
    def __init__(self):
        self.engine = pyttsx3.init()

    def speak(self, text: str):
        self.engine.say(text)
        self.engine.runAndWait()



