
import os
import psycopg2
from dotenv import load_dotenv
from pathlib import Path

# Load absolute path to .env
env_path = Path(__file__).parent.parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

DATABASE_URL = os.getenv("DATABASE_URL")

def check_db():
    print(f"Connecting to: {DATABASE_URL.split('@')[-1]}")
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor()
        
        print("\nColumns in 'vitals' table:")
        cur.execute("SELECT column_name, data_type FROM information_schema.columns WHERE table_name='vitals';")
        columns = cur.fetchall()
        for col in columns:
            print(f" - {col[0]} ({col[1]})")
        
        if not columns:
            print("Table 'vitals' not found!")
        
        # Check if 'bp' is missing
        has_bp = any(c[0] == 'bp' for c in columns)
        if not has_bp:
            print("\nUpdating table 'vitals' with missing columns...")
            cur.execute("ALTER TABLE vitals ADD COLUMN bp VARCHAR;")
            print("Added 'bp' column.")
            cur.execute("ALTER TABLE vitals ADD COLUMN heart_rate INTEGER;")
            print("Added 'heart_rate' column.")
            conn.commit()
            print("Commit successful.")
        else:
            print("\nColumn 'bp' already exists. No action needed.")

        cur.close()
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_db()
