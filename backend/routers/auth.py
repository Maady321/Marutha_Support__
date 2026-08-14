import uuid
import secrets
from datetime import datetime, timedelta
from typing import Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from backend.database import get_db
from backend.models import User, Session, VerificationToken, Role, AccountStatus, VerificationStatus, TokenType
from backend.schemas import RegisterSchema, LoginSchema, ResetPasswordSchema, ForgotPasswordSchema, VerifyEmailSchema, UserResponse
from backend.auth import (
    hash_password,
    verify_password,
    create_access_token,
    set_auth_cookies,
    clear_auth_cookies,
    get_current_user,
    pwd_context
)
from backend.audit import log_audit

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(dto: RegisterSchema, request: Request, db: AsyncSession = Depends(get_db)):
    # Check existing user
    result = await db.execute(select(User).where(User.email == dto.email))
    existing = result.scalars().first()
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="AUTH_EMAIL_ALREADY_EXISTS")

    hashed = hash_password(dto.password)
    user = User(
        email=dto.email,
        passwordHash=hashed,
        firstName=dto.firstName,
        lastName=dto.lastName,
        role=dto.role,
        accountStatus=AccountStatus.PENDING_VERIFICATION,
        verificationStatus=VerificationStatus.NOT_REQUIRED
    )
    db.add(user)
    await db.flush()  # populate user.id

    # Create verification token
    verify_token_raw = secrets.token_hex(32)
    token_hash = pwd_context.hash(verify_token_raw)
    
    token = VerificationToken(
        userId=user.id,
        tokenHash=token_hash,
        type=TokenType.EMAIL_VERIFICATION,
        expiresAt=datetime.utcnow() + timedelta(hours=24)
    )
    db.add(token)
    
    await log_audit(
        db,
        user.id,
        "REGISTER",
        request.client.host if request.client else None,
        request.headers.get("user-agent")
    )
    
    client_token = f"{user.id}.{verify_token_raw}"
    print(f"\n[MOCK EMAIL] Verification Link: http://localhost:3000/verify-email?token={client_token}\n", flush=True)

    return {
        "data": {
            "id": str(user.id),
            "email": user.email,
            "firstName": user.firstName,
            "lastName": user.lastName,
            "role": user.role.value,
            "accountStatus": user.accountStatus.value
        }
    }

@router.post("/login")
async def login(dto: LoginSchema, request: Request, response: Response, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == dto.email))
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=401, detail="AUTH_INVALID_CREDENTIALS")

    if user.accountStatus in [AccountStatus.DELETED, AccountStatus.SUSPENDED]:
        raise HTTPException(status_code=403, detail="AUTH_ACCOUNT_LOCKED")
    
    if user.lockoutUntil and user.lockoutUntil > datetime.utcnow():
        raise HTTPException(status_code=403, detail="AUTH_ACCOUNT_LOCKED")

    is_valid = verify_password(dto.password, user.passwordHash)
    if not is_valid:
        attempts = user.failedLoginAttempts + 1
        user.failedLoginAttempts = attempts
        if attempts >= 5:
            user.lockoutUntil = datetime.utcnow() + timedelta(minutes=15)
        await db.commit()
        raise HTTPException(status_code=401, detail="AUTH_INVALID_CREDENTIALS")

    # Reset lockout and attempts
    user.failedLoginAttempts = 0
    user.lockoutUntil = None
    user.lastLoginAt = datetime.utcnow()

    # Create tokens
    access_token = create_access_token(str(user.id), user.role, user.email)
    refresh_token_raw = secrets.token_hex(64)
    refresh_token_hash = pwd_context.hash(refresh_token_raw)

    session = Session(
        userId=user.id,
        refreshTokenHash=refresh_token_hash,
        expiresAt=datetime.utcnow() + timedelta(days=7),
        ipAddress=request.client.host if request.client else None,
        userAgent=request.headers.get("user-agent")
    )
    db.add(session)
    await db.flush()

    set_auth_cookies(response, access_token, f"{session.id}.{refresh_token_raw}")
    
    await log_audit(
        db,
        user.id,
        "LOGIN_SUCCESS",
        request.client.host if request.client else None,
        request.headers.get("user-agent")
    )

    return {
        "data": {
            "id": str(user.id),
            "email": user.email,
            "role": user.role.value
        }
    }

@router.post("/refresh")
async def refresh(request: Request, response: Response, db: AsyncSession = Depends(get_db)):
    client_token = request.cookies.get("refresh_token")
    if not client_token:
        raise HTTPException(status_code=401, detail="UNAUTHORIZED")

    try:
        session_id_str, raw_token = client_token.split(".", 1)
        session_id = uuid.UUID(session_id_str)
    except ValueError:
        raise HTTPException(status_code=401, detail="INVALID_REFRESH_TOKEN")

    result = await db.execute(
        select(Session)
        .where(Session.id == session_id)
        .execution_options(populate_existing=True)
    )
    session = result.scalars().first()
    if not session:
        raise HTTPException(status_code=401, detail="INVALID_REFRESH_TOKEN")

    # Fetch associated user
    result_user = await db.execute(select(User).where(User.id == session.userId))
    user = result_user.scalars().first()
    if not user:
        raise HTTPException(status_code=401, detail="INVALID_REFRESH_TOKEN")

    is_valid = verify_password(raw_token, session.refreshTokenHash)
    if not is_valid:
        # Session reuse detected: delete all sessions for user
        await db.execute(select(Session).where(Session.userId == user.id))
        user_sessions = (await db.execute(select(Session).where(Session.userId == user.id))).scalars().all()
        for us in user_sessions:
            await db.delete(us)
        
        await log_audit(
            db,
            user.id,
            "TOKEN_REUSE_DETECTED",
            request.client.host if request.client else None,
            request.headers.get("user-agent")
        )
        await db.commit()
        raise HTTPException(status_code=401, detail="INVALID_REFRESH_TOKEN")

    if session.expiresAt < datetime.utcnow() or user.accountStatus == AccountStatus.DELETED:
        await db.delete(session)
        await db.commit()
        raise HTTPException(status_code=401, detail="INVALID_REFRESH_TOKEN")

    # Generate new tokens
    new_access = create_access_token(str(user.id), user.role, user.email)
    new_refresh_raw = secrets.token_hex(64)
    new_refresh_hash = pwd_context.hash(new_refresh_raw)

    new_session = Session(
        userId=user.id,
        refreshTokenHash=new_refresh_hash,
        expiresAt=datetime.utcnow() + timedelta(days=7),
        ipAddress=request.client.host if request.client else None,
        userAgent=request.headers.get("user-agent")
    )
    db.add(new_session)
    await db.delete(session)
    await db.flush()

    set_auth_cookies(response, new_access, f"{new_session.id}.{new_refresh_raw}")

    return {"message": "Token refreshed"}

@router.post("/logout")
async def logout(request: Request, response: Response, db: AsyncSession = Depends(get_db)):
    client_token = request.cookies.get("refresh_token")
    if client_token:
        try:
            session_id_str, _ = client_token.split(".", 1)
            session_id = uuid.UUID(session_id_str)
            result = await db.execute(select(Session).where(Session.id == session_id))
            session = result.scalars().first()
            if session:
                await db.delete(session)
                await db.commit()
        except ValueError:
            pass

    clear_auth_cookies(response)
    return {"message": "Logged out successfully"}

@router.post("/verify-email")
async def verify_email(dto: VerifyEmailSchema, request: Request, db: AsyncSession = Depends(get_db)):
    try:
        user_id_str, raw_token = dto.token.split(".", 1)
        user_id = uuid.UUID(user_id_str)
    except ValueError:
        raise HTTPException(status_code=400, detail="INVALID_TOKEN")

    tokens_result = await db.execute(
        select(VerificationToken).where(
            VerificationToken.userId == user_id,
            VerificationToken.type == TokenType.EMAIL_VERIFICATION
        )
    )
    tokens = tokens_result.scalars().all()

    valid_token = None
    for t in tokens:
        if verify_password(raw_token, t.tokenHash):
            valid_token = t
            break

    if not valid_token:
        raise HTTPException(status_code=400, detail="INVALID_TOKEN")
    if valid_token.expiresAt < datetime.utcnow():
        raise HTTPException(status_code=400, detail="TOKEN_EXPIRED")

    # Update User
    user_result = await db.execute(select(User).where(User.id == user_id))
    user = user_result.scalars().first()
    if not user:
        raise HTTPException(status_code=400, detail="INVALID_TOKEN")

    user.emailVerified = True
    user.accountStatus = AccountStatus.ACTIVE

    # Delete verification tokens
    for t in tokens:
        await db.delete(t)

    await log_audit(
        db,
        user.id,
        "EMAIL_VERIFIED",
        request.client.host if request.client else None,
        request.headers.get("user-agent")
    )
    await db.commit()

    return {"message": "Email verified successfully"}

@router.post("/forgot-password")
async def forgot_password(dto: ForgotPasswordSchema, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == dto.email))
    user = result.scalars().first()
    if not user:
        # Prevent enumeration
        return {"message": "If the email exists, a reset link has been sent"}

    reset_token_raw = secrets.token_hex(32)
    token_hash = pwd_context.hash(reset_token_raw)

    token = VerificationToken(
        userId=user.id,
        tokenHash=token_hash,
        type=TokenType.PASSWORD_RESET,
        expiresAt=datetime.utcnow() + timedelta(hours=1)
    )
    db.add(token)
    await db.commit()

    client_token = f"{user.id}.{reset_token_raw}"
    print(f"\n[MOCK EMAIL] Password Reset: http://localhost:3000/reset-password?token={client_token}\n", flush=True)

    return {"message": "If the email exists, a reset link has been sent"}

@router.post("/reset-password")
async def reset_password(dto: ResetPasswordSchema, request: Request, db: AsyncSession = Depends(get_db)):
    try:
        user_id_str, raw_token = dto.token.split(".", 1)
        user_id = uuid.UUID(user_id_str)
    except ValueError:
        raise HTTPException(status_code=400, detail="INVALID_TOKEN")

    tokens_result = await db.execute(
        select(VerificationToken).where(
            VerificationToken.userId == user_id,
            VerificationToken.type == TokenType.PASSWORD_RESET
        )
    )
    tokens = tokens_result.scalars().all()

    valid_token = None
    for t in tokens:
        if verify_password(raw_token, t.tokenHash):
            valid_token = t
            break

    if not valid_token:
        raise HTTPException(status_code=400, detail="INVALID_TOKEN")
    if valid_token.expiresAt < datetime.utcnow():
        raise HTTPException(status_code=400, detail="TOKEN_EXPIRED")

    # Update User password
    user_result = await db.execute(select(User).where(User.id == user_id))
    user = user_result.scalars().first()
    if not user:
        raise HTTPException(status_code=400, detail="INVALID_TOKEN")

    user.passwordHash = hash_password(dto.newPassword)
    
    # Delete token and sessions
    for t in tokens:
        await db.delete(t)

    sessions_result = await db.execute(select(Session).where(Session.userId == user_id))
    for s in sessions_result.scalars().all():
        await db.delete(s)

    await log_audit(
        db,
        user.id,
        "PASSWORD_CHANGED",
        request.client.host if request.client else None,
        request.headers.get("user-agent")
    )
    await db.commit()

    return {"message": "Password reset successfully"}

@router.get("/me", response_model=Dict[str, UserResponse])
async def me(current_user: User = Depends(get_current_user)):
    return {"data": current_user}
