# FastAPI utilities for building routes and handling dependencies
from fastapi import APIRouter, Depends, HTTPException
# SQLAlchemy Session for database interaction
from sqlalchemy.orm import Session
# List type for formatting responses
from typing import List

# Import local database, models, and schemas
from backend import database, models, schemas

# Initialize the router with a prefix '/volunteers' and tags for documentation
router = APIRouter(
    prefix="/volunteers",
    tags=["volunteers"]
)

# Endpoint to get a list of all volunteers
@router.get("/", response_model=List[schemas.VolunteerDetails])
def list_all_volunteers(skip: int = 0, limit: int = 100, database_session: Session = Depends(database.get_database_session)):
    all_volunteers = database_session.query(models.VolunteerProfile).offset(skip).limit(limit).all()
    return all_volunteers

# Endpoint to get details of a specific volunteer by their ID
@router.get("/{volunteer_id}", response_model=schemas.VolunteerDetails)
def fetch_volunteer_profile(volunteer_id: int, database_session: Session = Depends(database.get_database_session)):
    volunteer_profile = database_session.query(models.VolunteerProfile).filter(models.VolunteerProfile.id == volunteer_id).first()
    if volunteer_profile is None:
        raise HTTPException(status_code=404, detail="Volunteer not found.")
    return volunteer_profile

# Endpoint to see all patients who have been assigned to this specific volunteer
@router.get("/{volunteer_id}/patients", response_model=List[schemas.PatientDetails])
def list_assigned_patients(volunteer_id: int, database_session: Session = Depends(database.get_database_session)):
    # Filter patients where the 'volunteer_id' matches the provided ID
    assigned_patients = database_session.query(models.PatientProfile).filter(models.PatientProfile.volunteer_id == volunteer_id).all()
    return assigned_patients
