# Standard libraries for time management and optional types
from datetime import datetime, timedelta, timezone
from typing import Optional

# FastAPI utilities for building routes, injecting dependencies, and handling errors
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
# 'jose' for JWT (JSON Web Token) creation and decoding
from jose import JWTError, jwt
# SQLAlchemy's Session type for database interaction
from sqlalchemy.orm import Session

# Import local modules for database schema and models
from backend import database, models, schemas
# Passlib for secure password hashing
from passlib.context import CryptContext

# Configure bcrypt as the hashing algorithm for passwords
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Security constants (In production, the SECRET_KEY should be in an environment variable)
SECRET_KEY = "marutha_secret_key_change_me_in_production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 300  # Token valid for 5 hours

# Initialize the router for all authentication endpoints
router = APIRouter(tags=["Authentication"])

# Define the security scheme: OAuth2 using password bearer tokens
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token", auto_error=False)


# Utility to compare a plain password with its hashed version in the database
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)


# Utility to securely hash a new password before storing it
def get_password_hash(password):
    return pwd_context.hash(password)


# Utility to create a JSON Web Token (JWT) for a user after successful login
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=15)
    to_encode.update({"exp": expire})  # Add expiration time to the token
    # Sign the token using the secret key and algorithm
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


# this helper function looks at the "identity card" (JWT token) a user sends
# and finds out exactly who they are in our database
async def fetch_logged_in_user(
    request: Request,
    token: Optional[str] = Depends(oauth2_scheme),
    database_session: Session = Depends(database.get_database_session)
):
    login_error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="We couldn't verify your identity. Please log in again.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    # Try getting token from cookie if not in header
    if not token:
        token = request.cookies.get("access_token")
        # If the cookie has "Bearer " prefix, strip it (optional, but good safety)
        if token and token.startswith("Bearer "):
            token = token[7:]
    
    if not token:
        raise login_error

    try:
        # decode the token to read the information inside
        token_payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_email: str = token_payload.get("sub") # 'sub' is standard for subject/email
        if user_email is None:
            raise login_error
        
        # save the identity info into a simple container
        identity_info = schemas.TokenData(username=user_email)
    except JWTError:
        raise login_error

    # now, look up the user in our database using their email
    verified_user = database_session.query(models.UserAccount).filter(models.UserAccount.email == identity_info.username).first()
    if verified_user is None:
        raise login_error
    
    # return the full user record
    return verified_user


# endpoint: this is called when a user types their email/password and clicks "Login"
@router.post("/token", response_model=schemas.Token)
async def handle_user_login(login_form: OAuth2PasswordRequestForm = Depends(), database_session: Session = Depends(database.get_database_session)):
    # 1. try to find the user in our records
    matching_user = database_session.query(models.UserAccount).filter(models.UserAccount.email == login_form.username).first()
    
    # 2. check if the user exists AND if the password is correct
    if not matching_user or not verify_password(login_form.password, matching_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="The email or password you entered is incorrect.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # 3. decide how long the login should last (300 minutes in this case)
    login_duration = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    # 4. create the "identity card" (Access Token)
    identity_card = create_access_token(
        data={"sub": matching_user.email, "role": matching_user.role, "id": matching_user.id},
        expires_delta=login_duration
    )
    
    # 5. send the token back to the user's browser
    return {"access_token": identity_card, "token_type": "bearer"}


# endpoint: this is called when a new user wants to join the platform
@router.post("/register", response_model=schemas.UserSummary)
def create_new_account(new_user_stats: schemas.UserRegistration, database_session: Session = Depends(database.get_database_session)):
    # 1. check if someone is already using this email
    existing_user = database_session.query(models.UserAccount).filter(models.UserAccount.email == new_user_stats.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="This email is already registered. Try logging in!")

    # 2. scramble the password so it's safe to store
    protected_password = get_password_hash(new_user_stats.password)
    
    # 3. bundle up the user's information
    fresh_user_account = models.UserAccount(
        email=new_user_stats.email,
        hashed_password=protected_password,
        role=new_user_stats.role,
        is_active=True
    )
    
    # 4. save to the database
    database_session.add(fresh_user_account)
    database_session.commit()
    database_session.refresh(fresh_user_account)
    
    return fresh_user_account
