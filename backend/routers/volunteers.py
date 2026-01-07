from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from backend import database, models, schemas

router = APIRouter(
    prefix="/volunteers",
    tags=["volunteers"]
)

@router.get("/", response_model=List[schemas.VolunteerResponse])
def read_volunteers(skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
    vols = db.query(models.Volunteer).offset(skip).limit(limit).all()
    return vols

@router.get("/{volunteer_id}", response_model=schemas.VolunteerResponse)
def read_volunteer(volunteer_id: int, db: Session = Depends(database.get_db)):
    vol = db.query(models.Volunteer).filter(models.Volunteer.id == volunteer_id).first()
    if vol is None:
        raise HTTPException(status_code=404, detail="Volunteer not found")
    return vol

@router.get("/{volunteer_id}/patients", response_model=List[schemas.PatientResponse])
def get_assigned_patients(volunteer_id: int, db: Session = Depends(database.get_db)):
    patients = db.query(models.Patient).filter(models.Patient.volunteer_id == volunteer_id).all()
    return patients
