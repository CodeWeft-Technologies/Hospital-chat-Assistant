#!/bin/bash

# Hospital Chat Assistant - Production Deployment Script

set -e

echo "🏥 Hospital Chat Assistant - Starting deployment..."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found!"
    echo "Please copy env.example to .env and configure your environment variables."
    exit 1
fi

# Load environment variables
export $(cat .env | grep -v '^#' | xargs)

# Check required environment variables
required_vars=("FLASK_SECRET_KEY" "DATABASE_URL")
for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        echo "❌ Error: $var is not set in .env file"
        exit 1
    fi
done

echo "✅ Environment variables validated"

# Install dependencies
echo "📦 Installing Python dependencies..."
pip install -r requirements.txt

# Create necessary directories
echo "📁 Creating necessary directories..."
mkdir -p app/static/uploads
mkdir -p app/data/slips
mkdir -p logs

# Set proper permissions
chmod 755 app/static/uploads
chmod 755 app/data/slips
chmod 755 logs

echo "✅ Directories created and permissions set"

# Run database migrations (if using Flask-Migrate)
if [ -f "migrations" ]; then
    echo "🗄️ Running database migrations..."
    flask db upgrade
fi

# Start the application
echo "🚀 Starting Hospital Chat Assistant..."
echo "Environment: ${FLASK_ENV:-production}"
echo "Port: ${PORT:-5000}"

if [ "${FLASK_ENV}" = "development" ]; then
    python app/app.py
else
    gunicorn --bind 0.0.0.0:${PORT:-5000} \
             --workers 4 \
             --timeout 120 \
             --keep-alive 2 \
             --max-requests 1000 \
             --max-requests-jitter 100 \
             --access-logfile - \
             --error-logfile - \
             app:app
fi
