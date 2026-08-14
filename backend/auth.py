import uuid
import hmac
from datetime import datetime, timedelta
from typing import Optional, List
import jwt
from fastapi import Request, HTTPException, Depends, Response
from passlib.context import CryptContext
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from backend.config import settings
from backend.database import get_db
from backend.models import User, Role

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(password: str, hashed: str) -> bool:
    return pwd_context.verify(password, hashed)

def create_access_token(user_id: str, role: Role, email: str) -> str:
    expire = datetime.utcnow() + timedelta(minutes=15)
    payload = {
        "sub": str(user_id),
        "role": str(role.value),
        "email": email,
        "exp": expire
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm="HS256")

def set_auth_cookies(response: Response, access_token: str, refresh_token: str):
    is_prod = settings.NODE_ENV == "production"
    
    # Access Token (15 mins)
    response.set_cookie(
        key="access_token",
        value=access_token,
        max_age=15 * 60,
        expires=15 * 60,
        path="/",
        domain=None,
        secure=is_prod,
        httponly=True,
        samesite="strict"
    )
    
    # Refresh Token (7 days)
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        max_age=7 * 24 * 60 * 60,
        expires=7 * 24 * 60 * 60,
        path="/api/v1/auth/refresh",
        domain=None,
        secure=is_prod,
        httponly=True,
        samesite="strict"
    )
    
    # CSRF Token (7 days, readable by client-side JS)
    csrf_token = str(uuid.uuid4())
    response.set_cookie(
        key="csrf_token",
        value=csrf_token,
        max_age=7 * 24 * 60 * 60,
        expires=7 * 24 * 60 * 60,
        path="/",
        domain=None,
        secure=is_prod,
        httponly=False,
        samesite="strict"
    )

def clear_auth_cookies(response: Response):
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/api/v1/auth/refresh")
    response.delete_cookie("csrf_token", path="/")

CSRF_EXEMPT_PATHS = {
    "/api/v1/auth/register",
    "/api/v1/auth/login",
    "/api/v1/auth/verify-email",
    "/api/v1/auth/forgot-password",
    "/api/v1/auth/reset-password",
}

async def verify_csrf(request: Request):
    if request.method in ["POST", "PATCH", "DELETE", "PUT"]:
        # Skip CSRF for public auth endpoints (no session/cookie exists yet)
        if request.url.path in CSRF_EXEMPT_PATHS:
            return
        cookie_csrf = request.cookies.get("csrf_token")
        header_csrf = request.headers.get("x-csrf-token")
        if not cookie_csrf or not header_csrf or not hmac.compare_digest(cookie_csrf, header_csrf):
            raise HTTPException(status_code=403, detail="CSRF token validation failed")

async def get_current_user(request: Request, db: AsyncSession = Depends(get_db)) -> User:
    access_token = request.cookies.get("access_token")
    if not access_token:
        raise HTTPException(status_code=401, detail="UNAUTHORIZED")
    try:
        payload = jwt.decode(access_token, settings.JWT_SECRET, algorithms=["HS256"])
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="UNAUTHORIZED")
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="UNAUTHORIZED")
        
    uid = uuid.UUID(user_id)
    result = await db.execute(select(User).where(User.id == uid))
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=401, detail="UNAUTHORIZED")
        
    if user.accountStatus in ["DELETED", "SUSPENDED"]:
        raise HTTPException(status_code=403, detail="AUTH_ACCOUNT_LOCKED")
        
    # Check lock-out status
    if user.lockoutUntil and user.lockoutUntil > datetime.utcnow():
        raise HTTPException(status_code=403, detail="AUTH_ACCOUNT_LOCKED")
        
    return user

def require_role(*roles: Role):
    async def dependency(user: User = Depends(get_current_user)):
        if user.role not in roles:
            raise HTTPException(status_code=403, detail="FORBIDDEN")
        return user
    return dependency
