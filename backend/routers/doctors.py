# FastAPI utilities for building routes and handling errors
from fastapi import APIRouter, Depends, HTTPException
# SQLAlchemy Session for database operations
from sqlalchemy.orm import Session
# List type for response modeling
from typing import List

# Import local database, models, and schemas
from backend import database, models, schemas
# Import authentication dependency to get the currently logged-in user
from backend.auth import fetch_logged_in_user

# Initialize the router with a prefix '/doctors' and tags for documentation
router = APIRouter(
    prefix="/doctors",
    tags=["doctors"]
)

# Endpoint to get a list of all doctors
@router.get("/", response_model=List[schemas.DoctorDetails])
def list_all_doctors(skip: int = 0, limit: int = 100, database_session: Session = Depends(database.get_database_session)):
    all_doctors = database_session.query(models.DoctorProfile).offset(skip).limit(limit).all()
    return all_doctors

# Endpoint to get details of a specific doctor by their ID
@router.get("/{doctor_id}", response_model=schemas.DoctorDetails)
def fetch_doctor_details(doctor_id: int, database_session: Session = Depends(database.get_database_session)):
    doctor_profile = database_session.query(models.DoctorProfile).filter(models.DoctorProfile.id == doctor_id).first()
    if doctor_profile is None:
        raise HTTPException(status_code=404, detail="Doctor not found.")
    return doctor_profile

# Endpoint for a doctor to toggle their online status (True = Online, False = Offline)
@router.post("/me/status")
def update_online_availability(status: bool, database_session: Session = Depends(database.get_database_session), logged_in_user: models.UserAccount = Depends(fetch_logged_in_user)):
    # Find the doctor profile linked to the logged-in user
    doctor_profile = database_session.query(models.DoctorProfile).filter(models.DoctorProfile.user_id == logged_in_user.id).first()
    if not doctor_profile:
        raise HTTPException(status_code=404, detail="Doctor profile not found.")

    # Update the online flag
    doctor_profile.is_online = status
    database_session.commit()      # Save change
    return {"status": "Updated!", "is_online": status}

# Endpoint for a doctor to see all 'PENDING' help requests sent to them
@router.get("/requests/pending")
def fetch_pending_requests(database_session: Session = Depends(database.get_database_session), logged_in_user: models.UserAccount = Depends(fetch_logged_in_user)):
    doctor_profile = database_session.query(models.DoctorProfile).filter(models.DoctorProfile.user_id == logged_in_user.id).first()
    if not doctor_profile:
        return []

    # Filter requests by doctor ID and 'PENDING' status
    pending_requests = database_session.query(models.DoctorRequest).filter(
        models.DoctorRequest.doctor_id == doctor_profile.id,
        models.DoctorRequest.status == models.ConsultationStatus.PENDING
    ).all()
    return pending_requests

# Endpoint for a doctor to accept a specific help request
@router.post("/requests/{request_id}/accept")
def accept_patient_request(request_id: int, database_session: Session = Depends(database.get_database_session), logged_in_user: models.UserAccount = Depends(fetch_logged_in_user)):
    doctor_profile = database_session.query(models.DoctorProfile).filter(models.DoctorProfile.user_id == logged_in_user.id).first()
    if not doctor_profile:
        raise HTTPException(status_code=403, detail="Only doctors can perform this action.")

    # Find the request
    help_request = database_session.query(models.DoctorRequest).filter(models.DoctorRequest.id == request_id).first()
    if not help_request:
        raise HTTPException(status_code=404, detail="Help request not found.")

    # Update request status to 'ACCEPTED'
    help_request.status = models.ConsultationStatus.ACCEPTED

    # Link the doctor to the patient profile
    patient_profile = database_session.query(models.PatientProfile).filter(models.PatientProfile.id == help_request.patient_id).first()
    if patient_profile:
        patient_profile.doctor_id = doctor_profile.id

    database_session.commit()      # Save all changes
    return {"message": "You have accepted the request!"}

# Endpoint to get all patients assigned to a specific doctor
@router.get("/{doctor_id}/patients", response_model=List[schemas.PatientDetails])
def fetch_my_assigned_patients(doctor_id: int, database_session: Session = Depends(database.get_database_session)):
    assigned_patients = database_session.query(models.PatientProfile).filter(models.PatientProfile.doctor_id == doctor_id).all()
    return assigned_patients

# Endpoint for a doctor to assign a volunteer to a specific patient
@router.post("/assign_volunteer")
def link_volunteer_to_patient(assignment_data: dict, database_session: Session = Depends(database.get_database_session), logged_in_user: models.UserAccount = Depends(fetch_logged_in_user)):
    patient_id = assignment_data.get("patient_id")
    volunteer_id = assignment_data.get("volunteer_id")

    # Find the patient and update their volunteer_id
    patient_profile = database_session.query(models.PatientProfile).filter(models.PatientProfile.id == patient_id).first()
    if patient_profile:
        patient_profile.volunteer_id = volunteer_id
        database_session.commit()

    return {"message": "Volunteer successfully assigned to the patient."}
