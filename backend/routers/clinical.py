# clinical.py - Clinical API Endpoints
# Handles consultations, vitals/health logs, reports, notes, and prescriptions

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List
import shutil
import os
import database, models, schemas
from auth import fetch_logged_in_user

# Create routers for each group of endpoints
consult_router = APIRouter(prefix="/consultations", tags=["Consultations"])
vitals_router = APIRouter(prefix="/vitals", tags=["Vitals"])
reports_router = APIRouter(prefix="/reports", tags=["Reports"])
notes_router = APIRouter(prefix="/notes", tags=["Notes"])
prescriptions_router = APIRouter(prefix="/prescriptions", tags=["Prescriptions"])


# =============================================
# CONSULTATION ENDPOINTS
# =============================================

@consult_router.post("/", response_model=schemas.DoctorRequestDetails)
def create_request(
    data: schemas.DoctorRequestSetup,
    db: Session = Depends(database.get_database_session),
    user: models.UserAccount = Depends(fetch_logged_in_user)
):
    """Patient creates a new consultation request to a doctor."""

    # Find the patient profile
    patient = db.query(models.PatientProfile).filter_by(user_id=user.id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Profile not found.")

    # Create the consultation request
    new_req = models.DoctorRequest(
        patient_id=patient.id,
        doctor_id=data.doctor_id,
        notes=data.notes,
        appointment_time=data.appointment_time,
        status="pending"
    )
    db.add(new_req)
    db.commit()
    db.refresh(new_req)
    return new_req


@consult_router.get("/my", response_model=List[schemas.DoctorRequestDetails])
def get_my_requests(
    db: Session = Depends(database.get_database_session),
    user: models.UserAccount = Depends(fetch_logged_in_user)
):
    """Get consultation requests for the current user."""

    requests = []

    # If user is a patient, get their requests
    if user.role == "patient":
        patient = db.query(models.PatientProfile).filter_by(user_id=user.id).first()
        if patient:
            requests = db.query(models.DoctorRequest).filter_by(patient_id=patient.id).all()

    # If user is a doctor, get requests assigned to them
    elif user.role == "doctor":
        doctor = db.query(models.DoctorProfile).filter_by(user_id=user.id).first()
        if doctor:
            requests = db.query(models.DoctorRequest).filter_by(doctor_id=doctor.id).all()

    # Build the response with patient and doctor names
    results = []
    for req in requests:
        try:
            details = schemas.DoctorRequestDetails.model_validate(req)

            # Add patient name if available
            if req.patient:
                details.patient_name = req.patient.name
                details.patient_user_id = req.patient.user_id

            # Add doctor name if available
            if req.doctor:
                details.doctor_name = req.doctor.name
                details.doctor_user_id = req.doctor.user_id

            results.append(details)
        except Exception as e:
            print("Error processing request " + str(req.id) + ": " + str(e))
            continue

    return results


# =============================================
# VITALS (HEALTH LOG) ENDPOINTS
# =============================================

@vitals_router.post("/", response_model=schemas.HealthLogDetails)
def add_health_log(
    log_data: schemas.HealthLogEntry,
    db: Session = Depends(database.get_database_session),
    user: models.UserAccount = Depends(fetch_logged_in_user)
):
    """Patient adds a new health log entry."""

    # Find patient profile
    patient = db.query(models.PatientProfile).filter_by(user_id=user.id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Profile not found.")

    # Create new health log
    new_log = models.HealthLog(
        patient_id=patient.id,
        pain_level=log_data.pain_level,
        mood=log_data.mood,
        notes=log_data.notes
    )
    db.add(new_log)
    db.commit()
    db.refresh(new_log)
    return new_log


@vitals_router.get("/my", response_model=List[schemas.HealthLogDetails])
def get_my_logs(
    db: Session = Depends(database.get_database_session),
    user: models.UserAccount = Depends(fetch_logged_in_user)
):
    """Get the current patient's health logs (newest first)."""

    patient = db.query(models.PatientProfile).filter_by(user_id=user.id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Profile not found.")

    logs = db.query(models.HealthLog).filter_by(
        patient_id=patient.id
    ).order_by(
        models.HealthLog.timestamp.desc()
    ).all()

    return logs


# =============================================
# REPORT UPLOAD ENDPOINTS
# =============================================

# Set up upload directory
if os.getenv("VERCEL"):
    UPLOAD_DIR = "/tmp/uploaded_reports"
else:
    UPLOAD_DIR = "uploaded_reports"

os.makedirs(UPLOAD_DIR, exist_ok=True)


@reports_router.post("/upload")
def upload_file(
    title: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(database.get_database_session),
    user: models.UserAccount = Depends(fetch_logged_in_user)
):
    """Upload a medical report file."""

    # Find patient profile
    patient = db.query(models.PatientProfile).filter_by(user_id=user.id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Profile not found.")

    # Save the file to disk
    physical_path = UPLOAD_DIR + "/" + file.filename
    db_relative_path = "uploaded_reports/" + file.filename

    with open(physical_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Save a record in the database
    new_report = models.MedicalReport(
        patient_id=patient.id,
        title=title,
        file_path=db_relative_path
    )
    db.add(new_report)
    db.commit()

    return {"message": "File uploaded!", "id": new_report.id}


@reports_router.get("/patient/{patient_id}", response_model=List[schemas.MedicalReportDetails])
def get_patient_reports(
    patient_id: int,
    db: Session = Depends(database.get_database_session)
):
    """Get all reports for a specific patient."""
    return db.query(models.MedicalReport).filter_by(patient_id=patient_id).all()


# =============================================
# MEDICAL NOTES ENDPOINTS
# =============================================

@notes_router.post("/", response_model=schemas.MedicalNoteDetails)
def create_note(
    data: schemas.MedicalNoteCreate,
    db: Session = Depends(database.get_database_session),
    user: models.UserAccount = Depends(fetch_logged_in_user)
):
    """Doctor creates a medical note for a patient."""

    if user.role != "doctor":
        raise HTTPException(status_code=403, detail="Only doctors can create notes.")

    doctor = db.query(models.DoctorProfile).filter_by(user_id=user.id).first()

    new_note = models.MedicalNote(
        doctor_id=doctor.id,
        patient_id=data.patient_id,
        note_content=data.note_content
    )
    db.add(new_note)
    db.commit()
    db.refresh(new_note)
    return new_note


@notes_router.get("/patient/{patient_id}", response_model=List[schemas.MedicalNoteDetails])
def get_patient_notes(
    patient_id: int,
    db: Session = Depends(database.get_database_session),
    user: models.UserAccount = Depends(fetch_logged_in_user)
):
    """Get all notes for a specific patient."""

    notes = db.query(models.MedicalNote).filter_by(patient_id=patient_id).all()

    results = []
    for n in notes:
        d = schemas.MedicalNoteDetails.model_validate(n)
        if n.patient:
            d.patient_name = n.patient.name
        if n.doctor:
            d.doctor_name = n.doctor.name
        results.append(d)

    return results


@notes_router.get("/my", response_model=List[schemas.MedicalNoteDetails])
def get_my_notes(
    db: Session = Depends(database.get_database_session),
    user: models.UserAccount = Depends(fetch_logged_in_user)
):
    """Doctor gets all their own notes."""

    if user.role != "doctor":
        raise HTTPException(status_code=403, detail="Only doctors can fetch all notes.")

    doctor = db.query(models.DoctorProfile).filter_by(user_id=user.id).first()

    notes = db.query(models.MedicalNote).filter_by(
        doctor_id=doctor.id
    ).order_by(
        models.MedicalNote.created_at.desc()
    ).all()

    results = []
    for n in notes:
        d = schemas.MedicalNoteDetails.model_validate(n)
        if n.patient:
            d.patient_name = n.patient.name
        if n.doctor:
            d.doctor_name = n.doctor.name
        results.append(d)

    return results


# =============================================
# PRESCRIPTION ENDPOINTS
# =============================================

@prescriptions_router.post("/", response_model=schemas.PrescriptionDetails)
def create_prescription(
    data: schemas.PrescriptionCreate,
    db: Session = Depends(database.get_database_session),
    user: models.UserAccount = Depends(fetch_logged_in_user)
):
    """Doctor creates a prescription for a patient."""

    if user.role != "doctor":
        raise HTTPException(status_code=403, detail="Only doctors can create prescriptions.")

    doctor = db.query(models.DoctorProfile).filter_by(user_id=user.id).first()

    new_script = models.Prescription(
        doctor_id=doctor.id,
        patient_id=data.patient_id,
        medication=data.medication,
        dosage=data.dosage,
        instructions=data.instructions
    )
    db.add(new_script)
    db.commit()
    db.refresh(new_script)
    return new_script


@prescriptions_router.get("/patient/{patient_id}", response_model=List[schemas.PrescriptionDetails])
def get_patient_prescriptions(
    patient_id: int,
    db: Session = Depends(database.get_database_session),
    user: models.UserAccount = Depends(fetch_logged_in_user)
):
    """Get all prescriptions for a specific patient."""

    scripts = db.query(models.Prescription).filter_by(patient_id=patient_id).all()

    results = []
    for s in scripts:
        d = schemas.PrescriptionDetails.model_validate(s)
        if s.patient:
            d.patient_name = s.patient.name
        if s.doctor:
            d.doctor_name = s.doctor.name
        results.append(d)

    return results


@prescriptions_router.get("/my", response_model=List[schemas.PrescriptionDetails])
def get_my_prescriptions(
    db: Session = Depends(database.get_database_session),
    user: models.UserAccount = Depends(fetch_logged_in_user)
):
    """Doctor gets all their own prescriptions."""

    if user.role != "doctor":
        raise HTTPException(status_code=403, detail="Only doctors can fetch all prescriptions.")

    doctor = db.query(models.DoctorProfile).filter_by(user_id=user.id).first()

    scripts = db.query(models.Prescription).filter_by(
        doctor_id=doctor.id
    ).order_by(
        models.Prescription.created_at.desc()
    ).all()

    results = []
    for s in scripts:
        d = schemas.PrescriptionDetails.model_validate(s)
        if s.patient:
            d.patient_name = s.patient.name
        if s.doctor:
            d.doctor_name = s.doctor.name
        results.append(d)

    return results
