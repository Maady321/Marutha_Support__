# FastAPI utilities for building routes and handling dependencies
from fastapi import APIRouter, Depends, HTTPException
# SQLAlchemy Session for database interaction
from sqlalchemy.orm import Session
# List type for formatting responses
from typing import List

# Import local database, models, and schemas
from backend import database, models, schemas

# Initialize the router with a prefix '/consultations' and tags for documentation
router = APIRouter(
    prefix="/consultations",
    tags=["consultations"]
)

# Endpoint to create a new doctor request (consultation)
@router.post("/", response_model=schemas.DoctorRequestDetails)
def create_new_doctor_request(request_data: schemas.DoctorRequestSetup, database_session: Session = Depends(database.get_database_session)):
    # Create a new doctor request record with default status 'PENDING'
    fresh_request = models.DoctorRequest(
        patient_id=1,           # Placeholder (In a real app, from current_user.id)
        doctor_id=request_data.doctor_id,
        notes=request_data.notes,
        appointment_time=request_data.appointment_time,
        status=models.ConsultationStatus.PENDING
    )
    database_session.add(fresh_request)
    database_session.commit()              # Save to database
    database_session.refresh(fresh_request)
    return fresh_request

# Endpoint to fetch a list of all doctor requests
@router.get("/", response_model=List[schemas.DoctorRequestDetails])
def list_all_requests(database_session: Session = Depends(database.get_database_session)):
    return database_session.query(models.DoctorRequest).all()

# Endpoint to update the status (pending, accepted, rejected) of a request
@router.put("/{request_id}/status")
def modify_request_status(request_id: int, status_update: schemas.DoctorRequestUpdate, database_session: Session = Depends(database.get_database_session)):
    # Find the doctor request record by ID
    existing_request = database_session.query(models.DoctorRequest).filter(models.DoctorRequest.id == request_id).first()
    if not existing_request:
        raise HTTPException(status_code=404, detail="Doctor request not found.")

    # Update the status field
    existing_request.status = status_update.status
    database_session.commit()              # Save changes
    return {"message": "Request status updated successfully."}
