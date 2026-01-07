from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from backend import database, models, schemas

router = APIRouter(
    prefix="/vitals",
    tags=["vitals"]
)

@router.post("/", response_model=schemas.VitalLogResponse)
def log_vitals(data: schemas.VitalLogCreate, db: Session = Depends(database.get_db)):
    new_log = models.VitalLog(
        patient_id=1,  # Placeholder
        pain_level=data.pain_level,
        mood=data.mood,
        notes=data.notes
    )
    db.add(new_log)
    db.commit()
    db.refresh(new_log)
    return new_log

@router.get("/my", response_model=List[schemas.VitalLogResponse])
def get_my_vitals(db: Session = Depends(database.get_db)):
    return db.query(models.VitalLog).filter(models.VitalLog.patient_id == 1).order_by(models.VitalLog.timestamp.desc()).all()

@router.get("/patient/{patient_id}", response_model=List[schemas.VitalLogResponse])
def get_patient_vitals(patient_id: int, db: Session = Depends(database.get_db)):
    return db.query(models.VitalLog).filter(models.VitalLog.patient_id == patient_id).order_by(models.VitalLog.timestamp.desc()).all()
