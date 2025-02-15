from typing import Annotated, Dict, TypedDict, List
from langchain_core.messages import BaseMessage, HumanMessage, AIMessage
from langgraph.graph import StateGraph, Graph
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_ollama.llms import OllamaLLM
from langchain.agents import AgentExecutor, create_openai_tools_agent
from langchain_core.utils.function_calling import convert_to_openai_tool
from .tools import AVAILABLE_TOOLS, generate_image

class AgentState(TypedDict):
    messages: List[BaseMessage]
    next: str

def create_agent_graph() -> Graph:
    # Convert our tools to OpenAI format
    tools = [
        convert_to_openai_tool(AVAILABLE_TOOLS[0])  # Make generate_image the primary tool
    ]

    prompt = ChatPromptTemplate.from_messages([
        ("system", """You are an AI assistant with image generation capabilities.
IMPORTANT: For ANY request involving images, pictures, drawings, or visualization:
1. You MUST use the generate_image tool
2. DO NOT describe or explain the image
3. DO NOT use creative writing or roleplay
4. IMMEDIATELY call generate_image with the prompt

Example:
Human: Can you draw a cat?
Assistant: Calling: generate_image("A cute cat sitting and looking at the camera")
"""),
        MessagesPlaceholder(variable_name="messages"),
        ("human", "{input}"),
    ])

    # Initialize the language model
    llm = OllamaLLM(model="deepseek-r1:1.5b")

    # Create the agent
    agent = create_openai_tools_agent(llm, tools, prompt)
    agent_executor = AgentExecutor(agent=agent, tools=tools)

    # Define state transitions
    def should_continue(state: AgentState) -> str:
        messages = state["messages"]
        last_message = messages[-1].content if messages else ""
        
        # Check if the last message indicates a need for image generation
        if any(keyword in last_message.lower() for keyword in 
               ['generate image', 'create image', 'draw', 'make a picture']):
            return "generate_image"
        return "end"

    def generate_image_node(state: AgentState) -> AgentState:
        messages = state["messages"]
        last_message = messages[-1].content
        
        # Direct image generation
        image_url = generate_image(last_message)
        response = f"Generated image: {image_url}"
        
        state["messages"].append(AIMessage(content=response))
        return state

    def process_normal(state: AgentState) -> AgentState:
        messages = state["messages"]
        last_message = messages[-1].content
        
        response = agent_executor.invoke({
            "input": last_message,
            "messages": messages[:-1]  # Exclude the last message as we're passing it as input
        })
        
        state["messages"].append(AIMessage(content=response["output"]))
        return state

    # Create the graph
    workflow = StateGraph(AgentState)

    # Add nodes
    workflow.add_node("process", process_normal)
    workflow.add_node("generate_image", generate_image_node)

    # Add edges
    workflow.add_edge("process", "generate_image")
    workflow.add_edge("generate_image", "end")
    workflow.add_edge("process", "end")

    # Set entry point
    workflow.set_entry_point("process")

    return workflow.compile()

def process_message(message: str) -> str:
    graph = create_agent_graph()
    result = graph.invoke({
        "messages": [HumanMessage(content=message)],
    })
    return result["messages"][-1].content
