#!/bin/bash
echo "Starting FastAPI backend..."
cd backend || exit
python main.py
BACKEND_PID=$!

cd ../frontend/omni-multi-agent-app || exit

echo "Installing frontend dependencies (if needed)..."
npm install

echo "Starting Vite frontend..."
npm run dev &
FRONTEND_PID=$!

echo "✅ Both backend (pid $BACKEND_PID) and frontend (pid $FRONTEND_PID) are running."
echo "🔁 Backend:   http://localhost:8000"
echo "🌐 Frontend: http://localhost:5173"

wait $BACKEND_PID
wait $FRONTEND_PID
