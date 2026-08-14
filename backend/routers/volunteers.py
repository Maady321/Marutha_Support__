import uuid
from typing import Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from backend.database import get_db
from backend.models import User, VolunteerProfile, Role
from backend.schemas import UpdateVolunteerProfileSchema, VolunteerProfileResponse
from backend.auth import get_current_user, require_role
from backend.audit import log_audit

router = APIRouter(prefix="/volunteers", tags=["volunteers"])

@router.get("/me", response_model=Dict[str, VolunteerProfileResponse])
async def get_profile(
    current_user: User = Depends(require_role(Role.VOLUNTEER)),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(VolunteerProfile).where(VolunteerProfile.userId == current_user.id))
    profile = result.scalars().first()
    
    if not profile:
        profile = VolunteerProfile(
            userId=current_user.id,
            skills=[],
            totalTasksCompleted=0
        )
        db.add(profile)
        await db.flush()
        
    return {"data": profile}

@router.patch("/me", response_model=Dict[str, VolunteerProfileResponse])
async def update_profile(
    dto: UpdateVolunteerProfileSchema,
    request: Request,
    current_user: User = Depends(require_role(Role.VOLUNTEER)),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(VolunteerProfile).where(VolunteerProfile.userId == current_user.id))
    profile = result.scalars().first()
    
    update_data = dto.dict(exclude_unset=True)
    if not profile:
        profile = VolunteerProfile(
            userId=current_user.id,
            skills=update_data.get("skills", []),
            bio=update_data.get("bio"),
            totalTasksCompleted=0
        )
        db.add(profile)
    else:
        for key, val in update_data.items():
            setattr(profile, key, val)
            
    await log_audit(
        db,
        current_user.id,
        "PROFILE_UPDATED",
        request.client.host if request.client else None,
        request.headers.get("user-agent"),
        {"targetId": str(current_user.id), "targetType": "VOLUNTEER_PROFILE"}
    )
    await db.commit()
    await db.refresh(profile)
    
    return {"data": profile}
