# Omni Multi-Agent Development Makefile

.PHONY: help install start stop clean test lint format docker-build docker-up docker-down

# Default target
help:
	@echo "🚀 Omni Multi-Agent Development Commands"
	@echo ""
	@echo "Setup & Installation:"
	@echo "  install          Install all dependencies (backend + frontend)"
	@echo "  install-backend  Install backend dependencies"
	@echo "  install-frontend Install frontend dependencies"
	@echo ""
	@echo "Development:"
	@echo "  start           Start both backend and frontend in development mode"
	@echo "  start-backend   Start only the backend server"
	@echo "  start-frontend  Start only the frontend development server"
	@echo "  stop            Stop all running services"
	@echo ""
	@echo "Testing & Quality:"
	@echo "  test            Run all tests"
	@echo "  test-backend    Run backend tests"
	@echo "  test-frontend   Run frontend tests"
	@echo "  lint            Run linting on all code"
	@echo "  format          Format all code"
	@echo ""
	@echo "Docker:"
	@echo "  docker-build    Build all Docker images"
	@echo "  docker-up       Start all services with Docker Compose"
	@echo "  docker-down     Stop all Docker services"
	@echo "  docker-logs     View Docker container logs"
	@echo ""
	@echo "Maintenance:"
	@echo "  clean           Clean all build artifacts and caches"
	@echo "  reset           Reset development environment (clean + install)"

# Installation targets
install: install-backend install-frontend
	@echo "✅ All dependencies installed successfully!"

install-backend:
	@echo "📦 Installing backend dependencies..."
	cd backend && pip install -r requirements.txt

install-frontend:
	@echo "📦 Installing frontend dependencies..."
	cd frontend && npm install

# Development targets
start:
	@echo "🚀 Starting development environment..."
	@echo "Backend will be available at: http://localhost:8000"
	@echo "Frontend will be available at: http://localhost:5173"
	@echo "API Documentation: http://localhost:8000/docs"
	@(cd backend && uvicorn main:app --reload --host 0.0.0.0 --port 8000) & \
	(cd frontend && npm run dev)

start-backend:
	@echo "🔧 Starting backend server..."
	cd backend && uvicorn main:app --reload --host 0.0.0.0 --port 8000

start-frontend:
	@echo "⚡ Starting frontend development server..."
	cd frontend && npm run dev

stop:
	@echo "🛑 Stopping all services..."
	@pkill -f "uvicorn main:app" || true
	@pkill -f "npm run dev" || true

# Testing targets
test: test-backend test-frontend
	@echo "✅ All tests completed!"

test-backend:
	@echo "🧪 Running backend tests..."
	cd backend && python -m pytest test_memory.py -v

test-frontend:
	@echo "🧪 Running frontend tests..."
	cd frontend && npm test

# Code quality targets
lint:
	@echo "🔍 Running linting..."
	cd backend && python -m flake8 . --max-line-length=88 --extend-ignore=E203,W503
	cd frontend && npm run lint

format:
	@echo "✨ Formatting code..."
	cd backend && python -m black . --line-length=88
	cd backend && python -m isort . --profile=black
	cd frontend && npm run format

# Docker targets
docker-build:
	@echo "🐳 Building Docker images..."
	docker-compose build

docker-up:
	@echo "🐳 Starting services with Docker Compose..."
	docker-compose up -d
	@echo "✅ Services started!"
	@echo "Frontend: http://localhost"
	@echo "Backend: http://localhost:8000"
	@echo "API Docs: http://localhost:8000/docs"

docker-down:
	@echo "🐳 Stopping Docker services..."
	docker-compose down

docker-logs:
	@echo "📄 Viewing Docker container logs..."
	docker-compose logs -f

# Maintenance targets
clean:
	@echo "🧹 Cleaning build artifacts and caches..."
	# Python
	find . -type d -name "__pycache__" -delete
	find . -type f -name "*.pyc" -delete
	find . -type f -name "*.pyo" -delete
	find . -type d -name "*.egg-info" -exec rm -rf {} + || true
	# Node.js
	rm -rf frontend/node_modules/.cache || true
	rm -rf frontend/dist || true
	rm -rf frontend/build || true
	# Docker
	docker system prune -f || true
	@echo "✅ Cleanup completed!"

reset: clean install
	@echo "🔄 Development environment reset completed!"

# Database targets
init-db:
	@echo "🗄️ Initializing database..."
	cd backend && python init_db.py

reset-db:
	@echo "🗄️ Resetting database..."
	rm -f backend/database/app.db || true
	cd backend && python init_db.py

# Health check
health:
	@echo "🏥 Checking service health..."
	@curl -f http://localhost:8000/health && echo "✅ Backend is healthy!" || echo "❌ Backend is down!"
	@curl -f http://localhost:5173 && echo "✅ Frontend is healthy!" || echo "❌ Frontend is down!"

# Development utilities
logs:
	@echo "📄 Following application logs..."
	tail -f backend/*.log frontend/*.log || echo "No log files found"

shell-backend:
	@echo "🐚 Opening backend Python shell..."
	cd backend && python -i -c "from main import app; print('Backend shell ready!')"

deps-update:
	@echo "📦 Updating dependencies..."
	cd backend && pip-review --auto
	cd frontend && npm update

# Git helpers
commit-check:
	@echo "✅ Running pre-commit checks..."
	$(MAKE) lint
	$(MAKE) test
	@echo "✅ All checks passed! Ready to commit."
