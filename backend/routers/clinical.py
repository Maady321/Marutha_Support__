from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form  # Import FastAPI modules
from sqlalchemy.orm import Session  # Import Session for database operations
from typing import List  # Import List for type hinting
import shutil, os  # Import shutil and os for file operations
import database, models, schemas  # Import backend modules
from auth import fetch_logged_in_user  # Import auth dependency

# Initialize routers for consultations, vitals, and reports
consult_router = APIRouter(prefix="/consultations", tags=["Consultations"])
vitals_router = APIRouter(prefix="/vitals", tags=["Vitals"])
reports_router = APIRouter(prefix="/reports", tags=["Reports"])
notes_router = APIRouter(prefix="/notes", tags=["Notes"])
prescriptions_router = APIRouter(prefix="/prescriptions", tags=["Prescriptions"])

# Endpoint to create a new consultation request
@consult_router.post("/", response_model=schemas.DoctorRequestDetails)
def create_request(
    data: schemas.DoctorRequestSetup,  # Input data for the request
    db: Session = Depends(database.get_database_session),  # Database dependency
    user: models.UserAccount = Depends(fetch_logged_in_user)  # User dependency
):
    # Find the patient profile linked to the user
    patient = db.query(models.PatientProfile).filter_by(user_id=user.id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Profile not found.")

    # Create a new DoctorRequest entry
    new_req = models.DoctorRequest(
        patient_id=patient.id,
        doctor_id=data.doctor_id,
        notes=data.notes,
        appointment_time=data.appointment_time, 
        status="pending"
    )
    db.add(new_req)  # Add to session
    db.commit()  # Commit transaction
    db.refresh(new_req)  # Refresh object
    return new_req  # Return created request

# Endpoint to get requests associated with the current user
@consult_router.get("/my", response_model=List[schemas.DoctorRequestDetails])
def get_my_requests(
    db: Session = Depends(database.get_database_session),
    user: models.UserAccount = Depends(fetch_logged_in_user)
):
    # If user is a patient, return their requests
    requests = []
    if user.role == "patient":
        patient = db.query(models.PatientProfile).filter_by(user_id=user.id).first()
        if patient:
            requests = db.query(models.DoctorRequest).filter_by(patient_id=patient.id).all()
    
    # If user is a doctor, return requests assigned to them
    elif user.role == "doctor":
        doctor = db.query(models.DoctorProfile).filter_by(user_id=user.id).first()
        if doctor:
            requests = db.query(models.DoctorRequest).filter_by(doctor_id=doctor.id).all()
            
    results = []
    for req in requests:
        try:
            details = schemas.DoctorRequestDetails.model_validate(req)
            if req.patient:
                details.patient_name = req.patient.name
                details.patient_user_id = req.patient.user_id
            if req.doctor:
                details.doctor_name = req.doctor.name
                details.doctor_user_id = req.doctor.user_id
            results.append(details)
        except Exception as e:
            # Skip invalid entries or log error safely
            print(f"Error processing request {req.id}: {e}")
            continue
    
    return results

# Endpoint to add a health log (vitals)
@vitals_router.post("/", response_model=schemas.HealthLogDetails)
def add_health_log(
    log_data: schemas.HealthLogEntry,  # Input data for health log
    db: Session = Depends(database.get_database_session),
    user: models.UserAccount = Depends(fetch_logged_in_user)
):
    # Get patient profile
    patient = db.query(models.PatientProfile).filter_by(user_id=user.id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Profile not found.")

    # Create new health log entry
    new_log = models.HealthLog(
        patient_id=patient.id,
        pain_level=log_data.pain_level,
        mood=log_data.mood,
        notes=log_data.notes
    )
    db.add(new_log)  # Add to session
    db.commit()  # Commit to DB
    db.refresh(new_log)  # Refresh data
    return new_log  # Return created log

# Endpoint to get the current patient's health logs
@vitals_router.get("/my", response_model=List[schemas.HealthLogDetails])
def get_my_logs(
    db: Session = Depends(database.get_database_session),
    user: models.UserAccount = Depends(fetch_logged_in_user)
):
    patient = db.query(models.PatientProfile).filter_by(user_id=user.id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Profile not found.")

    # Return logs ordered by timestamp descending
    return db.query(models.HealthLog).filter_by(patient_id=patient.id).order_by(models.HealthLog.timestamp.desc()).all()

# Ensure the upload directory exists
os.makedirs("uploaded_reports", exist_ok=True)

# Endpoint to upload a medical report
@reports_router.post("/upload")
def upload_file(
    title: str = Form(...),  # Form field for report title         
    file: UploadFile = File(...),  # File object to be uploaded   
    db: Session = Depends(database.get_database_session),
    user: models.UserAccount = Depends(fetch_logged_in_user)
):
    patient = db.query(models.PatientProfile).filter_by(user_id=user.id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Profile not found.")

    # Construct the file path
    file_path = f"uploaded_reports/{file.filename}"
    # Save the uploaded file to disk
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Create a database record for the report
    new_report = models.MedicalReport(
        patient_id=patient.id,
        title=title,
        file_path=file_path     
    )
    db.add(new_report)
    db.commit()
    
    return {"message": "File uploaded!", "id": new_report.id}

# Endpoint to get reports for a specific patient
@reports_router.get("/patient/{patient_id}", response_model=List[schemas.MedicalReportDetails])
def get_patient_reports(patient_id: int, db: Session = Depends(database.get_database_session)):
    return db.query(models.MedicalReport).filter_by(patient_id=patient_id).all()

# --- Notes Routes ---
@notes_router.post("/", response_model=schemas.MedicalNoteDetails)
def create_note(
    data: schemas.MedicalNoteCreate,
    db: Session = Depends(database.get_database_session),
    user: models.UserAccount = Depends(fetch_logged_in_user)
):
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
def get_patient_notes(patient_id: int, db: Session = Depends(database.get_database_session), user: models.UserAccount = Depends(fetch_logged_in_user)):
    notes = db.query(models.MedicalNote).filter_by(patient_id=patient_id).all()
    results = []
    for n in notes:
        d = schemas.MedicalNoteDetails.model_validate(n)
        if n.patient: d.patient_name = n.patient.name
        if n.doctor: d.doctor_name = n.doctor.name
        results.append(d)
    return results

@notes_router.get("/my", response_model=List[schemas.MedicalNoteDetails])
def get_my_notes(db: Session = Depends(database.get_database_session), user: models.UserAccount = Depends(fetch_logged_in_user)):
    if user.role != "doctor":
        raise HTTPException(status_code=403, detail="Only doctors can fetch all notes.")
    doctor = db.query(models.DoctorProfile).filter_by(user_id=user.id).first()
    notes = db.query(models.MedicalNote).filter_by(doctor_id=doctor.id).order_by(models.MedicalNote.created_at.desc()).all()
    results = []
    for n in notes:
        d = schemas.MedicalNoteDetails.model_validate(n)
        if n.patient: d.patient_name = n.patient.name
        if n.doctor: d.doctor_name = n.doctor.name
        results.append(d)
    return results

# --- Prescriptions Routes ---
@prescriptions_router.post("/", response_model=schemas.PrescriptionDetails)
def create_prescription(
    data: schemas.PrescriptionCreate,
    db: Session = Depends(database.get_database_session),
    user: models.UserAccount = Depends(fetch_logged_in_user)
):
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
def get_patient_prescriptions(patient_id: int, db: Session = Depends(database.get_database_session), user: models.UserAccount = Depends(fetch_logged_in_user)):
    scripts = db.query(models.Prescription).filter_by(patient_id=patient_id).all()
    results = []
    for s in scripts:
        d = schemas.PrescriptionDetails.model_validate(s)
        if s.patient: d.patient_name = s.patient.name
        if s.doctor: d.doctor_name = s.doctor.name
        results.append(d)
    return results

@prescriptions_router.get("/my", response_model=List[schemas.PrescriptionDetails])
def get_my_prescriptions(db: Session = Depends(database.get_database_session), user: models.UserAccount = Depends(fetch_logged_in_user)):
    if user.role != "doctor":
        raise HTTPException(status_code=403, detail="Only doctors can fetch all prescriptions.")
    doctor = db.query(models.DoctorProfile).filter_by(user_id=user.id).first()
    scripts = db.query(models.Prescription).filter_by(doctor_id=doctor.id).order_by(models.Prescription.created_at.desc()).all()
    results = []
    for s in scripts:
        d = schemas.PrescriptionDetails.model_validate(s)
        if s.patient: d.patient_name = s.patient.name
        if s.doctor: d.doctor_name = s.doctor.name
        results.append(d)
    return results
