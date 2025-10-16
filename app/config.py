# app/config.py
import os
from dotenv import load_dotenv # type: ignore
from pathlib import Path

load_dotenv()

class Settings:
    # Flask Configuration
    SECRET_KEY = os.getenv("FLASK_SECRET_KEY")
    if not SECRET_KEY:
        raise ValueError("FLASK_SECRET_KEY environment variable is required")
    
    # Environment
    FLASK_ENV = os.getenv("FLASK_ENV", "production")
    DEBUG = os.getenv("DEBUG", "False").lower() == "true"
    TESTING = os.getenv("TESTING", "False").lower() == "true"
    
    # API Keys
    ASSEMBLYAI_API_KEY = os.getenv("ASSEMBLYAI_API_KEY")
    ELEVEN_LABS_API_KEY = os.getenv("ELEVEN_LABS_API_KEY")
    GOOGLE_TTS_API_KEY = os.getenv("GOOGLE_TTS_API_KEY")
    GOOGLE_STT_API_KEY = os.getenv("GOOGLE_STT_API_KEY")
    GOOGLE_TRANSLATE_API_KEY = os.getenv("GOOGLE_TRANSLATE_API_KEY")
    VERTEX_AI_API_KEY = os.getenv("VERTEX_AI_API_KEY")
    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
    
    # Email Configuration
    HOSPITAL_EMAIL = os.getenv("HOSPITAL_EMAIL")
    EMAIL_PASSWORD = os.getenv("EMAIL_PASSWORD")
    EMAIL_RECEIVER = os.getenv("EMAIL_RECEIVER")
    
    # Database Configuration
    DATABASE_URL = os.getenv("DATABASE_URL")
    DB_HOST = os.getenv("DB_HOST")
    DB_PORT = os.getenv("DB_PORT", "5432")
    DB_NAME = os.getenv("DB_NAME")
    DB_USER = os.getenv("DB_USER")
    DB_PASSWORD = os.getenv("DB_PASSWORD")
    
    # Validate required database configuration
    if not all([DATABASE_URL, DB_HOST, DB_NAME, DB_USER, DB_PASSWORD]):
        raise ValueError("Database configuration is incomplete. Please set DATABASE_URL or all DB_* variables")
    
    # Security Settings
    SESSION_COOKIE_SECURE = FLASK_ENV == "production"
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = "Lax"
    
    # File Upload Settings
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB max file size
    UPLOAD_FOLDER = "static/uploads"
    
    # Logging Configuration
    LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
    LOG_FILE = os.getenv("LOG_FILE", "app.log")

BASE_DIR = Path(__file__).resolve().parent
settings = Settings()
