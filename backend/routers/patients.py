# FastAPI utilities for building routes and handling errors
from fastapi import APIRouter, Depends, HTTPException

# SQLAlchemy Session for database operations
from sqlalchemy.orm import Session

# Import local database, models, and schemas
from backend import database, models, schemas

# Import authentication dependency to get the currently logged-in user
from backend.auth import fetch_logged_in_user

# Initialize the router with a prefix '/patients' and tags for documentation
router = APIRouter(prefix="/patients", tags=["patients"])


# Endpoint to get a list of all patients
@router.get("/", response_model=list[schemas.PatientDetails])
def fetch_all_patients(
    skip: int = 0,
    limit: int = 100,
    database_session: Session = Depends(database.get_database_session),
):
    all_patients = (
        database_session.query(models.PatientProfile).offset(skip).limit(limit).all()
    )
    return all_patients


# Endpoint for a patient to see which doctors are currently online
@router.get("/online/doctors", response_model=list[schemas.DoctorDetails])
def find_available_doctors(
    database_session: Session = Depends(database.get_database_session),
    logged_in_user: models.UserAccount = Depends(fetch_logged_in_user),
):
    # Filter doctors where the 'is_online' flag is True
    available_doctors = (
        database_session.query(models.DoctorProfile)
        .filter(models.DoctorProfile.is_online == True)
        .all()
    )
    return available_doctors


# Endpoint for a patient to request a consultation with a specific doctor
@router.post("/request_doctor/{doctor_id}")
def send_help_request(
    doctor_id: int,
    database_session: Session = Depends(database.get_database_session),
    logged_in_user: models.UserAccount = Depends(fetch_logged_in_user),
):
    # Find the patient profile linked to the currently logged-in user
    patient_profile = (
        database_session.query(models.PatientProfile)
        .filter(models.PatientProfile.user_id == logged_in_user.id)
        .first()
    )
    if not patient_profile:
        raise HTTPException(
            status_code=404, detail="We couldn't find your patient profile."
        )

    # Create a new consultation record (DoctorRequest)
    new_request = models.DoctorRequest(
        patient_id=patient_profile.id,
        doctor_id=doctor_id,
        status=models.ConsultationStatus.PENDING,
        notes="Patient requested help via the app.",
    )
    database_session.add(new_request)
    database_session.commit()  # Save the request
    return {"message": "Your request has been sent to the doctor!"}


# Endpoint to get details of a specific patient by their ID
@router.get("/{patient_id}", response_model=schemas.PatientDetails)
def fetch_patient_by_id(
    patient_id: int, database_session: Session = Depends(database.get_database_session)
):
    found_patient = (
        database_session.query(models.PatientProfile)
        .filter(models.PatientProfile.id == patient_id)
        .first()
    )
    if found_patient is None:
        raise HTTPException(status_code=404, detail="Patient not found.")
    return found_patient


# Endpoint to update a patient's disease stage
@router.put("/{patient_id}")
def update_disease_progress(
    patient_id: int,
    update_data: schemas.PatientProfileSetup,
    database_session: Session = Depends(database.get_database_session),
):
    patient_to_update = (
        database_session.query(models.PatientProfile)
        .filter(models.PatientProfile.id == patient_id)
        .first()
    )
    if not patient_to_update:
        raise HTTPException(status_code=404, detail="Patient not found.")

    # Update patient fields
    patient_to_update.name = update_data.name
    patient_to_update.age = update_data.age
    patient_to_update.stage = update_data.stage
    database_session.commit()  # Save changes
    database_session.refresh(patient_to_update)
    return patient_to_update


# Endpoint to get the history of disease stages for a patient
@router.get("/{patient_id}/stages")
def fetch_stage_history(
    patient_id: int, database_session: Session = Depends(database.get_database_session)
):
    patient_profile = (
        database_session.query(models.PatientProfile)
        .filter(models.PatientProfile.id == patient_id)
        .first()
    )
    if not patient_profile:
        return {"current": "Unknown", "history": []}

    return {
        "current": patient_profile.stage,
        "history": [
            {"date": "2023-01-01", "stage": "early"},
            {"date": "2023-06-01", "stage": "mid"},
        ],
    }
