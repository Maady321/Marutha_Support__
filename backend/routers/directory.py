from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import select
from typing import List, Optional

from backend.database import get_db
from backend.models import User, Role, DoctorProfile, HospitalProfile, VerificationStatus
from backend.schemas import DoctorDirectoryResponse, HospitalDirectoryResponse

router = APIRouter(prefix="/api/v1/directory", tags=["directory"])

@router.get("/doctors", response_model=List[DoctorDirectoryResponse])
def get_doctors_directory(
    specialty: Optional[str] = Query(None),
    accepting_patients: bool = Query(True),
    db: Session = Depends(get_db)
):
    query = select(DoctorProfile).join(User).where(User.role == Role.DOCTOR, User.verificationStatus == VerificationStatus.VERIFIED)
    
    if specialty:
        query = query.where(DoctorProfile.specialty.ilike(f"%{specialty}%"))
        
    if accepting_patients:
        query = query.where(DoctorProfile.isAcceptingPatients == True)
        
    profiles = db.scalars(query).all()
    
    # We need to map firstName and lastName from User to the response
    results = []
    for profile in profiles:
        results.append(DoctorDirectoryResponse(
            id=profile.id,
            userId=profile.userId,
            firstName=profile.user.firstName,
            lastName=profile.user.lastName,
            specialty=profile.specialty,
            hospital=profile.hospital,
            yearsOfExperience=profile.yearsOfExperience,
            bio=profile.bio,
            isAcceptingPatients=profile.isAcceptingPatients
        ))
    return results


@router.get("/hospitals", response_model=List[HospitalDirectoryResponse])
def get_hospitals_directory(
    palliative_care_only: bool = Query(False),
    db: Session = Depends(get_db)
):
    query = select(HospitalProfile).join(User).where(User.role == Role.HOSPITAL, User.verificationStatus == VerificationStatus.VERIFIED)
    
    if palliative_care_only:
        query = query.where(HospitalProfile.palliativeCareUnit == True)
        
    profiles = db.scalars(query).all()
    
    results = []
    for profile in profiles:
        results.append(HospitalDirectoryResponse(
            id=profile.id,
            userId=profile.userId,
            hospitalName=profile.hospitalName,
            contactPerson=profile.contactPerson,
            contactPhone=profile.contactPhone,
            palliativeCareUnit=profile.palliativeCareUnit
        ))
    return results
