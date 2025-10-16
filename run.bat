@echo off
REM Hospital Chat Assistant - Windows Production Deployment Script

echo 🏥 Hospital Chat Assistant - Starting deployment...

REM Check if .env file exists
if not exist .env (
    echo ❌ Error: .env file not found!
    echo Please copy env.example to .env and configure your environment variables.
    pause
    exit /b 1
)

echo ✅ Environment file found

REM Install dependencies
echo 📦 Installing Python dependencies...
pip install -r requirements.txt

REM Create necessary directories
echo 📁 Creating necessary directories...
if not exist "app\static\uploads" mkdir "app\static\uploads"
if not exist "app\data\slips" mkdir "app\data\slips"
if not exist "logs" mkdir "logs"

echo ✅ Directories created

REM Start the application
echo 🚀 Starting Hospital Chat Assistant...

REM Check if FLASK_ENV is set to development
if "%FLASK_ENV%"=="development" (
    python app\app.py
) else (
    gunicorn --bind 0.0.0.0:%PORT% --workers 4 --timeout 120 --keep-alive 2 --max-requests 1000 --max-requests-jitter 100 app:app
)

pause
