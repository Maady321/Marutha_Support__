import uuid
from typing import Dict, Any, List
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from backend.database import get_db
from backend.models import User, DoctorProfile, Role, VerificationStatus
from backend.schemas import UpdateDoctorProfileSchema, DoctorProfileResponse
from backend.auth import get_current_user, require_role
from backend.audit import log_audit

router = APIRouter(prefix="/doctors", tags=["doctors"])

@router.get("")
async def get_public_doctors(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(User)
        .options(selectinload(User.doctorProfile))
        .where(
            User.role == Role.DOCTOR,
            User.verificationStatus == VerificationStatus.APPROVED
        )
    )
    users = result.scalars().all()
    
    data = []
    for u in users:
        dp = u.doctorProfile
        data.append({
            "id": str(u.id),
            "firstName": u.firstName,
            "lastName": u.lastName,
            "avatarUrl": u.avatarUrl,
            "doctorProfile": {
                "specialty": dp.specialty if dp else "",
                "hospital": dp.hospital if dp else None,
                "yearsOfExperience": dp.yearsOfExperience if dp else None,
                "isAcceptingPatients": dp.isAcceptingPatients if dp else True,
                "bio": dp.bio if dp else None,
                "qualifications": dp.qualifications if dp else None
            }
        })
        
    return {"data": data}

@router.get("/me", response_model=Dict[str, DoctorProfileResponse])
async def get_profile(
    current_user: User = Depends(require_role(Role.DOCTOR)),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(DoctorProfile).where(DoctorProfile.userId == current_user.id))
    profile = result.scalars().first()
    
    if not profile:
        profile = DoctorProfile(
            userId=current_user.id,
            specialty="",
            licenseNumber="",
            isAcceptingPatients=True
        )
        db.add(profile)
        await db.flush()
        
    return {"data": profile}

@router.patch("/me", response_model=Dict[str, DoctorProfileResponse])
async def update_profile(
    dto: UpdateDoctorProfileSchema,
    request: Request,
    current_user: User = Depends(require_role(Role.DOCTOR)),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(DoctorProfile).where(DoctorProfile.userId == current_user.id))
    profile = result.scalars().first()
    
    update_data = dto.dict(exclude_unset=True)
    if not profile:
        profile = DoctorProfile(
            userId=current_user.id,
            specialty=update_data.get("specialty", ""),
            licenseNumber=update_data.get("licenseNumber", ""),
            bio=update_data.get("bio"),
            qualifications=update_data.get("qualifications"),
            hospital=update_data.get("hospital"),
            yearsOfExperience=update_data.get("yearsOfExperience"),
            isAcceptingPatients=update_data.get("isAcceptingPatients", True)
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
        {"targetId": str(current_user.id), "targetType": "DOCTOR_PROFILE"}
    )
    await db.commit()
    await db.refresh(profile)
    
    return {"data": profile}

@router.get("/{id}")
async def get_public_doctor_profile(id: str, db: AsyncSession = Depends(get_db)):
    try:
        doc_id = uuid.UUID(id)
    except ValueError:
        raise HTTPException(status_code=404, detail="Doctor not found or not verified")
        
    result = await db.execute(
        select(User)
        .options(selectinload(User.doctorProfile))
        .where(
            User.id == doc_id,
            User.role == Role.DOCTOR,
            User.verificationStatus == VerificationStatus.APPROVED
        )
    )
    u = result.scalars().first()
    if not u:
        raise HTTPException(status_code=404, detail="Doctor not found or not verified")
        
    dp = u.doctorProfile
    return {
        "data": {
            "id": str(u.id),
            "firstName": u.firstName,
            "lastName": u.lastName,
            "avatarUrl": u.avatarUrl,
            "doctorProfile": {
                "specialty": dp.specialty if dp else "",
                "hospital": dp.hospital if dp else None,
                "yearsOfExperience": dp.yearsOfExperience if dp else None,
                "isAcceptingPatients": dp.isAcceptingPatients if dp else True,
                "bio": dp.bio if dp else None,
                "qualifications": dp.qualifications if dp else None
            }
        }
    }
