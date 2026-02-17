from sqlalchemy import text
from backend.database import engine

def sync_schema():
    cols = [
        ("users", "token", "VARCHAR UNIQUE"),
        ("doctors", "is_online", "BOOLEAN DEFAULT FALSE"),
        ("patients", "doctor_id", "INTEGER REFERENCES doctors(id)")
    ]
    
    for table, col, typ in cols:
        print(f"Trying to add {col} to {table}...")
        try:
            # Use a fresh connection/transaction for each
            with engine.begin() as conn:
                conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {col} {typ};"))
                print(f"SUCCESS: Added {col} to {table}")
        except Exception as e:
            if "already exists" in str(e).lower():
                print(f"INFO: {col} already exists in {table}.")
            else:
                print(f"ERROR on {table}.{col}: {e}")

if __name__ == "__main__":
    sync_schema()
