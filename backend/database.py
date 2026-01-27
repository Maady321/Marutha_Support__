# SQLAlchemy components for building the database engine and sessions
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Standard libraries for environment variable management
import os
from dotenv import load_dotenv

# Load secret keys and URLs from the .env file
load_dotenv()

# Define the database URL. It checks the environment variable first,
# then falls back to a default PostgreSQL URL if not found.
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:AcademyRootPassword@localhost/marutha_db")

# Create the SQLAlchemy engine that connects the Python code to PostgreSQL
engine = create_engine(SQLALCHEMY_DATABASE_URL)

# Create a 'SessionLocal' class. Each instance of this class will be a database session.
# We set autocommit and autoflush to False for better control over transactions.
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for our database models to inherit from
Base = declarative_base()

# dependency function to open a connection to the database
# this is used by our API routes whenever they need to save or fetch data
def get_database_session():
    # create a new database session
    database_session = SessionLocal()
    try:
        # 'yield' makes this session available to the route that called it
        yield database_session
    finally:
        # once the API route is done, always close the connection
        database_session.close()
