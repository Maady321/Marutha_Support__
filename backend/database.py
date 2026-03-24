# backend/database.py - Database connection setup
# This file sets up the connection to the database

# 1. WHAT: Imports create_engine from SQLAlchemy.
# EXPLAIN: This function is the primary entry point for SQLAlchemy to connect to a database.
# QUESTION: Why do we use create_engine?
# ANSWER: It manages a pool of connections and knows how to talk to specific database types like PostgreSQL.
from sqlalchemy import create_engine

# 2. WHAT: Imports sessionmaker and declarative_base.
# EXPLAIN: sessionmaker creates a factory for database sessions. declarative_base is a base class for models.
# QUESTION: What is a 'session' in SQLAlchemy?
# ANSWER: A session is a workspace for your objects, allowing you to track changes before saving them to the database.
from sqlalchemy.orm import sessionmaker, declarative_base

# 3. WHAT: Imports the standard OS module.
# EXPLAIN: Used to interact with the operating system, like reading environment variables.
# QUESTION: Why is 'os' needed here?
# ANSWER: To fetch the DATABASE_URL secret from the system environment.
import os

# 4. WHAT: Imports Path for file system operations.
# EXPLAIN: Provides an object-oriented way to handle file paths.
# QUESTION: Why use Path instead of just strings?
# ANSWER: Path handles different operating system slash directions (Windows vs Linux) automatically.
from pathlib import Path

# 5. WHAT: Imports load_dotenv from the dotenv library.
# EXPLAIN: This reads key-value pairs from a .env file and adds them to environment variables.
# QUESTION: Why do we use a .env file?
# ANSWER: To keep sensitive database passwords out of the actual code for security.
from dotenv import load_dotenv

# 6. WHAT: Defines the path to the .env file in the backend folder.
# EXPLAIN: This tells the script to look for a file named '.env' in the current location.
backend_env = Path('.env')

# 7. WHAT: Defines the path to the .env file in the root folder.
# EXPLAIN: Checks if the .env is one folder up (the project root).
root_env = Path('..') / '.env'

# 8. WHAT: Conditional block to load the backend .env if it exists.
# EXPLAIN: If the file is found in the backend folder, load its variables.
if backend_env.exists():
    load_dotenv(dotenv_path=backend_env)
# 9. WHAT: Else-if block to load the root .env.
# EXPLAIN: If not in the backend folder, try the root folder.
elif root_env.exists():
    load_dotenv(dotenv_path=root_env)

# 10. WHAT: Fetches the 'DATABASE_URL' environment variable.
# EXPLAIN: This retrieves your Neon PostgreSQL connection string.
# QUESTION: What happens if DATABASE_URL is missing?
# ANSWER: It defaults to an empty string (""), which the code handles later.
DATABASE_URL = os.getenv("DATABASE_URL", "")

# 11. WHAT: String replacement for Heroku-style URLs.
# EXPLAIN: Fixes "postgres://" (deprecated) to "postgresql://" which SQLAlchemy requires.
# QUESTION: Why is this replacement necessary?
# ANSWER: Newer versions of SQLAlchemy only recognize "postgresql://" as the valid driver prefix.
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# 12. WHAT: Default fallback logic if no database is configured.
# EXPLAIN: Uses Neon DB instead of a local SQLite file (marutha.db) if the Neon URL isn't found in env.
# QUESTION: Why not use SQLite on Vercel?
# ANSWER: Vercel serverless functions are stateless. A SQLite DB in /tmp gets wiped out after a few seconds, logging users out and losing data.

# 13. WHAT: Security-conscious print statement.
# EXPLAIN: Logs which database the app is using but hides the password part (before the '@' sign).
# QUESTION: Why split by '@'?
# ANSWER: Connection strings are usually 'user:pass@host'. Splitting at '@' isolates the 'host' for safe logging.
if '@' in DATABASE_URL:
    print("Database:", DATABASE_URL.split('@')[-1])

# 14. WHAT: Sets up the SQLAlchemy engine based on the protocol.
# EXPLAIN: If SQLite, uses specific threading args; else uses pooling for Neon.
if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False},
        echo=False,
    )
else:
    engine = create_engine(
        DATABASE_URL,
        pool_pre_ping=True,
        pool_recycle=300,
        pool_size=5,
        max_overflow=10,
        echo=False,
    )

# 15. WHAT: Creates the SessionLocal factory.
# EXPLAIN: This class is used to instantiate new database sessions.
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 16. WHAT: Defines the Base class for models.
# EXPLAIN: This is the declarative base all tables inherit from.
Base = declarative_base()

# 17. WHAT: Dependency function for route handlers.
# EXPLAIN: Manages the lifecycle of a database session per request.
# QUESTION: How does this help with performance?
# ANSWER: It ensures every individual API request gets its own connection and closes it immediately after, preventing database "exhaustion".
def get_database_session():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
