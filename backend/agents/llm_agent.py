from typing import Optional
from langchain.memory import ConversationBufferMemory  # Fixed import
from .graph import create_agent_graph
from core.config import Config
import logging
from langchain_core.messages import HumanMessage, AIMessage

class ChatAgent:
    def __init__(self):
        # Update ConversationBufferMemory initialization
        self.memory = ConversationBufferMemory(memory_key="chat_history", return_messages=True, migration_guide="https://python.langchain.com/docs/versions/migrating_memory")
        self.agent_executor = create_agent_graph()

    def chat(self, prompt: str) -> str:
        try:
            if not prompt.strip():
                return "Please provide a valid input"
            
            # Get chat history from memory using the updated memory_key
            history = self.memory.load_memory_variables({})["chat_history"]
            
            # Format the input with proper message structure
            response = self.agent_executor({
                "input": prompt,
                "chat_history": history,
                "intermediate_steps": []
            })
            
            if isinstance(response, dict) and "output" in response:
                output = response["output"]
                # Save the interaction to memory
                self.memory.save_context({"input": prompt}, {"output": output})
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
