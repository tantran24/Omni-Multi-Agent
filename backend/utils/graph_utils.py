from typing import Dict, List, Any, TypedDict, Optional
from langchain_core.messages import BaseMessage, HumanMessage
from langgraph.graph import StateGraph, END
from utils.agents.router_agent import (
    RouterAgent,
    AssistantAgent,
    MathAgent,
    ResearchAgent,
    PlanningAgent,
    ConversationAssistantAgent,
)
from utils.agents.image_agent import ImageAgent
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


async def create_agent_graph():
    """Create an async-aware directed graph for agent routing and execution"""
    agents = {
        "router": RouterAgent(),
        "assistant": AssistantAgent(),
        "image": ImageAgent(),
        "math": MathAgent(),
        "research": ResearchAgent(),
        "planning": PlanningAgent(),
    }

    # Initialize all agents' tools in parallel
    import asyncio

    await asyncio.gather(*(agent.initialize_tools() for agent in agents.values()))

    # Initialize MCP tools information for router agent
    router_agent = agents["router"]
    if hasattr(router_agent, "initialize_mcp_tools_info"):
        await router_agent.initialize_mcp_tools_info()

    workflow = StateGraph(AgentState)

    async def create_agent_node(agent_name: str):
        async def node_func(
            state: AgentState, config: Optional[RunnableConfig] = None
        ) -> AgentState:
            agent = agents[agent_name]
            logger.info(f"{agent_name.capitalize()} agent processing request")

            human_message = HumanMessage(content=state["input"])
            chat_history = state.get("chat_history", [])

            if agent_name == "router":
                response = await agent.invoke(
                    message=human_message, chat_history=chat_history
                )
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
                response = await agent.invoke(
                    message=human_message, chat_history=chat_history
                )
                updated_state = state.copy()

                if "delegation" in response:
                    delegation = response["delegation"]
                    target_agent = delegation.get("target_agent")
                    logger.info(f"Agent {agent_name} delegated to {target_agent}")

                    updated_state["current_agent"] = target_agent
                    updated_state["output"] = response["messages"][0].content
                    updated_state["chat_history"] = (
                        chat_history + [human_message] + response["messages"]
                    )
                    return updated_state

                updated_state["output"] = response["messages"][0].content
                updated_state["chat_history"] = (
                    chat_history + [human_message] + response["messages"]
                )

                if "artifacts" in response and response["artifacts"]:
                    updated_state["artifacts"] = response["artifacts"]

                return updated_state

        return node_func

    # Add nodes to the workflow - corrected to properly await the coroutine
    for agent_name in agents:
        node_func = await create_agent_node(agent_name)
        workflow.add_node(agent_name, node_func)

    workflow.set_entry_point("router")

    def route_to_agent(state: AgentState) -> str:
        """Route to the appropriate agent based on router's decision"""
        current_agent = state.get("current_agent")
        if current_agent is None:
            logger.info("No agent specified, defaulting to assistant")
            return "assistant"

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
                "illustration",
                "artwork",
                "design",
                "sketch",
                "depict",
                "drawing of",
                "photo of",
                "show me",
                "create a visual",
            ]

            if any(keyword in user_input for keyword in image_keywords):
                logger.info("Image keyword detected, routing to image agent instead")
                return "image"

        current_agent = current_agent.lower()
        logger.info(f"Routing to agent: {current_agent}")

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


async def create_conversation_agent_graph():
    """Create an async-aware directed graph for agent routing and execution"""
    agents = {
        "router": RouterAgent(),
        "assistant": ConversationAssistantAgent(),
        "math": MathAgent(),
        "research": ResearchAgent(),
        "planning": PlanningAgent(),
    }

    # Initialize all agents' tools in parallel
    import asyncio

    await asyncio.gather(*(agent.initialize_tools() for agent in agents.values()))

    # Initialize MCP tools information for router agent
    router_agent = agents["router"]
    if hasattr(router_agent, "initialize_mcp_tools_info"):
        await router_agent.initialize_mcp_tools_info()

    workflow = StateGraph(AgentState)

    async def create_agent_node(agent_name: str):
        async def node_func(
            state: AgentState, config: Optional[RunnableConfig] = None
        ) -> AgentState:
            agent = agents[agent_name]
            logger.info(f"{agent_name.capitalize()} agent processing request")

            human_message = HumanMessage(content=state["input"])
            chat_history = state.get("chat_history", [])

            if agent_name == "router":
                response = await agent.invoke(
                    message=human_message, chat_history=chat_history
                )
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
                response = await agent.invoke(
                    message=human_message, chat_history=chat_history
                )
                updated_state = state.copy()

                if "delegation" in response:
                    delegation = response["delegation"]
                    target_agent = delegation.get("target_agent")
                    logger.info(f"Agent {agent_name} delegated to {target_agent}")

                    updated_state["current_agent"] = target_agent
                    updated_state["output"] = response["messages"][0].content
                    updated_state["chat_history"] = (
                        chat_history + [human_message] + response["messages"]
                    )
                    return updated_state

                updated_state["output"] = response["messages"][0].content
                updated_state["chat_history"] = (
                    chat_history + [human_message] + response["messages"]
                )

                if "artifacts" in response and response["artifacts"]:
                    updated_state["artifacts"] = response["artifacts"]

                return updated_state

        return node_func

    # Add nodes to the workflow - corrected to properly await the coroutine
    for agent_name in agents:
        node_func = await create_agent_node(agent_name)
        workflow.add_node(agent_name, node_func)

    workflow.set_entry_point("router")

    def route_to_agent(state: AgentState) -> str:
        """Route to the appropriate agent based on router's decision"""
        current_agent = state.get("current_agent")
        if current_agent is None:
            logger.info("No agent specified, defaulting to assistant")
            return "assistant"

        if current_agent == "assistant":
            user_input = state.get("input", "").lower()

        current_agent = current_agent.lower()
        logger.info(f"Routing to agent: {current_agent}")

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
