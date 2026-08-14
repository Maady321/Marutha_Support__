from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import select
from typing import List
import uuid

from backend.database import get_db
from backend.models import User, Role, CaregiverPatientLink, CaregiverPermission, FamilyRelationshipStatus, PatientProfile
from backend.schemas import CaregiverPatientLinkResponse, LinkPatientSchema
from backend.auth import get_current_user

router = APIRouter(prefix="/api/v1/caregivers", tags=["caregivers"])

def require_caregiver(user: User = Depends(get_current_user)):
    if user.role != Role.CAREGIVER:
        raise HTTPException(status_code=403, detail="Only caregivers can access this endpoint")
    return user

@router.post("/link-patient", response_model=CaregiverPatientLinkResponse)
def link_to_patient(
    payload: LinkPatientSchema,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_caregiver)
):
    try:
        patient_id = uuid.UUID(payload.inviteCode)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid invite code format. Must be patient UUID.")

    patient = db.scalar(select(User).where(User.id == patient_id, User.role == Role.PATIENT))
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    existing = db.scalar(select(CaregiverPatientLink).where(
        CaregiverPatientLink.caregiverId == current_user.id,
        CaregiverPatientLink.patientId == patient_id
    ))
    if existing:
        raise HTTPException(status_code=400, detail="Already linked to this patient")

    link = CaregiverPatientLink(
        caregiverId=current_user.id,
        patientId=patient_id,
        permissions=[CaregiverPermission.MEDICAL_VIEW.value, CaregiverPermission.COMMUNICATION_ONLY.value],
        status=FamilyRelationshipStatus.ACTIVE
    )
    db.add(link)
    db.commit()
    db.refresh(link)
    return link

@router.get("/patients")
def get_linked_patients(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_caregiver)
):
    links = db.scalars(select(CaregiverPatientLink).where(
        CaregiverPatientLink.caregiverId == current_user.id,
        CaregiverPatientLink.status == FamilyRelationshipStatus.ACTIVE
    )).all()
    
    result = []
    for link in links:
        patient = link.patient
        result.append({
            "linkId": link.id,
            "patientId": patient.id,
            "firstName": patient.firstName,
            "lastName": patient.lastName,
            "permissions": link.permissions,
            "linkedAt": link.linkedAt or link.createdAt
        })
    return {"data": result}
