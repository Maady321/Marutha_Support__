from backend.database import engine, Base
from backend import models
from sqlalchemy import text

def reset_database():
    print("Resetting database...")

    with engine.connect() as connection:
        connection.execute(text("DROP SCHEMA public CASCADE;"))
        connection.execute(text("CREATE SCHEMA public;"))
        connection.commit()

    print("Schema wiped. Creating new tables...")
    Base.metadata.create_all(bind=engine)
    print("Database reset complete.")

if __name__ == "__main__":
    reset_database()
