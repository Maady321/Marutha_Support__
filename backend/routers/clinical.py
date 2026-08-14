from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import select
from typing import List
import uuid

from backend.database import get_db
from backend.models import User, Role, ClinicalAssignment, VitalsRecord, ConsultationNote, Prescription, TimelineEvent, TimelineEventType
from backend.schemas import ClinicalAssignmentResponse, CreateClinicalAssignmentSchema, VitalsRecordResponse, CreateVitalsRecordSchema, ConsultationNoteResponse, CreateConsultationNoteSchema, PrescriptionResponse, CreatePrescriptionSchema
from backend.auth import get_current_user

router = APIRouter(prefix="/api/v1/clinical/tools", tags=["clinical-tools"])

def require_clinician(user: User = Depends(get_current_user)):
    if user.role not in [Role.DOCTOR, Role.NURSE]:
        raise HTTPException(status_code=403, detail="Only doctors and nurses can access this endpoint")
    return user

@router.post("/assignments", response_model=ClinicalAssignmentResponse)
def assign_patient(
    payload: CreateClinicalAssignmentSchema,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_clinician)
):
    patient = db.scalar(select(User).where(User.id == payload.patientId, User.role == Role.PATIENT))
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
        
    assignment = ClinicalAssignment(
        clinicianId=current_user.id,
        patientId=payload.patientId,
        roleContext=payload.roleContext
    )
    db.add(assignment)
    db.commit()
    db.refresh(assignment)
    return assignment

@router.get("/assignments/my-patients", response_model=List[ClinicalAssignmentResponse])
def get_my_patients(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_clinician)
):
    assignments = db.scalars(select(ClinicalAssignment).where(ClinicalAssignment.clinicianId == current_user.id)).all()
    return assignments

@router.post("/vitals", response_model=VitalsRecordResponse)
def log_vitals(
    patient_id: uuid.UUID,
    payload: CreateVitalsRecordSchema,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_clinician)
):
    record = VitalsRecord(
        patientId=patient_id,
        recordedById=current_user.id,
        bloodPressure=payload.bloodPressure,
        heartRate=payload.heartRate,
        temperature=payload.temperature,
        oxygenSaturation=payload.oxygenSaturation
    )
    db.add(record)
    db.flush() # get record id
    
    # Create timeline event
    event = TimelineEvent(
        patientId=patient_id,
        authorId=current_user.id,
        eventType=TimelineEventType.VITAL,
        description=f"Vitals recorded: HR {payload.heartRate} bpm, BP {payload.bloodPressure}, Temp {payload.temperature}C, O2 {payload.oxygenSaturation}%",
        relatedEntityId=record.id
    )
    db.add(event)
    db.commit()
    db.refresh(record)
    return record

@router.post("/consultations", response_model=ConsultationNoteResponse)
def log_consultation(
    patient_id: uuid.UUID,
    payload: CreateConsultationNoteSchema,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != Role.DOCTOR:
        raise HTTPException(status_code=403, detail="Only doctors can log consultation notes")
        
    note = ConsultationNote(
        patientId=patient_id,
        doctorId=current_user.id,
        subjective=payload.subjective,
        objective=payload.objective,
        assessment=payload.assessment,
        plan=payload.plan
    )
    db.add(note)
    db.flush()
    
    event = TimelineEvent(
        patientId=patient_id,
        authorId=current_user.id,
        eventType=TimelineEventType.CONSULTATION,
        description="Doctor's Consultation Note Added",
        relatedEntityId=note.id
    )
    db.add(event)
    db.commit()
    db.refresh(note)
    return note

@router.post("/prescriptions", response_model=PrescriptionResponse)
def issue_prescription(
    patient_id: uuid.UUID,
    payload: CreatePrescriptionSchema,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != Role.DOCTOR:
        raise HTTPException(status_code=403, detail="Only doctors can issue prescriptions")
        
    prescription = Prescription(
        patientId=patient_id,
        doctorId=current_user.id,
        medicationName=payload.medicationName,
        dosage=payload.dosage,
        frequency=payload.frequency,
        durationDays=payload.durationDays
    )
    db.add(prescription)
    db.flush()
    
    event = TimelineEvent(
        patientId=patient_id,
        authorId=current_user.id,
        eventType=TimelineEventType.PRESCRIPTION,
        description=f"Prescription issued: {payload.medicationName} {payload.dosage} ({payload.frequency})",
        relatedEntityId=prescription.id
    )
    db.add(event)
    db.commit()
    db.refresh(prescription)
    return prescription
