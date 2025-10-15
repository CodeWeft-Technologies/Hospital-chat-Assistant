# app/config.py
import os
from dotenv import load_dotenv # type: ignore
from pathlib import Path

load_dotenv()

class Settings:
    SECRET_KEY = os.getenv("FLASK_SECRET_KEY") or "devkey"
    ASSEMBLYAI_API_KEY = os.getenv("ASSEMBLYAI_API_KEY")
    ELEVEN_LABS_API_KEY = os.getenv("ELEVEN_LABS_API_KEY")
    GOOGLE_TTS_API_KEY = os.getenv("GOOGLE_TTS_API_KEY")
    HOSPITAL_EMAIL = os.getenv("HOSPITAL_EMAIL")
    EMAIL_PASSWORD = os.getenv("EMAIL_PASSWORD")
    EMAIL_RECEIVER = os.getenv("EMAIL_RECEIVER")
    GOOGLE_STT_API_KEY = os.getenv("GOOGLE_TTS_API_KEY")
    GOOGLE_TRANSLATE_API_KEY = os.getenv("GOOGLE_TRANSLATE_API_KEY")
    VERTEX_AI_API_KEY = os.getenv("VERTEX_AI_API_KEY")
    
    # Database Configuration
    DATABASE_URL = os.getenv("DATABASE_URL") or "postgresql://postgres:ykxVXJk0Tj0dcLSY@db.mldyhilykclbfogcavre.supabase.co:5432/postgres"
    DB_HOST = os.getenv("DB_HOST") or "db.mldyhilykclbfogcavre.supabase.co"
    DB_PORT = os.getenv("DB_PORT") or "5432"
    DB_NAME = os.getenv("DB_NAME") or "postgres"
    DB_USER = os.getenv("DB_USER") or "postgres"
    DB_PASSWORD = os.getenv("DB_PASSWORD") or "ykxVXJk0Tj0dcLSY"

BASE_DIR = Path(__file__).resolve().parent
settings = Settings()
