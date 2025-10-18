import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy.pool import QueuePool
from dotenv import load_dotenv
import logging

load_dotenv()

# Database Configuration
DB_USER = os.getenv("DB_USER")
DB_PASS = os.getenv("DB_PASSWORD")
DB_HOST = os.getenv("DB_HOST")
DB_PORT = os.getenv("DB_PORT", "5432")
DB_NAME = os.getenv("DB_NAME")

# Use DATABASE_URL if provided, otherwise construct from individual components
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    if not all([DB_USER, DB_PASS, DB_HOST, DB_NAME]):
        # Fallback to SQLite for development
        DATABASE_URL = "sqlite:///hospital_chat.db"
        print("Using SQLite database for development")
    else:
        DATABASE_URL = f"postgresql+psycopg2://{DB_USER}:{DB_PASS}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

# Production-ready engine configuration
engine_kwargs = {
    "echo": os.getenv("FLASK_ENV") == "development"
}

# Add PostgreSQL-specific configurations only for PostgreSQL databases
if DATABASE_URL.startswith("postgresql"):
    engine_kwargs.update({
        "poolclass": QueuePool,
        "pool_size": 10,
        "max_overflow": 20,
        "pool_pre_ping": True,
        "pool_recycle": 3600,  # Recycle connections after 1 hour
    })

engine = create_engine(DATABASE_URL, **engine_kwargs)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# Configure logging for database operations
logging.basicConfig(level=logging.INFO)
db_logger = logging.getLogger('sqlalchemy.engine')
if os.getenv("FLASK_ENV") != "development":
    db_logger.setLevel(logging.WARNING)

