from sqlalchemy import create_engine  # Import create_engine to establish a database connection
from sqlalchemy.ext.declarative import declarative_base  # Import declarative_base for defining the base class for models
from sqlalchemy.orm import sessionmaker  # Import sessionmaker to create database sessions
import os  # Import os to interact with the operating system environment variables
from dotenv import load_dotenv  # Import load_dotenv to load environment variables from a .env file

load_dotenv()  # Load environment variables from the .env file

# Define the database URL, retrieving it from environment variables or using a default local PostgreSQL URL
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:AcademyRootPassword@localhost/marutha_db")

# Create the SQLAlchemy engine using the defined database URL
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
