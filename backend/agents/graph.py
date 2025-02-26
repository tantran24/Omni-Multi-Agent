from typing import Annotated, TypedDict, List, Union, Dict, Any, Tuple, Callable
from langchain_core.messages import (
    BaseMessage,
    AIMessage,
    SystemMessage,
    HumanMessage,
    FunctionMessage,
)
from langgraph.graph import StateGraph, END
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_ollama import ChatOllama
from langgraph.checkpoint.memory import MemorySaver
from langgraph.graph.message import add_messages
from core.config import Config
from .tools import AVAILABLE_TOOLS, generate_image_tool
from .prompts import BASE_SYSTEM_PROMPT
import logging
import requests
import functools


# Define a reducer for the current_agent field to resolve concurrent updates
def _current_agent_reducer(current_value: str, new_value: str) -> str:
    """Reducer for current_agent that prefers the new value."""
    # This will always use the latest value
    return new_value


# Define a reducer for the artifacts dictionary
def _merge_dicts(current_dict: Dict[str, Any], new_dict: Dict[str, Any]) -> Dict[str, Any]:
    """Merge two dictionaries, with values from the new dict taking precedence."""
    merged = current_dict.copy()
    merged.update(new_dict)
    return merged


# Define the state for our multi-agent graph
class AgentState(TypedDict):
    messages: Annotated[List[BaseMessage], add_messages]
    # Track which agent is currently active - with a proper reducer to handle multiple updates
    current_agent: Annotated[str, _current_agent_reducer]
    # Store any generated artifacts - with a reducer to properly merge dictionaries
    artifacts: Annotated[Dict[str, Any], _merge_dicts]
    # Track the conversation history - properly annotated to accumulate values
    chat_history: Annotated[List[BaseMessage], add_messages]


# Define our different agent types
AGENT_TYPES = {
    "router": "Router Agent",
    "research": "Research Agent",
    "math": "Math Agent",
    "assistant": "Assistant Agent",
    "planning": "Planning Agent",
    "image": "Image Agent",
}


def create_agent_graph():
    """Create a LangGraph for multi-agent collaboration."""

    # First check Ollama server is available
    def _check_ollama():
        try:
            response = requests.get(
                Config.OLLAMA_HEALTH_CHECK_URL, timeout=Config.OLLAMA_CONNECTION_TIMEOUT
            )
            response.raise_for_status()
            return True
        except requests.exceptions.RequestException as e:
            logging.error(f"Ollama connection error: {str(e)}")
            return False

    if not _check_ollama():
        raise ConnectionError(
            "Could not connect to Ollama server. Please ensure it's running and try again."
        )

    # Create the LLM with Ollama
    llm = ChatOllama(
        model=Config.LLM_MODEL,
        temperature=Config.LLM_TEMPERATURE,
        base_url=Config.OLLAMA_BASE_URL,
        timeout=Config.LLM_TIMEOUT,
        retry_on_failure=True,
        num_retries=Config.OLLAMA_MAX_RETRIES,
    )

    # Create tool descriptions for prompts
    tool_strings = "\n".join(
        [f"- {tool.name}: {tool.description}" for tool in AVAILABLE_TOOLS]
    )

    # Router Agent: Determines which agent should handle the request
    def router_agent(state: AgentState) -> Dict[str, Any]:
        """Router agent that determines which specialized agent should handle the request."""
        # Get the last message
        last_message = state["messages"][-1]
        if not isinstance(last_message, HumanMessage):
            # If the last message is not from a human, we should end
            return {"current_agent": END}

        # Create the prompt for the router
        router_prompt = ChatPromptTemplate.from_messages(
            [
                SystemMessage(
                    content=f"""You are the Router Agent for a multi-agent system.
Your job is to analyze the user's message and determine which specialized agent should handle it.

Available agents:
- research: For information gathering, facts, general knowledge
- math: For calculations, equations, and mathematical problems
- assistant: For general conversation, simple tasks, and coordination
- planning: For complex tasks requiring step-by-step planning
- image: For ANY requests involving image creation or visualization

Available tools:
{tool_strings}

When a user requests an image (using words like 'draw', 'picture', 'image', 'create', 'visualize', 'show me'),
ALWAYS route to the image agent.

Respond with ONLY the name of the agent that should handle this request. No explanations."""
                ),
                MessagesPlaceholder(variable_name="chat_history"),
                last_message,
            ]
        )

        # Get router's decision
        response = llm.invoke(
            router_prompt.format(chat_history=state.get("chat_history", []))
        )

        # Parse the response to get the agent name (convert to lowercase, strip whitespace)
        agent_name = response.content.lower().strip()

        # Validate agent name
        valid_agents = list(AGENT_TYPES.keys())
        if agent_name not in valid_agents:
            # Default to assistant if we got an invalid agent name
            agent_name = "assistant"

        # Return the selected agent as the next step
        return {"current_agent": agent_name}

    # Helper function to create specialized agents
    def create_specialized_agent(agent_type: str):
        """Create a specialized agent with appropriate system prompt."""

        def agent_func(state: AgentState) -> Dict[str, Any]:
            """The function that executes the specialized agent."""
            # Get the last message
            last_message = state["messages"][-1]
            if not isinstance(last_message, HumanMessage):
                return {"current_agent": END}

            # Create the prompt for this specialized agent
            agent_prompt = ChatPromptTemplate.from_messages(
                [
                    SystemMessage(
                        content=f"""You are the {AGENT_TYPES[agent_type]} in a multi-agent system.

{BASE_SYSTEM_PROMPT.format(tools=tool_strings)}

As the {AGENT_TYPES[agent_type]}, focus on your specialty:
- Research Agent: Focus on accurate information and facts
- Math Agent: Focus on precise calculations and showing your work
- Assistant Agent: Focus on being helpful and coordinating tasks 
- Planning Agent: Focus on breaking down complex tasks into steps
- Image Agent: Focus on creating detailed image descriptions

Always start your response with: [{AGENT_TYPES[agent_type]}]"""
                    ),
                    MessagesPlaceholder(variable_name="chat_history"),
                    last_message,
                ]
            )

            # Invoke the LLM
            response = llm.invoke(
                agent_prompt.format(chat_history=state.get("chat_history", []))
            )

            # For the image agent, look for image generation requests
            if agent_type == "image":
                # Check if the response contains a request to use the generate_image tool
                if "[Tool Used] generate_image(" in response.content:
                    # Extract the prompt for image generation
                    parts = response.content.split("[Tool Used] generate_image(", 1)
                    if len(parts) > 1:
                        image_prompt = parts[1].split(")", 1)[0]
                        try:
                            # Use the proper tool object with the invoke method
                            image_result = generate_image_tool.invoke({"prompt": image_prompt})
                            
                            # Add the image result to the artifacts
                            # Return as part of the state update instead of modifying state directly
                            artifacts = {
                                "image": image_result
                            }

                            # Append tool result to response
                            tool_message = f"\n\nImage generated successfully with prompt: {image_prompt}"
                            response = AIMessage(
                                content=response.content + tool_message
                            )
                            
                            # Return updated state with response and artifacts
                            return {
                                "messages": [response],
                                "chat_history": [last_message, response],
                                "artifacts": artifacts,
                                "current_agent": END,
                            }
                            
                        except Exception as e:
                            error_msg = f"\n\nError generating image: {str(e)}"
                            response = AIMessage(content=response.content + error_msg)

            # Return updated state with response
            return {
                "messages": [response],
                "chat_history": [last_message, response],
                "current_agent": END,
            }

        return agent_func

    # Create our specialized agents
    research_agent = create_specialized_agent("research")
    math_agent = create_specialized_agent("math")
    assistant_agent = create_specialized_agent("assistant")
    planning_agent = create_specialized_agent("planning")
    image_agent = create_specialized_agent("image")

    # Create the graph
    workflow = StateGraph(AgentState)

    # Add our nodes
    workflow.add_node("router", router_agent)
    workflow.add_node("research", research_agent)
    workflow.add_node("math", math_agent)
    workflow.add_node("assistant", assistant_agent)
    workflow.add_node("planning", planning_agent)
    workflow.add_node("image", image_agent)

    # Add edges - the router decides where to go next
    workflow.add_edge("router", "research")
    workflow.add_edge("router", "math")
    workflow.add_edge("router", "assistant")
    workflow.add_edge("router", "planning")
    workflow.add_edge("router", "image")

    # Start with the router
    workflow.set_entry_point("router")

    # Compile the graph
    app = workflow.compile()

    # Create a wrapper function with similar interface to AgentExecutor
    def invoke_with_structured_args(inputs: dict) -> dict:
        """Interface to maintain compatibility with the original code."""
        try:
            # Initialize the graph state
            state = {
                "messages": [HumanMessage(content=inputs["input"])],
                "chat_history": inputs.get("chat_history", []),
                "current_agent": "router",  # Start with router
                "artifacts": {},
            }

            # Run the graph
            result = app.invoke(state)

            # Format the output to be compatible with AgentExecutor interface
            output_messages = result.get("messages", [])
            if output_messages and len(output_messages) > 0:
                output = output_messages[-1].content
            else:
                output = "No response generated."

            return {
                "output": output, 
                "artifacts": result.get("artifacts", {}),
                "chat_history": result.get("chat_history", [])
            }

        except Exception as e:
            logging.error(f"Graph execution error: {str(e)}")
            raise

    return invoke_with_structured_args


# For backward compatibility
def process_message(message: str, agent_executor) -> str:
    """Process a message using the agent executor."""
    try:
        result = agent_executor({"input": message, "chat_history": []})
        return result.get("output", "Error processing request")
    except ConnectionError as e:
        return "Error: Ollama server is not running. Please start Ollama first."
    except Exception as e:
        return f"I encountered an error: {str(e)}"
