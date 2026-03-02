from sqlalchemy import create_engine  # Import create_engine to establish a database connection
from sqlalchemy.orm import sessionmaker, declarative_base  # Import sessionmaker and declarative_base
import os  # Import os to interact with the operating system environment variables
from pathlib import Path
from dotenv import load_dotenv  # Import load_dotenv to load environment variables from a .env file

# Load .env from current dir or parent dir (project root)
env_path = Path('.env')
if not env_path.exists():
    env_path = Path('..') / '.env'
load_dotenv(dotenv_path=env_path)

# Define the database URL, retrieving it from environment variables or using a default local SQLite database
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./test.db")

# Create the SQLAlchemy engine using the defined database URL
# For SQLite, check_same_thread is set to False for compatibility with FastAPI
if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
else:
    engine = create_engine(DATABASE_URL)

# Create a customized SessionLocal class, disabling autocommit and autoflush, and binding it to the engine
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create a Base class for the ORM models to inherit from
Base = declarative_base()

# Define a dependency function to get a database session
def get_database_session():
    db = SessionLocal()  # Create a new database session
    try:
        yield db  # Yield the session to the caller
    finally:
        db.close()  # Close the session after the request is finished
