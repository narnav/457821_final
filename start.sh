#!/bin/bash

# AI Trading Tutor Startup Script
# This script starts both backend and frontend servers

echo "🚀 Starting AI Trading Tutor Application..."
echo ""

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.8 or higher."
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 14 or higher."
    exit 1
fi

echo "✅ Prerequisites check passed"
echo ""

# Start backend
echo "📊 Starting Backend Server (FastAPI)..."
cd backend

# Check if virtual environment exists, create if not
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install/update dependencies
echo "Installing Python dependencies..."
pip install -q -r requirements.txt

# Start backend in background
echo "Starting FastAPI server on http://localhost:8000"
python main.py &
BACKEND_PID=$!

cd ..

# Wait a moment for backend to start
sleep 3

# Start frontend
echo ""
echo "🎨 Starting Frontend Server (React)..."
cd frontend-ts

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "Installing Node dependencies (this may take a few minutes)..."
    npm install
fi

# Start frontend
echo "Starting React app on http://localhost:3000"
npm start &
FRONTEND_PID=$!

cd ..

echo ""
echo "✅ Both servers are starting..."
echo ""
echo "📝 Important URLs:"
echo "   - Frontend: http://localhost:3000"
echo "   - Backend API: http://localhost:8000"
echo "   - API Docs: http://localhost:8000/docs"
echo ""
echo "⚠️  To stop the servers, press Ctrl+C"
echo ""

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Shutting down servers..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    echo "✅ Servers stopped"
    exit 0
}

# Trap Ctrl+C
trap cleanup INT

# Wait for processes
wait
