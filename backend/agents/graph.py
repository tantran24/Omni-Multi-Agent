from typing import Annotated, TypedDict, List, Union
from langchain_core.messages import BaseMessage, AIMessage, SystemMessage, HumanMessage
from langgraph.graph import StateGraph
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_ollama import ChatOllama
from langchain.agents import AgentExecutor, create_react_agent
from langgraph.checkpoint.memory import MemorySaver
from langgraph.graph.message import add_messages
from core.config import Config
from .tools import AVAILABLE_TOOLS
from langchain.agents import AgentType, Tool
import requests.exceptions
import logging

class AgentState(TypedDict):
    messages: Annotated[list, add_messages]
    chat_history: List[BaseMessage]
    agent_scratchpad: List[BaseMessage]

def create_agent_graph() -> AgentExecutor:
    def _check_ollama():
        try:
            response = requests.get(
                Config.OLLAMA_HEALTH_CHECK_URL,
                timeout=Config.OLLAMA_CONNECTION_TIMEOUT
            )
            response.raise_for_status()
            return True
        except requests.exceptions.RequestException as e:
            logging.error(f"Ollama connection error: {str(e)}")
            return False

    if not _check_ollama():
        raise ConnectionError("Could not connect to Ollama server. Please ensure it's running and try again.")

    messages = [
        SystemMessage(content="""You are a helpful AI assistant that can use tools to accomplish tasks.

You have access to the following tools:
{tools}

The available tool names are: {tool_names}

Follow this exact format for every response:
1. Thought: Your internal reasoning about the task.
2. Action: The exact tool name to use (if no tool is needed, write "No Action").
3. Action Input: The input to the tool (if applicable).
4. Observation: The result produced by the tool.
... (repeat if using multiple tools)
Finally, when you are ready to answer the user, provide:
Thought: Your final internal reasoning.
Final Answer: Your answer to the user.

Important: Every "Thought:" entry must be immediately followed by an "Action:" line.
"""),
        MessagesPlaceholder(variable_name="chat_history"),
        ("human", "{input}"),
        ("ai", "{agent_scratchpad}")
    ]

    prompt = ChatPromptTemplate.from_messages(messages)

    llm = ChatOllama(
        model=Config.LLM_MODEL,
        temperature=Config.LLM_TEMPERATURE,
        base_url=Config.OLLAMA_BASE_URL,
        timeout=Config.LLM_TIMEOUT,
        retry_on_failure=True,
        num_retries=Config.OLLAMA_MAX_RETRIES
    )

    # Format tool descriptions
    tool_strings = "\n".join([f"{tool.name}: {tool.description}" for tool in AVAILABLE_TOOLS])
    tool_names = ", ".join([tool.name for tool in AVAILABLE_TOOLS])

    # Create the agent with the correct type and handle the scratchpad properly
    agent = create_react_agent(
        llm=llm,
        tools=AVAILABLE_TOOLS,
        prompt=prompt.partial(
            tools=tool_strings,
            tool_names=tool_names
        )
    )

    def _format_chat_history(chat_history) -> List[BaseMessage]:
        if not chat_history:
            return []
        if isinstance(chat_history[0], BaseMessage):
            return chat_history
        return [
            HumanMessage(content=msg) if i % 2 == 0 else AIMessage(content=msg)
            for i, msg in enumerate(chat_history)
        ]

    def _format_scratchpad(actions) -> List[BaseMessage]:
        if not actions:
            return []
        formatted_actions = []
        for action, observation in actions:
            formatted_actions.extend([
                AIMessage(content=f"Thought: {action.log}"),
                HumanMessage(content=f"Observation: {observation}")
            ])
        return formatted_actions

    executor = AgentExecutor(
        agent=agent,
        tools=AVAILABLE_TOOLS,
        verbose=True,
        max_iterations=Config.MAX_ITERATIONS,
        handle_parsing_errors=True,
        early_stopping_method=Config.EARLY_STOPPING_METHOD,
        return_intermediate_steps=True
    )

    def invoke_with_structured_args(inputs: dict) -> dict:
        formatted_inputs = {
            "input": inputs["input"],
            "chat_history": _format_chat_history(inputs.get("chat_history", [])),
            "agent_scratchpad": _format_scratchpad(inputs.get("intermediate_steps", []))
        }
        try:
            return executor.invoke(formatted_inputs)
        except Exception as e:
            logging.error(f"Agent execution error: {str(e)}")
            raise

    return invoke_with_structured_args

def process_message(message: str, agent_executor) -> str:
    try:
        result = agent_executor({
            "input": message,
            "chat_history": []
        })
        return result.get("output", "Error processing request")
    except ConnectionError as e:
        return "Error: Ollama server is not running. Please start Ollama first."
    except Exception as e:
        return f"I encountered an error: {str(e)}"
