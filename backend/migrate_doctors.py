"""
Migration script: adds missing columns to the 'doctors' table in PostgreSQL.
Columns: experience, qualification, bio, phone, license_id
"""
from sqlalchemy import text
import database

print("Running migration: adding missing columns to 'doctors' table...")

columns_to_add = [
    ("experience", "INTEGER"),
    ("qualification", "VARCHAR"),
    ("bio", "VARCHAR"),
    ("phone", "VARCHAR"),
    ("license_id", "VARCHAR"),
]

with database.engine.connect() as conn:
    for col_name, col_type in columns_to_add:
        try:
            conn.execute(text(f"ALTER TABLE doctors ADD COLUMN {col_name} {col_type}"))
            conn.commit()
            print(f"  + Added column: {col_name} ({col_type})")
        except Exception as e:
            conn.rollback()
            if "already exists" in str(e).lower() or "duplicate column" in str(e).lower():
                print(f"  ~ Column already exists: {col_name} (skipped)")
            else:
                print(f"  ! Error adding {col_name}: {e}")

print("\nMigration complete.")
