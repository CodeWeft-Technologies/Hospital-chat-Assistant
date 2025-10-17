#!/usr/bin/env python3
"""
WSGI entry point for Hospital Chat Assistant
This file allows Gunicorn to properly import the Flask application
"""
import sys
import os

# Add the app directory to Python path
app_dir = os.path.join(os.path.dirname(__file__), 'app')
sys.path.insert(0, app_dir)

# Change working directory to app
os.chdir(app_dir)

# Import the Flask app
from app import app

# This is the WSGI application object that Gunicorn will use
application = app

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=False)
