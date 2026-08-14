import uuid
from typing import Dict, Optional
from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from backend.database import get_db
from backend.models import User, Session, AccountStatus
from backend.schemas import UpdateUserSchema, UserResponse
from backend.auth import get_current_user, clear_auth_cookies
from backend.audit import log_audit

router = APIRouter(prefix="/users", tags=["users"])

class PreferencesUpdateSchema(BaseModel):
    emailNotificationsEnabled: Optional[bool] = None

@router.get("/me", response_model=Dict[str, UserResponse])
async def get_profile(current_user: User = Depends(get_current_user)):
    return {"data": current_user}

@router.patch("/me", response_model=Dict[str, UserResponse])
async def update_profile(
    dto: UpdateUserSchema,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Update only fields provided
    update_data = dto.dict(exclude_unset=True)
    for key, val in update_data.items():
        setattr(current_user, key, val)

    await log_audit(
        db,
        current_user.id,
        "PROFILE_UPDATED",
        request.client.host if request.client else None,
        request.headers.get("user-agent"),
        {"targetId": str(current_user.id), "targetType": "USER"}
    )
    await db.commit()
    # Refresh to ensure object is fully updated
    await db.refresh(current_user)
    
    return {"data": current_user}

@router.patch("/me/preferences", response_model=Dict[str, UserResponse])
async def update_preferences(
    dto: PreferencesUpdateSchema,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if dto.emailNotificationsEnabled is not None:
        current_user.emailNotificationsEnabled = dto.emailNotificationsEnabled
        
        await log_audit(
            db,
            current_user.id,
            "PREFERENCES_UPDATED",
            request.client.host if request.client else None,
            request.headers.get("user-agent"),
            {"targetId": str(current_user.id), "targetType": "USER", "action": "Update Preferences"}
        )
        await db.commit()
        await db.refresh(current_user)

    return {"data": current_user}

@router.delete("/me")
async def deactivate_account(
    request: Request,
    response: Response,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    current_user.accountStatus = AccountStatus.DEACTIVATED
    
    # Invalidate sessions
    sessions_result = await db.execute(select(Session).where(Session.userId == current_user.id))
    for s in sessions_result.scalars().all():
        await db.delete(s)
        
    await log_audit(
        db,
        current_user.id,
        "ACCOUNT_STATUS_CHANGED",
        request.client.host if request.client else None,
        request.headers.get("user-agent"),
        {"targetId": str(current_user.id), "targetType": "USER", "newStatus": AccountStatus.DEACTIVATED.value}
    )
    
    await db.commit()
    clear_auth_cookies(response)
    
    return {"message": "Account deactivated"}
