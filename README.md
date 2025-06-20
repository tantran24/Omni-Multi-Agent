# 🚀 Omni Multi-Agent System

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Docker](https://img.shields.io/badge/docker-supported-blue.svg)](docker-compose.yml)
[![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=flat&logo=fastapi)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB)](https://reactjs.org)

> **Advanced AI Multi-Agent System with Persistent Memory, Real-time Chat, and Specialized Agent Coordination**

Omni Multi-Agent is a cutting-edge AI system that orchestrates multiple specialized AI agents through an intelligent routing system. Built with enterprise-grade architecture, it provides seamless integration of conversational AI, image generation, web search, and document processing capabilities with persistent session management.

---

## 🌟 Key Features

### 🧠 **Multi-Agent Architecture**

- **Intelligent Router**: Automatically routes requests to the most suitable agent
- **Specialized Agents**: Research, Math, Planning, Image Generation, and more
- **Agent Coordination**: Seamless handoffs and collaborative problem-solving

### 💾 **Persistent Memory System**

- **Session Management**: Maintain conversation context across sessions
- **Message History**: Full conversation persistence with SQLAlchemy
- **Context Retrieval**: Smart context loading for enhanced responses

### 🎨 **Advanced Capabilities**

- **Image Generation**: High-quality image creation with Stable Diffusion XL
- **Document Processing**: PDF analysis and content extraction
- **Web Search**: Real-time web information retrieval
- **Speech Integration**: Text-to-speech and speech-to-text support

### 🌐 **Modern Tech Stack**

- **Backend**: FastAPI with async/await support
- **Frontend**: React with modern UI components
- **Database**: SQLAlchemy with async ORM
- **Vector DB**: Qdrant for semantic search
- **AI Framework**: LangGraph + LangChain for agent orchestration

---

## 🚀 Quick Start

### Option 1: Docker Deployment (Recommended)

```bash
# Clone the repository
git clone https://github.com/tantran24/Omni-Multi-Agent.git
cd Omni-Multi-Agent

# Start all services with Docker Compose
docker-compose up -d

# Access the application
# Frontend: http://localhost
# Backend API: http://localhost:8000
# API Documentation: http://localhost:8000/docs
```

### Option 2: Manual Installation

#### Prerequisites

- Python 3.11+
- Node.js 18+
- Ollama
- Git

#### Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Initialize database
python init_db.py

# Start the server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

#### Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

#### Ollama Setup

```bash
# Install Ollama (if not already installed)
curl -fsSL https://ollama.ai/install.sh | sh

# Pull required models
ollama pull llama2
ollama pull gemma:2b
```

---

## 📱 Usage Guide

### Basic Chat Interaction

1. **Start a Conversation**: Open the app and type your message
2. **Session Management**: Your conversations are automatically saved
3. **Switch Sessions**: Use the session manager to navigate between chats
4. **Persistent History**: All messages are preserved across browser sessions

### Advanced Features

#### Image Generation

```
Generate an image of a futuristic city at sunset
Create a logo for a tech startup
Draw a cute cartoon cat wearing a spacesuit
```

#### Document Analysis

- Upload PDF files for analysis and Q&A
- Extract key information from documents
- Summarize long documents

#### Web Search

```
Search for the latest news about artificial intelligence
Find information about climate change solutions
Look up the current stock price of Tesla
```

#### Mathematical Problem Solving

```
Solve the equation: 2x + 5 = 15
Calculate the derivative of x^2 + 3x + 2
What is the area of a circle with radius 5?
```

---

## 🛠️ Development Guide

### Project Structure

```
Omni-Multi-Agent/
├── backend/                 # FastAPI backend
│   ├── services/           # Core business logic
│   ├── utils/             # Utilities and agents
│   ├── config/            # Configuration files
│   ├── database/          # Database models and migrations
│   └── main.py           # Application entry point
├── frontend/              # React frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── services/      # API services
│   │   └── utils/        # Frontend utilities
│   └── public/           # Static assets
├── docker-compose.yml     # Docker orchestration
└── README.md             # This file
```

### API Documentation

The backend provides comprehensive API documentation:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **OpenAPI Schema**: http://localhost:8000/openapi.json

---

## 🎯 Specialized Agents

### 🤖 Chat Agent

- General conversation handling
- Context-aware responses
- Memory integration

### 🎨 Image Agent

- Text-to-image generation
- Style and quality optimization
- Multiple format support

### 📚 RAG Agent

- Document Q&A
- Semantic search
- Context extraction

### 🔍 Research Agent

- Web search integration
- Information synthesis
- Fact verification

### 📊 Planning Agent

- Task breakdown
- Project planning
- Goal-oriented assistance

---

## ⚙️ Configuration

### Environment Variables

```bash
# Backend Configuration
OLLAMA_BASE_URL=http://localhost:11434
HUGGINGFACE_API_KEY=your_hf_api_key
DATABASE_URL=sqlite:///./database/app.db

# Frontend Configuration
VITE_API_URL=http://localhost:8000
```

### Customization

The system is highly configurable through:

- `backend/config/config.py` - Backend settings
- `frontend/.env` - Frontend environment variables
- `backend/config/prompts.py` - Agent prompts and behaviors

---

## 🔒 Security Features

- CORS protection configured
- Input validation and sanitization
- Secure file upload handling
- Environment-based configuration
- Docker security best practices

---

## 🤝 Community & Support

### Getting Help

- 📖 [Documentation](docs/)
- 💬 [Discussions](https://github.com/tantran24/Omni-Multi-Agent/discussions)
- 🐛 [Issue Tracker](https://github.com/tantran24/Omni-Multi-Agent/issues)

### Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🏆 Acknowledgments

- **LangChain Team** for the amazing agent framework
- **FastAPI** for the high-performance web framework
- **React Community** for the frontend ecosystem
- **Ollama** for local LLM infrastructure
- **Hugging Face** for AI model hosting

---

<div align="center">

**Made with ❤️ by the Omni Multi-Agent Team**

[⭐ Star this project](https://github.com/tantran24/Omni-Multi-Agent) if you find it helpful!

</div>
