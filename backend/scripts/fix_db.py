
import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

def fix_schema():
    print(f"Connecting to database...")
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor()
        
        # Add 'bp' column to 'vitals' table if it doesn't exist
        print("Checking for 'bp' column in 'vitals' table...")
        cur.execute("SELECT column_name FROM information_schema.columns WHERE table_name='vitals' AND column_name='bp';")
        if not cur.fetchone():
            print("Adding 'bp' column...")
            cur.execute("ALTER TABLE vitals ADD COLUMN bp VARCHAR;")
            print("Added 'bp' column successfully.")
        else:
            print("'bp' column already exists.")

        # Add 'heart_rate' column to 'vitals' table if it doesn't exist
        print("Checking for 'heart_rate' column in 'vitals' table...")
        cur.execute("SELECT column_name FROM information_schema.columns WHERE table_name='vitals' AND column_name='heart_rate';")
        if not cur.fetchone():
            print("Adding 'heart_rate' column...")
            cur.execute("ALTER TABLE vitals ADD COLUMN heart_rate INTEGER;")
            print("Added 'heart_rate' column successfully.")
        else:
            print("'heart_rate' column already exists.")
            
        conn.commit()
        cur.close()
        conn.close()
        print("Done!")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    fix_schema()
