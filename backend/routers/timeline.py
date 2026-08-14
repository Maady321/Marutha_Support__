from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import select
from typing import List
import uuid

from backend.database import get_db
from backend.models import User, TimelineEvent, Role, TimelineEventType
from backend.schemas import TimelineEventResponse, CreateTimelineEventSchema
from backend.auth import get_current_user

router = APIRouter(prefix="/api/v1/clinical/timeline", tags=["timeline"])

@router.get("/{patient_id}", response_model=List[TimelineEventResponse])
def get_timeline(
    patient_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Todo: Add permission checking (is doctor, nurse, linked caregiver, or the patient themselves)
    events = db.scalars(
        select(TimelineEvent)
        .where(TimelineEvent.patientId == patient_id)
        .order_by(TimelineEvent.timestamp.desc())
    ).all()
    return events

@router.post("/{patient_id}", response_model=TimelineEventResponse)
def add_timeline_event(
    patient_id: uuid.UUID,
    payload: CreateTimelineEventSchema,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Allow doctors and nurses to add events
    if current_user.role not in [Role.DOCTOR, Role.NURSE, Role.ADMIN]:
        raise HTTPException(status_code=403, detail="Not authorized to add clinical timeline events")

    patient = db.scalar(select(User).where(User.id == patient_id, User.role == Role.PATIENT))
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    event = TimelineEvent(
        patientId=patient_id,
        authorId=current_user.id,
        eventType=payload.eventType,
        description=payload.description,
        relatedEntityId=payload.relatedEntityId
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    return event
