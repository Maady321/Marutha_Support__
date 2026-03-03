from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, declarative_base
import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env from backend dir, then project root
for env_path in [Path('.env'), Path('..') / '.env']:
    if env_path.exists():
        load_dotenv(dotenv_path=env_path)
        break

# ────────────────────────────────────────────
# Resolve DATABASE_URL
# ────────────────────────────────────────────
DATABASE_URL = os.getenv("DATABASE_URL", "")

# Fix for Heroku / some cloud providers that give "postgres://" (deprecated)
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# Fallback if no URL is set at all
if not DATABASE_URL:
    if os.getenv("VERCEL"):
        # Vercel serverless — use /tmp SQLite as emergency fallback
        DATABASE_URL = "sqlite:////tmp/marutha.db"
        print("⚠️  WARNING: No DATABASE_URL set. Using temporary SQLite in /tmp — data will NOT persist!")
    else:
        # Local development fallback
        DATABASE_URL = "sqlite:///./marutha.db"
        print("⚠️  WARNING: No DATABASE_URL set. Falling back to local SQLite.")

print(f"✅ Database: {DATABASE_URL.split('@')[-1] if '@' in DATABASE_URL else DATABASE_URL}")

# ────────────────────────────────────────────
# Create Engine
# ────────────────────────────────────────────
if DATABASE_URL.startswith("sqlite"):
    # SQLite — needs check_same_thread=False for FastAPI
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False},
        echo=False,
    )
else:
    # PostgreSQL / any other DB — use connection pooling
    engine = create_engine(
        DATABASE_URL,
        pool_pre_ping=True,       # Test connections before using them
        pool_recycle=300,         # Recycle connections every 5 min
        pool_size=5,              # Keep 5 connections in pool
        max_overflow=10,          # Allow 10 extra connections under load
        echo=False,
    )

# ────────────────────────────────────────────
# Session & Base
# ────────────────────────────────────────────
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_database_session():
    """FastAPI dependency: yields a DB session and closes it after each request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
