# backend/auth.py - Authentication (Login, Register, Token Verification)
# This file handles user registration, login, and checking if a user is logged in.

# 1. WHAT: Imports time and typing utilities.
from datetime import datetime, timedelta, timezone
from typing import Optional

# 2. WHAT: Imports FastAPI security classes.
# EXPLAIN: APIRouter groups endpoints; OAuth2PasswordBearer handles the "Bearer" token standard.
# QUESTION: Why use Bearer tokens?
# ANSWER: It's the industry standard for securely sending credentials in the header of an API call.
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

# 3. WHAT: Imports secrets and password hashing.
# EXPLAIN: CryptContext using "bcrypt" ensures passwords aren't stored as plain text.
# QUESTION: Why is hashing important?
# ANSWER: If the database is hacked, the hacker only sees "scrambled" text, not the actual passwords.
import secrets
from passlib.context import CryptContext

# 4. WHAT: Imports database and internal models.
from sqlalchemy.orm import Session
import database, models, schemas

# 5. WHAT: Sets up the hashing machine.
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# 6. WHAT: Configures where to find tokens.
# EXPLAIN: FastAPI will look for the "Authorization: Bearer <token>" header during requests.
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

# 7. WHAT: Creates the Auth Router.
router = APIRouter(tags=["Auth"])


# 8. WHAT: Password Verifier.
# EXPLAIN: Compares a user's input with the encrypted database version.
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)


# 9. WHAT: Password Hasher.
# EXPLAIN: Turns a new password into a secure hash for the first time.
def get_password_hash(password):
    return pwd_context.hash(password)


# 10. WHAT: Token Generator.
# EXPLAIN: Creates a long, random string (hex) to identify a logged-in session.
def create_simple_token():
    return secrets.token_hex(32)


# 11. WHAT: User Session Fetcher.
# EXPLAIN: Takes a token, looks it up in the "users" table, and returns the User object.
# QUESTION: What happens if the token is wrong?
# ANSWER: It returns a "401 Unauthorized" error, blocking access to the private page.
async def fetch_logged_in_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(database.get_database_session)
):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    user = db.query(models.UserAccount).filter(models.UserAccount.token == token).first()
    if user is None:
        raise credentials_exception
    return user


# ---- Register Endpoint ----

# 12. WHAT: Signup logic.
# EXPLAIN: Checks if email exists, creates the account, and makes a role-specific profile (Patient/Doctor/Volunteer).
# QUESTION: Why create a profile immediately?
# ANSWER: So the user doesn't have an empty dashboard when they log in for the first time.
@router.post("/register", response_model=schemas.UserSummary)
def register(
    user: schemas.UserRegistration,
    db: Session = Depends(database.get_database_session)
):
    # Prevent duplicate emails
    existing_user = db.query(models.UserAccount).filter(models.UserAccount.email == user.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Hash password and save user
    new_user = models.UserAccount(
        email=user.email,
        hashed_password=get_password_hash(user.password),
        role=user.role,
        token=create_simple_token()
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Initialize Table-specific profile
    if user.role == "patient":
        db.add(models.PatientProfile(user_id=new_user.id, name=user.name, age=0, stage="New"))
    elif user.role == "doctor":
        db.add(models.DoctorProfile(user_id=new_user.id, name=user.name, specialty="General"))
    elif user.role == "volunteer":
        db.add(models.VolunteerProfile(user_id=new_user.id, name=user.name))

    db.commit()
    return new_user


# ---- Login Endpoint ----

# 13. WHAT: Login logic.
# EXPLAIN: Validates credentials and returns a fresh session token.
# QUESTION: Why return "role" in login?
# ANSWER: So the frontend knows which dashboard (doctor or patient) to redirect the user to.
@router.post("/login", response_model=schemas.Token)
def login(
    user_credentials: schemas.UserLogin,
    db: Session = Depends(database.get_database_session)
):
    user = db.query(models.UserAccount).filter(models.UserAccount.email == user_credentials.email).first()

    if not user or not verify_password(user_credentials.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect email or password")

    # Generate and save session token
    new_token = create_simple_token()
    user.token = new_token
    db.commit()

    return {
        "access_token": new_token,
        "token_type": "bearer",
        "role": user.role
    }


# ---- Get Current User Endpoint ----

# 14. WHAT: Personal Details endpoint.
# EXPLAIN: Returns the logged-in user's account info.
@router.get("/users/me", response_model=schemas.UserSummary)
def read_users_me(
    current_user: models.UserAccount = Depends(fetch_logged_in_user)
):
    return current_user
