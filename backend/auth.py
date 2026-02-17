from datetime import datetime, timedelta, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
import secrets
from passlib.context import CryptContext
from sqlalchemy.orm import Session
from backend import database, models, schemas

# Initialize password hashing context with bcrypt
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
# OAuth2 scheme for token extraction from headers
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

router = APIRouter(tags=["Auth"])

def verify_password(plain_password, hashed_password):
    """Verify a plain password against the hashed password."""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    """Generate a hash for the given password."""
    return pwd_context.hash(password)

def create_simple_token():
    """Generate a simple random token string."""
    return secrets.token_hex(32)

async def fetch_logged_in_user(token: str = Depends(oauth2_scheme), db: Session = Depends(database.get_database_session)):
    """
    Dependency to fetch the current authenticated user using a simple token.
    Searches for the token in the database.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    # Query the user by their unique token
    try:
        user = db.query(models.UserAccount).filter(models.UserAccount.token == token).first()
        if user is None:
            raise credentials_exception
        return user
    except Exception as e:
        raise

@router.post("/register", response_model=schemas.UserSummary)
def register(user: schemas.UserRegistration, db: Session = Depends(database.get_database_session)):
    """Endpoint to register a new user."""
    if db.query(models.UserAccount).filter(models.UserAccount.email == user.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    
    new_user = models.UserAccount(
        email=user.email,
        hashed_password=get_password_hash(user.password),
        role=user.role,
        token=create_simple_token()
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Create initial skeletal profile based on role
    if user.role == "patient":
        profile = models.PatientProfile(user_id=new_user.id, name=user.name, age=0, stage="New")
        db.add(profile)
    elif user.role == "doctor":
        profile = models.DoctorProfile(user_id=new_user.id, name=user.name, specialty="General")
        db.add(profile)
    elif user.role == "volunteer":
        profile = models.VolunteerProfile(user_id=new_user.id, name=user.name)
        db.add(profile)
        
    db.commit()
    
    return new_user

@router.post("/login", response_model=schemas.Token)
def login(user_credentials: schemas.UserLogin, db: Session = Depends(database.get_database_session)):
    """Endpoint for user login. Generates a new token on successful login."""
    user = db.query(models.UserAccount).filter(models.UserAccount.email == user_credentials.email).first()
    
    if not user or not verify_password(user_credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Generate a new simple token on every login
    new_token = create_simple_token()
    user.token = new_token
    db.commit()
    
    return {"access_token": new_token, "token_type": "bearer", "role": user.role}

@router.get("/users/me", response_model=schemas.UserSummary)
def read_users_me(current_user: models.UserAccount = Depends(fetch_logged_in_user)):
    """Endpoint to get current user details."""
    return current_user
