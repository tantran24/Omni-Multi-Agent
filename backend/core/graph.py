from typing import Dict, List, Any, TypedDict, Optional, cast
from langchain_core.messages import BaseMessage, HumanMessage
from langgraph.graph import StateGraph, END
from utils.agents.router_agent import (
    RouterAgent,
    AssistantAgent,
    ImageAgent,
    MathAgent,
    ResearchAgent,
    PlanningAgent,
)
import logging
import re
from langchain_core.runnables import RunnableConfig

logger = logging.getLogger(__name__)


class AgentState(TypedDict):
    input: str
    chat_history: List[BaseMessage]
    current_agent: Optional[str]
    output: Optional[str]
    artifacts: Optional[Dict[str, Any]]


def create_agent_graph():
    """Create a directed graph for agent routing and execution"""
    agents = {
        "router": RouterAgent(),
        "assistant": AssistantAgent(),
        "image": ImageAgent(),
        "math": MathAgent(),
        "research": ResearchAgent(),
        "planning": PlanningAgent(),
    }

    workflow = StateGraph(AgentState)

    def create_agent_node(agent_name: str):
        def node_func(
            state: AgentState, config: Optional[RunnableConfig] = None
        ) -> AgentState:
            agent = agents[agent_name]
            logger.info(f"{agent_name.capitalize()} agent processing request")

            human_message = HumanMessage(content=state["input"])
            chat_history = state.get("chat_history", [])

            # For the router node specifically, determine the agent type
            if agent_name == "router":
                response = agent.invoke(
                    message=human_message, chat_history=chat_history
                )

                # Extract the agent type from the response
                ai_message = response["messages"][0]
                content = ai_message.content
                match = re.search(r"ROUTE:\s*(.*?)(?:\s|$)", content, re.IGNORECASE)

                updated_state = state.copy()
                if match:
                    agent_type = match.group(1).strip().lower()
                    updated_state["current_agent"] = agent_type
                    logger.info(f"Router selected agent: {agent_type}")
                else:
                    updated_state["current_agent"] = "assistant"
                    logger.info("Router defaulting to assistant agent")

                return updated_state
            else:
                # For specialized agents
                response = agent.invoke(
                    message=human_message, chat_history=chat_history
                )

                updated_state = state.copy()
                updated_state["output"] = response["messages"][0].content
                updated_state["chat_history"] = (
                    chat_history + [human_message] + response["messages"]
                )

                if "artifacts" in response and response["artifacts"]:
                    updated_state["artifacts"] = response["artifacts"]

                return updated_state

        return node_func

    for agent_name in agents:
        workflow.add_node(agent_name, create_agent_node(agent_name))

    workflow.set_entry_point("router")

    def route_to_agent(state: AgentState) -> str:
        """Route to the appropriate agent based on router's decision"""
        # Safely get the current_agent with a default
        current_agent = state.get("current_agent")

        # Handle None case
        if current_agent is None:
            logger.info("No agent specified, defaulting to assistant")
            return "assistant"

        # Handle image keyword detection as a fallback
        if current_agent == "assistant":
            user_input = state.get("input", "").lower()
            image_keywords = [
                "draw",
                "image",
                "picture",
                "generate image",
                "create image",
                "visualize",
                "create a picture",
                "make an image",
                "render",
            ]

            if any(keyword in user_input for keyword in image_keywords):
                logger.info("Image keyword detected, routing to image agent instead")
                return "image"

        # Convert to lowercase
        current_agent = current_agent.lower()
        logger.info(f"Routing to agent: {current_agent}")

        # Check if agent exists
        return current_agent if current_agent in agents else "assistant"

    workflow.add_conditional_edges(
        "router", route_to_agent, {name: name for name in agents if name != "router"}
    )

    for name in agents:
        if name != "router":
            workflow.add_edge(name, END)

    try:
        compiled_graph = workflow.compile()
        logger.info("Graph compilation successful")
        return compiled_graph
    except Exception as e:
        logger.error(f"Graph compilation error: {str(e)}")
        raise
