from sqlalchemy import create_engine, inspect
from backend import database
import os

def check_schema():
    engine = database.engine
    inspector = inspect(engine)

    if "users" in inspector.get_table_names():
        print("Table 'users' exists. Columns:")
        for column in inspector.get_columns("users"):
            print(f"- {column['name']} ({column['type']})")
    else:
        print("Table 'users' does not exist.")

if __name__ == "__main__":
    check_schema()
