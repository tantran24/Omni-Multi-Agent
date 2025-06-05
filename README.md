# Omni-Multi-Agent

Omni-Multi-Agent is an advanced AI system that combines multiple specialized AI agents to handle a wide range of tasks through a single interface. The project uses a multi-agent architecture powered by LangGraph and Ollama to create a versatile assistant that can handle conversations, generate images, search the web, and more.

## Overview

This project integrates various AI capabilities including:

- Conversational AI using large language models
- Speech-to-text and text-to-speech conversion
- Image generation using Stable Diffusion
- Web searching
- Mathematical problem solving
- Planning and task breakdown

The architecture consists of a Python FastAPI backend that coordinates the various agents and a React frontend that provides a chat interface for users.

## Features

- **Multi-Agent Coordination**: A router agent routes user requests to specialized agents
- **Specialized Agents**:
  - Research Agent: For information gathering and facts
  - Math Agent: For calculations and equations
  - Assistant Agent: For general conversation and coordination
  - Planning Agent: For breaking down complex tasks
  - Image Agent: For generating images from text descriptions
  - Web Search Agent: For searching the internet
  - Time Agent: For providing current time information
- **Tools**:
  - Image Generation: Creates images from text descriptions
  - Web Search: Finds information online
  - Time: Provides the current time
- **Responsive UI**: A clean, modern chat interface built with React

## Architecture

The system is built with:

- **Backend**: Python with FastAPI
- **Frontend**: React with styled-components
- **AI Framework**: LangChain and LangGraph for agent orchestration
- **LLM Provider**: Ollama for local LLM inference
- **Image Generation**: Stable Diffusion XL via Hugging Face

## Installation Guide

### Prerequisites

- Python 3.9+
- Node.js and npm
- Ollama (for local LLM inference)
- CUDA-capable GPU (recommended for image generation)

### Backend Setup

1. Clone the repository:

```bash
git clone https://github.com/tantran24/Omni-Multi-Agent.git
cd Omni-Multi-Agent
```

2. Install Python dependencies:

```bash
cd backend
pip install -r requirements.txt
```

3. Install and start Ollama:

   - Download from [Ollama's website](https://ollama.ai)
   - Install and run the application

4. Pull the required model:

```bash
ollama pull PetrosStav/gemma3-tools:4b
```

5. Run the backend server:

```bash
cd backend
uvicorn main:app --reload
```

The server will start on http://localhost:8000

### Frontend Setup

1. Install Node.js dependencies:

```bash
cd frontend
npm install
```

2. Start the development server:

```bash
npm run dev
```

The frontend will be available at http://localhost:3000

## Usage

1. Open your browser and navigate to http://localhost:3000
2. Type a message in the input box and press Enter or click Send
3. The system will route your request to the appropriate agent and respond accordingly
4. For image generation, include words like "draw", "create image", or "visualize" in your prompt
5. For web searches, start your message with "search for" or similar phrases

## Current Tools and Capabilities

The current version includes:

- **Language Model Integration**: Using Ollama for local LLM inference
- **Image Generation**: Stable Diffusion XL with optimized inference
- **Speech-to-Text/Text-to-Speech**: Basic functionality included
- **Web Search**: Simple web search functionality
- **Multi-Agent Routing**: Intelligent request routing to specialized agents

## Upcoming Features

- Audio file processing
- Document analysis and summarization
- Voice interaction improvements
- Code execution and development tools
- Enhanced memory and conversation history
