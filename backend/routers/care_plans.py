from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import select
from typing import List
import uuid

from backend.database import get_db
from backend.models import User, CarePlan, Role, CarePlanStatus
from backend.schemas import CarePlanResponse, CreateCarePlanSchema
from backend.auth import get_current_user

router = APIRouter(prefix="/api/v1/clinical/care-plans", tags=["care-plans"])

@router.get("/{patient_id}", response_model=List[CarePlanResponse])
def get_care_plans(
    patient_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Todo: permissions check
    plans = db.scalars(
        select(CarePlan)
        .where(CarePlan.patientId == patient_id)
        .order_by(CarePlan.createdAt.desc())
    ).all()
    return plans

@router.post("/{patient_id}", response_model=CarePlanResponse)
def create_care_plan(
    patient_id: uuid.UUID,
    payload: CreateCarePlanSchema,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in [Role.DOCTOR, Role.NURSE, Role.ADMIN]:
        raise HTTPException(status_code=403, detail="Not authorized to create care plans")

    patient = db.scalar(select(User).where(User.id == patient_id, User.role == Role.PATIENT))
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    plan = CarePlan(
        patientId=patient_id,
        authorId=current_user.id,
        status=CarePlanStatus.DRAFT,
        reviewDate=payload.reviewDate,
        goals=payload.goals,
        notes=payload.notes
    )
    db.add(plan)
    db.commit()
    db.refresh(plan)
    return plan
