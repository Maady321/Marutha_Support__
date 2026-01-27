# FastAPI utilities for building routes and handling dependencies
from fastapi import APIRouter, Depends, HTTPException
# SQLAlchemy Session for database interaction
from sqlalchemy.orm import Session
# List type for formatting responses
from typing import List

# Import local database, models, and schemas
from backend import database, models, schemas

# Initialize the router with a prefix '/vitals' and tags for documentation
router = APIRouter(
    prefix="/vitals",
    tags=["vitals"]
)

# Endpoint for a patient to log their current health status (pain, mood, etc.)
@router.post("/", response_model=schemas.HealthLogDetails)
def log_new_health_stats(entry_data: schemas.HealthLogEntry, database_session: Session = Depends(database.get_database_session)):
    # Create a new health log entry for the patient
    fresh_health_log = models.HealthLog(
        patient_id=1,           # Placeholder (In a real app, this would be current_user.id)
        pain_level=entry_data.pain_level,
        mood=entry_data.mood,
        notes=entry_data.notes
    )
    database_session.add(fresh_health_log)
    database_session.commit()      # Save to database
    database_session.refresh(fresh_health_log)
    return fresh_health_log

# Endpoint for a user to fetch their own health log history
@router.get("/my", response_model=List[schemas.HealthLogDetails])
def fetch_my_health_history(database_session: Session = Depends(database.get_database_session)):
    # Query logs for the patient (using placeholder ID 1) sorted by most recent
    history = database_session.query(models.HealthLog).filter(models.HealthLog.patient_id == 1).order_by(models.HealthLog.timestamp.desc()).all()
    return history

# Endpoint for a doctor or volunteer to see a specific patient's health logs
@router.get("/patient/{patient_id}", response_model=List[schemas.HealthLogDetails])
def fetch_patient_health_logs(patient_id: int, database_session: Session = Depends(database.get_database_session)):
    # Filter logs by the provided patient_id
    patient_logs = database_session.query(models.HealthLog).filter(models.HealthLog.patient_id == patient_id).order_by(models.HealthLog.timestamp.desc()).all()
    return patient_logs
