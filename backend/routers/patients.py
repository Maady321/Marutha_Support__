import uuid
from typing import Dict, Any
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from backend.database import get_db
from backend.models import User, PatientProfile, Role
from backend.schemas import UpdatePatientProfileSchema, PatientProfileResponse
from backend.auth import get_current_user, require_role
from backend.audit import log_audit

router = APIRouter(prefix="/patients", tags=["patients"])

@router.get("/me", response_model=Dict[str, PatientProfileResponse])
async def get_profile(
    current_user: User = Depends(require_role(Role.PATIENT)),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(PatientProfile).where(PatientProfile.userId == current_user.id))
    profile = result.scalars().first()
    
    if not profile:
        profile = PatientProfile(userId=current_user.id)
        db.add(profile)
        await db.flush()
        
    return {"data": profile}

@router.patch("/me", response_model=Dict[str, PatientProfileResponse])
async def update_profile(
    dto: UpdatePatientProfileSchema,
    request: Request,
    current_user: User = Depends(require_role(Role.PATIENT)),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(PatientProfile).where(PatientProfile.userId == current_user.id))
    profile = result.scalars().first()
    
    update_data = dto.dict(exclude_unset=True)
    
    # Parse dateOfBirth string if provided
    dob = None
    if "dateOfBirth" in update_data and update_data["dateOfBirth"]:
        try:
            dob = date.fromisoformat(update_data["dateOfBirth"])
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid date format for dateOfBirth. Use YYYY-MM-DD.")
            
    if not profile:
        profile = PatientProfile(
            userId=current_user.id,
            dateOfBirth=dob,
            gender=update_data.get("gender"),
            medicalNotes=update_data.get("medicalNotes"),
            emergencyContactName=update_data.get("emergencyContactName"),
            emergencyContactPhone=update_data.get("emergencyContactPhone"),
            emergencyContactRelationship=update_data.get("emergencyContactRelationship")
        )
        db.add(profile)
    else:
        for key, val in update_data.items():
            if key == "dateOfBirth":
                profile.dateOfBirth = dob
            else:
                setattr(profile, key, val)
                
    await log_audit(
        db,
        current_user.id,
        "PROFILE_UPDATED",
        request.client.host if request.client else None,
        request.headers.get("user-agent"),
        {"targetId": str(current_user.id), "targetType": "PATIENT_PROFILE"}
    )
    await db.commit()
    await db.refresh(profile)
    
    return {"data": profile}
