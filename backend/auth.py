# auth.py - Authentication (Login, Register, Token Verification)
# This file handles user registration, login, and checking if a user is logged in

from datetime import datetime, timedelta, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
import secrets
from passlib.context import CryptContext
from sqlalchemy.orm import Session
import database, models, schemas

# Setup password hashing (bcrypt algorithm)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# This tells FastAPI to look for the token in the "Authorization" header
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

# Create a router to group all auth-related endpoints
router = APIRouter(tags=["Auth"])


def verify_password(plain_password, hashed_password):
    """Check if the typed password matches the stored hashed password."""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password):
    """Convert a plain password into a hashed version for safe storage."""
    return pwd_context.hash(password)


def create_simple_token():
    """Generate a random token string (used for login sessions)."""
    return secrets.token_hex(32)


async def fetch_logged_in_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(database.get_database_session)
):
    """
    Find the currently logged-in user by their token.
    This function is used as a 'dependency' - FastAPI calls it automatically
    before any endpoint that needs to know who the user is.
    """
    # Create the error message we'll use if the token is invalid
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    # Search the database for a user with this token
    try:
        user = db.query(models.UserAccount).filter(
            models.UserAccount.token == token
        ).first()

        if user is None:
            raise credentials_exception

        return user
    except Exception:
        raise


# ---- Register Endpoint ----
@router.post("/register", response_model=schemas.UserSummary)
def register(
    user: schemas.UserRegistration,
    db: Session = Depends(database.get_database_session)
):
    """Create a new user account."""

    # Check if email is already taken
    existing_user = db.query(models.UserAccount).filter(
        models.UserAccount.email == user.email
    ).first()

    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Create the user account
    new_user = models.UserAccount(
        email=user.email,
        hashed_password=get_password_hash(user.password),
        role=user.role,
        token=create_simple_token()
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Create an initial profile based on their role
    if user.role == "patient":
        profile = models.PatientProfile(
            user_id=new_user.id,
            name=user.name,
            age=0,
            stage="New"
        )
        db.add(profile)

    elif user.role == "doctor":
        profile = models.DoctorProfile(
            user_id=new_user.id,
            name=user.name,
            specialty="General"
        )
        db.add(profile)

    elif user.role == "volunteer":
        profile = models.VolunteerProfile(
            user_id=new_user.id,
            name=user.name
        )
        db.add(profile)

    db.commit()
    return new_user


# ---- Login Endpoint ----
@router.post("/login", response_model=schemas.Token)
def login(
    user_credentials: schemas.UserLogin,
    db: Session = Depends(database.get_database_session)
):
    """Log in an existing user. Returns a token for future API calls."""

    # Find the user by email
    user = db.query(models.UserAccount).filter(
        models.UserAccount.email == user_credentials.email
    ).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Check if password is correct
    password_is_correct = verify_password(
        user_credentials.password,
        user.hashed_password
    )

    if not password_is_correct:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Generate a new token for this login session
    new_token = create_simple_token()
    user.token = new_token
    db.commit()

    return {
        "access_token": new_token,
        "token_type": "bearer",
        "role": user.role
    }


# ---- Get Current User Endpoint ----
@router.get("/users/me", response_model=schemas.UserSummary)
def read_users_me(
    current_user: models.UserAccount = Depends(fetch_logged_in_user)
):
    """Return the details of the currently logged-in user."""
    return current_user
