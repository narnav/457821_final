@echo off
REM AI Trading Tutor Startup Script for Windows
REM This script starts both backend and frontend servers

echo.
echo 🚀 Starting AI Trading Tutor Application...
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python is not installed. Please install Python 3.8 or higher.
    pause
    exit /b 1
)

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js is not installed. Please install Node.js 14 or higher.
    pause
    exit /b 1
)

echo ✅ Prerequisites check passed
echo.

REM Start backend
echo 📊 Starting Backend Server (FastAPI)...
cd backend

REM Check if virtual environment exists, create if not
if not exist "venv" (
    echo Creating virtual environment...
    python -m venv venv
)

REM Activate virtual environment
call venv\Scripts\activate.bat

REM Install/update dependencies
echo Installing Python dependencies...
pip install -q -r requirements.txt

REM Start backend in new window
echo Starting FastAPI server on http://localhost:8000
start "Backend Server" cmd /k python main.py

cd ..

REM Wait for backend to start
timeout /t 3 /nobreak >nul

REM Start frontend
echo.
echo 🎨 Starting Frontend Server (React)...
cd frontend-ts

REM Install dependencies if needed
if not exist "node_modules" (
    echo Installing Node dependencies (this may take a few minutes)...
    call npm install
)

REM Start frontend in new window
echo Starting React app on http://localhost:3000
start "Frontend Server" cmd /k npm start

cd ..

echo.
echo ✅ Both servers are starting in separate windows...
echo.
echo 📝 Important URLs:
echo    - Frontend: http://localhost:3000
echo    - Backend API: http://localhost:8000
echo    - API Docs: http://localhost:8000/docs
echo.
echo ⚠️  To stop the servers, close the server windows
echo.
pause
