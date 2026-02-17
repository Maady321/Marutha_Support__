import secrets
from backend.database import SessionLocal
from backend import models

def fix_tokens():
    db = SessionLocal()
    users = db.query(models.UserAccount).filter(models.UserAccount.token == None).all()
    for user in users:
        print(f"Setting default token for {user.email}")
        user.token = secrets.token_hex(32)
    db.commit()
    db.close()
    print("Token stabilization done.")

if __name__ == "__main__":
    fix_tokens()
