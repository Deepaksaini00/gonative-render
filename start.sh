#!/bin/bash
# Start both backend and frontend in separate terminals

echo "🚀 Starting LangLearn..."
echo ""
echo "Starting Backend on http://localhost:8000"
cd backend && source venv/bin/activate 2>/dev/null || true && uvicorn app.main:app --reload --port 8000 &
BACKEND_PID=$!

sleep 2

echo "Starting Frontend on http://localhost:5173"
cd ../frontend && npm run dev &
FRONTEND_PID=$!

echo ""
echo "✅ Both servers running!"
echo "   Frontend: http://localhost:5173"
echo "   Backend:  http://localhost:8000"
echo "   API Docs: http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop both servers"

wait $BACKEND_PID $FRONTEND_PID
