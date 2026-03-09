# database.py - Database connection setup
# This file sets up the connection to the database

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
import os
from pathlib import Path
from dotenv import load_dotenv

# Try to load environment variables from .env file
backend_env = Path('.env')
root_env = Path('..') / '.env'

if backend_env.exists():
    load_dotenv(dotenv_path=backend_env)
elif root_env.exists():
    load_dotenv(dotenv_path=root_env)

# Get the database URL from environment variable
DATABASE_URL = os.getenv("DATABASE_URL", "")

# Fix old-style postgres:// URLs to postgresql://
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# If no database URL is set, use a fallback SQLite database
if not DATABASE_URL:
    if os.getenv("VERCEL"):
        DATABASE_URL = "sqlite:////tmp/marutha.db"
        print("WARNING: No DATABASE_URL set. Using temporary SQLite in /tmp")
    else:
        DATABASE_URL = "sqlite:///./marutha.db"
        print("WARNING: No DATABASE_URL set. Using local SQLite.")

# Print which database we are using (hide password if present)
if '@' in DATABASE_URL:
    print("Database:", DATABASE_URL.split('@')[-1])
else:
    print("Database:", DATABASE_URL)

# Create the database engine based on database type
if DATABASE_URL.startswith("sqlite"):
    # SQLite needs this special setting to work with FastAPI
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False},
        echo=False,
    )
else:
    # PostgreSQL or other databases use connection pooling
    engine = create_engine(
        DATABASE_URL,
        pool_pre_ping=True,
        pool_recycle=300,
        pool_size=5,
        max_overflow=10,
        echo=False,
    )

# Create a session factory - this is used to create database sessions
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for all database models
Base = declarative_base()


def get_database_session():
    """
    Creates a new database session for each request.
    The session is automatically closed when the request is done.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
