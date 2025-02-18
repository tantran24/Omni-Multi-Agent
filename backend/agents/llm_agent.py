from langchain.schema import AIMessage, HumanMessage
from langgraph.checkpoint.memory import MemorySaver

import re
from .graph import process_message

class ChatAgent:
    def __init__(self):
        self.memory = MemorySaver()

    def chat(self, prompt: str) -> str:
        try:
            # if self._is_image_request(prompt):
                # image_prompt = self._extract_image_prompt(prompt)
                # image_path = generate_image(image_prompt)
                # return f"Generated image: {image_path}"
            
            # Lưu message của user vào memory
            self.memory.chat_memory.add_user_message(prompt)

            # Gửi prompt có ngữ cảnh trước đó
            history = self.memory.load_memory_variables({})["history"]
            print("AAA")
            response = process_message(prompt)
            print("dddd")


            # Lưu phản hồi của AI vào memory
            self.memory.chat_memory.add_ai_message(response)

            return response.replace('\r\n', '\n')
        except Exception as e:
            return f"[Chat Agent] Error processing request: {str(e)}"


def main():
    agent = ChatAgent()

    print("ChatAgent is running. Type 'exit' to stop.")

    while True:
        user_input = input("You: ")
        if user_input.lower() == "exit":
            print("Exiting ChatAgent...")
            break

        response = agent.chat(user_input)
        print(f"Agent: {response}")

if __name__ == "__main__":
    main()
