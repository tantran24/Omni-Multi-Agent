from typing import Optional, List, Dict, Any
from langchain_core.messages import HumanMessage, AIMessage, BaseMessage
from .graph import create_agent_graph
from core.config import Config
import logging


class ChatAgent:
    def __init__(self):
        # Create the multi-agent graph
        self.agent_executor = create_agent_graph()
        # Store conversation history
        self.chat_history: List[BaseMessage] = []

    def chat(self, prompt: str) -> str:
        try:
            if not prompt.strip():
                return "Please provide a valid input"

            # Process the input through our multi-agent graph
            response = self.agent_executor(
                {"input": prompt, "chat_history": self.chat_history}
            )

            # Extract output and artifacts
            if isinstance(response, dict) and "output" in response:
                output = response["output"]

                # Update the conversation history
                if "chat_history" in response:
                    self.chat_history = response["chat_history"]

                # Handle any generated artifacts
                artifacts = response.get("artifacts", {})
                if "image" in artifacts:
                    # In a real implementation, you might return an image URL or file path
                    output += "\n[Image has been generated]"

                return output
            else:
                raise ValueError("Invalid response format from agent")

        except Exception as e:
            logging.error(f"Chat error: {str(e)}")
            return f"Error: {str(e)}"


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
