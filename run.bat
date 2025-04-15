@echo off
echo ===============================
echo 🔁 Starting Omni App on Windows
echo ===============================

echo ✅ Activating Conda environment...
call conda activate omni_env

echo Setting PYTHONPATH to backend...
set PYTHONPATH=%cd%\backend

echo 🚀 Starting FastAPI backend on port 8000...
start cmd /k "uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000 --reload-dir backend"

cd frontend\omni-multi-agent-app

echo 📦 Installing frontend dependencies (if needed)...
call npm install

echo 🌐 Starting React frontend on port 5173...
start cmd /k "npm run dev"

echo ✅ All services launched!
