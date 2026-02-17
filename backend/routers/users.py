from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from backend import database, models, schemas
from backend.auth import fetch_logged_in_user
import logging
import traceback

logger = logging.getLogger("uvicorn.error")

# Initialize routers with prefixes and tags
patients_router = APIRouter(prefix="/patients", tags=["Patients"])
doctors_router = APIRouter(prefix="/doctors", tags=["Doctors"])
volunteers_router = APIRouter(prefix="/volunteers", tags=["Volunteers"])

# Endpoint to create a new patient profile
@patients_router.post("/", response_model=schemas.PatientDetails)
def create_patient(
    profile_data: schemas.PatientProfileSetup,
    db: Session = Depends(database.get_database_session),
    user: models.UserAccount = Depends(fetch_logged_in_user),
):
    if db.query(models.PatientProfile).filter_by(user_id=user.id).first():
        raise HTTPException(status_code=400, detail="Profile already exists.")

    new_patient = models.PatientProfile(
        user_id=user.id,
        name=profile_data.name,
        age=profile_data.age,
        stage=profile_data.stage,
    )
    db.add(new_patient)
    db.commit()
    db.refresh(new_patient)
    return new_patient

# Endpoint to get all patients
@patients_router.get("/", response_model=List[schemas.PatientDetails])
def get_all_patients(db: Session = Depends(database.get_database_session)):
    return db.query(models.PatientProfile).all()

# Endpoint to get the current user's patient profile
@patients_router.get("/me", response_model=schemas.PatientDetails)
def get_my_profile(
    db: Session = Depends(database.get_database_session),
    user: models.UserAccount = Depends(fetch_logged_in_user),
):
    profile = db.query(models.PatientProfile).filter_by(user_id=user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found.")
    return profile

# Endpoint to get all online doctors
@patients_router.get("/online/doctors", response_model=List[schemas.DoctorDetails])
def get_online_doctors(db: Session = Depends(database.get_database_session)):
    return db.query(models.DoctorProfile).filter_by(is_online=True).all()

@patients_router.post("/request_doctor/{doctor_id}")
def request_doctor(
    doctor_id: int,
    db: Session = Depends(database.get_database_session),
    user: models.UserAccount = Depends(fetch_logged_in_user),
):
    patient = db.query(models.PatientProfile).filter_by(user_id=user.id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Authenticated user does not have a patient profile. Consultations can only be requested by patients.")

    # Check for existing pending request
    existing_request = db.query(models.DoctorRequest).filter_by(
        patient_id=patient.id, 
        doctor_id=doctor_id, 
        status="pending"
    ).first()
    
    if existing_request:
        raise HTTPException(status_code=400, detail="You already have a pending request with this doctor.")
    
    try:
        new_request = models.DoctorRequest(
            patient_id=patient.id,
            doctor_id=doctor_id,
            status="pending",
            notes="Help requested via app",
        )
        db.add(new_request)
        db.commit()
        return {"message": "Request sent!"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

# Endpoint to get a specific patient's details
@patients_router.get("/{patient_id}", response_model=schemas.PatientDetails)
def get_patient(patient_id: int, db: Session = Depends(database.get_database_session)):
    patient = db.query(models.PatientProfile).filter_by(id=patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found.")
    return patient

# Endpoint to get current doctor's profile
@doctors_router.get("/me", response_model=schemas.DoctorDetails)
def get_doctor_me(
    db: Session = Depends(database.get_database_session),
    user: models.UserAccount = Depends(fetch_logged_in_user)
):
    doctor = db.query(models.DoctorProfile).filter_by(user_id=user.id).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor profile not found.")
    return doctor

# Endpoint to get a specific doctor's details
@doctors_router.get("/{doctor_id}", response_model=schemas.DoctorDetails)
def get_doctor(doctor_id: int, db: Session = Depends(database.get_database_session)):
    doctor = db.query(models.DoctorProfile).filter_by(id=doctor_id).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found.")
    return doctor

# Endpoint for a doctor to update their online status
@doctors_router.post("/me/status")
def set_online_status(
    status: bool,
    db: Session = Depends(database.get_database_session),
    user: models.UserAccount = Depends(fetch_logged_in_user)
):
    doctor = db.query(models.DoctorProfile).filter_by(user_id=user.id).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor profile not found.")

    doctor.is_online = status
    db.commit()
    return {"status": "Updated", "is_online": status}

# Endpoint for a doctor to get pending requests
@doctors_router.get("/requests/pending")
def get_pending_requests(
    db: Session = Depends(database.get_database_session),
    user: models.UserAccount = Depends(fetch_logged_in_user)
):
    doctor = db.query(models.DoctorProfile).filter_by(user_id=user.id).first()
    if not doctor:
        return []

    requests = db.query(models.DoctorRequest).filter_by(
        doctor_id=doctor.id, 
        status="pending"
    ).all()
    
    # Manually populate patient_name for the response
    results = []
    for req in requests:
        # Create schema object from ORM model
        details = schemas.DoctorRequestDetails.model_validate(req)
        # Manually set patient_name if patient relationship exists
        if req.patient:
            details.patient_name = req.patient.name
            details.patient_stage = req.patient.stage
        results.append(details)
            
    return results

# Endpoint for a doctor to get accepted appointments
@doctors_router.get("/appointments")
def get_accepted_appointments(
    db: Session = Depends(database.get_database_session),
    user: models.UserAccount = Depends(fetch_logged_in_user)
):
    doctor = db.query(models.DoctorProfile).filter_by(user_id=user.id).first()
    if not doctor:
        return []

    requests = db.query(models.DoctorRequest).filter_by(
        doctor_id=doctor.id, 
        status="accepted"
    ).all()
    
    results = []
    for req in requests:
        details = schemas.DoctorRequestDetails.model_validate(req)
        if req.patient:
            details.patient_name = req.patient.name
            details.patient_stage = req.patient.stage
        results.append(details)
            
    return results

# Endpoint for a doctor to accept a request
@doctors_router.post("/requests/{request_id}/accept")
def accept_request(
    request_id: int,
    db: Session = Depends(database.get_database_session),
    user: models.UserAccount = Depends(fetch_logged_in_user)
):
    request = db.query(models.DoctorRequest).get(request_id)
    if not request:
        raise HTTPException(status_code=404, detail="Request not found.")
    
    request.status = "accepted"
    db.commit()
    return {"status": "Accepted"}

# Endpoint for a volunteer profile
@volunteers_router.get("/me", response_model=schemas.VolunteerDetails)
def get_volunteer_me(
    db: Session = Depends(database.get_database_session),
    user: models.UserAccount = Depends(fetch_logged_in_user)
):
    volunteer = db.query(models.VolunteerProfile).filter_by(user_id=user.id).first()
    if not volunteer:
        raise HTTPException(status_code=404, detail="Volunteer profile not found.")
    return volunteer
