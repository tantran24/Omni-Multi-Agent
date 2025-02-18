from typing import Annotated, Dict, TypedDict, List
from langchain_core.messages import BaseMessage, HumanMessage, AIMessage
from langgraph.graph import StateGraph, Graph, START, END
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_ollama import ChatOllama
from langchain.agents import AgentExecutor, create_openai_tools_agent
from langchain_core.utils.function_calling import convert_to_openai_tool
from langgraph.checkpoint.memory import MemorySaver
from langgraph.graph.message import add_messages
from langgraph.prebuilt import ToolNode, tools_condition
from langgraph.prebuilt import create_react_agent
from langchain_core.runnables import RunnableConfig

from .tools import AVAILABLE_TOOLS



class AgentState(TypedDict):
    messages: Annotated[list, add_messages]


def create_agent_graph() -> Graph:
    memory = MemorySaver()

    tools = [AVAILABLE_TOOLS[0]]

    role_prompt = ("""You are an AI assistant with image generation capabilities.
                IMPORTANT: For ANY request involving images, pictures, drawings, or visualization:
                1. You MUST use the generate_image tool
                2. DO NOT describe or explain the image
                3. DO NOT use creative writing or roleplay
                4. IMMEDIATELY call generate_image with the prompt

                Example:
                Human: Can you draw a cat?
                Assistant: Calling: generate_image("A cute cat sitting and looking at the camera")
                """)
    prompt = ChatPromptTemplate.from_messages([
        ("system", role_prompt),
        MessagesPlaceholder(variable_name="messages"),
        MessagesPlaceholder("agent_scratchpad"),
    ])

    llm = ChatOllama(model="MFDoom/deepseek-r1-tool-calling:1.5b")
    agent = create_react_agent(llm, tools, prompt=prompt)
    agent_executor = AgentExecutor(agent=agent, tools=tools, verbose=True)

    def should_continue(state: AgentState) -> str:
        messages = state["messages"]
        last_message = messages[-1].content if messages else ""
        
        if any(keyword in last_message.lower() for keyword in 
               ['generate image', 'create image', 'draw', 'make a picture']):
            return "generate_image"
        return "end"
    

    def chatbot(state: AgentState,
                config: RunnableConfig,) -> AgentState:
        messages = state["messages"]
        if len(messages) > 1:
            last_message = messages[-1].content
        else:
            last_message = messages

        response = agent_executor.invoke({
            "messages": messages[-1] 
        }, config)

        state["messages"].append(AIMessage(content=response["output"]))
        return state



    workflow = StateGraph(AgentState)

    workflow.add_node("chatbot", chatbot)

    tool_node = ToolNode(tools=[tools[0]])
    workflow.add_node("tools", tool_node)
    workflow.add_conditional_edges("chatbot", tools_condition)

    workflow.add_edge("tools", "chatbot")
    workflow.add_edge(START, "chatbot")

    return workflow.compile(checkpointer=memory)


from IPython.display import Image, display


def process_message(message: str) -> str:

    try:
        display(Image(graph.get_graph().draw_mermaid_png()))
    except Exception:
        # This requires some extra dependencies and is optional
        pass
    config = {"configurable": {"thread_id": "1"}}
    graph = create_agent_graph()
    result = graph.invoke({
        "messages": [HumanMessage(content=message)],
    }, config, stream_mode="values")

    return result["messages"][-1].content

if __name__ == "__main__":
    process_message("DKKKK")
