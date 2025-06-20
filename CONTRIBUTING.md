# Contributing to Omni Multi-Agent System

Thank you for your interest in contributing to the Omni Multi-Agent System! This document provides guidelines and information for contributors.

## 🚀 Getting Started

### Prerequisites

- Python 3.11+
- Node.js 18+
- Git
- Docker (optional but recommended)

### Development Setup

1. **Fork and Clone**

   ```bash
   git clone https://github.com/your-username/Omni-Multi-Agent.git
   cd Omni-Multi-Agent
   ```

2. **Set up Backend**

   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. **Set up Frontend**

   ```bash
   cd frontend
   npm install
   ```

4. **Start Development Environment**

   ```bash
   # Terminal 1: Backend
   cd backend && uvicorn main:app --reload

   # Terminal 2: Frontend
   cd frontend && npm run dev
   ```

## 📋 Development Guidelines

### Code Style

#### Python (Backend)

- Follow PEP 8 style guidelines
- Use type hints for all function parameters and return values
- Maximum line length: 88 characters (Black formatter)
- Use descriptive variable and function names

#### JavaScript/React (Frontend)

- Use ES6+ features
- Follow React best practices and hooks patterns
- Use meaningful component and variable names
- Prefer functional components over class components

### Git Workflow

1. **Create Feature Branch**

   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make Changes**

   - Write clean, documented code
   - Include tests for new functionality
   - Update documentation as needed

3. **Commit Changes**

   ```bash
   git add .
   git commit -m "feat: add your feature description"
   ```

4. **Push and Create PR**
   ```bash
   git push origin feature/your-feature-name
   ```

### Commit Message Convention

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, missing semicolons, etc)
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks

Examples:

```
feat: add persistent session management
fix: resolve message display bug in chat interface
docs: update installation instructions
refactor: improve agent routing logic
```

## 🧪 Testing

### Backend Tests

```bash
cd backend
python -m pytest test_memory.py -v
```

### Frontend Tests

```bash
cd frontend
npm test
```

### Integration Tests

```bash
# Start all services
docker-compose up -d

# Run integration tests
npm run test:integration
```

## 🏗️ Architecture Guidelines

### Adding New Agents

1. **Create Agent Class**

   ```python
   # backend/utils/agents/your_agent.py
   from .base_agent import BaseAgent
   from .memory_mixin import MemoryMixin

   class YourAgent(MemoryMixin, BaseAgent):
       def __init__(self):
           super().__init__()
           # Your initialization code
   ```

2. **Register in Router**

   ```python
   # backend/utils/agents/router_agent.py
   # Add your agent to the routing logic
   ```

3. **Add Tests**
   ```python
   # backend/tests/test_your_agent.py
   # Comprehensive test coverage
   ```

### Adding New API Endpoints

1. **Create Endpoint**

   ```python
   # backend/utils/api/endpoints.py
   @router.post("/your-endpoint")
   async def your_endpoint(request: YourRequest):
       # Implementation
       return YourResponse(...)
   ```

2. **Add Frontend Service**
   ```javascript
   // frontend/src/services/yourService.js
   export const yourApiCall = async (data) => {
     // API call implementation
   };
   ```

## 🐛 Bug Reports

When reporting bugs, please include:

- **Environment**: OS, Python version, Node.js version
- **Steps to Reproduce**: Clear, numbered steps
- **Expected Behavior**: What should happen
- **Actual Behavior**: What actually happens
- **Screenshots/Logs**: If applicable
- **Additional Context**: Any other relevant information

Use the bug report template:

```markdown
## Bug Description

Brief description of the bug

## Environment

- OS: [e.g., Windows 11, macOS 13, Ubuntu 22.04]
- Python: [e.g., 3.11.5]
- Node.js: [e.g., 18.17.0]
- Browser: [e.g., Chrome 118]

## Steps to Reproduce

1. Go to '...'
2. Click on '...'
3. Scroll down to '...'
4. See error

## Expected Behavior

Clear description of what you expected to happen

## Actual Behavior

Clear description of what actually happened

## Screenshots

If applicable, add screenshots to help explain your problem

## Additional Context

Add any other context about the problem here
```

## ✨ Feature Requests

For feature requests, please provide:

- **Problem Statement**: What problem does this solve?
- **Proposed Solution**: How should it work?
- **Alternatives Considered**: Other approaches you've thought about
- **Additional Context**: Any other relevant information

## 📚 Documentation

When contributing documentation:

- Use clear, concise language
- Include code examples where appropriate
- Update both inline code comments and external documentation
- Test all examples to ensure they work

## 🔍 Code Review Process

1. **Automated Checks**: All PRs must pass automated tests and linting
2. **Peer Review**: At least one project maintainer will review your PR
3. **Discussion**: Be open to feedback and suggestions
4. **Iteration**: Make requested changes promptly
5. **Merge**: Once approved, your PR will be merged

## 🏷️ Release Process

1. **Version Bumping**: Follow semantic versioning (MAJOR.MINOR.PATCH)
2. **Changelog**: Update CHANGELOG.md with new features and fixes
3. **Testing**: Comprehensive testing in staging environment
4. **Tagging**: Create git tags for releases
5. **Docker Images**: Build and push updated Docker images

## 📞 Getting Help

- **Discord**: [Join our Discord server](https://discord.gg/your-invite)
- **Discussions**: [GitHub Discussions](https://github.com/tantran24/Omni-Multi-Agent/discussions)
- **Email**: contact@omni-multi-agent.dev

## 📜 Code of Conduct

This project follows the [Contributor Covenant Code of Conduct](https://www.contributor-covenant.org/version/2/1/code_of_conduct/). By participating, you are expected to uphold this code.

## 📄 License

By contributing to this project, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to the Omni Multi-Agent System! 🎉
